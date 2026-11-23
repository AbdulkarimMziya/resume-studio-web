import { API_BASE, ApiError, isMockMode, isRecord, postWithTimeout, readDetail } from "./client";
import { mockAnalyze } from "./mock";
import type { AnalyzeRequest, AnalyzeResponse, Suggestion } from "./types";

export { ApiError } from "./client";

/** Keep the trailing slash: Django's APPEND_SLASH can't redirect a POST. */
export const ANALYZE_URL = `${API_BASE}/api/analyze/`;

/** A little longer than the backend's 30-second Gemini timeout, so the backend's 503 arrives first. */
export const TIMEOUT_MS = 35_000;

/** POST /api/analyze/ — or the built-in mock when VITE_USE_MOCK is not "false". */
export function analyze(request: AnalyzeRequest, signal?: AbortSignal): Promise<AnalyzeResponse> {
  return isMockMode() ? mockAnalyze(request, signal) : realAnalyze(request, signal);
}

async function realAnalyze(request: AnalyzeRequest, signal?: AbortSignal): Promise<AnalyzeResponse> {
  const response = await postWithTimeout(
    ANALYZE_URL,
    {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(request),
    },
    { timeoutMs: TIMEOUT_MS, timeoutMessage: "The analysis took too long. Please try again.", signal },
  );

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, body);
  return parseResponse(body);
}

function toApiError(status: number, body: unknown): ApiError {
  switch (status) {
    case 400: {
      const details = fieldErrors(body);
      return new ApiError("invalid_input", details ? `Please check your input. ${details}` : "Please check your input and try again.", 400);
    }
    case 429:
      return new ApiError("server", "Too many requests. Wait a minute and try again.", 429);
    case 502:
      return new ApiError("ai_bad_output", "The AI returned something we couldn't use. Please try again.", 502);
    case 503:
      return new ApiError("ai_unavailable", "The AI service is unavailable right now. Please try again shortly.", 503);
    default:
      return new ApiError("server", readDetail(body) ?? `Something went wrong (error ${status}). Please try again.`, status);
  }
}

const FIELD_LABELS: Record<string, string> = {
  resume_text: "Resume",
  job_description: "Job description",
};

/** Flattens DRF's `{ field: ["message", ...] }` validation errors into one line. */
function fieldErrors(body: unknown): string | null {
  if (!isRecord(body)) return null;
  const parts = Object.entries(body).flatMap(([field, value]) => {
    const messages = Array.isArray(value) ? value : [value];
    const label = FIELD_LABELS[field] ?? (field === "non_field_errors" || field === "detail" ? "" : field);
    return messages
      .filter((m): m is string => typeof m === "string")
      .map((m) => (label ? `${label}: ${m}` : m));
  });
  return parts.length ? parts.join(" ") : null;
}

function parseResponse(body: unknown): AnalyzeResponse {
  if (!isRecord(body) || !Array.isArray(body.suggestions)) {
    throw new ApiError("server", "The server sent an unexpected response.");
  }
  const suggestions: Suggestion[] = body.suggestions.filter(
    (s): s is Suggestion =>
      isRecord(s) && typeof s.original === "string" && typeof s.replacement === "string" && typeof s.reason === "string",
  );
  return { suggestions };
}
