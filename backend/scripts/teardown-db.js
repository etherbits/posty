import db from "../src/lib/db/index.js";

// Script to drop all tables (completely removes tables and data)
async function teardownTables() {
	console.log("💥 Dropping all tables...");

	// DROP TABLE removes the table structure and all data
	// CASCADE automatically drops dependent objects
	const query = `
    DROP TABLE IF EXISTS posts CASCADE;
    DROP TABLE IF EXISTS mastodon_keys CASCADE;
    DROP TABLE IF EXISTS user_targets CASCADE;
    DROP TABLE IF EXISTS app_settings CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `;

	try {
		await db.query(query);
		console.log("✅ All tables dropped successfully.");
	} catch (err) {
		console.error("❌ Error dropping tables:", err);
	} finally {
		await db.end();
	}
}

teardownTables();
