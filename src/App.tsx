import { useCallback, useRef, useState } from "react";
import { analyze } from "./api/analyze";
import { ApiError, isMockMode } from "./api/client";
import { EditorScreen } from "./components/EditorScreen";
import { JobStep } from "./components/JobStep";
import { LoadingScreen } from "./components/LoadingScreen";
import { ProgressBar } from "./components/ProgressBar";
import { ResumeStep } from "./components/ResumeStep";
import { Toast, type Status } from "./components/Toast";
import { assemble, locateSuggestions, parseSections, type Section, type TailoredSuggestion } from "./resume/sections";
import { SAMPLE_JOB, SAMPLE_RESUME } from "./sampleData";

type Screen = "resume" | "job" | "loading" | "editor";

const PROGRESS: Record<Screen, number> = { resume: 1, job: 2, loading: 2.5, editor: 3 };

export default function App() {
  const [screen, setScreen] = useState<Screen>("resume");
  const [resume, setResume] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [job, setJob] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [items, setItems] = useState<TailoredSuggestion[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [status, setStatusState] = useState<Status>({ id: 0, message: "", isError: false });

  const abortRef = useRef<AbortController | null>(null);
  // The resume the current draft was built from, so going back with an unchanged resume keeps edits.
  const draftSourceRef = useRef<string | null>(null);

  function setStatus(message: string, isError = false) {
    setStatusState((prev) => ({ id: prev.id + 1, message, isError }));
  }
  const dismissStatus = useCallback(() => setStatusState((prev) => ({ ...prev, message: "" })), []);

  function show(next: Screen) {
    setHasNavigated(true);
    setScreen(next);
  }

  async function submit() {
    const resumeText = resume.trim();
    const jobText = job.trim();
    if (!resumeText) {
      show("resume");
      setStatus("Add your resume first.", true);
      return;
    }
    if (!jobText) {
      setStatus("Paste the job description.", true);
      document.getElementById("job")?.focus();
      return;
    }
    if (abortRef.current) return; // already in flight

    const controller = new AbortController();
    abortRef.current = controller;
    show("loading");
    setStatus("");

    try {
      const result = await analyze({ resume_text: resumeText, job_description: jobText }, controller.signal);
      let draft = sections;
      if (draftSourceRef.current !== resumeText) {
        draft = parseSections(resumeText);
        setSections(draft);
        draftSourceRef.current = resumeText;
      }
      setItems(locateSuggestions(result.suggestions, draft));
      setEditorKey((k) => k + 1);
      show("editor");
      const n = result.suggestions.length;
      setStatus(n === 0 ? "No changes suggested" : `${n} suggestion${n === 1 ? "" : "s"} ready`);
    } catch (err) {
      if (controller.signal.aborted) return; // cancel() already handled the UI
      show("job");
      setStatus(err instanceof ApiError ? err.message : "Something went wrong. Please try again.", true);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    show("job");
    setStatus("Cancelled. Your text is still here");
  }

  /** Logo click: back to step 1, keeping the user's text (no reload). */
  function goHome() {
    abortRef.current?.abort();
    abortRef.current = null;
    show("resume");
    setStatus("");
    window.scrollTo({ top: 0 });
  }

  function updateSection(id: string, body: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, body } : s)));
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied to clipboard");
    } catch {
      setStatus("Couldn't reach the clipboard. Select the text and press Cmd/Ctrl+C.", true);
    }
  }

  function download() {
    const blob = new Blob([assemble(sections) + "\n"], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const base = (resumeName || "resume").replace(/\.txt$/i, "").replace(/[^\w.-]+/g, "-");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${base}-tailored.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`Downloaded ${a.download}`);
  }

  return (
    <>
      <header className="topbar">
        <a
          className="brand"
          href={import.meta.env.BASE_URL}
          aria-label="Resume Studio, start over"
          onClick={(e) => {
            // Let cmd/ctrl/shift/middle clicks open a new tab; a plain click stays in the app.
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            goHome();
          }}
        >
          <span className="logo" aria-hidden="true">
            r.
          </span>{" "}
          resume studio
        </a>
        <span className={isMockMode() ? "badge" : "badge live"}>{isMockMode() ? "Mock API" : "Live API"}</span>
        <ProgressBar progress={PROGRESS[screen]} />
      </header>

      <main className={screen === "editor" || screen === "loading" ? "wide" : undefined}>
        {screen === "resume" && (
          <ResumeStep
            resume={resume}
            resumeName={resumeName}
            focusHeading={hasNavigated}
            onResumeChange={(text, name) => {
              setResume(text);
              setResumeName(name);
            }}
            onUseExample={() => {
              setResume(SAMPLE_RESUME);
              setResumeName("Jordan Lee resume.txt");
              setStatus("Example resume added");
            }}
            onNext={() => {
              show("job");
              setStatus("");
            }}
            onStatus={setStatus}
          />
        )}
        {screen === "job" && (
          <JobStep
            job={job}
            jobUrl={jobUrl}
            onJobChange={setJob}
            onJobUrlChange={setJobUrl}
            onUseExample={() => {
              setJob(SAMPLE_JOB);
              setJobUrl("");
              setStatus("Example job added");
            }}
            onBack={() => {
              show("resume");
              setStatus("");
            }}
            onSubmit={submit}
          />
        )}
        {screen === "loading" && <LoadingScreen onCancel={cancel} />}
        {screen === "editor" && (
          <EditorScreen
            key={editorKey}
            sections={sections}
            items={items}
            onSectionChange={updateSection}
            onCopy={copy}
            onDownload={download}
            onBack={() => {
              show("job");
              setStatus("Your edits are kept while the resume stays the same");
            }}
          />
        )}

      </main>
      <Toast status={status} onDismiss={dismissStatus} />
    </>
  );
}
