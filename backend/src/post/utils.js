import PostRepository from "./repository.js";
import SettingsRepository from "../settings/repository.js";
import { blueskyProvider, mastodonProvider } from "../lib/providers/index.js";

const providerMap = {
	mastodon: mastodonProvider,
	bluesky: blueskyProvider,
};

function resolvePlatforms(post) {
	return Array.isArray(post.platforms) && post.platforms.length
		? post.platforms
		: ["mastodon"];
}

function mergeCounts(posts, countsMap, keyField) {
	return posts.map((post) => {
		const key = post[keyField];
		if (!key) return post;
		const counts = countsMap.get(key);
		if (!counts) return post;
		const replies = counts.replies ?? 0;
		const favorites = counts.favorites ?? 0;
		const reposts = counts.reposts ?? 0;
		const next = {
			...post,
			replies_count: (post.replies_count || 0) + replies,
			favorites_count: (post.favorites_count || 0) + favorites,
			reposts_count: (post.reposts_count ?? post.reblogs_count ?? 0) + reposts,
		};
		if (!post.created_at && counts.createdAt) {
			next.created_at = counts.createdAt;
		}
		return next;
	});
}

export async function sendDuePosts() {
	const integrations = await SettingsRepository.ensureIntegrations();
	const duePosts = await PostRepository.getDue();
	let sentIdCount = 0;

	for (const duePost of duePosts) {
		const platforms = resolvePlatforms(duePost);
		const delivery = {
			mastodon: Boolean(duePost.mastodon_id),
			bluesky: Boolean(duePost.bluesky_uri),
		};

		for (const platform of platforms) {
			if (delivery[platform]) continue;
			const provider = providerMap[platform];
			if (!provider || !provider.isEnabled(integrations)) continue;

			const sentPost = await provider.sendPost({
				userId: duePost.user_id,
				content: duePost.content,
				visibility: duePost.visibility,
				mediaIds: duePost.media_ids,
				media: Array.isArray(duePost.bluesky_media)
					? duePost.bluesky_media
					: [],
			});

			if (!sentPost) continue;

			if (platform === "mastodon") {
				await PostRepository.updateDelivery(duePost.id, {
					mastodonId: sentPost.id,
					mastodonUrl: sentPost.url,
				});
				delivery.mastodon = true;
			}

			if (platform === "bluesky") {
				await PostRepository.updateDelivery(duePost.id, {
					blueskyUri: sentPost.uri,
					blueskyCid: sentPost.cid,
					blueskyUrl: sentPost.url,
				});
				delivery.bluesky = true;
			}
		}

		const allDelivered = platforms.every((platform) => delivery[platform]);
		if (allDelivered && duePost.status !== "sent") {
			await PostRepository.updateDelivery(duePost.id, { status: "sent" });
			sentIdCount++;
		}
	}

	return sentIdCount;
}

export async function enrichPosts(posts) {
	const integrations = await SettingsRepository.ensureIntegrations();
	let enriched = posts.map((post) => ({
		...post,
		replies_count: 0,
		favorites_count: 0,
		reposts_count: 0,
	}));

	if (mastodonProvider.isEnabled(integrations)) {
		const mastodonCounts = await mastodonProvider.getCounts(enriched);
		enriched = mergeCounts(enriched, mastodonCounts, "mastodon_id");
	}

	if (blueskyProvider.isEnabled(integrations)) {
		const blueskyCounts = await blueskyProvider.getCounts(enriched);
		enriched = mergeCounts(enriched, blueskyCounts, "bluesky_uri");
	}

	return enriched;
}

export async function enrichPost(post) {
	const [enriched] = await enrichPosts([post]);
	return enriched || post;
}
