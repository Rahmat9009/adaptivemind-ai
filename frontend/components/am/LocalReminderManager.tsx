"use client";

import { useEffect } from "react";
import { loadQuickRecalls } from "@/lib/quick-recall";
import { readStudyPlan } from "@/lib/study-planner";
import {
  getDueLocalReminders,
  getUnnotifiedReminders,
  loadLocalReminderSettings,
  markReminderNotified,
} from "@/lib/local-reminders";

export function LocalReminderManager() {
  useEffect(() => {
    if (!("Notification" in window)) return;

    const check = () => {
      if (
        document.visibilityState !== "visible"
        || Notification.permission !== "granted"
        || !loadLocalReminderSettings().browserNotifications
      ) {
        return;
      }
      const pending = getUnnotifiedReminders(
        getDueLocalReminders(readStudyPlan(), loadQuickRecalls()),
      );
      for (const reminder of pending.slice(0, 3)) {
        try {
          new Notification(reminder.title, {
            body: reminder.body,
            tag: reminder.id,
          });
          markReminderNotified(reminder.id);
        } catch {
          return;
        }
      }
    };

    check();
    const interval = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return null;
}
