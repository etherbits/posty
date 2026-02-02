import db from "../lib/db/index.js";

const DEFAULT_INTEGRATIONS = {
	mastodonEnabled: true,
	blueskyEnabled: true,
};

const INTEGRATION_ROWS = [
	{ key: "mastodon_enabled", value: DEFAULT_INTEGRATIONS.mastodonEnabled },
	{ key: "bluesky_enabled", value: DEFAULT_INTEGRATIONS.blueskyEnabled },
];

function mapRowsToIntegrations(rows) {
	const map = new Map(rows.map((row) => [row.key, row.value]));
	return {
		mastodonEnabled: map.has("mastodon_enabled")
			? map.get("mastodon_enabled")
			: DEFAULT_INTEGRATIONS.mastodonEnabled,
		blueskyEnabled: map.has("bluesky_enabled")
			? map.get("bluesky_enabled")
			: DEFAULT_INTEGRATIONS.blueskyEnabled,
	};
}

async function ensureIntegrations() {
	await db.query(
		"INSERT INTO app_settings(key, value) VALUES ($1, $2), ($3, $4) ON CONFLICT (key) DO NOTHING",
		[
			INTEGRATION_ROWS[0].key,
			INTEGRATION_ROWS[0].value,
			INTEGRATION_ROWS[1].key,
			INTEGRATION_ROWS[1].value,
		],
	);

	const result = await db.query(
		"SELECT key, value FROM app_settings WHERE key IN ($1, $2)",
		[INTEGRATION_ROWS[0].key, INTEGRATION_ROWS[1].key],
	);

	return mapRowsToIntegrations(result.rows);
}

async function updateIntegrations({ mastodonEnabled, blueskyEnabled }) {
	await db.query(
		"INSERT INTO app_settings(key, value) VALUES ($1, $2), ($3, $4) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
		[
			INTEGRATION_ROWS[0].key,
			Boolean(mastodonEnabled),
			INTEGRATION_ROWS[1].key,
			Boolean(blueskyEnabled),
		],
	);

	return {
		mastodonEnabled: Boolean(mastodonEnabled),
		blueskyEnabled: Boolean(blueskyEnabled),
	};
}

export default {
	ensureIntegrations,
	updateIntegrations,
};
