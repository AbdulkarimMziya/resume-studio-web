import type { AnalyzeRequest, AnalyzeResponse } from "./types";
import { SAMPLE_SUGGESTIONS } from "../sampleData";

const MOCK_DELAY_MS = 1500;

/**
 * Stand-in for POST /api/analyze/ until the backend exists.
 * Returns the sample suggestions whose `original` text appears in the submitted resume,
 * so the example resume gets all three and other text gets an empty list ("nothing to change").
 */
export function mockAnalyze(request: AnalyzeRequest, signal?: AbortSignal): Promise<AnalyzeResponse> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Request cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve({
        suggestions: SAMPLE_SUGGESTIONS.filter((s) => request.resume_text.includes(s.original)),
      });
    }, MOCK_DELAY_MS);

    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
  });
}
