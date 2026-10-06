# config/

Data files that drive the app. Edit these, not code.

| File | What it is |
|---|---|
| `scoring-weights.json` | Default factor weights (sum 100) |
| `task-type-thresholds.json` | Minimum benchmark quality per task type (placeholders) |
| `models.json` | Model names, tiers and prices. **Empty template; you fill it in.** |
| `sectors/*.json` | One profile per sector |

## Filling in models.json
1. Pick 4–5 models to compare, covering three tiers: budget, balanced, premium.
2. Copy the model's gateway slug (OpenRouter model id) and its input/output price per million tokens from the provider or OpenRouter pricing page.
3. Set `source_url` and `last_updated` (today's date). The UI shows the oldest `last_updated`.
4. Delete the `_example_only_delete_me` entry.

## Sector profile schema (`sectors/*.json`)
- `id`, `name`, `description`
- `typical_workflows[]`: `name`, `description`, `likely_task_types[]`
- `common_tools[]`
- `sensitive_data_categories[]`: any of `health`, `financial`, `personal`
- `compliance_notes[]`: plain-language privacy/compliance considerations (not legal advice)
- `follow_up_questions[]`: sector-specific questions the intake asks when information is missing
- `weight_adjustments`: percentage-point deltas for `time_saved`, `volume_repetitiveness`, `error_risk_inverse`, `ease_of_implementation` (optional; renormalized to 100)

Valid task types: `classification`, `extraction`, `summarization`, `drafting`, `reasoning`, `other`.
