import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { ApiError } from "../api/client";
import { checkUploadFile, extractText, UPLOAD_ACCEPT } from "../api/extract";
import { MAX_RESUME_LENGTH } from "../api/types";
import { useFocusOnMount } from "../useFocusOnMount";
import { ResumeArt } from "./art";

type Mode = "drop" | "paste" | "card";

interface Props {
  resume: string;
  resumeName: string;
  focusHeading: boolean;
  onResumeChange: (text: string, name: string) => void;
  onUseExample: () => void;
  onNext: () => void;
  onStatus: (message: string, isError?: boolean) => void;
}

export function ResumeStep({ resume, resumeName, focusHeading, onResumeChange, onUseExample, onNext, onStatus }: Props) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>(focusHeading);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasResume = resume.trim().length > 0;
  const [mode, setMode] = useState<Mode>(hasResume ? "card" : "drop");
  const [dragging, setDragging] = useState(false);

  // Upload state. Only the newest upload may update the UI (request id), and leaving the step cancels it.
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [focusTextarea, setFocusTextarea] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (focusTextarea) textareaRef.current?.focus();
  }, [focusTextarea]);

  async function uploadFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploadNote(null);

    const problem = checkUploadFile(file);
    if (problem) {
      setUploadError(problem);
      return;
    }
    if (hasResume && !window.confirm(`Replace the resume text with the text from ${file.name}?`)) return;

    abortRef.current?.abort(); // a newer file replaces an upload that's still running
    const controller = new AbortController();
    abortRef.current = controller;
    const id = ++requestIdRef.current;
    setUploading(file.name);

    try {
      const text = await extractText(file, controller.signal);
      if (id !== requestIdRef.current) return;
      onResumeChange(text, file.name);
      setMode("paste");
      setUploadNote(`Text from ${file.name}. Check it before continuing, especially from PDFs.`);
      setFocusTextarea((n) => n + 1);
    } catch (err) {
      if (id !== requestIdRef.current || controller.signal.aborted) return;
      setUploadError(err instanceof ApiError ? err.message : "Couldn't upload that file. Please try again.");
    } finally {
      if (id === requestIdRef.current) {
        setUploading(null);
        abortRef.current = null;
      }
    }
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again
    void uploadFile(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void uploadFile(e.dataTransfer.files[0]);
  }

  function useExample() {
    onUseExample();
    setUploadError(null);
    setUploadNote(null);
    setMode("card");
  }

  function remove() {
    onResumeChange("", "");
    setUploadNote(null);
    setMode("drop");
    onStatus("Resume removed");
  }

  const canContinue = hasResume && !uploading;
  function continueIfReady() {
    if (canContinue) onNext();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      continueIfReady();
    }
  }

  const nearLimit = resume.length > MAX_RESUME_LENGTH * 0.9;
  const extension = (resumeName.match(/\.(\w+)$/)?.[1] ?? "txt").toUpperCase();

  return (
    <section className="wizard screen-enter" aria-labelledby="resume-heading">
      <div className="wizard-intro">
        <ResumeArt />
        <p className="wizard-kicker">Tailor your resume for the job</p>
        <h1 id="resume-heading" tabIndex={-1} ref={headingRef}>
          Which resume would you like to tailor?
        </h1>
        <p className="wizard-sub">Start with the resume you already have. You'll review every change before it's yours.</p>
      </div>

      <div className="wizard-card">
        {mode === "card" && hasResume ? (
          <div className="file-card" aria-label="Selected resume">
            <span className={`file-tile ext-${extension.toLowerCase()}`} aria-hidden="true">
              {extension}
            </span>
            <div className="file-info">
              <strong>{resumeName || "Pasted resume"}</strong>
              <span>
                {resume.length.toLocaleString()} characters · {resume.split("\n").length} lines
              </span>
              <span className="file-actions">
                <button type="button" className="link-button" onClick={() => setMode("paste")}>
                  Edit text
                </button>
                <span aria-hidden="true">·</span>
                <button type="button" className="link-button" disabled={!!uploading} onClick={() => fileRef.current?.click()}>
                  Replace file
                </button>
                <span aria-hidden="true">·</span>
                <button type="button" className="link-button" onClick={remove}>
                  Remove
                </button>
              </span>
            </div>
            <span className="file-check" aria-hidden="true">
              ✓
            </span>
            <span className="sr-only">Selected</span>
          </div>
        ) : mode === "paste" ? (
          <div className="paste-box">
            <label htmlFor="resume">{uploadNote ? "Review your resume text" : "Paste your resume"}</label>
            <textarea
              id="resume"
              ref={textareaRef}
              maxLength={MAX_RESUME_LENGTH}
              placeholder="Your name, contact details, summary, experience, education, skills..."
              spellCheck={false}
              value={resume}
              autoFocus={!uploadNote}
              aria-describedby={uploadNote ? "upload-status" : undefined}
              onKeyDown={handleKeyDown}
              onChange={(e) => onResumeChange(e.target.value, resumeName || "Pasted resume")}
            />
            <div className="paste-meta">
              <button type="button" className="link-button" onClick={() => (hasResume ? setMode("card") : setMode("drop"))}>
                {hasResume ? "Done editing" : "Upload a file instead"}
              </button>
              <span className={nearLimit ? "count warn" : "count"}>
                {resume.length.toLocaleString()} / {MAX_RESUME_LENGTH.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              className={`dropzone${dragging ? " dragging" : ""}${uploading ? " busy" : ""}`}
              aria-busy={!!uploading}
              aria-describedby="upload-status upload-error"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <span className="dropzone-icon" aria-hidden="true">
                {uploading ? (
                  <span className="mini-spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path d="M12 16V4m0 0l-4.5 4.5M12 4l4.5 4.5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {uploading ? (
                <>
                  <span className="dropzone-title">Reading {uploading}…</span>
                  <span className="dropzone-hint">Drop or choose another file to replace it</span>
                </>
              ) : (
                <>
                  <span className="dropzone-title">
                    Drop your resume here or <span className="dropzone-link">browse</span>
                  </span>
                  <span className="dropzone-hint">.docx, .pdf or .txt · up to 2 MB</span>
                </>
              )}
            </button>
            <div className="or-row">
              <span>or</span>
            </div>
            <div className="choice-row">
              <button type="button" className="secondary" disabled={!!uploading} onClick={() => setMode("paste")}>
                Paste text
              </button>
              <button type="button" className="secondary" disabled={!!uploading} onClick={useExample}>
                Use example
              </button>
            </div>
          </>
        )}

        <label htmlFor="file" className="sr-only">
          Upload your resume (.docx, .pdf or .txt, up to 2 MB)
        </label>
        <input
          ref={fileRef}
          id="file"
          type="file"
          accept={UPLOAD_ACCEPT}
          hidden
          aria-describedby="upload-status upload-error"
          onChange={handleFile}
        />
        <p id="upload-status" className={uploadNote ? "upload-note" : "upload-status"} aria-live="polite">
          {uploading && mode !== "drop" ? (
            <>
              <span className="mini-spinner" aria-hidden="true" /> Reading {uploading}…
            </>
          ) : (
            uploadNote
          )}
        </p>
        <p id="upload-error" className="field-error" role="alert">
          {uploadError}
        </p>

        <button type="button" className="cta" disabled={!canContinue} onClick={continueIfReady}>
          Continue <span aria-hidden="true">→</span>
        </button>
        <p className="cta-hint">
          {mode === "paste" && canContinue ? "or press ⌘/Ctrl + Enter · " : ""}Uploaded files are only read to get the text; they aren't saved.
        </p>
      </div>
    </section>
  );
}
