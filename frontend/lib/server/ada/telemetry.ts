export type AdaTimingName =
  | "validation"
  | "learningDna"
  | "source"
  | "prompt"
  | "provider"
  | "retry"
  | "optionalProvider"
  | "parse"
  | "persistence";

export interface AdaTimingSnapshot extends Record<AdaTimingName, number> {
  total: number;
  providerCalls: number;
  retryCount: number;
}

const timingNames: AdaTimingName[] = [
  "validation",
  "learningDna",
  "source",
  "prompt",
  "provider",
  "retry",
  "optionalProvider",
  "parse",
  "persistence",
];

function boundedDuration(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(value, 120_000)) : 0;
}

export class AdaTelemetry {
  private readonly startedAt = performance.now();
  private readonly durations = new Map<AdaTimingName, number>();
  private providerCalls = 0;
  private retryCount = 0;

  add(name: AdaTimingName, durationMs: number): void {
    const current = this.durations.get(name) ?? 0;
    this.durations.set(name, current + boundedDuration(durationMs));
  }

  set(name: AdaTimingName, durationMs: number): void {
    this.durations.set(name, boundedDuration(durationMs));
  }

  providerCall({ retry = false }: { retry?: boolean } = {}): void {
    this.providerCalls += 1;
    if (retry) this.retryCount += 1;
  }

  snapshot(): AdaTimingSnapshot {
    const durations = Object.fromEntries(
      timingNames.map((name) => [name, Math.round((this.durations.get(name) ?? 0) * 10) / 10]),
    ) as Record<AdaTimingName, number>;
    return {
      ...durations,
      total: Math.round(boundedDuration(performance.now() - this.startedAt) * 10) / 10,
      providerCalls: this.providerCalls,
      retryCount: this.retryCount,
    };
  }

  serverTiming(): string {
    const timing = this.snapshot();
    return [
      ["validation", timing.validation],
      ["dna", timing.learningDna],
      ["source", timing.source],
      ["prompt", timing.prompt],
      ["provider", timing.provider],
      ["retry", timing.retry],
      ["optional-provider", timing.optionalProvider],
      ["parse", timing.parse],
      ["persistence", timing.persistence],
      ["total", timing.total],
    ].map(([name, duration]) => `${name};dur=${duration}`).join(", ");
  }
}

export function safeClientDuration(value: string | null): number {
  const duration = Number(value);
  return Number.isFinite(duration) && duration >= 0 && duration <= 60_000
    ? duration
    : 0;
}

export function logAdaTiming({
  requestId,
  action,
  sourceCount,
  telemetry,
  outcome,
}: {
  requestId: string;
  action: string;
  sourceCount: number;
  telemetry: AdaTelemetry;
  outcome: "success" | "error" | "cancelled";
}): void {
  if (process.env.NODE_ENV !== "development") return;
  console.info(JSON.stringify({
    event: "ada_timing",
    requestId,
    action,
    sourceCount,
    outcome,
    ...telemetry.snapshot(),
  }));
}
