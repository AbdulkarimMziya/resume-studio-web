// Small decorative illustrations for the wizard steps.

export function ResumeArt() {
  return (
    <svg className="art" viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <rect x="8" y="40" width="120" height="96" rx="14" fill="var(--accent-soft)" />
      <path d="M62 14h62l26 26v92a6 6 0 0 1-6 6H62a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2" />
      <path d="M124 14v20a6 6 0 0 0 6 6h20" fill="var(--bg)" stroke="var(--line-strong)" strokeWidth="2" />
      <rect x="72" y="50" width="60" height="7" rx="3.5" fill="var(--ink)" />
      <rect x="72" y="66" width="62" height="5" rx="2.5" fill="var(--muted)" opacity=".55" />
      <rect x="72" y="78" width="54" height="5" rx="2.5" fill="var(--muted)" opacity=".55" />
      <rect x="72" y="90" width="60" height="5" rx="2.5" fill="var(--muted)" opacity=".55" />
      <rect x="72" y="102" width="34" height="5" rx="2.5" fill="var(--muted)" opacity=".55" />
      <circle cx="36" cy="104" r="20" fill="var(--accent)" />
      <path d="M36 92l3.2 8.8L48 104l-8.8 3.2L36 116l-3.2-8.8L24 104l8.8-3.2z" fill="var(--accent-ink)" />
    </svg>
  );
}

export function JobArt() {
  return (
    <svg className="art" viewBox="0 0 180 150" aria-hidden="true" focusable="false">
      <rect x="40" y="28" width="132" height="96" rx="14" fill="var(--accent-soft)" />
      <rect x="18" y="54" width="112" height="78" rx="10" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2" />
      <path d="M56 54v-10a6 6 0 0 1 6-6h24a6 6 0 0 1 6 6v10" fill="none" stroke="var(--line-strong)" strokeWidth="2" />
      <rect x="18" y="54" width="112" height="22" rx="10" fill="var(--accent)" />
      <rect x="66" y="70" width="16" height="12" rx="3" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2" />
      <rect x="32" y="96" width="62" height="5" rx="2.5" fill="var(--muted)" opacity=".55" />
      <rect x="32" y="108" width="80" height="5" rx="2.5" fill="var(--muted)" opacity=".55" />
      <circle cx="146" cy="40" r="14" fill="var(--spark)" />
      <path d="M146 32l2.2 5.8L154 40l-5.8 2.2L146 48l-2.2-5.8L138 40l5.8-2.2z" fill="#fff" />
    </svg>
  );
}

export function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" fill="currentColor" />
    </svg>
  );
}
