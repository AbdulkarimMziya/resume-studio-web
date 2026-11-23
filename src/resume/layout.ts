// Turns a section's plain text into display blocks for the resume-style preview.
// Only affects how the preview looks; the text itself (and the download) is unchanged.

export type Block =
  | { kind: "entry"; title: string; right?: string; sub?: string; subRight?: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "label"; label: string; value: string }
  | { kind: "text"; text: string };

const BULLET = /^[-•*–·▪◦]\s+(.*)$/;
const LABEL = /^([^:|]{1,40}):\s+(.+)$/;
// Two columns separated by a tab or 2+ spaces (common in text copied from PDFs). Splits at the last gap.
const COLUMNS = /^(.*\S)(?:\t+| {2,})(\S.*)$/;

const MONTH = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?";
const SEASON = "(?:Spring|Summer|Fall|Autumn|Winter)";
const DATE = `(?:(?:${MONTH}|${SEASON})\\s+\\d{4}|\\d{1,2}/\\d{4}|\\d{4}|Present|present|Current|current)`;
const RANGE = `${DATE}(?:\\s*(?:-|–|—|to)\\s*${DATE})?`;
const ONLY_RANGE = new RegExp(`^${RANGE}$`);
const TRAILING_DATE = new RegExp(`^(.*?\\S)[\\s,]+(?:\\((${RANGE})\\)|(${RANGE}))$`);

/** "May 2025 - Aug 2025" → "May 2025 – Aug 2025"; anything that isn't a date range is returned as is. */
function normalizeDate(text: string): string {
  return ONLY_RANGE.test(text) ? text.replace(/\s*(?:–|—|-|\bto\b)\s*/, " – ") : text;
}

/** Splits a heading line into its left text and right-aligned part (location or dates), if it has one. */
function toRow(line: string): { left: string; right?: string } {
  const columns = COLUMNS.exec(line);
  if (columns) return { left: columns[1], right: normalizeDate(columns[2]) };
  const dated = TRAILING_DATE.exec(line);
  if (dated) return { left: dated[1], right: normalizeDate(dated[2] ?? dated[3]) };
  return { left: line };
}

function looksLikeHeading(line: string): boolean {
  return COLUMNS.test(line) || TRAILING_DATE.test(line) || line.includes(" | ");
}

/**
 * Classifies each line of a section body:
 * bullets, "Label: value" lines, entry headings (title with location/dates on the right,
 * plus an optional second line such as a job title), and plain text.
 * Wrapped lines (e.g. pasted from a PDF) are joined back onto the bullet or label they continue.
 */
export function layoutBody(body: string): Block[] {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let open = false; // true while there's no blank line since the last block

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      open = false;
      continue;
    }
    const last = blocks.at(-1);

    const bullet = BULLET.exec(line);
    if (bullet) {
      if (open && last?.kind === "bullets") last.items.push(bullet[1]);
      else blocks.push({ kind: "bullets", items: [bullet[1]] });
      open = true;
      continue;
    }

    const label = LABEL.exec(line);
    if (open && !label && !looksLikeHeading(line)) {
      if (last?.kind === "bullets") {
        last.items[last.items.length - 1] += ` ${line}`;
        continue;
      }
      if (last?.kind === "label") {
        last.value += ` ${line}`;
        continue;
      }
    }
    open = true;

    if (label) {
      blocks.push({ kind: "label", label: label[1], value: label[2] });
      continue;
    }

    const next = lines[i + 1]?.trim() ?? "";
    if (looksLikeHeading(line) || BULLET.test(next)) {
      const { left, right } = toRow(line);
      const entry: Block = { kind: "entry", title: left, right };
      if (next && !BULLET.test(next) && !LABEL.test(next)) {
        const sub = toRow(next);
        entry.sub = sub.left;
        entry.subRight = sub.right;
        i++;
      }
      blocks.push(entry);
      continue;
    }

    blocks.push({ kind: "text", text: line });
  }
  return blocks;
}

/** Contact lines → individual items, split on "|" so the preview can show them on one line. */
export function contactItems(lines: string[]): string[] {
  return lines
    .flatMap((line) => line.split("|"))
    .map((item) => item.trim())
    .filter(Boolean);
}
