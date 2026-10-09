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

## D9. Phase 2 scaffold and server boundary
- **Decision:** After the instruction to continue Phase 2, add the agreed Next.js,
  React, TypeScript, Tailwind, zod and vitest dependencies. Use native server-side
  fetch for OpenRouter rather than an additional provider SDK. Load root `.env`
  through Next's environment loader; keep secrets out of client modules.
- **Why:** Implements the approved stack with a small dependency surface.
- **Trade-off:** The configured intake model must support JSON-schema output.
  Provider failures are reported without exposing raw provider responses.

## D10. Unknown facts must be reviewed, not invented
- **Decision:** Extraction fields may be null for missing quantities, impact and
  sensitivity. The user must supply these before confirmation. Keep original
  extraction confidence and evidence separate from user edits. No scores or
  prices are requested from the LLM.
- **Why:** Missing volume is not zero; guessed input would distort later scoring.
- **Trade-off:** The extraction schema is intentionally more permissive about
  unknowns than the database's confirmed-task fields. Sensitivity uses the
  existing single-category schema; users choose the most sensitive category.

## D11. Phase 2 is a local, ephemeral draft flow
- **Decision:** Support one workflow per draft, editable tasks, manual entry and
  JSON download. Keep drafts in tab memory; defer database save/load and public
  hosting. Do not add anonymous assessment read endpoints or public RLS policies.
- **Why:** Provides a reviewable intake slice without exposing unauthenticated
  business records. Supabase is not needed to try the intake screen.
- **Trade-off:** Refresh loses the draft and JSON import is not implemented.
  Before public deployment, add access protection and a shared request budget
  for the paid extraction endpoint. Loopback binding is only a local default,
  not authentication. Database integration must preserve confirmed task fields
  and snapshot deterministic weights when scoring is implemented.
