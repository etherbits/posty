import cron from "node-cron";
import { sendDuePosts } from "./utils.js";

export function startPostDispatching() {
	cron.schedule("* * * * *", async () => {
		console.info("Sending due posts...");

		const sentCount = await sendDuePosts();

		console.info(`${sentCount.length} due posts sent.`);
	});
}
