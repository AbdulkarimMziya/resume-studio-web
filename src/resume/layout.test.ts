import { describe, expect, it } from "vitest";
import { contactItems, layoutBody } from "./layout";

describe("layoutBody", () => {
  it("turns a dated line followed by bullets into an entry with its bullets", () => {
    const body = [
      "Software Developer Intern, Northwind Logistics (May 2025 - Aug 2025)",
      "- Worked on APIs for the shipping team.",
      "- Fixed bugs in the order tracking system.",
      "- Helped with testing.",
    ].join("\n");

    expect(layoutBody(body)).toEqual([
      { kind: "entry", title: "Software Developer Intern, Northwind Logistics", right: "May 2025 – Aug 2025" },
      {
        kind: "bullets",
        items: ["Worked on APIs for the shipping team.", "Fixed bugs in the order tracking system.", "Helped with testing."],
      },
    ]);
  });

  it("reads two-column lines (as copied from a PDF) into title/right and an italic second row", () => {
    const body = "Thompson Rivers University    Kamloops, BC\nBachelor of Computing Science    01/2020 – 12/2025";

    expect(layoutBody(body)).toEqual([
      {
        kind: "entry",
        title: "Thompson Rivers University",
        right: "Kamloops, BC",
        sub: "Bachelor of Computing Science",
        subRight: "01/2020 – 12/2025",
      },
    ]);
  });

  it("keeps a project's ' | tech stack' in the title and pulls the dates to the right", () => {
    const [block] = layoutBody("RecruitReach | Python, Django REST Framework, pytest 2026 – Present\n• Built a REST API.");

    expect(block).toEqual({ kind: "entry", title: "RecruitReach | Python, Django REST Framework, pytest", right: "2026 – Present" });
  });

  it("joins wrapped lines back onto the bullet they continue, but starts a new entry at the next heading", () => {
    const body = [
      "• Wrote 60 pytest tests and gated every pull request in GitHub Actions",
      "CI.",
      "DidWeights | Swift, SwiftUI",
      "• Built a workout tracking app.",
    ].join("\n");

    expect(layoutBody(body)).toEqual([
      { kind: "bullets", items: ["Wrote 60 pytest tests and gated every pull request in GitHub Actions CI."] },
      { kind: "entry", title: "DidWeights | Swift, SwiftUI", right: undefined },
      { kind: "bullets", items: ["Built a workout tracking app."] },
    ]);
  });

  it("recognises 'Label: value' lines and plain text", () => {
    expect(layoutBody("Languages: Swift, Python\nFrameworks: SwiftUI")).toEqual([
      { kind: "label", label: "Languages", value: "Swift, Python" },
      { kind: "label", label: "Frameworks", value: "SwiftUI" },
    ]);
    expect(layoutBody("Developer who likes building things with Python.")).toEqual([
      { kind: "text", text: "Developer who likes building things with Python." },
    ]);
  });
});

describe("contactItems", () => {
  it("splits contact lines on '|' and drops empty pieces", () => {
    expect(contactItems(["Kamloops, BC | +1 250-000-0000 | x@example.com", ""])).toEqual([
      "Kamloops, BC",
      "+1 250-000-0000",
      "x@example.com",
    ]);
  });
});
