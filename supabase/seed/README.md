# Seeding

Reference data comes from `config/`:

- `config/models.json` -> `models` table (fill in prices first; the template ships empty)
- `config/task-type-thresholds.json` -> `task_type_thresholds` table

A seed script (`web/scripts/seed.ts`) arrives in Phase 2 with the app scaffold. It will upsert by `slug` / `task_type`, so re-running after you update prices is safe.
