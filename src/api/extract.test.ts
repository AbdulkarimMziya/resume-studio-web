import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./client";
import { checkUploadFile, EXTRACT_URL, extractText, UPLOAD_MAX_BYTES, UPLOAD_TIMEOUT_MS } from "./extract";

// Fake fetch so no test ever reaches the real backend.
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

const resumeFile = () => new File(["%PDF-1.7 fake"], "resume.pdf", { type: "application/pdf" });

beforeEach(() => {
  vi.stubEnv("VITE_USE_MOCK", "false");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("extractText", () => {
  it("POSTs the file as multipart FormData to /api/extract-text/ without setting Content-Type", async () => {
    const fetchMock = fakeFetch(200, { text: "Jane Doe\nJunior developer" });
    const file = resumeFile();

    const text = await extractText(file);

    expect(text).toBe("Jane Doe\nJunior developer");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(EXTRACT_URL);
    expect(url).toMatch(/\/api\/extract-text\/$/);
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBe(file);
    const headerNames = Object.keys(init.headers).map((h) => h.toLowerCase());
    expect(headerNames).not.toContain("content-type");
  });

  it("400 {file: [...]} → invalid_input with the field message", async () => {
    fakeFetch(400, { file: ["Only .txt, .docx and .pdf files are supported."] });
    const error = await expectApiError(extractText(resumeFile()));
    expect(error.kind).toBe("invalid_input");
    expect(error.status).toBe(400);
    expect(error.message).toBe("Only .txt, .docx and .pdf files are supported.");
  });

  it("400 {detail} → invalid_input with the detail, shown as-is", async () => {
    const detail = "No text found in that PDF. It may be a scanned image; paste your resume text instead.";
    fakeFetch(400, { detail });
    const error = await expectApiError(extractText(resumeFile()));
    expect(error.kind).toBe("invalid_input");
    expect(error.message).toBe(detail);
  });

  it("200 with a body that has no text → server", async () => {
    fakeFetch(200, { content: "oops" });
    expect((await expectApiError(extractText(resumeFile()))).kind).toBe("server");
  });

  it("415 → server with a generic message", async () => {
    fakeFetch(415, { detail: 'Unsupported media type "application/json" in request.' });
    const error = await expectApiError(extractText(resumeFile()));
    expect(error.kind).toBe("server");
    expect(error.message).toBe("Couldn't upload that file. Please try again.");
  });

  it("network failure → network", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    expect((await expectApiError(extractText(resumeFile()))).kind).toBe("network");
  });

  it("no answer within the upload timeout → timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })),
    );
    const pending = extractText(resumeFile()).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(UPLOAD_TIMEOUT_MS);
    const error = (await pending) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe("timeout");
  });

  it("re-throws the abort when the caller cancels (a newer file replaced this one)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      })),
    );
    const controller = new AbortController();
    const pending = extractText(resumeFile(), controller.signal).catch((e: unknown) => e);
    controller.abort();
    const error = await pending;
    expect(error).not.toBeInstanceOf(ApiError);
    expect((error as DOMException).name).toBe("AbortError");
  });
});

describe("checkUploadFile", () => {
  const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);

  it("accepts .txt, .docx and .pdf, case-insensitively", () => {
    expect(checkUploadFile(file("cv.txt"))).toBeNull();
    expect(checkUploadFile(file("cv.docx"))).toBeNull();
    expect(checkUploadFile(file("CV.PDF"))).toBeNull();
  });

  it("rejects other types, empty files and files over 2 MB before any request", () => {
    expect(checkUploadFile(file("cv.doc"))).toBe("Only .txt, .docx and .pdf files are supported.");
    expect(checkUploadFile(file("photo.png"))).toBe("Only .txt, .docx and .pdf files are supported.");
    expect(checkUploadFile(file("cv.pdf", 0))).toBe("That file is empty.");
    expect(checkUploadFile(file("cv.pdf", UPLOAD_MAX_BYTES + 1))).toBe("That file is over 2 MB.");
    expect(checkUploadFile(file("cv.pdf", UPLOAD_MAX_BYTES))).toBeNull();
  });
});

describe("extractText in mock mode (no backend)", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_USE_MOCK", "true");
  });

  it("reads .txt in the browser without calling fetch", async () => {
    const fetchMock = fakeFetch(500, {});
    const text = await extractText(new File(["  Jane Doe\nDeveloper  "], "cv.txt", { type: "text/plain" }));
    expect(text).toBe("Jane Doe\nDeveloper");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("explains that .pdf and .docx need the backend", async () => {
    const error = await expectApiError(extractText(resumeFile()));
    expect(error.kind).toBe("invalid_input");
    expect(error.message).toMatch(/needs the backend/);
  });
});
