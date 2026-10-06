# Decision log

Format: **Decision** — context, options considered, why, trade-offs.

## D1. LLM extracts, code decides
- **Context:** Recommendations must be explainable and reproducible.
- **Decision:** The LLM only converts free text into structured task data
  (validated with a schema). Scoring, ranking, approach and model selection and
  costing are pure functions in code.
- **Why:** Same input gives the same output; every score has stored reasoning;
  weights are tunable; scoring logic is unit-testable.
- **Trade-off:** Extraction errors flow into scores, so extracted fields carry a
  confidence and the user can correct them before scoring.

## D2. "Cheapest good enough" via benchmark thresholds
- **Decision:** A model is eligible for a task type only if its benchmark quality
  meets the per-task-type threshold; then pick the cheapest eligible per tier.
- **Why:** Avoids recommending a cheap model that fails the task.
- **Trade-off:** Thresholds are judgment calls. They live in
  `config/task-type-thresholds.json` and ship as placeholders to be tuned.

## D3. Prices and model names are data, not code
- **Decision:** `models` table seeded from `config/models.json`, with
  `last_updated` and `source_url` per row; the template ships empty.
- **Why:** Prices change often and model knowledge from memory goes stale.
- **Trade-off:** Manual upkeep. Mitigated by showing the date in the UI.

## D4. Stack: Next.js + Supabase + Python, OpenRouter gateway
- **Decision:** Keep the proposed stack. Use OpenRouter (one key, OpenAI-compatible
  endpoint) as the gateway for both the app and the benchmark.
- **Why:** Fewest API keys; Python benchmark needs no provider-specific SDKs.
- **Alternatives:** LiteLLM (more control, more setup).
- **Trade-off:** Gateway adds a small margin/dependency on a third party.

## D5. Sector profiles are JSON config files
- **Decision:** One JSON file per sector in `config/sectors/` (workflows, tools,
  compliance notes, follow-up questions, weight deltas). IT-internal workflows
  (ticket triage, code review, docs, incident summaries, RFPs) live in the
  `it-services` profile.
- **Why:** Non-developers can edit them; the intake uses them to ask better
  questions; no redeploy logic changes needed.

## D6. Weight adjustments are additive deltas, renormalized
- **Decision:** Sector files give percentage-point deltas to the default weights;
  code renormalizes to 100.
- **Why:** Easy to read and reason about ("healthcare: +10 on error risk").

## D7. RLS on, no public policies; server uses service-role key
- **Decision:** No user accounts in v1. The browser never talks to Supabase
  directly.
- **Why:** Simplest safe default for an app that stores business descriptions.
- **Trade-off:** Past assessments aren't private per user until auth is added
  (listed as a limitation).

## D8. Phase 1 contains no app scaffold
- **Decision:** `create-next-app` and its dependencies are deferred to the start
  of Phase 2, after approval.
- **Why:** Brief says to ask before adding dependencies.
