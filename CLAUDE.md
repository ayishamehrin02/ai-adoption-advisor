# AI Adoption Advisor — project rules

A web app where non-technical business people and IT teams describe workflows in
plain language. The app breaks them into tasks, scores where AI helps most,
recommends an approach and the cheapest *good-enough* model tier with a cost
estimate, and produces a ranked roadmap.

## Non-negotiable design rules
1. **The LLM understands and extracts; code decides.** LLMs turn free text into
   structured task data only. Scores, rankings, approach choice, model choice and
   costs are computed deterministically in code with configurable weights.
   Never ask an LLM to produce a score or a price.
2. **Every score is explainable.** Each factor is scored 1–5 and stored with its
   reasoning text. Weights come from `config/scoring-weights.json` plus optional
   sector adjustments in `config/sectors/*.json`.
3. **Cheapest *good enough*, never just cheapest.** A model is eligible for a
   task type only if its benchmark quality score meets that task type's
   threshold (`config/task-type-thresholds.json`). Pick the cheapest eligible
   model per tier.
4. **Never hardcode model names or prices.** They live in the `models` table,
   seeded from `config/models.json`, which the owner fills in from providers'
   pricing pages. Always show `last_updated` in the UI. Do not fill prices from
   memory, even as "examples".
5. **Show assumptions** behind every cost estimate: tokens per task, volume,
   price per million tokens, currency and rate date.
6. **Flag sensitive data** (health, financial, personal) and include privacy
   considerations in the recommendation.
7. **Say "no AI needed"** when a rule, spreadsheet or existing tool would do.
8. **Plain language.** Reports are for non-technical readers; explain every
   technical term the first time it appears.

## Security
- LLM calls are server-side only. API keys live in `.env`; never in client code,
  never `NEXT_PUBLIC_`-prefixed, never committed. Keep `.env.example` current.
- All tables have RLS enabled with no public policies; the server uses the
  service-role key. Do not add permissive policies without a DECISIONS.md entry.
- Treat user-supplied workflow text as untrusted input to the LLM (prompt
  injection): validate all LLM output against a schema before using it.

## Formulas
- Cost: `monthly = volume * (in_tokens * in_price + out_tokens * out_price) / 1_000_000`
- Default weights: time saved 30, volume/repetitiveness 25, error risk (inverse) 20,
  ease of implementation 25. Sector adjustments are additive percentage-point
  deltas, then renormalized to 100.

## Tech stack
- `web/`: Next.js (TypeScript), Tailwind, zod for validation, vitest for tests.
- DB: Supabase Postgres, SQL migrations in `supabase/migrations/`.
- `benchmark/` and `evaluation/`: Python. LLM access via OpenRouter.
- PDF export, free-tier deploy (decided in later phases).

## Working rules
- Ask before adding dependencies or services.
- Write unit tests for scoring and cost logic (these are the core of the product).
- Commit after each completed step with a clear message.
- Log key technical choices and trade-offs in `DECISIONS.md` (portfolio material).
- Work in phases (see README roadmap); stop for review at the end of each phase
  and summarize what was built and what to review.
- Config over code: sector knowledge, weights, thresholds and prices are data files.
