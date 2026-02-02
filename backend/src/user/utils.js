import UserRepository from "../user/repository.js";

export async function extractProfileData(user, withMastodon = true) {
	const hasMastodon = withMastodon
		? await UserRepository.hasMastodonConnected(user.id)
		: false;
	const hasBluesky = await UserRepository.hasBlueskyConnected(user.id);

	return {
		id: user.id,
		username: user.username,
		role: user.role,
		hasMastodonConnected: hasMastodon,
		hasBlueskyConnected: hasBluesky,
	};
}
