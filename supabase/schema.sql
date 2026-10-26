-- Paste this whole file in Supabase > SQL Editor > Run.
-- Profiles are reachable ONLY through the functions below (RLS is on, no table policies),
-- so the public anon key cannot read other people's rows or PIN hashes.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  pseudo      text not null check (char_length(trim(pseudo)) between 1 and 24),
  pseudo_key  text generated always as (lower(trim(pseudo))) stored unique,
  pin_hash    text not null,
  answers     jsonb not null default '{}'::jsonb,
  grp         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.profile_exists(p_pseudo text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from profiles where pseudo_key = lower(trim(p_pseudo)));
$$;

create or replace function public.signup(p_pseudo text, p_pin text, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_pin !~ '^[0-9]{4}$' then raise exception 'bad_pin'; end if;
  insert into profiles (pseudo, pin_hash, answers, grp)
  values (trim(p_pseudo), crypt(p_pin, gen_salt('bf')), p_answers, p_answers->>'group');
  return p_answers;
exception when unique_violation then
  raise exception 'taken';
end $$;

create or replace function public.login(p_pseudo text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare a jsonb;
begin
  select answers into a from profiles
   where pseudo_key = lower(trim(p_pseudo)) and pin_hash = crypt(p_pin, pin_hash);
  if not found then raise exception 'bad_login'; end if;
  return a;
end $$;

create or replace function public.save_answers(p_pseudo text, p_pin text, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  update profiles set answers = p_answers, grp = p_answers->>'group', updated_at = now()
   where pseudo_key = lower(trim(p_pseudo)) and pin_hash = crypt(p_pin, pin_hash);
  if not found then raise exception 'bad_login'; end if;
  return p_answers;
end $$;

revoke all on function public.profile_exists(text), public.signup(text,text,jsonb),
  public.login(text,text), public.save_answers(text,text,jsonb) from public;
grant execute on function public.profile_exists(text), public.signup(text,text,jsonb),
  public.login(text,text), public.save_answers(text,text,jsonb) to anon;
