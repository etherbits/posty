import BaseProvider from "./BaseProvider.js";
import UserRepository from "../../user/repository.js";

const BASE_URL = "https://bsky.social";
const REFRESH_LEEWAY_MS = 60 * 1000;
const MAX_BATCH = 25;

function decodeJwtExpiry(token) {
	if (!token) return null;
	const payload = token.split(".")[1];
	if (!payload) return null;
	const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
	const padded = normalized.padEnd(
		normalized.length + ((4 - (normalized.length % 4)) % 4),
		"=",
	);
	const json = Buffer.from(padded, "base64").toString("utf8");
	try {
		const data = JSON.parse(json);
		if (!data.exp) return null;
		return new Date(data.exp * 1000);
	} catch {
		return null;
	}
}

function chunkArray(items, size) {
	const chunks = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
}

export default class BlueskyProvider extends BaseProvider {
	constructor() {
		super("bluesky");
	}

	isEnabled(integrations) {
		return Boolean(integrations?.blueskyEnabled);
	}

	async createSession(handle, appPassword) {
		const response = await fetch(
			`${BASE_URL}/xrpc/com.atproto.server.createSession`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ identifier: handle, password: appPassword }),
			},
		);

		if (!response.ok) {
			const error = await response.text();
			throw new Error(error || "Failed to create session");
		}

		return await response.json();
	}

	async refreshSession(refreshJwt) {
		const response = await fetch(
			`${BASE_URL}/xrpc/com.atproto.server.refreshSession`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${refreshJwt}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			const error = await response.text();
			throw new Error(error || "Failed to refresh session");
		}

		return await response.json();
	}

	async getSession(userId) {
		const stored = await UserRepository.getBlueskyKey(userId);
		if (!stored) return null;

		const expiresAt = stored.expires_at ? new Date(stored.expires_at) : null;
		const needsRefresh =
			expiresAt && Date.now() > expiresAt.getTime() - REFRESH_LEEWAY_MS;

		if (!needsRefresh) {
			return {
				did: stored.did,
				handle: stored.handle,
				accessJwt: stored.access_jwt,
				refreshJwt: stored.refresh_jwt,
				expiresAt,
			};
		}

		let refreshed;
		try {
			refreshed = await this.refreshSession(stored.refresh_jwt);
		} catch (error) {
			console.error("Bluesky session refresh failed:", error);
			return null;
		}
		const nextExpiresAt = decodeJwtExpiry(refreshed.accessJwt);
		await UserRepository.updateBlueskyKey(userId, {
			accessJwt: refreshed.accessJwt,
			refreshJwt: refreshed.refreshJwt,
			expiresAt: nextExpiresAt,
		});

		return {
			did: refreshed.did,
			handle: refreshed.handle,
			accessJwt: refreshed.accessJwt,
			refreshJwt: refreshed.refreshJwt,
			expiresAt: nextExpiresAt,
		};
	}

	async uploadMedia({ userId, fileBuffer, mimeType }) {
		const session = await this.getSession(userId);
		if (!session) {
			return null;
		}

		const response = await fetch(
			`${BASE_URL}/xrpc/com.atproto.repo.uploadBlob`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${session.accessJwt}`,
					"Content-Type": mimeType,
				},
				body: fileBuffer,
			},
		);

		if (!response.ok) {
			const error = await response.text();
			console.error("Bluesky media upload error:", error);
			return null;
		}

		const data = await response.json();
		return data.blob;
	}

	async sendPost({ userId, content, media = [] }) {
		const session = await this.getSession(userId);
		if (!session) {
			console.error("Bluesky account not connected");
			return null;
		}

		const record = {
			$type: "app.bsky.feed.post",
			text: content,
			createdAt: new Date().toISOString(),
		};

		if (media.length > 0) {
			const images = media.slice(0, 4);
			record.embed = {
				$type: "app.bsky.embed.images",
				images: images.map((item) => ({
					image: item.blob ?? item.image ?? item,
					alt: item.alt ?? "",
				})),
			};
		}

		const response = await fetch(
			`${BASE_URL}/xrpc/com.atproto.repo.createRecord`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${session.accessJwt}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					repo: session.did,
					collection: "app.bsky.feed.post",
					record,
				}),
			},
		);

		if (!response.ok) {
			const error = await response.text();
			console.error("Bluesky post error:", error);
			return null;
		}

		const data = await response.json();
		const uri = data.uri;
		const cid = data.cid;
		const rkey = uri.split("/").pop();
		const url = `https://bsky.app/profile/${session.handle}/post/${rkey}`;

		return { uri, cid, url, createdAt: record.createdAt };
	}

	async getCounts(posts) {
		const postsToEnrich = posts.filter(
			(post) => post.status === "sent" && post.bluesky_uri,
		);

		if (postsToEnrich.length === 0) {
			return new Map();
		}

		const postsByUser = new Map();
		for (const post of postsToEnrich) {
			if (!postsByUser.has(post.user_id)) {
				postsByUser.set(post.user_id, []);
			}
			postsByUser.get(post.user_id).push(post);
		}

		const sessionEntries = await Promise.all(
			Array.from(postsByUser.keys()).map(async (userId) => [
				userId,
				await this.getSession(userId),
			]),
		);
		const sessionMap = new Map(sessionEntries.filter(([, session]) => session));

		const responses = await Promise.all(
			Array.from(postsByUser.entries()).map(async ([userId, userPosts]) => {
				const session = sessionMap.get(userId);
				if (!session) return [];
				const uriChunks = chunkArray(
					userPosts.map((post) => post.bluesky_uri),
					MAX_BATCH,
				);
				const chunkResponses = await Promise.all(
					uriChunks.map(async (uris) => {
						const params = new URLSearchParams();
						uris.forEach((uri) => params.append("uris", uri));
						try {
							const response = await fetch(
								`${BASE_URL}/xrpc/app.bsky.feed.getPosts?${params.toString()}`,
								{
									headers: {
										Authorization: `Bearer ${session.accessJwt}`,
									},
								},
							);

							if (!response.ok) {
								const error = await response.text();
								console.error("Bluesky enrich error:", error);
								return [];
							}
							const data = await response.json();
							return data.posts || [];
						} catch (error) {
							console.error("Bluesky enrich request failed:", error);
							return [];
						}
					}),
				);
				return chunkResponses.flat();
			}),
		);

		const dataMap = new Map();
		responses.flat().forEach((post) => {
			if (!post?.uri) return;
			dataMap.set(post.uri, {
				id: post.uri,
				replies: post.replyCount ?? 0,
				favorites: post.likeCount ?? 0,
				reposts: post.repostCount ?? 0,
				createdAt: post.record?.createdAt,
			});
		});

		return dataMap;
	}
}
