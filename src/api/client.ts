// Shared pieces for talking to the Django REST Framework backend.

/** Which kind of failure happened, so the UI can choose what to tell the user. */
export type ApiErrorKind =
  | "invalid_input" // 400: the user can fix their input
  | "ai_bad_output" // 502: retry
  | "ai_unavailable" // 503: retry shortly
  | "timeout" // took longer than the browser timeout
  | "network" // server down, offline, or blocked by CORS
  | "server"; // anything else (a bug on the backend)

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

/** Read at call time (not import time) so tests can switch it with vi.stubEnv. */
export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK !== "false";
}

export const NETWORK_MESSAGE = "Couldn't reach the server. Check that the backend is running and try again.";

interface PostOptions {
  timeoutMs: number;
  timeoutMessage: string;
  /** The caller's own cancel signal (e.g. "Back" or a newer upload). */
  signal?: AbortSignal;
}

/**
 * fetch() with one AbortController for both reasons to stop: the timeout, or the caller cancelling.
 * Throws ApiError("timeout" | "network"); re-throws the AbortError when the caller cancelled on purpose.
 */
export async function postWithTimeout(url: string, init: RequestInit, { timeoutMs, timeoutMessage, signal }: PostOptions): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", cancel);

  try {
    return await fetch(url, { ...init, method: "POST", signal: controller.signal });
  } catch (error) {
    if (timedOut) throw new ApiError("timeout", timeoutMessage);
    if (signal?.aborted) throw error; // the caller cancelled; it will ignore this
    throw new ApiError("network", NETWORK_MESSAGE);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readDetail(body: unknown): string | null {
  return isRecord(body) && typeof body.detail === "string" ? body.detail : null;
}
