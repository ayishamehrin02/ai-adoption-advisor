# AI Adoption Advisor

> Describe your workflows in plain language. Get a ranked, explainable plan for
> where AI helps, which approach to use, and what it will cost.

**Status:** Phase 2 (intake and task breakdown) implemented; ready for review. See [Roadmap](#roadmap).

## Problem
_TODO (phase 7): why business owners and IT teams struggle to decide where AI is worth it._

## What it does
1. Breaks each workflow into tasks.
2. Scores each task on where AI would help most (deterministic, weighted, explainable).
3. Recommends an approach: AI agent, single LLM call, classic ML, simple automation, or no AI needed.
4. Recommends the cheapest *good-enough* model tier (budget / balanced / premium) with a monthly cost and visible assumptions.
5. Produces a ranked AI adoption roadmap, exportable to PDF.

## Architecture
_TODO (phase 7): diagram._ Planned shape:

```
Browser ──> Next.js (UI + API routes, server-side LLM calls)
                 │  extract (LLM)        score/rank/cost (pure code)
                 ├──> OpenRouter ──> models
                 └──> Supabase Postgres <── Python benchmark (quality, latency, cost)
config/ (sectors, weights, thresholds, models.json)
```

## Repo layout
| Path | Purpose |
|---|---|
| `web/` | Next.js app: sector-aware intake, AI extraction and editable task review |
| `config/` | Sector profiles, scoring weights, quality thresholds, `models.json` template |
| `supabase/` | SQL migrations and seed notes |
| `benchmark/` | Python benchmark harness (Phase 5) |
| `evaluation/` | Advisor-vs-expert evaluation (Phase 7) |
| `docs/` | Extra documentation |
| `CLAUDE.md` | Project rules |
| `DECISIONS.md` | Decision log |

## Setup
1. Copy `.env.example` to `.env` and fill it in.
2. Create a Supabase project and apply `supabase/migrations/0001_init.sql`
   (SQL editor or `supabase db push`).
3. Fill in `config/models.json` from providers' pricing pages (see `config/README.md`).
4. Use Node.js 22+ and run `npm ci` inside `web/`.
5. Set `OPENROUTER_API_KEY` and `INTAKE_MODEL` in the root `.env`. Choose a
   model that supports structured JSON-schema output. No model or price is
   supplied by the app. Restart the server after changing environment values.
6. In `web/`, run `npm run dev` and open http://127.0.0.1:3000.

### What works in Phase 2
- Choose from eight sector profiles and describe one workflow per draft.
- Extract tasks through a server-only OpenRouter route, with bounded input,
  a timeout, schema validation, extraction confidence and follow-up questions.
- Review, edit, add or remove tasks. Missing facts remain unknown until supplied;
  confirmation requires valid volume, duration, error impact and sensitivity.
- Enter tasks manually without an AI key. Download a confirmed JSON draft.
- See sector privacy notes and sensitive-data flags.

Drafts are held in memory in the current tab; refresh/navigation clears them.
Download before leaving. Supabase persistence and loading drafts are not wired
up in this phase. No scoring, recommendation, model prices or PDF export is
present yet. The development server binds to loopback; this unauthenticated,
paid extraction endpoint is not ready for public deployment.

### Checks
From `web/`: `npm test`, `npm run typecheck`, and `npm run build`.
Extraction tests use a mocked gateway and do not spend API credits. For a live
check, configure the key/model and submit a non-sensitive workflow; review the
result and confirm that missing facts require user input.

## Roadmap
1. Setup (done)
2. Intake and task breakdown (implemented; review checkpoint)
3. Scoring engine and ranked roadmap, with tests
4. Model recommendation and cost estimator
5. Benchmark harness; connect real results
6. Report UI, PDF export, dashboard
7. Advisor evaluation, case study, deployment

## Results
_TODO._

## Limitations
_TODO. Known so far: no per-user auth in v1; benchmark thresholds are judgment calls; prices are manually maintained._
