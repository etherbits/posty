import db from "../src/lib/db/index.js";

// Script to make a user an admin by username
async function makeAdmin() {
	const username = process.argv[2];

	if (!username) {
		console.error("❌ Please provide a username");
		console.error("Usage: node scripts/make-admin.js <username>");
		process.exit(1);
	}

	console.log(`🔄 Making user "${username}" an admin...`);

	try {
		const result = await db.query(
			"UPDATE users SET role = 'admin' WHERE username = $1 RETURNING id, username, role",
			[username],
		);

		if (result.rows.length === 0) {
			console.error(`❌ User "${username}" not found`);
			process.exit(1);
		}

		const user = result.rows[0];
		console.log(`✅ User "${user.username}" is now an admin`);
	} catch (err) {
		console.error("❌ Error updating user:", err);
		process.exit(1);
	} finally {
		await db.end();
	}
}

makeAdmin();
