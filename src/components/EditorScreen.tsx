import { useState } from "react";
import type { Section, TailoredSuggestion } from "../resume/sections";
import { useFocusOnMount } from "../useFocusOnMount";
import { PreviewDialog } from "./PreviewDialog";
import { AutoTextarea, ResumeSection } from "./ResumeSection";
import { SuggestionSidebar } from "./SuggestionSidebar";

interface Props {
  sections: Section[];
  items: TailoredSuggestion[];
  onSectionChange: (id: string, body: string) => void;
  onCopy: (text: string) => void;
  onDownload: () => void;
  onBack: () => void;
}

export function EditorScreen(props: Props) {
  const { sections, items, onSectionChange, onCopy, onDownload, onBack } = props;
  const headingRef = useFocusOnMount<HTMLHeadingElement>(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const header = sections.find((s) => s.title === null);
  const body = sections.filter((s) => s.title !== null);
  const [name = "", ...contactLines] = (header?.body ?? "").split("\n");
  const contact = contactLines.join("\n");

  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.sectionId) counts.set(item.sectionId, (counts.get(item.sectionId) ?? 0) + 1);
  }

  function showSuggestions(sectionId: string) {
    setFilter((current) => (current === sectionId ? null : sectionId));
    const sidebar = document.getElementById("suggestions");
    if (sidebar && window.matchMedia("(max-width: 900px)").matches) {
      sidebar.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="screen-enter">
      <div className="editor-toolbar">
        <button type="button" className="back-link" onClick={onBack}>
          <span aria-hidden="true">←</span> Edit job
        </button>
        <h1 id="editor-heading" tabIndex={-1} ref={headingRef} className="toolbar-title">
          Review your tailored resume
          <span className="toolbar-meta">
            {items.length} suggestion{items.length === 1 ? "" : "s"}
          </span>
        </h1>
        <div className="toolbar-actions">
          <button type="button" className="secondary" onClick={onDownload}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download
          </button>
          <button type="button" onClick={() => setPreviewOpen(true)}>
            Preview
          </button>
        </div>
      </div>

      <div className="editor">
        <article className="doc" aria-labelledby="editor-heading">
          {header && (
            <header className="doc-header">
              <label htmlFor="doc-name" className="sr-only">
                Name
              </label>
              <input
                id="doc-name"
                className="doc-name"
                value={name}
                onChange={(e) => onSectionChange(header.id, contact ? `${e.target.value}\n${contact}` : e.target.value)}
              />
              <label htmlFor="doc-contact" className="sr-only">
                Contact details
              </label>
              <AutoTextarea
                id="doc-contact"
                className="doc-text doc-contact"
                value={contact}
                onChange={(e) => onSectionChange(header.id, e.target.value ? `${name}\n${e.target.value}` : name)}
              />
            </header>
          )}
          {body.map((section) => (
            <ResumeSection
              key={section.id}
              section={section}
              suggestionCount={counts.get(section.id) ?? 0}
              active={filter === section.id}
              onChange={(value) => onSectionChange(section.id, value)}
              onShowSuggestions={() => showSuggestions(section.id)}
            />
          ))}
        </article>

        <SuggestionSidebar
          items={items}
          sections={sections}
          filter={filter}
          onClearFilter={() => setFilter(null)}
          onCopy={onCopy}
        />
      </div>

      <PreviewDialog open={previewOpen} sections={sections} onClose={() => setPreviewOpen(false)} onDownload={onDownload} />
    </div>
  );
}
