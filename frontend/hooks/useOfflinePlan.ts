"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudyPlan } from "@/lib/study-planner";
import { getAllPlans, savePlan, removePlan } from "@/lib/idb";
import { addToOfflineQueue } from "@/lib/idb";

export function useOfflinePlan() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPlans()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const cachePlan = useCallback(async (plan: StudyPlan) => {
    await savePlan(plan);
    setPlans((prev) => {
      const exists = prev.some((p) => p.id === plan.id);
      return exists
        ? prev.map((p) => (p.id === plan.id ? plan : p))
        : [plan, ...prev];
    });
  }, []);

  const deletePlan = useCallback(async (id: string) => {
    await removePlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggleTaskOffline = useCallback(
    async (planId: string, taskId: string, completed: boolean) => {
      // Update local plan state
      setPlans((prev) =>
        prev.map((plan) => {
          if (plan.id !== planId) return plan;
          return {
            ...plan,
            days: plan.days.map((day) => ({
              ...day,
              tasks: day.tasks.map((task) =>
                task.id === taskId ? { ...task, completed } : task
              ),
            })),
          };
        })
      );

      // Queue for sync
      await addToOfflineQueue({
        type: "plan-task-toggle",
        payload: { planId, taskId, completed },
      });
    },
    []
  );

  return { plans, loading, cachePlan, deletePlan, toggleTaskOffline };
}
