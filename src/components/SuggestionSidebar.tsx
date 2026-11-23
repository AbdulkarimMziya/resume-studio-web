import { toTitleCase, type Section, type TailoredSuggestion } from "../resume/sections";
import { SparkIcon } from "./art";

interface Props {
  items: TailoredSuggestion[];
  sections: Section[];
  filter: string | null;
  onClearFilter: () => void;
  onCopy: (text: string) => void;
}

export function SuggestionSidebar({ items, sections, filter, onClearFilter, onCopy }: Props) {
  const byId = new Map(sections.map((s) => [s.id, s]));
  const visible = filter ? items.filter((i) => i.sectionId === filter) : items;
  const filterTitle = filter ? sectionLabel(byId.get(filter)) : null;

  return (
    <aside className="sidebar" id="suggestions" aria-labelledby="sidebar-heading" tabIndex={-1}>
      <div className="sidebar-head">
        <span className="sidebar-icon" aria-hidden="true">
          <SparkIcon />
        </span>
        <div>
          <h2 id="sidebar-heading">AI suggestions</h2>
          <p className="sidebar-sub">Matched to the job you pasted</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="sidebar-empty">
          <h3>Nothing to change</h3>
          <p>Your resume already reads well for this role. You can still edit it on the left and download it.</p>
        </div>
      ) : (
        <>
          <div className="sidebar-filter">
            <h3>Suggestions{filterTitle ? ` for ${filterTitle}` : ""}</h3>
            {filter && (
              <button type="button" className="link-button" onClick={onClearFilter}>
                Show all ({items.length})
              </button>
            )}
          </div>
          <p className="sidebar-intro">Copy a rewrite, then paste it into your resume where it fits.</p>
          <ol className="suggestion-list" key={filter ?? "all"}>
            {visible.map((item) => {
              const section = item.sectionId ? byId.get(item.sectionId) : undefined;
              return (
                <li key={item.id} className="suggestion-card">
                  <span className="chip">
                    <SparkIcon /> {sectionLabel(section)}
                  </span>
                  <p className="was">
                    <span className="sr-only">Original: </span>
                    {item.original}
                  </p>
                  <p className="now">
                    <span className="sr-only">Suggested: </span>
                    {item.replacement}
                  </p>
                  <p className="why">{item.reason}</p>
                  <div className="card-actions">
                    <button type="button" className="secondary small" onClick={() => onCopy(item.replacement)}>
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                        <rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                        <path d="M5 15V6a2 2 0 0 1 2-2h9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Copy
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="help disclaimer">AI suggestions can be wrong. Only keep claims you can back up.</p>
        </>
      )}
    </aside>
  );
}

function sectionLabel(section: Section | undefined): string {
  if (!section) return "General";
  return section.title ? toTitleCase(section.title) : "Header";
}
