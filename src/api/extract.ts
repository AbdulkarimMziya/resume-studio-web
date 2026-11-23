// POST /api/extract-text/: turn an uploaded .txt / .docx / .pdf into plain resume text.
// Upload only fills the resume text; analyze() is unchanged.

import { API_BASE, ApiError, isMockMode, isRecord, postWithTimeout, readDetail } from "./client";
import { MAX_RESUME_LENGTH } from "./types";

/** Keep the trailing slash: Django can't redirect a POST. */
export const EXTRACT_URL = `${API_BASE}/api/extract-text/`;
export const UPLOAD_TIMEOUT_MS = 20_000;
export const UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const UPLOAD_EXTENSIONS = [".txt", ".docx", ".pdf"];
export const UPLOAD_ACCEPT =
  ".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

/** Fast checks before uploading (the server checks again). Returns a user-facing message, or null if OK. */
export function checkUploadFile(file: File): string | null {
  if (!UPLOAD_EXTENSIONS.includes(extensionOf(file.name))) return "Only .txt, .docx and .pdf files are supported.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > UPLOAD_MAX_BYTES) return "That file is over 2 MB.";
  return null;
}

export async function extractText(file: File, signal?: AbortSignal): Promise<string> {
  if (isMockMode()) return mockExtract(file);

  const form = new FormData();
  form.append("file", file);
  // Don't set Content-Type: the browser must add the multipart boundary itself.
  const response = await postWithTimeout(
    EXTRACT_URL,
    { headers: { Accept: "application/json" }, body: form },
    { timeoutMs: UPLOAD_TIMEOUT_MS, timeoutMessage: "Reading that file took too long. Please try again.", signal },
  );

  const body: unknown = await response.json().catch(() => null);

  if (response.ok) {
    if (!isRecord(body) || typeof body.text !== "string") {
      throw new ApiError("server", "The server sent a response this app does not understand.", response.status);
    }
    return body.text;
  }

  if (response.status === 400) {
    // The backend's 400 messages are written for end users: show them as they come.
    const fileErrors = isRecord(body) && Array.isArray(body.file) ? body.file.filter((m): m is string => typeof m === "string") : [];
    if (fileErrors.length) throw new ApiError("invalid_input", fileErrors.join(" "), 400);
    const detail = readDetail(body);
    if (detail) throw new ApiError("invalid_input", detail, 400);
  }
  throw new ApiError("server", "Couldn't upload that file. Please try again.", response.status);
}

/** Without a backend, only .txt can be read (in the browser). */
async function mockExtract(file: File): Promise<string> {
  if (extensionOf(file.name) !== ".txt") {
    throw new ApiError("invalid_input", "Uploading Word and PDF files needs the backend. Set VITE_USE_MOCK=false, or paste the text.");
  }
  const text = (await file.text()).trim();
  if (!text) throw new ApiError("invalid_input", "That file is empty.");
  return text.slice(0, MAX_RESUME_LENGTH);
}
