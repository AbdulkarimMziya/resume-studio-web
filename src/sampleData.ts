import type { Suggestion } from "./api/types";

export const SAMPLE_RESUME = `Jordan Lee
Junior Backend Developer | Vancouver, BC | jordan.lee@example.com

SUMMARY
Developer who likes building things with Python.

EXPERIENCE
Software Developer Intern, Northwind Logistics (May 2025 - Aug 2025)
- Worked on APIs for the shipping team.
- Fixed bugs in the order tracking system.
- Helped with testing.

Teaching Assistant, Intro to Programming, Coastal University (Sep 2024 - Apr 2025)
- Ran weekly lab sessions for 30 students.

PROJECTS
Budget Tracker - Django REST Framework + PostgreSQL app for logging personal expenses.

SKILLS
Python, Django REST Framework, PostgreSQL, Git, pytest, REST APIs`;

export const SAMPLE_JOB = `Backend Developer (Junior) - Harbourline Software

About the role
You will join a small platform team that builds and maintains the REST APIs behind our customer dashboard.

Responsibilities
- Design, build and maintain REST APIs using Python and Django REST Framework.
- Write automated tests and keep our test coverage healthy.
- Investigate and fix production issues to improve reliability.
- Work closely with product and frontend teammates.

Requirements
- Experience with Python and a modern web framework.
- Familiarity with relational databases such as PostgreSQL.
- Comfortable writing unit and integration tests.
- Nice to have: experience with Docker.`;

export const SAMPLE_SUGGESTIONS: Suggestion[] = [
  {
    original: "Developer who likes building things with Python.",
    replacement:
      "Junior backend developer who builds and tests REST APIs with Python, Django REST Framework and PostgreSQL.",
    reason:
      "The job asks to “Design, build and maintain REST APIs using Python and Django REST Framework.” Your skills list already names these tools, so the summary can say so directly.",
  },
  {
    original: "Worked on APIs for the shipping team.",
    replacement: "Built and maintained REST API endpoints used by the shipping team.",
    reason:
      "Matches “build and maintain REST APIs.” Only use “built” if you wrote the endpoints yourself; otherwise describe your actual part.",
  },
  {
    original: "Helped with testing.",
    replacement: "Wrote automated pytest tests for API endpoints.",
    reason:
      "The role asks you to “Write automated tests.” pytest is in your skills; keep this only if it describes the testing you really did.",
  },
];
