import { useCallback, useEffect, useRef, useState } from "react";
import { notifyError } from "../utils/toastHistory";

const API_URL = "http://localhost:3000";
const DEFAULT_TARGETS = { weekly: 10, monthly: 50 };

export function useTargets(isAuthenticated) {
	const [targets, setTargets] = useState(DEFAULT_TARGETS);
	const [isLoadingTargets, setIsLoadingTargets] = useState(false);
	const targetsRef = useRef(targets);

	useEffect(() => {
		targetsRef.current = targets;
	}, [targets]);

	const fetchTargets = useCallback(async () => {
		if (!isAuthenticated) return;
		setIsLoadingTargets(true);
		try {
			const response = await fetch(`${API_URL}/user/targets`, {
				credentials: "include",
			});
			if (!response.ok) throw new Error("Failed to load targets");
			const data = await response.json();
			const nextTargets = {
				weekly:
					Number.isFinite(data.weeklyTarget) && data.weeklyTarget >= 0
						? data.weeklyTarget
						: DEFAULT_TARGETS.weekly,
				monthly:
					Number.isFinite(data.monthlyTarget) && data.monthlyTarget >= 0
						? data.monthlyTarget
						: DEFAULT_TARGETS.monthly,
			};
			setTargets(nextTargets);
		} catch (error) {
			console.error(error);
			notifyError("Failed to load targets");
		} finally {
			setIsLoadingTargets(false);
		}
	}, [isAuthenticated]);

	const updateTargets = useCallback(
		async (nextTargets) => {
			if (!isAuthenticated) return false;
			const previous = targetsRef.current;
			const weeklyTarget = Number(nextTargets.weekly) || 0;
			const monthlyTarget = Number(nextTargets.monthly) || 0;
			setTargets({ weekly: weeklyTarget, monthly: monthlyTarget });
			try {
				const response = await fetch(`${API_URL}/user/targets`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ weeklyTarget, monthlyTarget }),
				});
				if (!response.ok) throw new Error("Failed to save targets");
				const data = await response.json();
				setTargets({
					weekly: data.weeklyTarget,
					monthly: data.monthlyTarget,
				});
				return true;
			} catch (error) {
				console.error(error);
				setTargets(previous);
				notifyError("Failed to save targets");
				return false;
			}
		},
		[isAuthenticated],
	);

	useEffect(() => {
		if (!isAuthenticated) {
			setTargets(DEFAULT_TARGETS);
			return;
		}
		fetchTargets();
	}, [fetchTargets, isAuthenticated]);

	return {
		targets,
		isLoadingTargets,
		refreshTargets: fetchTargets,
		updateTargets,
	};
}
