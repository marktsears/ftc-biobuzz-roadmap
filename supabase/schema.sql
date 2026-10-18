-- Trinity Robotics Rails: shared state for the team.
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query → Run).
--
-- Row level security is ON with no policies, so the public (anon) key can't read or write anything.
-- Only the Next.js server, using the service-role key, touches these tables.

create table if not exists public.checks (
  team     text        not null,
  item_id  text        not null,
  by_name  text        not null,
  at       timestamptz not null default now(),
  primary key (team, item_id)
);

create table if not exists public.claims (
  team     text        not null,
  item_id  text        not null,
  name     text        not null,
  at       timestamptz not null default now(),
  primary key (team, item_id, name)
);

create table if not exists public.quest_log (
  team     text        not null,
  quest_id text        not null,
  name     text        not null,
  note     text,
  at       timestamptz not null default now(),
  primary key (team, quest_id, name)
);

create table if not exists public.budgets (
  team        text primary key,
  rows        jsonb       not null,
  updated_at  timestamptz not null default now()
);

alter table public.checks    enable row level security;
alter table public.claims    enable row level security;
alter table public.quest_log enable row level security;
alter table public.budgets   enable row level security;
