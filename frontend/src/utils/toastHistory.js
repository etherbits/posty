import toast from "react-hot-toast";

const MAX_TOASTS = 5;
const toastHistory = [];

function addToHistory(type, message) {
	if (!message) return;
	toastHistory.push({ type, message });
	if (toastHistory.length > MAX_TOASTS) {
		toastHistory.shift();
	}
}

export function notifySuccess(message, options = {}) {
	addToHistory("success", message);
	return toast.success(message, options);
}

export function notifyError(message, options = {}) {
	addToHistory("error", message);
	return toast.error(message, options);
}

export function replayToasts() {
	const items = toastHistory.slice(-MAX_TOASTS);
	if (!items.length) return;

	items.forEach((item, index) => {
		setTimeout(() => {
			const fn = toast[item.type] || toast;
			fn(item.message, { duration: 2200 });
		}, index * 180);
	});
}
