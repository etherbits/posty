import MastodonProvider from "./MastodonProvider.js";
import BlueskyProvider from "./BlueskyProvider.js";

export const mastodonProvider = new MastodonProvider();
export const blueskyProvider = new BlueskyProvider();

export const providers = [mastodonProvider, blueskyProvider];
