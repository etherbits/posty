export function extractProfileData(user) {
	return {
		id: user.id,
		username: user.username,
		role: user.role,
	};
}
