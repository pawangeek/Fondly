-- Fondly: shared cards storage.
-- Run ONCE in the Supabase dashboard -> SQL Editor. Safe to re-run (idempotent).

-- 1. The cards table. `data` holds the text card (occasion, recipient, name,
--    message, from, stock); media lives in Vercel Blob and we keep only URLs.
create table if not exists public.cards (
  slug        text primary key,
  data        jsonb       not null,
  photos      text[]      not null default '{}',
  voice_url   text,
  created_at  timestamptz not null default now()
);

-- 2. Row Level Security: the anon (publishable) key may only READ.
--    Writes go through the serverless function using the secret key,
--    which bypasses RLS.
alter table public.cards enable row level security;

drop policy if exists "cards public read" on public.cards;
create policy "cards public read"
  on public.cards for select
  to anon
  using (true);

-- 3. BACKSTOP purge at 14 days.
--    The PRIMARY 7-day cleanup is the /api/cron-cleanup Vercel function: it
--    deletes the Blob objects (photos + voice) first, then the rows. Postgres
--    can't reach Blob storage, so this job only sweeps rows the function may
--    have missed (e.g. if it was down). Running at 14d gives the function a
--    full week of retries before Postgres force-deletes a row and orphans its
--    Blob objects.
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('purge-old-cards');
exception
  when others then null;
end $$;

select cron.schedule(
  'purge-old-cards',
  '41 3 * * *',
  $$ delete from public.cards where created_at < now() - interval '14 days' $$
);

-- Check the job landed:  select * from cron.job where jobname = 'purge-old-cards';
