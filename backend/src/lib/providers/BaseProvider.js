export default class BaseProvider {
	constructor(platform) {
		this.platform = platform;
	}

	getPlatform() {
		return this.platform;
	}

	isEnabled(integrations) {
		return true;
	}

	async uploadMedia() {
		throw new Error("uploadMedia not implemented");
	}

	async sendPost() {
		throw new Error("sendPost not implemented");
	}

	async getCounts() {
		return new Map();
	}
}
