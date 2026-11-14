-- SPARK MVP database setup
-- Run this entire file in Supabase: SQL Editor -> New query -> Run.
create extension if not exists pgcrypto;

create table if not exists public.spark_pairs (
  id uuid primary key default gen_random_uuid(),
  pair_code text unique not null,
  state jsonb not null default '{"history":[]}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.spark_pairs enable row level security;
-- No direct table access is granted to anon/authenticated.
revoke all on public.spark_pairs from anon, authenticated;

create or replace function public.spark_create_pair()
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_id uuid;
  new_code text;
begin
  loop
    new_code := upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
    exit when not exists(select 1 from public.spark_pairs where pair_code = new_code);
  end loop;
  insert into public.spark_pairs(pair_code) values(new_code) returning id into new_id;
  return json_build_object('pair_id', new_id, 'pair_code', new_code);
end;
$$;

create or replace function public.spark_get_state(p_pair_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.spark_pairs%rowtype;
begin
  select * into p from public.spark_pairs where pair_code = upper(trim(p_pair_code));
  if not found then return null; end if;
  return json_build_object('pair_id', p.id, 'pair_code', p.pair_code, 'state', p.state);
end;
$$;

create or replace function public.spark_save_state(p_pair_id uuid, p_state jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.spark_pairs set state = coalesce(p_state, '{"history":[]}'::jsonb)
  where id = p_pair_id;
  return found;
end;
$$;

revoke all on function public.spark_create_pair() from public;
revoke all on function public.spark_get_state(text) from public;
revoke all on function public.spark_save_state(uuid,jsonb) from public;
grant execute on function public.spark_create_pair() to anon, authenticated;
grant execute on function public.spark_get_state(text) to anon, authenticated;
grant execute on function public.spark_save_state(uuid,jsonb) to anon, authenticated;
