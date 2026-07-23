"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudyPlan } from "@/lib/study-planner";
import {
  getAllPlans,
  removePlan,
  savePlan,
} from "@/lib/idb";
import {
  queuePlanTaskToggle,
  reconcilePlanTaskToggle,
} from "@/lib/offline-sync";

export function useOfflinePlan() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setPlans(await getAllPlans());
      setError(null);
    } catch (storageError) {
      setError(
        storageError instanceof Error
          ? storageError.message
          : "The local study plan is unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const cachePlan = useCallback(async (plan: StudyPlan) => {
    await savePlan(plan);
    setPlans((current) => {
      const next = current.filter((item) => item.id !== plan.id);
      return [plan, ...next];
    });
  }, []);

  const deletePlan = useCallback(async (id: string) => {
    await removePlan(id);
    setPlans((current) => current.filter((plan) => plan.id !== id));
  }, []);

  const toggleTaskOffline = useCallback(
    async (
      planId: string,
      taskId: string,
      completed: boolean,
    ): Promise<StudyPlan | null> => {
      const plan = plans.find((item) => item.id === planId);
      if (!plan) return null;
      const payload = {
        planId,
        taskId,
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
      };
      const updated = reconcilePlanTaskToggle(plan, payload);
      if (!updated) return null;
      await savePlan(updated);
      await queuePlanTaskToggle(payload);
      setPlans((current) =>
        current.map((item) => (item.id === planId ? updated : item)),
      );
      return updated;
    },
    [plans],
  );

  return {
    plans,
    loading,
    error,
    refresh,
    cachePlan,
    deletePlan,
    toggleTaskOffline,
  };
}
