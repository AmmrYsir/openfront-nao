create table if not exists user_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  username text not null,
  clan_tag text not null default '',
  language text not null default 'en',
  dark_mode boolean not null default false,
  special_effects boolean not null default true,
  anonymous_names boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_preferences_language
  on user_preferences(language);
