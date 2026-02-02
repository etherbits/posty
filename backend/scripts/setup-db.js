import db from "../src/lib/db/index.js";

// Script to create the tables required for app
async function createTables() {
	console.log("📦 Creating tables...");

	const query = `
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS user_targets (
        user_id UUID PRIMARY KEY,
        weekly_target INTEGER NOT NULL DEFAULT 10,
        monthly_target INTEGER NOT NULL DEFAULT 50,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    INSERT INTO app_settings(key, value)
    VALUES ('mastodon_enabled', TRUE), ('bluesky_enabled', FALSE)
    ON CONFLICT (key) DO NOTHING;

    CREATE TABLE IF NOT EXISTS mastodon_keys (
        user_id UUID PRIMARY KEY,
        access_token TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        mastodon_id TEXT,
        content TEXT NOT NULL,
        scheduled_time TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'pending',
        visibility TEXT NOT NULL DEFAULT 'private',
        url TEXT,
        media_ids TEXT[],
        platforms TEXT[],
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

	try {
		await db.query(query);
		console.log("Tables created successfully");
	} catch (err) {
		console.error("Error creating tables:", err);
	} finally {
		await db.end();
	}
}

createTables();
