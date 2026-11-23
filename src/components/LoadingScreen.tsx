import { useEffect, useState } from "react";
import { useFocusOnMount } from "../useFocusOnMount";

const MESSAGES = ["Reading your resume…", "Matching it to the job…", "Drafting suggestions…"];

/** Skeleton of the editor while the analysis runs. */
export function LoadingScreen({ onCancel }: { onCancel: () => void }) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, MESSAGES.length - 1)), 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="loading screen-enter" aria-labelledby="loading-heading" aria-busy="true">
      <div className="loading-bar">
        <div>
          <h1 id="loading-heading" tabIndex={-1} ref={headingRef}>
            Tailoring your resume
          </h1>
          <p className="loading-message" key={step}>
            {MESSAGES[step]}
          </p>
        </div>
        <button className="secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <div className="editor" aria-hidden="true">
        <div className="doc skeleton-doc">
          <span className="sk sk-title" />
          <span className="sk sk-line" style={{ width: "55%" }} />
          {[0, 1, 2].map((i) => (
            <div className="sk-section" key={i}>
              <span className="sk sk-heading" />
              <span className="sk sk-line" />
              <span className="sk sk-line" style={{ width: "88%" }} />
              <span className="sk sk-line" style={{ width: "72%" }} />
            </div>
          ))}
        </div>
        <div className="sidebar skeleton-side">
          <span className="sk sk-heading" />
          {[0, 1].map((i) => (
            <div className="sk-card" key={i}>
              <span className="sk sk-chip" />
              <span className="sk sk-line" />
              <span className="sk sk-block" />
              <span className="sk sk-line" style={{ width: "80%" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
