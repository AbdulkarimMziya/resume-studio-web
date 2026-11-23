import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyze, ANALYZE_URL, TIMEOUT_MS } from "./analyze";
import { ApiError } from "./client";

function fakeFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function expectApiError(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

const request = { resume_text: "my resume", job_description: "the job" };

beforeEach(() => {
  vi.stubEnv("VITE_USE_MOCK", "false");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("analyze", () => {
  it("POSTs JSON to /api/analyze/ and returns the suggestions", async () => {
    const suggestions = [{ original: "Helped with testing.", replacement: "Wrote tests.", reason: "x" }];
    const fetchMock = fakeFetch(200, { suggestions });

    expect((await analyze(request)).suggestions).toEqual(suggestions);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(ANALYZE_URL);
    expect(url).toMatch(/\/api\/analyze\/$/);
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual(request);
  });

  it("accepts an empty list (nothing to change is not an error)", async () => {
    fakeFetch(200, { suggestions: [] });
    expect((await analyze(request)).suggestions).toEqual([]);
  });

  it("400 → invalid_input listing the field errors", async () => {
    fakeFetch(400, { resume_text: ["This field may not be blank."] });
    const error = await expectApiError(analyze(request));
    expect(error.kind).toBe("invalid_input");
    expect(error.message).toBe("Please check your input. Resume: This field may not be blank.");
  });

  it("502 → ai_bad_output, 503 → ai_unavailable", async () => {
    fakeFetch(502, { detail: "bad output" });
    expect((await expectApiError(analyze(request))).kind).toBe("ai_bad_output");
    fakeFetch(503, { detail: "down" });
    expect((await expectApiError(analyze(request))).kind).toBe("ai_unavailable");
  });

  it("network failure → network", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    expect((await expectApiError(analyze(request))).kind).toBe("network");
  });

  it("no answer within the timeout → timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })),
    );
    const pending = analyze(request).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    expect(((await pending) as ApiError).kind).toBe("timeout");
  });
});
