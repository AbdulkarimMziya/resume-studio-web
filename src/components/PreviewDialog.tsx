import { useEffect, useRef } from "react";
import { contactItems, layoutBody, type Block } from "../resume/layout";
import type { Section } from "../resume/sections";

interface Props {
  open: boolean;
  sections: Section[];
  onClose: () => void;
  onDownload: () => void;
}

/** "Name | tech stack" → bold name, italic stack (like a project heading); otherwise a bold title. */
function EntryTitle({ title }: { title: string }) {
  const bar = title.indexOf(" | ");
  if (bar === -1) return <strong>{title}</strong>;
  return (
    <span>
      <strong>{title.slice(0, bar)}</strong> | <em>{title.slice(bar + 3)}</em>
    </span>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "entry":
      return (
        <div className="entry">
          <div className="entry-row">
            <EntryTitle title={block.title} />
            {block.right && <span>{block.right}</span>}
          </div>
          {block.sub && (
            <div className="entry-row entry-sub">
              <span>{block.sub}</span>
              {block.subRight && <span>{block.subRight}</span>}
            </div>
          )}
        </div>
      );
    case "bullets":
      return (
        <ul className="entry-bullets">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "label":
      return (
        <p className="entry-label">
          <strong>{block.label}:</strong> {block.value}
        </p>
      );
    case "text":
      return <p>{block.text}</p>;
  }
}

export function PreviewDialog({ open, sections, onClose, onDownload }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const header = sections.find((s) => s.title === null);
  const [name = "", ...contactLines] = (header?.body ?? "").split("\n");
  const contact = contactItems(contactLines);

  return (
    <dialog ref={ref} className="preview" aria-labelledby="preview-heading" onClose={onClose}>
      <div className="preview-bar">
        <h2 id="preview-heading">Preview</h2>
        <div className="preview-actions">
          <button type="button" className="secondary pill" onClick={onDownload}>
            Download
          </button>
          <button type="button" className="pill" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <article className="preview-page">
        {name && <h1>{name.trim()}</h1>}
        {contact.length > 0 && <p className="preview-contact">{contact.join(" | ")}</p>}
        {sections
          .filter((s) => s.title !== null && s.body.trim())
          .map((s) => (
            <section key={s.id}>
              <h3>{s.title}</h3>
              {layoutBody(s.body).map((block, i) => (
                <BlockView key={i} block={block} />
              ))}
            </section>
          ))}
      </article>
    </dialog>
  );
}
