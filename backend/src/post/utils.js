import PostRepository from "./repository.js";
import UserRepository from "../user/repository.js";

export async function sendDuePosts() {
	const duePosts = await PostRepository.getDue();
	const sentIds = [];

	for (const duePost of duePosts) {
		const didSend = await sendPost(
			duePost.user_id,
			duePost.content,
			duePost.visibility,
			duePost.media_ids,
		);

		if (didSend) {
			sentIds.push(duePost.id);
		}
	}

	await PostRepository.markAsSent(sentIds);

	return sentIds;
}

export async function sendPost(userId, content, visibility, mediaIds) {
	const mastodonToken = await UserRepository.getMastodonKey(userId);

	if (!mastodonToken) {
		console.error("Mastodon account not connected");
		return false;
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
		return false;
	}

	return true;
}
