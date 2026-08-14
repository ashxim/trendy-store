-- Run this once if your products table already exists (created before the schema update).
-- It adds the offer / discount / active columns and creates the settings table for the hero.
-- Idempotent: safe to re-run.

alter table public.products add column if not exists images jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists regular_price integer;
alter table public.products add column if not exists offer_active boolean not null default false;
alter table public.products add column if not exists offer_start date;
alter table public.products add column if not exists offer_end date;
alter table public.products add column if not exists offer_badge text;
alter table public.products add column if not exists active boolean not null default true;
alter table public.products add column if not exists bundle jsonb;

create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.settings enable row level security;
