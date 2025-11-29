import crypto from "crypto";

class MastodonOAuth {
	constructor(baseURL, clientId, clientSecret, redirectURI) {
		this.baseURL = baseURL.replace(/\/$/, "");
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.redirectURI = redirectURI;
	}

	createAuthorizationURL(state, scopes) {
		const url = new URL(`${this.baseURL}/oauth/authorize`);
		url.searchParams.set("response_type", "code");
		url.searchParams.set("client_id", this.clientId);
		url.searchParams.set("redirect_uri", this.redirectURI);
		url.searchParams.set("state", state);
		url.searchParams.set("scope", scopes.join(" "));
		return url;
	}

	async validateAuthorizationCode(code) {
		const body = new URLSearchParams();
		body.set("grant_type", "authorization_code");
		body.set("code", code);
		body.set("client_id", this.clientId);
		body.set("client_secret", this.clientSecret);
		body.set("redirect_uri", this.redirectURI);

		const response = await fetch(`${this.baseURL}/oauth/token`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: body.toString(),
		});

		if (!response.ok) {
			throw new Error("Failed to validate authorization code");
		}

		const data = await response.json();
		return { accessToken: () => data.access_token };
	}

	generateState() {
		return crypto.randomBytes(32).toString("base64url");
	}
}

const mastodon = new MastodonOAuth(
	process.env.MASTODON_BASE_URL,
	process.env.MASTODON_CLIENT_KEY,
	process.env.MASTODON_CLIENT_SECRET,
	process.env.MASTODON_REDIRECT_URI,
);

export default mastodon;
