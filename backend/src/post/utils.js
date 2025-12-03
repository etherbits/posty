import PostRepository from "./repository.js";
import UserRepository from "../user/repository.js";

export async function sendDuePosts() {
	const duePosts = await PostRepository.getDue();
	let sentIdCount = 0;

	for (const duePost of duePosts) {
		const sentPost = await sendPost(
			duePost.user_id,
			duePost.content,
			duePost.visibility,
			duePost.media_ids,
		);

		if (sentPost !== null) {
			await PostRepository.updateAsSent(duePost.id, sentPost.id, sentPost.url);
			sentIdCount++;
		}
	}

	return sentIdCount;
}

export async function sendPost(userId, content, visibility, mediaIds) {
	const mastodonToken = await UserRepository.getMastodonKey(userId);

	if (!mastodonToken) {
		console.error("Mastodon account not connected");
		return null;
	}

	const postResponse = await fetch(
		`${process.env.MASTODON_BASE_URL}/api/v1/statuses`,
		{
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
		},
	);

	if (!postResponse.ok) {
		const err = await postResponse.json();
		console.error(err ?? "Something went wrong");
		return null;
	}

	const post = await postResponse.json();

	return post;
}

/**
 * Batch enrich multiple posts with Mastodon data using the batch API endpoint.
 * Groups posts by user to use the correct access token and parallelizes requests across users.
 */
export async function enrichPosts(posts) {
	// Filter posts that need enrichment (sent posts with mastodon_id)
	const postsToEnrich = posts.filter(
		(post) => post.status === "sent" && post.mastodon_id,
	);

	if (postsToEnrich.length === 0) {
		return posts;
	}

	// Group posts by user_id since each user has a different access token
	const postsByUser = new Map();
	for (const post of postsToEnrich) {
		if (!postsByUser.has(post.user_id)) {
			postsByUser.set(post.user_id, []);
		}
		postsByUser.get(post.user_id).push(post);
	}

	// Fetch tokens for all users in parallel
	const userIds = Array.from(postsByUser.keys());
	const tokenEntries = await Promise.all(
		userIds.map(async (userId) => {
			const token = await UserRepository.getMastodonKey(userId);
			return [userId, token];
		}),
	);
	const tokenMap = new Map(tokenEntries.filter(([, token]) => token));

	// Batch fetch mastodon posts for each user in parallel
	const userFetchPromises = Array.from(postsByUser.entries()).map(
		async ([userId, userPosts]) => {
			const token = tokenMap.get(userId);
			if (!token) {
				return [];
			}

			const mastodonIds = userPosts.map((p) => p.mastodon_id);

			try {
				// Build query string with id[] parameters for batch fetch
				const queryParams = mastodonIds
					.map((id) => `id[]=${encodeURIComponent(id)}`)
					.join("&");

				const response = await fetch(
					`${process.env.MASTODON_BASE_URL}/api/v1/statuses?${queryParams}`,
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
						`Failed to batch fetch statuses for user ${userId}:`,
						err,
					);
					return [];
				}

				const mastodonPosts = await response.json();
				return mastodonPosts;
			} catch (error) {
				console.error(`Error fetching statuses for user ${userId}:`, error);
				return [];
			}
		},
	);

	// Wait for all user fetches to complete in parallel
	const allMastodonPosts = await Promise.all(userFetchPromises);

	// Flatten and create a map of mastodon_id to mastodon data
	const mastodonDataMap = new Map();
	for (const mastodonPosts of allMastodonPosts) {
		for (const mastodonPost of mastodonPosts) {
			mastodonDataMap.set(mastodonPost.id, mastodonPost);
		}
	}

	// Merge enrichment data into posts
	return posts.map((post) => {
		if (!post.mastodon_id) {
			return post;
		}
		const mastodonData = mastodonDataMap.get(post.mastodon_id);
		if (mastodonData) {
			return mergeWithMastodonPost(post, mastodonData);
		}
		return post;
	});
}

export async function enrichPost(post) {
	const mastodonToken = await UserRepository.getMastodonKey(post.user_id);

	if (!mastodonToken) {
		console.error("Mastodon account not connected");
		return post;
	}

	const postResponse = await fetch(
		`${process.env.MASTODON_BASE_URL}/api/v1/statuses/${post.mastodon_id}`,
		{
			headers: {
				Authorization: `Bearer ${mastodonToken}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!postResponse.ok) {
		const err = await postResponse.json();
		console.error(err ?? "Something went wrong");
		return post;
	}

	const mastodonPost = await postResponse.json();

	return mergeWithMastodonPost(post, mastodonPost);
}

function mergeWithMastodonPost(post, mastodonPost) {
	return {
		...post,
		replies_count: mastodonPost.replies_count,
		favorites_count: mastodonPost.favourites_count,
		created_at: mastodonPost.created_at,
	};
}
