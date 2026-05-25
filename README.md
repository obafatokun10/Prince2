# PRINCE2 7 Practitioner Practice App

A modern, self-hosted React web app for practicing PRINCE2 7 Practitioner exam questions. 180 questions across two formats (classic multiple choice and matching), with profile management, scenario-grouped questions, filtering by topic, and localStorage persistence.

## Data Status

- **Questions loaded:** 180 of 180 (100%)
- **Batches:** All 11 batches + metadata loaded successfully
- **Status:** Complete question bank ready

## Quick Start (Local Development)

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173/`. All data is stored in browser localStorage — no backend needed.

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g., `prince2-practitioner`)
2. Clone this project into it
3. Push to `main` branch:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```
4. Go to repository **Settings → Pages**
5. Select **Source: GitHub Actions**
6. The workflow runs automatically and deploys to `https://username.github.io/prince2-practitioner/`

The workflow:
- Runs on every push to `main`
- Installs dependencies with `npm ci`
- Builds with `npm run build` (sets `VITE_BASE_PATH` for GitHub Pages path)
- Deploys the `dist/` folder to GitHub Pages

## Updating Questions

To refresh question content or add new batches:
1. Add new JSON files to `src/data/`
2. Update `src/data/index.js` to import them (copy the pattern from existing batch imports)
3. Add the new batch to the `allBatches` array in the `loadQuestionBank()` function
4. Commit and push — the workflow rebuilds automatically

The app merges all JSON files at startup and de-duplicates by `scenario_id`.

## Features

- **Profile management**: Create multiple profiles, each with separate progress
- **Two modes**:
  - *Scenario Run*: Work through all questions in a scenario
  - *Continuous*: Questions across all scenarios with filtering by syllabus area and focus
- **Question formats**:
  - Classic (1 mark): Single answer from options with justifications
  - Matching (3 marks): Match items to options, scored 0–3
- **Filtering**: By syllabus area (Principles/People/Practices/Processes) and focus topic
- **localStorage persistence**: All profile data stays on the device
- **Mobile-optimised**: Clean, single-column layout responsive to phone/tablet

## Tech Stack

- React 18
- Vite (build tool)
- Vanilla JavaScript (no external component library)
- CSS-in-JS (inline styles)
- GitHub Pages (free hosting)

## Syllabus Weighting

The question bank maps to the real PRINCE2 7 Practitioner exam:
- Practices: ~93 questions
- Processes: ~30 questions
- Principles: ~18 questions
- People: ~15 questions

Note: The 11 loaded files contain 156 questions. When batch 6 is added, you'll have the full 180.

## localStorage Schema

All data is namespaced under `p2p:` prefix:
- `p2p:activeProfile` — currently logged-in profile name
- `p2p:users` — list of all profile names and metadata
- `p2p:<profileName>:mastery` — per-profile mastery scores (reserved for future expansion)
- `p2p:<profileName>:history` — per-profile question history (reserved for future expansion)

## Known Limitations

- **Thin scenario context**: Scenarios are 1–2 sentences (lighter than real exam); you can enrich the JSON later
- **3 options per classic question**: The real exam uses 4; your data has 3 (app adapts to however many exist)

## Next Steps

1. Test locally: `npm run dev`
2. Deploy: Push to GitHub, watch the workflow run
3. Share the public URL: `https://username.github.io/repo-name/`
4. Update questions: Replace or add JSON files in `src/data/`, re-commit

---

Built for self-study. Deployed on GitHub Pages. No external dependencies or backend. All progress saved locally.
