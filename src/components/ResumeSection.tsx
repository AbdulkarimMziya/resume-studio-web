import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";
import { toTitleCase, type Section } from "../resume/sections";
import { SparkIcon } from "./art";

/** Textarea that grows with its content so it reads like document text. */
export function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      // border-box sizing: add the borders on top of the content + padding height.
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    };
    fit();
    // Re-measure when the width changes (window resize, rotation), or wrapped text gets clipped.
    let lastWidth = el.clientWidth;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth !== lastWidth) {
        lastWidth = el.clientWidth;
        fit();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [props.value]);
  return <textarea ref={ref} rows={1} {...props} />;
}

interface Props {
  section: Section;
  suggestionCount: number;
  active: boolean;
  onChange: (body: string) => void;
  onShowSuggestions: () => void;
}

export function ResumeSection({ section, suggestionCount, active, onChange, onShowSuggestions }: Props) {
  const title = toTitleCase(section.title ?? "Resume");
  const headingId = `${section.id}-heading`;
  return (
    <section className={active ? "doc-section active" : "doc-section"} aria-labelledby={headingId}>
      <div className="doc-section-head">
        <h2 id={headingId}>{title}</h2>
        {suggestionCount > 0 && (
          <button
            type="button"
            className="spark-button"
            aria-pressed={active}
            aria-label={`Show ${suggestionCount} suggestion${suggestionCount === 1 ? "" : "s"} for ${title}`}
            onClick={onShowSuggestions}
          >
            <SparkIcon />
            <span className="spark-label" aria-hidden="true">
              {suggestionCount} suggestion{suggestionCount === 1 ? "" : "s"}
            </span>
          </button>
        )}
      </div>
      <AutoTextarea
        className="doc-text"
        aria-labelledby={headingId}
        spellCheck
        value={section.body}
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  );
}
