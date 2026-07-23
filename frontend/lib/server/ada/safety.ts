export const MAX_TUTOR_REQUEST_BYTES = 4 * 1024 * 1024;
export const MAX_PROVIDER_RESPONSE_BYTES = 512 * 1024;
export const PROVIDER_TIMEOUT_MS = 20_000;

export type AdaErrorCode =
  | "INVALID_REQUEST"
  | "REQUEST_TOO_LARGE"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_RESPONSE_INVALID"
  | "REQUEST_CANCELLED";

export class AdaError extends Error {
  readonly code: AdaErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;
  readonly upstreamStatus?: number;

  constructor({
    code,
    message,
    status,
    retryable = false,
    retryAfterMs,
    upstreamStatus,
  }: {
    code: AdaErrorCode;
    message: string;
    status: number;
    retryable?: boolean;
    retryAfterMs?: number;
    upstreamStatus?: number;
  }) {
    super(message);
    this.name = "AdaError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
    this.upstreamStatus = upstreamStatus;
  }
}

export function getSafeAdaError(error: unknown): AdaError {
  if (error instanceof AdaError) return error;
  if (error instanceof Error && error.name === "AbortError") {
    return new AdaError({
      code: "REQUEST_CANCELLED",
      message: "This Ada request was cancelled.",
      status: 499,
      retryable: true,
    });
  }

  return new AdaError({
    code: "PROVIDER_UNAVAILABLE",
    message: "Ada could not complete this request. Please try again.",
    status: 502,
    retryable: true,
  });
}

export function parseRetryAfterMs(response: Response): number | undefined {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) return undefined;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1_000);

  const date = Date.parse(retryAfter);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return undefined;
}
