-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor > New query)
-- It creates the tables used by the products dashboard and the storefront.
-- Idempotent: safe to run even if the products table already exists.

create table if not exists public.products (
  id            text primary key,
  name          text not null,
  short         text,
  tagline       text,
  price         integer not null default 0,       -- selling price (used in orders)
  regular_price integer,                          -- regular price before discount (optional)
  old_price     integer,                          -- optional "was" price for display
  image         text,
  images        jsonb not null default '[]'::jsonb,
  badge         text,
  featured      boolean not null default false,
  offer_active  boolean not null default false,   -- enable/disable the offer
  offer_start   date,                             -- optional offer start date
  offer_end     date,                             -- optional offer end date
  offer_badge   text,                             -- optional custom badge (auto "-XX%" if empty)
  active        boolean not null default true,    -- enable/disable product on the storefront
  bundle        jsonb,                            -- fixed-price pack offer, e.g. {"qty":2,"price":2900,"title":"عرض خاص — 2 بيوأكوا","badge":"وفر 900 د.ج","active":true,"featured":true}
  rating        numeric not null default 5,
  reviews       text,
  benefits      jsonb not null default '[]'::jsonb,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Hero / store settings (key -> jsonb value)
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- All access goes through the server API with the service-role key,
-- so row level security can stay enabled with no extra policies.
alter table public.products enable row level security;
alter table public.settings enable row level security;
