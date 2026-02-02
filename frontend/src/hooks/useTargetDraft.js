import { useEffect, useRef, useState } from "react";

export function useTargetDraft(targets, onUpdateTargets, delay = 600) {
	const [draftTargets, setDraftTargets] = useState({ weekly: "", monthly: "" });
	const [isSaving, setIsSaving] = useState(false);
	const lastSavedRef = useRef({ weekly: 0, monthly: 0 });
	const saveTimeoutRef = useRef(null);
	const saveVersionRef = useRef(0);

	useEffect(() => {
		const nextWeekly = Number(targets?.weekly ?? 0);
		const nextMonthly = Number(targets?.monthly ?? 0);
		lastSavedRef.current = { weekly: nextWeekly, monthly: nextMonthly };
		setDraftTargets({
			weekly: nextWeekly.toString(),
			monthly: nextMonthly.toString(),
		});
	}, [targets]);

	useEffect(() => {
		if (!onUpdateTargets) return undefined;
		const weekly = Number(draftTargets.weekly || 0);
		const monthly = Number(draftTargets.monthly || 0);
		if (
			weekly === lastSavedRef.current.weekly &&
			monthly === lastSavedRef.current.monthly
		) {
			return undefined;
		}
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}
		saveTimeoutRef.current = setTimeout(async () => {
			const version = saveVersionRef.current + 1;
			saveVersionRef.current = version;
			setIsSaving(true);
			const ok = await onUpdateTargets({ weekly, monthly });
			if (saveVersionRef.current !== version) return;
			if (ok) {
				lastSavedRef.current = { weekly, monthly };
			}
			setIsSaving(false);
		}, delay);
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, [draftTargets.weekly, draftTargets.monthly, onUpdateTargets, delay]);

	const updateDraft = (key, value) => {
		const cleaned = value.replace(/[^\d]/g, "");
		setDraftTargets((prev) => ({ ...prev, [key]: cleaned }));
	};

	return { draftTargets, updateDraft, isSaving, setDraftTargets };
}
