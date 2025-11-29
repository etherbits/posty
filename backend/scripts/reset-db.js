import dotenv from "dotenv";
dotenv.config();

import db from "../src/lib/db/index.js";

// Script to remove all data from the tables (keeps table structure)
async function resetTables() {
	console.log("🗑️  Resetting tables...");

	// TRUNCATE removes all rows from tables
	// CASCADE automatically truncates dependent tables
	// RESTART IDENTITY resets auto-incrementing IDs
	const query = `
    TRUNCATE TABLE posts CASCADE;
    TRUNCATE TABLE mastodon_keys CASCADE;
    TRUNCATE TABLE users CASCADE;
  `;

	try {
		await db.query(query);
		console.log("✅ All data removed successfully. Tables remain intact.");
	} catch (err) {
		console.error("❌ Error resetting tables:", err);
	} finally {
		await db.end();
	}
}

resetTables();
