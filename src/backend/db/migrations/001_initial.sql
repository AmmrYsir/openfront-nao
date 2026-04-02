create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  persistent_id text not null unique,
  display_name text not null,
  email text,
  discord_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists game_records (
  game_id text primary key,
  payload jsonb not null,
  status text not null default 'finished',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ranked_leaderboard (
  user_id uuid primary key references users(id) on delete cascade,
  elo integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public_lobbies (
  game_id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
