"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] =
    useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const reloadRequested = useRef(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then(
        (registrations) =>
          Promise.all(
            registrations.map((registration) =>
              registration.unregister(),
            ),
          ),
      );
      if ("caches" in window) {
        void caches.keys().then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith("adaptivemind-"))
              .map((key) => caches.delete(key)),
          ),
        );
      }
      return;
    }

    let disposed = false;
    const showWaitingWorker = (worker: ServiceWorker | null) => {
      if (!disposed && worker) {
        setWaitingWorker(worker);
        setDismissed(false);
      }
    };

    void navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }).then((nextRegistration) => {
      if (disposed) return;
      showWaitingWorker(nextRegistration.waiting);
      nextRegistration.addEventListener("updatefound", () => {
        const installing = nextRegistration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed"
            && navigator.serviceWorker.controller
          ) {
            showWaitingWorker(nextRegistration.waiting ?? installing);
          }
        });
      });
    }).catch(() => {
      // The app remains usable online when service workers are unavailable.
    });

    const handleControllerChange = () => {
      if (!reloadRequested.current) return;
      reloadRequested.current = false;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );
    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  if (!waitingWorker || dismissed) return null;

  return (
    <aside
      className="fixed bottom-20 right-4 z-[var(--am-z-toast)] w-[min(22rem,calc(100vw-2rem))] border border-[var(--am-border-light)] bg-[var(--am-surface)] p-4 shadow-[var(--am-shadow-lg)] sm:bottom-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <RefreshCw
          size={18}
          className="mt-0.5 shrink-0 text-[var(--am-primary)]"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--am-text-primary)]">
            AdaptiveMind update ready
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--am-text-secondary)]">
            Reload when convenient to use the new version. Your local learning
            data will remain on this device.
          </p>
          <button
            type="button"
            className="am-btn am-btn-primary mt-3"
            onClick={() => {
              reloadRequested.current = true;
              waitingWorker.postMessage({ type: "SKIP_WAITING" });
            }}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Reload
          </button>
        </div>
        <button
          type="button"
          className="am-icon-button shrink-0"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update notice"
          title="Dismiss"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
