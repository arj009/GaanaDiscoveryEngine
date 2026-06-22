# Gaana Discovery Intelligence Dashboard

React + Vite frontend for the AI-Powered Review Discovery Engine (Phase 5). Surfaces insights that answer the six Problem Statement questions using processed review data.

**Deployment split (per Architecture):**

| Component | Host | Path |
|---|---|---|
| Dashboard (this app) | Vercel — manual CLI | `gaana-discovery-engine/dashboard` |
| FastAPI API | Render | `gaana-discovery-engine/api` |

## Local development

```bash
npm install
npm run dev
```

The dashboard loads review data from `/public/enriched_reviews.json` (static bundle). Optionally set `VITE_API_URL` in `.env` when the Render API is live.

## Manual Vercel deployment

Deploy from the dashboard directory (recommended):

```bash
cd gaana-discovery-engine/dashboard
npm install
npm run build
npx vercel login          # once
npx vercel --prod         # production deploy
```

Or deploy from the monorepo root (uses root `vercel.json`):

```bash
cd /path/to/Gaana
npx vercel --prod
```

### Vercel project settings (manual deploy only)

When linking the project in the Vercel dashboard:

- **Root Directory:** `gaana-discovery-engine/dashboard` (if importing from Git later)
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Node.js Version:** 20.x

Do **not** enable automatic Git deployments if you want manual-only releases — use `vercel --prod` from the CLI instead.

### Environment variables (optional)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Render FastAPI base URL for live API / NLQ (future); omit to use static JSON |

Copy `.env.example` to `.env` for local overrides. Set the same variable in the Vercel dashboard under Project → Settings → Environment Variables when connecting to the Render API.

## Data source

Production builds bundle `public/enriched_reviews.json` (~800 KB). Regenerate it by running the processing pipeline, then rebuild and redeploy.
