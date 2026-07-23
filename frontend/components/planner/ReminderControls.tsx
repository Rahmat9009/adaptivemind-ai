"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  loadLocalReminderSettings,
  saveLocalReminderSettings,
} from "@/lib/local-reminders";

export function ReminderControls() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const available = "Notification" in window;
      setSupported(available);
      setPermission(available ? Notification.permission : "denied");
      setEnabled(loadLocalReminderSettings().browserNotifications);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function enable() {
    if (!supported) return;
    setMessage(null);
    try {
      const nextPermission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();
      setPermission(nextPermission);
      const nextEnabled = nextPermission === "granted";
      setEnabled(nextEnabled);
      saveLocalReminderSettings({
        browserNotifications: nextEnabled,
      });
      setMessage(
        nextEnabled
          ? "Browser reminders enabled while AdaptiveMind is open."
          : "Notification permission was not granted. Due items remain visible in the app.",
      );
    } catch {
      setMessage(
        "Browser reminders are unavailable. Due items remain visible in the app.",
      );
    }
  }

  function disable() {
    setEnabled(false);
    saveLocalReminderSettings({ browserNotifications: false });
    setMessage("Browser reminders disabled.");
  }

  return (
    <section
      className="mt-5 border-t border-[var(--am-border-light)] pt-5"
      aria-labelledby="local-reminders-title"
    >
      <h3
        id="local-reminders-title"
        className="text-sm font-semibold text-[var(--am-text-primary)]"
      >
        Local reminders
      </h3>
      <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--am-text-secondary)]">
        Due tasks and reviews always appear in AdaptiveMind. Optional browser
        notifications work only while AdaptiveMind is open; no email, SMS, or
        WhatsApp messages are sent.
      </p>
      {supported === false ? (
        <p className="mt-3 text-xs text-[var(--am-text-muted)]">
          Browser notifications are not supported here. Calendar export and
          in-app indicators remain available.
        </p>
      ) : enabled && permission === "granted" ? (
        <button
          type="button"
          className="am-btn am-btn-secondary mt-3"
          onClick={disable}
        >
          <BellOff size={16} aria-hidden="true" />
          Disable browser reminders
        </button>
      ) : (
        <button
          type="button"
          className="am-btn am-btn-secondary mt-3"
          onClick={() => void enable()}
          disabled={supported === null || permission === "denied"}
        >
          <Bell size={16} aria-hidden="true" />
          Enable browser reminders
        </button>
      )}
      {permission === "denied" && (
        <p className="mt-2 text-xs leading-5 text-[var(--am-text-muted)]">
          Notifications are blocked in browser settings. In-app reminders and
          calendar export still work.
        </p>
      )}
      <p
        className="mt-2 min-h-5 text-xs text-[var(--am-text-muted)]"
        role="status"
        aria-live="polite"
      >
        {message ?? ""}
      </p>
    </section>
  );
}
