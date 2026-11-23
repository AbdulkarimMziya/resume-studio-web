const STEPS = ["Resume", "Job", "Tailor"];

/** Slim 3-segment progress bar. `progress` runs 1–3 (segments filled); fractions show a partly filled segment. */
export function ProgressBar({ progress }: { progress: number }) {
  const current = Math.min(Math.max(Math.ceil(progress) - 1, 0), STEPS.length - 1);
  return (
    <ol className="progress" aria-label="Progress">
      {STEPS.map((label, i) => {
        const fill = Math.max(0, Math.min(1, progress - i));
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={label} className={`progress-step ${state}`} aria-current={state === "current" ? "step" : undefined}>
            <span className="progress-label">
              <span className="progress-dot" aria-hidden="true">
                {state === "done" ? "✓" : i + 1}
              </span>
              {label}
            </span>
            <span className="progress-track" aria-hidden="true">
              <span className="progress-fill" style={{ transform: `scaleX(${fill})` }} />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
