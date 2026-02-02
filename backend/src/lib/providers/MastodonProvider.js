import BaseProvider from "./BaseProvider.js";
import UserRepository from "../../user/repository.js";

const BASE_URL = process.env.MASTODON_BASE_URL?.replace(/\/$/, "");

export default class MastodonProvider extends BaseProvider {
	constructor() {
		super("mastodon");
	}

	isEnabled(integrations) {
		return Boolean(integrations?.mastodonEnabled);
	}

	async uploadMedia({ userId, fileBuffer, fileName, mimeType }) {
		const accessToken = await UserRepository.getMastodonKey(userId);
		if (!accessToken) {
			return null;
		}

		const form = new FormData();
		const blob = new Blob([fileBuffer], { type: mimeType });
		form.append("file", blob, fileName);

		const response = await fetch(`${BASE_URL}/api/v2/media`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			body: form,
		});

		if (!response.ok) {
			const error = await response.text();
			console.error("Mastodon media upload error:", error);
			return null;
		}

		return await response.json();
	}

	async sendPost({ userId, content, visibility, mediaIds }) {
		const mastodonToken = await UserRepository.getMastodonKey(userId);
		if (!mastodonToken) {
			console.error("Mastodon account not connected");
			return null;
		}

		const postResponse = await fetch(`${BASE_URL}/api/v1/statuses`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${mastodonToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				status: content,
				visibility: visibility,
				media_ids: mediaIds,
			}),
		});

		if (!postResponse.ok) {
			const err = await postResponse.json();
			console.error(err ?? "Something went wrong");
			return null;
		}

		const post = await postResponse.json();
		return { id: post.id, url: post.url, createdAt: post.created_at };
	}

	async getCounts(posts) {
		const postsToEnrich = posts.filter(
			(post) => post.status === "sent" && post.mastodon_id,
		);

		if (postsToEnrich.length === 0) {
			return new Map();
		}

		const userIds = Array.from(new Set(postsToEnrich.map((post) => post.user_id)));
		const tokenEntries = await Promise.all(
			userIds.map(async (userId) => {
				const token = await UserRepository.getMastodonKey(userId);
				return [userId, token];
			}),
		);
		const tokenMap = new Map(tokenEntries.filter(([, token]) => token));

		const fetchPromises = postsToEnrich.map(async (post) => {
			const token = tokenMap.get(post.user_id);
			if (!token) return null;
			try {
				const response = await fetch(
					`${BASE_URL}/api/v1/statuses/${post.mastodon_id}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					},
				);

				if (!response.ok) {
					const err = await response.text();
					console.error(
						`Failed to fetch status ${post.mastodon_id} for user ${post.user_id}:`,
						err,
					);
					return null;
				}

				const mastodonPost = await response.json();
				return {
					id: mastodonPost.id,
					replies: mastodonPost.replies_count,
					favorites: mastodonPost.favourites_count,
					reposts: mastodonPost.reblogs_count,
					createdAt: mastodonPost.created_at,
				};
			} catch (error) {
				console.error(
					`Error fetching status ${post.mastodon_id} for user ${post.user_id}:`,
					error,
				);
				return null;
			}
		});

		const statuses = await Promise.all(fetchPromises);
		const dataMap = new Map();
		for (const status of statuses) {
			if (status?.id) {
				dataMap.set(status.id, status);
			}
		}

		return dataMap;
	}
}
