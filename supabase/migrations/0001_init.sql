-- AI Adoption Advisor: initial schema
-- Access model: RLS enabled on every table with NO public policies.
-- The Next.js server and Python scripts use the service-role key (bypasses RLS).

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type task_type as enum ('classification','extraction','summarization','drafting','reasoning','other');
create type error_impact as enum ('low','medium','high');
create type data_sensitivity as enum ('none','personal','financial','health');
create type ai_approach as enum ('ai_agent','single_llm_call','classic_ml','simple_automation','no_ai_needed');
create type model_tier as enum ('budget','balanced','premium');
create type score_factor as enum ('time_saved','volume_repetitiveness','error_risk_inverse','ease_of_implementation');

-- ---------- reference data ----------
-- Seeded from config/models.json. Never hardcode names/prices in code.
create table models (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,            -- gateway model id (e.g. OpenRouter id)
  provider         text not null,
  display_name     text not null,
  tier             model_tier not null,
  input_price_per_m  numeric(12,6) not null check (input_price_per_m >= 0),   -- USD per 1M tokens
  output_price_per_m numeric(12,6) not null check (output_price_per_m >= 0),  -- USD per 1M tokens
  context_window   integer,
  source_url       text,
  last_updated     date not null,
  active           boolean not null default true
);

-- Seeded from config/task-type-thresholds.json.
create table task_type_thresholds (
  task_type    task_type primary key,
  min_quality  numeric(4,3) not null check (min_quality between 0 and 1)
);

-- Display currency conversion; prices are stored in USD.
create table fx_rates (
  currency     char(3) primary key,
  per_usd      numeric(14,6) not null check (per_usd > 0),
  last_updated date not null
);
insert into fx_rates (currency, per_usd, last_updated) values ('USD', 1, current_date);

-- ---------- assessments ----------
create table assessments (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  title             text not null,
  sector_id         text not null,                  -- matches config/sectors/<id>.json
  business_summary  text,
  display_currency  char(3) not null default 'USD',
  weights           jsonb not null,                 -- snapshot of weights used (after sector adjustment)
  status            text not null default 'draft' check (status in ('draft','extracted','scored','complete'))
);

create table workflows (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references assessments(id) on delete cascade,
  name           text not null,
  raw_description text not null,                    -- user's own words, untrusted input
  created_at     timestamptz not null default now()
);

-- Structured task data extracted by the LLM and confirmed/edited by the user.
create table tasks (
  id                 uuid primary key default gen_random_uuid(),
  workflow_id        uuid not null references workflows(id) on delete cascade,
  assessment_id      uuid not null references assessments(id) on delete cascade,
  name               text not null,
  task_type          task_type not null,
  monthly_volume     integer not null check (monthly_volume >= 0),
  minutes_per_task   numeric(8,2) not null check (minutes_per_task >= 0),
  error_impact       error_impact not null,
  data_sensitivity   data_sensitivity not null default 'none',
  current_tools      text[] not null default '{}',
  extraction_confidence numeric(3,2) check (extraction_confidence between 0 and 1),
  user_confirmed     boolean not null default false,
  created_at         timestamptz not null default now()
);
create index on tasks (assessment_id);

-- ---------- deterministic outputs ----------
-- One row per task per factor: score 1-5 plus the reasoning text.
create table task_scores (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  factor     score_factor not null,
  score      smallint not null check (score between 1 and 5),
  weight     numeric(5,2) not null,                 -- weight (points) applied at scoring time
  reasoning  text not null,
  unique (task_id, factor)
);

-- Final per-task verdict: total score, rank, approach, privacy notes.
create table recommendations (
  id                 uuid primary key default gen_random_uuid(),
  task_id            uuid not null unique references tasks(id) on delete cascade,
  assessment_id      uuid not null references assessments(id) on delete cascade,
  total_score        numeric(5,2) not null,         -- weighted, 0-100
  rank               integer not null,
  approach           ai_approach not null,
  approach_reasoning text not null,
  privacy_notes      text[] not null default '{}',
  created_at         timestamptz not null default now()
);
create index on recommendations (assessment_id, rank);

-- Cost options per task: budget / balanced / premium, with every assumption stored.
create table cost_estimates (
  id                 uuid primary key default gen_random_uuid(),
  task_id            uuid not null references tasks(id) on delete cascade,
  tier               model_tier not null,
  model_id           uuid references models(id),    -- null if no model meets the quality threshold
  eligible           boolean not null,
  monthly_volume     integer not null,
  input_tokens       integer not null,
  output_tokens      integer not null,
  input_price_per_m  numeric(12,6),
  output_price_per_m numeric(12,6),
  monthly_cost_usd   numeric(14,4),
  quality_score      numeric(4,3),                  -- benchmark quality used for eligibility
  quality_threshold  numeric(4,3),
  prices_last_updated date,
  note               text,
  unique (task_id, tier)
);

-- ---------- benchmark (written by the Python harness) ----------
create table benchmark_runs (
  id          uuid primary key default gen_random_uuid(),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  gateway     text not null default 'openrouter',
  judge_model text,
  notes       text
);

create table benchmark_results (
  id             uuid primary key default gen_random_uuid(),
  run_id         uuid not null references benchmark_runs(id) on delete cascade,
  model_id       uuid not null references models(id),
  task_type      task_type not null,
  case_id        text not null,
  quality        numeric(4,3) not null check (quality between 0 and 1),
  metric         text not null,                     -- exact_match | f1 | judge_rubric
  latency_ms     integer,
  input_tokens   integer,
  output_tokens  integer,
  cost_usd       numeric(14,6),
  raw_output     text,
  judge_notes    text
);
create index on benchmark_results (run_id, model_id, task_type);

-- Average quality per model and task type for the most recent finished run.
create view benchmark_summary as
select r.model_id,
       r.task_type,
       avg(r.quality)          as avg_quality,
       count(*)                as cases,
       avg(r.latency_ms)       as avg_latency_ms,
       avg(r.input_tokens)     as avg_input_tokens,
       avg(r.output_tokens)    as avg_output_tokens,
       avg(r.cost_usd)         as avg_cost_usd
from benchmark_results r
where r.run_id = (select id from benchmark_runs where finished_at is not null order by finished_at desc limit 1)
group by r.model_id, r.task_type;

-- ---------- security ----------
alter table models               enable row level security;
alter table task_type_thresholds enable row level security;
alter table fx_rates             enable row level security;
alter table assessments          enable row level security;
alter table workflows            enable row level security;
alter table tasks                enable row level security;
alter table task_scores          enable row level security;
alter table recommendations      enable row level security;
alter table cost_estimates       enable row level security;
alter table benchmark_runs       enable row level security;
alter table benchmark_results    enable row level security;
-- No policies on purpose: only the service-role key can read/write (see DECISIONS.md D7).
alter view benchmark_summary set (security_invoker = true);
