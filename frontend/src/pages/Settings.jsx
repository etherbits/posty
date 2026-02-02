import { useEffect, useState } from "react";
import { useTargetDraft } from "../hooks/useTargetDraft";
import { BlueskyConnectModal } from "../components/BlueskyConnectModal";
import styles from "./Settings.module.css";

export function Settings({
	user,
	onConnectMastodon,
	onDisconnectMastodon,
	onConnectBluesky,
	onDisconnectBluesky,
	targets,
	onUpdateTargets,
	integrations,
	onUpdateIntegrations,
	isAdmin,
}) {
	const [isWorking, setIsWorking] = useState(false);
	const [isBlueskyModalOpen, setIsBlueskyModalOpen] = useState(false);
	const [draftIntegrations, setDraftIntegrations] = useState({
		mastodonEnabled: true,
		blueskyEnabled: false,
	});
	const [isUpdatingIntegrations, setIsUpdatingIntegrations] = useState(false);
	const { draftTargets, updateDraft, isSaving } = useTargetDraft(
		targets,
		onUpdateTargets,
	);

	useEffect(() => {
		if (!integrations) return;
		setDraftIntegrations({
			mastodonEnabled: Boolean(integrations.mastodonEnabled),
			blueskyEnabled: Boolean(integrations.blueskyEnabled),
		});
	}, [integrations]);

	const handleMastodonAction = async () => {
		if (isWorking) return;
		if (!draftIntegrations.mastodonEnabled) return;
		setIsWorking(true);
		try {
			if (user?.hasMastodonConnected) {
				await onDisconnectMastodon();
			} else {
				onConnectMastodon();
			}
		} finally {
			setIsWorking(false);
		}
	};

	const handleBlueskyAction = async () => {
		if (isWorking) return;
		if (!draftIntegrations.blueskyEnabled) return;
		if (blueskyConnected) {
			setIsWorking(true);
			try {
				await onDisconnectBluesky();
			} finally {
				setIsWorking(false);
			}
			return;
		}
		setIsBlueskyModalOpen(true);
	};

	const handleIntegrationToggle = async (key) => {
		if (!isAdmin || isUpdatingIntegrations) return;
		const nextIntegrations = {
			...draftIntegrations,
			[key]: !draftIntegrations[key],
		};
		setDraftIntegrations(nextIntegrations);
		setIsUpdatingIntegrations(true);
		const success = await onUpdateIntegrations(nextIntegrations);
		if (!success) {
			setDraftIntegrations({
				mastodonEnabled: Boolean(integrations?.mastodonEnabled),
				blueskyEnabled: Boolean(integrations?.blueskyEnabled),
			});
		}
		setIsUpdatingIntegrations(false);
	};

	const blueskyConnected = Boolean(user?.hasBlueskyConnected);
	const mastodonEnabled = draftIntegrations.mastodonEnabled;
	const blueskyEnabled = draftIntegrations.blueskyEnabled;

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div>
					<h2 className={styles.title}>Settings</h2>
					<p className={styles.subtitle}>Manage integrations and targets.</p>
				</div>
			</div>

			{isAdmin && (
				<section className={styles.section}>
					<h3 className={styles.sectionTitle}>Platform Availability</h3>
					<div className={styles.toggleGrid}>
						<div className={styles.toggleCard}>
							<div>
								<p className={styles.toggleTitle}>Mastodon</p>
								<p className={styles.toggleSubtitle}>
									Allow posting and analytics for Mastodon.
								</p>
							</div>
							<label className={styles.switch}>
								<input
									type="checkbox"
									checked={mastodonEnabled}
									onChange={() => handleIntegrationToggle("mastodonEnabled")}
									disabled={!isAdmin || isUpdatingIntegrations}
								/>
								<span className={styles.slider} />
							</label>
						</div>
						<div className={styles.toggleCard}>
							<div>
								<p className={styles.toggleTitle}>Bluesky</p>
								<p className={styles.toggleSubtitle}>
									Enable the Bluesky integration across the workspace.
								</p>
							</div>
							<label className={styles.switch}>
								<input
									type="checkbox"
									checked={blueskyEnabled}
									onChange={() => handleIntegrationToggle("blueskyEnabled")}
									disabled={!isAdmin || isUpdatingIntegrations}
								/>
								<span className={styles.slider} />
							</label>
						</div>
					</div>
				</section>
			)}

			<section className={styles.section}>
				<h3 className={styles.sectionTitle}>Social Accounts</h3>
				<div className={styles.cardsGrid}>
					<div className={styles.accountCard}>
						<div className={styles.accountIcon}>
							<img
								src="/vectors/mastodon.svg"
								alt="Mastodon"
								className={styles.accountIconInner}
							/>
						</div>
						<div className={styles.accountInfo}>
							<p className={styles.accountName}>Mastodon</p>
							<p className={styles.accountStatus}>
								{mastodonEnabled
									? user?.hasMastodonConnected
										? "Connected"
										: "Not connected"
									: "Disabled"}
							</p>
						</div>
						<button
							type="button"
							className={`${styles.accountButton} ${
								user?.hasMastodonConnected
									? styles.secondaryButton
									: styles.primaryButton
							}`}
							onClick={handleMastodonAction}
							disabled={isWorking || !mastodonEnabled}
						>
							{mastodonEnabled
								? user?.hasMastodonConnected
									? "Disconnect"
									: "Connect"
								: "Disabled"}
						</button>
					</div>

					<div
						className={`${styles.accountCard} ${
							!blueskyConnected || !blueskyEnabled
								? styles.accountDisabled
								: ""
						}`}
					>
						<div className={styles.accountIconAlt}>
							<span
								className={styles.accountIconSymbol}
								style={{
									WebkitMaskImage: "url(/vectors/bluesky.svg)",
									maskImage: "url(/vectors/bluesky.svg)",
								}}
							/>
						</div>
						<div className={styles.accountInfo}>
							<p className={styles.accountName}>Bluesky</p>
							<p className={styles.accountStatus}>
								{blueskyEnabled
									? blueskyConnected
										? "Connected"
										: "Not connected"
									: "Disabled"}
							</p>
						</div>
						<button
							type="button"
							className={`${styles.accountButton} ${styles.secondaryButton}`}
							onClick={handleBlueskyAction}
							disabled={isWorking || !blueskyEnabled}
						>
							{blueskyEnabled
								? blueskyConnected
									? "Disconnect"
									: "Connect"
								: "Disabled"}
						</button>
					</div>
				</div>
			</section>

			<BlueskyConnectModal
				isOpen={isBlueskyModalOpen}
				onClose={() => setIsBlueskyModalOpen(false)}
				onConnect={onConnectBluesky}
			/>

			<section className={styles.section}>
				<h3 className={styles.sectionTitle}>Targets</h3>
				<div className={styles.targetsCard}>
					<div className={styles.targetField}>
						<label className={styles.targetLabel} htmlFor="weekly-target">
							Weekly Target
						</label>
						<div className={styles.targetInputWrap}>
							<input
								id="weekly-target"
								type="text"
								inputMode="numeric"
								placeholder="0"
								value={draftTargets.weekly}
								onChange={(event) => updateDraft("weekly", event.target.value)}
								className={styles.targetInput}
								disabled={isSaving}
							/>
							<span className={styles.targetUnit}>engagements</span>
						</div>
					</div>

					<div className={styles.targetField}>
						<label className={styles.targetLabel} htmlFor="monthly-target">
							Monthly Target
						</label>
						<div className={styles.targetInputWrap}>
							<input
								id="monthly-target"
								type="text"
								inputMode="numeric"
								placeholder="0"
								value={draftTargets.monthly}
								onChange={(event) => updateDraft("monthly", event.target.value)}
								className={styles.targetInput}
								disabled={isSaving}
							/>
							<span className={styles.targetUnit}>engagements</span>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
