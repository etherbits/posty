import db from "../lib/db/index.js";

async function create(username, passwordHash) {
	const query =
		"INSERT INTO users(username, password_hash) VALUES($1, $2) RETURNING *";

	const result = await db.query(query, [username, passwordHash]);
	const user = result.rows[0];
	return user;
}

async function getByUsername(username) {
	const query = "SELECT * FROM users WHERE username = $1";

	const result = await db.query(query, [username]);
	const user = result.rows[0];
	return user;
}

export default {
	create,
	getByUsername,
};
