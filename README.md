# Resume Studio
**A web app that tailors your existing resume to a specific job posting: AI suggests sharper, role-specific wording, and you decide what goes in. It never invents experience.**

🔗 **[Live Demo](https://abdulkarimmziya.github.io/resume-studio-web/)** (uses the hosted API; the first request can take about a minute while the free Render server wakes up)
📄 **[Backend / API (Django REST Framework)](https://github.com/AbdulkarimMziya/resume-studio-api)**

<!-- Drop a screenshot or GIF into docs/media/ and keep this file name, or update the path below. -->
![Resume Studio demo](docs/media/demo.gif)

---

## 🎯 Problem & Motivation
A generic resume gets filtered out, but rewriting it by hand for every posting is slow, and AI tools that rewrite everything tend to exaggerate. Resume Studio compares your resume with one job description and suggests specific rewrites of lines you already have, each with the reason it fits the role. You copy in only what's true.

## ✨ Key Features & Engineering Highlights
* **Three-step tailoring flow:** Resume → Job → Editor, with a progress bar, focus management between steps, and a skeleton loader while the AI works.
* **Resume upload (.docx, .pdf, .txt):** Files go to a DRF endpoint as multipart form data (the browser sets the boundary). Wrong types, empty files and files over 2 MB are rejected before any request, and picking a new file cancels an upload still in progress.
* **Section-aware editor:** The resume is split into editable sections. ✦ buttons filter suggestions by section, and each suggestion has a **Copy** button, so the user stays in control of every edit. Download as `.txt` or preview a clean version.
* **Typed API client:** A shared fetch helper handles timeouts and cancellation. Errors map to clear user messages (bad input, AI unavailable, network, timeout). A mock mode lets the UI run without a backend.
* **Accessible by default:** Live regions for status messages, labelled controls, keyboard shortcuts (⌘/Ctrl + Enter), and all motion respects `prefers-reduced-motion`.
* **Tested:** Vitest covers the API layer with a faked `fetch`, so tests never hit the real backend.

## 🛠 Tech Stack
* **Frontend:** React 19, TypeScript, Vite, plain CSS
* **Backend (separate repo):** Python, Django REST Framework, Google Gemini
* **Tooling:** Vitest, oxlint

## 🏗 Architecture & Technical Decisions
```
React (this repo) ──POST /api/extract-text/──▶ DRF ──▶ text from .docx / .pdf / .txt
                  ──POST /api/analyze/──────▶ DRF ──▶ Gemini ──▶ 0–5 suggestions {original, replacement, reason}
```
* **Thin, stateless client:** No accounts or database. Resume text lives only in the browser tab, and uploaded files are read for their text and never saved.
* **Copy instead of auto-apply:** Suggestions don't edit the resume for you. That keeps the user responsible for every claim, which matters more than saving a click.
* **Plain CSS over a UI kit:** A small set of design tokens keeps the bundle small and the look consistent, without a component library to learn.
* **Trade-offs & future improvements:** Section detection is heuristic (ALL-CAPS or common headings). Scanned PDFs need OCR, which isn't supported yet. Next steps are deployment with a live demo, and exporting to `.docx`/PDF.

## 🚀 Local Setup
```bash
# 1. Clone the repository
git clone https://github.com/AbdulkarimMziya/resume-studio-web.git
cd resume-studio-web

# 2. Install dependencies & run
npm install
cp .env.example .env.local
npm run dev        # http://localhost:5173
```
It starts in **mock mode** (sample suggestions, no backend needed). To use the real API, run [resume-studio-api](https://github.com/AbdulkarimMziya/resume-studio-api) and set `VITE_USE_MOCK=false` and `VITE_API_BASE_URL=http://localhost:8000` in `.env.local`.

`npm test` runs the tests. `npm run build` and `npm run lint` check types and style.

### Deploying the live demo
`npm run deploy` builds against the hosted API on Render and publishes `dist/` to the `gh-pages` branch. GitHub Pages serves that branch (Settings → Pages → Source: `gh-pages`).

## 📬 Contact
**Abdulkarim Mziya** – [LinkedIn](https://linkedin.com/in/abdulkarim-mziya) | [GitHub](https://github.com/AbdulkarimMziya)
