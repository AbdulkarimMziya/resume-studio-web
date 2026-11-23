import type { FormEvent, KeyboardEvent } from "react";
import { MAX_JOB_LENGTH } from "../api/types";
import { useFocusOnMount } from "../useFocusOnMount";
import { JobArt, SparkIcon } from "./art";

interface Props {
  job: string;
  jobUrl: string;
  onJobChange: (value: string) => void;
  onJobUrlChange: (value: string) => void;
  onUseExample: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function JobStep({ job, jobUrl, onJobChange, onJobUrlChange, onUseExample, onBack, onSubmit }: Props) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>(true);
  const ready = job.trim().length > 0;
  const nearLimit = job.length > MAX_JOB_LENGTH * 0.9;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (ready) onSubmit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (ready) onSubmit();
    }
  }

  return (
    <section className="wizard screen-enter" aria-labelledby="job-heading">
      <div className="wizard-intro">
        <button type="button" className="back-link" onClick={onBack}>
          <span aria-hidden="true">←</span> Back to resume
        </button>
        <JobArt />
        <p className="wizard-kicker">Tailor your resume for the job</p>
        <h1 id="job-heading" tabIndex={-1} ref={headingRef}>
          Which job are you tailoring it for?
        </h1>
        <p className="wizard-sub">Paste the full posting. Responsibilities and requirements give the best suggestions.</p>
      </div>

      <form id="job-form" className="wizard-card" onSubmit={handleSubmit} noValidate>
        <label htmlFor="job">Job description</label>
        <textarea
          id="job"
          maxLength={MAX_JOB_LENGTH}
          placeholder="Paste the responsibilities and requirements..."
          spellCheck={false}
          value={job}
          onKeyDown={handleKeyDown}
          onChange={(e) => onJobChange(e.target.value)}
        />
        <div className="paste-meta">
          <button type="button" className="link-button" onClick={onUseExample}>
            Use example job
          </button>
          <span className={nearLimit ? "count warn" : "count"}>
            {job.length.toLocaleString()} / {MAX_JOB_LENGTH.toLocaleString()}
          </span>
        </div>

        <label htmlFor="url">
          Job link <span className="muted">(optional, not opened yet)</span>
        </label>
        <input
          id="url"
          type="url"
          placeholder="https://company.com/careers/role"
          value={jobUrl}
          onChange={(e) => onJobUrlChange(e.target.value)}
        />

        <button type="submit" className="cta" disabled={!ready}>
          <SparkIcon /> Tailor my resume
        </button>
        <p className="cta-hint">
          {ready ? "or press ⌘/Ctrl + Enter · " : ""}Your text is sent to the AI to generate suggestions. Nothing is saved.
        </p>
      </form>
    </section>
  );
}
