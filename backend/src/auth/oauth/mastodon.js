import { Mastodon } from "arctic";

const mastodon = new Mastodon(BASE_URL, CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export default mastodon;
