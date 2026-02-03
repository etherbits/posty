import { useEffect, useState } from "react";
import { ModalShell } from "./ModalShell";
import styles from "./BlueskyConnectModal.module.css";

export function BlueskyConnectModal({ isOpen, onClose, onConnect }) {
	const [handle, setHandle] = useState("");
	const [appPassword, setAppPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			setHandle("");
			setAppPassword("");
			setIsSubmitting(false);
		}
	}, [isOpen]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!handle.trim() || !appPassword.trim() || isSubmitting) return;
		setIsSubmitting(true);
		const success = await onConnect(handle.trim(), appPassword.trim());
		setIsSubmitting(false);
		if (success) onClose();
	};

	return (
		<ModalShell
			isOpen={isOpen}
			onClose={onClose}
			styles={styles}
			title="Connect Bluesky"
			subtitle="Use an app password from your Bluesky settings."
		>
			<form onSubmit={handleSubmit} className={styles.form}>
				<label className={styles.label}>
					Handle
					<input
						type="text"
						value={handle}
						onChange={(event) => setHandle(event.target.value)}
						placeholder="you.bsky.social"
						className={styles.input}
						required
					/>
				</label>
				<label className={styles.label}>
					App Password
					<input
						type="password"
						value={appPassword}
						onChange={(event) => setAppPassword(event.target.value)}
						placeholder="xxxx-xxxx-xxxx-xxxx"
						className={styles.input}
						required
					/>
				</label>
				<div className={styles.actions}>
					<button
						type="button"
						className={styles.secondaryButton}
						onClick={onClose}
						disabled={isSubmitting}
					>
						Cancel
					</button>
					<button
						type="submit"
						className={styles.primaryButton}
						disabled={!handle.trim() || !appPassword.trim() || isSubmitting}
					>
						{isSubmitting ? "Connecting..." : "Connect"}
					</button>
				</div>
			</form>
		</ModalShell>
	);
}
