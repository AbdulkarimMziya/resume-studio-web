import type { Suggestion } from "../api/types";

/** One block of the resume. The header (name + contact lines) has `title: null`. */
export interface Section {
  id: string;
  title: string | null;
  body: string;
}

/** A suggestion tied to the section it was found in when the analysis came back. */
export interface TailoredSuggestion extends Suggestion {
  id: string;
  sectionId: string | null;
}

const KNOWN_HEADINGS =
  /^(summary|profile|professional summary|objective|about( me)?|experience|work experience|professional experience|employment( history)?|education|skills|technical skills|projects|personal projects|certifications?|licen[cs]es( & certifications)?|volunteer(ing| experience)?|awards|honou?rs|publications|languages|interests|relevant coursework|coursework)$/i;

function isHeading(line: string): boolean {
  const text = line.trim().replace(/:$/, "");
  if (text.length < 4 || text.length > 40) return false;
  if (KNOWN_HEADINGS.test(text)) return true;
  // ALL CAPS lines made of letters, spaces, & and / (e.g. "WORK EXPERIENCE", "SKILLS & TOOLS").
  return /^[A-Z][A-Z &/]*[A-Z]$/.test(text);
}

function trimBlankLines(lines: string[]): string {
  let start = 0;
  let end = lines.length;
  while (start < end && !lines[start].trim()) start++;
  while (end > start && !lines[end - 1].trim()) end--;
  return lines.slice(start, end).join("\n");
}

/** Splits plain-text resume into a header plus titled sections, using heading lines as boundaries. */
export function parseSections(text: string): Section[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const sections: Section[] = [];
  let title: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    const body = trimBlankLines(buffer);
    if (title !== null || body) sections.push({ id: `s${sections.length}`, title, body });
    buffer = [];
  };

  for (const line of lines) {
    if (isHeading(line)) {
      flush();
      title = line.trim().replace(/:$/, "");
    } else {
      buffer.push(line);
    }
  }
  flush();

  // No headings found: treat everything after the first line as one section.
  if (sections.length === 1 && sections[0].title === null) {
    const [first, ...rest] = sections[0].body.split("\n");
    const body = trimBlankLines(rest);
    return body
      ? [
          { id: "s0", title: null, body: first },
          { id: "s1", title: "Resume", body },
        ]
      : sections;
  }
  return sections;
}

/** Rebuilds plain text from sections (used for download and preview). */
export function assemble(sections: Section[]): string {
  return sections
    .map((s) => (s.title ? `${s.title.toUpperCase()}\n${s.body}`.trimEnd() : s.body.trim()))
    .filter(Boolean)
    .join("\n\n");
}

/** Ties each suggestion to the first section whose text contains its `original`. */
export function locateSuggestions(suggestions: Suggestion[], sections: Section[]): TailoredSuggestion[] {
  return suggestions.map((s, i) => ({
    ...s,
    id: `g${i}`,
    sectionId: sections.find((section) => section.body.includes(s.original))?.id ?? null,
  }));
}

/** "WORK EXPERIENCE" → "Work Experience"; mixed-case titles are left alone. */
export function toTitleCase(text: string): string {
  if (text !== text.toUpperCase()) return text;
  return text.toLowerCase().replace(/(^|[\s/&])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase());
}
