"use client";

import {
  Bot,
  FileText,
  HardDrive,
  Mic,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { PageShell } from "@/components/am/PageShell";
import { ReadingPreferencesInline } from "@/components/tutor/ReadingPreferencesInline";
import { useReadingSettings } from "@/hooks/useReadingSettings";
import { DataControls } from "./DataControls";

const privacySections = [
  {
    id: "stored-locally",
    title: "What stays on this device",
    icon: HardDrive,
    paragraphs: [
      "AdaptiveMind stores Learning DNA, lesson and explanation history, mastery estimates, planner data, preferences, learning activity, review schedules, and downloaded lessons in this browser.",
      "Small settings use localStorage. Downloaded lessons, study plans, learning activity, and pending offline updates use IndexedDB. There is no AdaptiveMind account or cloud learner record in this version.",
    ],
  },
  {
    id: "sent-to-ai",
    title: "What is sent for an Ada request",
    icon: Bot,
    paragraphs: [
      "When you ask Ada for a live response, AdaptiveMind sends your submitted prompt and the selected learner context needed for that request to the configured external AI provider.",
      "Extracted document or website content is included when you select it. Images are included when image analysis is required. Source-only mode tells Ada to stay within the supplied source, but AI output can still be incomplete or incorrect.",
    ],
  },
  {
    id: "uploaded-materials",
    title: "Uploaded materials and links",
    icon: FileText,
    paragraphs: [
      "Files and images are processed for the active request. AdaptiveMind does not intentionally create a permanent cloud library of raw uploads, and raw files are not saved as downloaded lessons.",
      "The external AI provider may process submitted text or images according to its own service terms. Inaccessible links and failed file extractions are reported rather than treated as successfully read.",
    ],
  },
  {
    id: "voice",
    title: "Voice",
    icon: Mic,
    paragraphs: [
      "The microphone starts only after you take an action and grant browser permission. You can review and edit recognized text before submitting it.",
      "AdaptiveMind does not intentionally store voice recordings permanently. Browser speech recognition may use a speech service provided by your browser or operating system. Spoken Ada responses never autoplay.",
    ],
  },
  {
    id: "accuracy",
    title: "AI accuracy and learning estimates",
    icon: TriangleAlert,
    paragraphs: [
      "Ada responses can be wrong. Verify important academic, medical, legal, safety, or financial information with authoritative sources.",
      "Understanding checks, mastery estimates, confidence coaching, and explanation recommendations are approximate models based on limited local evidence. They are not diagnoses or permanent learning-style classifications.",
    ],
  },
] as const;

export function PrivacyPageShell() {
  const readingSettings = useReadingSettings();

  return (
    <PageShell
      heading="Privacy and local data"
      subheading="Plain-language details about what stays on this device and what leaves it for an Ada request."
    >
      <div className="space-y-12">
        <section
          className="border-y border-[var(--am-border-light)] py-7"
          aria-labelledby="privacy-summary-title"
        >
          <div className="flex gap-4">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-[var(--am-primary)]"
              size={24}
              aria-hidden="true"
            />
            <div>
              <h2
                id="privacy-summary-title"
                className="am-heading-serif text-2xl text-[var(--am-text-primary)]"
              >
                Local-first, not anonymous or permanent
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--am-text-secondary)]">
                Your learning record normally remains in this browser. Clearing
                browser data may remove it, and another device will not receive
                it automatically. Live Ada requests require a connection and
                send selected request data to an external AI provider.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-x-10 gap-y-9 lg:grid-cols-2">
          {privacySections.map((section) => {
            const Icon = section.icon;
            return (
              <section
                key={section.id}
                aria-labelledby={`${section.id}-title`}
                className="border-t border-[var(--am-border-light)] pt-5"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={20}
                    className="text-[var(--am-primary)]"
                    aria-hidden="true"
                  />
                  <h2
                    id={`${section.id}-title`}
                    className="text-base font-semibold text-[var(--am-text-primary)]"
                  >
                    {section.title}
                  </h2>
                </div>
                <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--am-text-secondary)]">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            );
          })}

          <section
            aria-labelledby="not-collected-title"
            className="border-t border-[var(--am-border-light)] pt-5"
          >
            <h2
              id="not-collected-title"
              className="text-base font-semibold text-[var(--am-text-primary)]"
            >
              What AdaptiveMind does not currently collect
            </h2>
            <ul className="mt-3 grid list-disc gap-x-6 gap-y-1 pl-5 text-sm leading-7 text-[var(--am-text-secondary)] sm:grid-cols-2">
              <li>Account profile</li>
              <li>Cloud learner record</li>
              <li>Phone number</li>
              <li>Payment information</li>
              <li>Advertising data</li>
              <li>Inferred disability</li>
              <li>Inferred emotional state</li>
              <li>Public ratings or peer rankings</li>
            </ul>
          </section>
        </div>

        <section
          aria-labelledby="limitations-title"
          className="border-y border-[var(--am-border-light)] py-7"
        >
          <h2
            id="limitations-title"
            className="am-heading-serif text-2xl text-[var(--am-text-primary)]"
          >
            Current limitations
          </h2>
          <ul className="mt-4 grid list-disc gap-x-8 gap-y-2 pl-5 text-sm leading-7 text-[var(--am-text-secondary)] md:grid-cols-2">
            <li>No account, cloud synchronization, or cloud backup.</li>
            <li>No guarantee of recovery after browser data is cleared.</li>
            <li>No email, SMS, or WhatsApp reminders.</li>
            <li>
              Reminders are limited to in-app due states, optional browser
              notifications, and calendar export.
            </li>
            <li>
              Microphone permission is revoked through your browser settings.
            </li>
            <li>
              Offline mode can open saved material but cannot create a new Ada
              response.
            </li>
          </ul>
        </section>

        <DataControls />

        <section
          aria-labelledby="reading-preferences-title"
          className="border-t border-[var(--am-border-light)] pt-7"
        >
          <h2
            id="reading-preferences-title"
            className="am-heading-serif text-2xl text-[var(--am-text-primary)]"
          >
            Reading preferences
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--am-text-secondary)]">
            These settings stay on this browser and apply across AdaptiveMind.
            Your operating system reduced-motion preference is also respected.
          </p>
          <div className="mt-5 max-w-xl border-y border-[var(--am-border-light)] py-5">
            <ReadingPreferencesInline
              settings={readingSettings}
              onChange={() => undefined}
            />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
