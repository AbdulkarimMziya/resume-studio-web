import { useEffect, useRef } from "react";
import { toTitleCase, type Section } from "../resume/sections";

interface Props {
  open: boolean;
  sections: Section[];
  onClose: () => void;
  onDownload: () => void;
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
  const [name = "", ...contact] = (header?.body ?? "").split("\n");

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
        {name && <h1>{name}</h1>}
        {contact.length > 0 && <p className="preview-contact">{contact.join("\n").trim()}</p>}
        {sections
          .filter((s) => s.title !== null && s.body.trim())
          .map((s) => (
            <section key={s.id}>
              <h3>{toTitleCase(s.title ?? "")}</h3>
              <p>{s.body}</p>
            </section>
          ))}
      </article>
    </dialog>
  );
}
