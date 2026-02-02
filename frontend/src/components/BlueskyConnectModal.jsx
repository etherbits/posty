import { useEffect, useState } from "react";
import { X } from "lucide-react";
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
		<div
			className={`${styles.overlay} ${isOpen ? styles.open : ""}`}
			aria-hidden={!isOpen}
			onClick={onClose}
		>
			<div
				className={`${styles.modal} ${isOpen ? styles.open : ""}`}
				onClick={(event) => event.stopPropagation()}
				role="dialog"
				aria-modal="true"
			>
				<div className={styles.header}>
					<div>
						<h3 className={styles.title}>Connect Bluesky</h3>
						<p className={styles.subtitle}>
							Use an app password from your Bluesky settings.
						</p>
					</div>
					<button
						type="button"
						className={styles.close}
						onClick={onClose}
					>
						<X size={18} />
					</button>
				</div>

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
			</div>
		</div>
	);
}
