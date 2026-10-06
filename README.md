# AI Adoption Advisor

> Describe your workflows in plain language. Get a ranked, explainable plan for
> where AI helps, which approach to use, and what it will cost.

**Status:** Phase 1 (setup) complete. See [Roadmap](#roadmap).

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
| `web/` | Next.js app (added in Phase 2) |
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
4. _More steps arrive with the app (Phase 2+)._

## Roadmap
1. Setup (done)
2. Intake and task breakdown
3. Scoring engine and ranked roadmap, with tests
4. Model recommendation and cost estimator
5. Benchmark harness; connect real results
6. Report UI, PDF export, dashboard
7. Advisor evaluation, case study, deployment

## Results
_TODO._

## Limitations
_TODO. Known so far: no per-user auth in v1; benchmark thresholds are judgment calls; prices are manually maintained._
