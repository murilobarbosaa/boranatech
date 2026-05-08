do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and (
        pg_get_constraintdef(oid) ilike '%avatar_border%'
        or pg_get_constraintdef(oid) ilike '%avatar_icon%'
        or pg_get_constraintdef(oid) ilike '%avatar_bg%'
      )
  loop
    execute format('alter table public.profiles drop constraint if exists %I', constraint_record.conname);
  end loop;
end $$;

alter table public.profiles
  alter column avatar_border set default 'classic',
  alter column avatar_icon set default 'initials',
  alter column avatar_bg set default 'yellow';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_avatar_border_allowed'
  ) then
    alter table public.profiles
      add constraint profiles_avatar_border_allowed
      check (avatar_border in ('classic', 'purple', 'gold', 'pink', 'green', 'blue', 'orange', 'red', 'cyan'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_avatar_icon_allowed'
  ) then
    alter table public.profiles
      add constraint profiles_avatar_icon_allowed
      check (avatar_icon in ('initials', 'code', 'sparkles', 'rocket', 'brain', 'laptop', 'star', 'target', 'crown'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_avatar_bg_allowed'
  ) then
    alter table public.profiles
      add constraint profiles_avatar_bg_allowed
      check (avatar_bg in ('slate', 'yellow', 'purple', 'pink', 'green', 'blue', 'orange', 'cream', 'white'));
  end if;
end $$;
