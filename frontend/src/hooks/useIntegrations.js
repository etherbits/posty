import { useCallback, useEffect, useRef, useState } from "react";
import { notifyError, notifySuccess } from "../utils/toastHistory";

const API_URL = "http://localhost:3000";
const DEFAULT_INTEGRATIONS = {
	mastodonEnabled: true,
	blueskyEnabled: true,
};

export function useIntegrations(isAuthenticated) {
	const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATIONS);
	const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);
	const integrationsRef = useRef(integrations);

	useEffect(() => {
		integrationsRef.current = integrations;
	}, [integrations]);

	const fetchIntegrations = useCallback(async () => {
		if (!isAuthenticated) return;
		setIsLoadingIntegrations(true);
		try {
			const response = await fetch(`${API_URL}/settings/integrations`, {
				credentials: "include",
			});
			if (!response.ok) throw new Error("Failed to load integrations");
			const data = await response.json();
			setIntegrations({
				mastodonEnabled: Boolean(data.mastodonEnabled),
				blueskyEnabled: Boolean(data.blueskyEnabled),
			});
		} catch (error) {
			console.error(error);
			notifyError("Failed to load integrations");
		} finally {
			setIsLoadingIntegrations(false);
		}
	}, [isAuthenticated]);

	const updateIntegrations = useCallback(
		async (nextIntegrations) => {
			if (!isAuthenticated) return false;
			const previous = integrationsRef.current;
			const payload = {
				mastodonEnabled: Boolean(nextIntegrations.mastodonEnabled),
				blueskyEnabled: Boolean(nextIntegrations.blueskyEnabled),
			};
			setIntegrations(payload);
			try {
				const response = await fetch(`${API_URL}/settings/integrations`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify(payload),
				});
				if (!response.ok) throw new Error("Failed to update integrations");
				const data = await response.json();
				setIntegrations({
					mastodonEnabled: Boolean(data.mastodonEnabled),
					blueskyEnabled: Boolean(data.blueskyEnabled),
				});
				notifySuccess("Integrations updated successfully!");
				return true;
			} catch (error) {
				console.error(error);
				setIntegrations(previous);
				notifyError("Failed to update integrations");
				return false;
			}
		},
		[isAuthenticated],
	);

	useEffect(() => {
		if (!isAuthenticated) {
			setIntegrations(DEFAULT_INTEGRATIONS);
			return;
		}
		fetchIntegrations();
	}, [fetchIntegrations, isAuthenticated]);

	return {
		integrations,
		isLoadingIntegrations,
		refreshIntegrations: fetchIntegrations,
		updateIntegrations,
	};
}
