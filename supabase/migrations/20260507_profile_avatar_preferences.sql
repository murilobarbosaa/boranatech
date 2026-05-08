alter table public.profiles
  add column if not exists avatar_border text not null default 'classic' check (avatar_border in ('classic', 'purple', 'gold')),
  add column if not exists avatar_icon text not null default 'initials' check (avatar_icon in ('initials', 'code', 'sparkles')),
  add column if not exists avatar_bg text not null default 'yellow' check (avatar_bg in ('slate', 'yellow', 'purple'));
