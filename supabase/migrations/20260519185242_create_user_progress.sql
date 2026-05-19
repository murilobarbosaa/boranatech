create table public.user_progress (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  context    text not null,
  item_key   text not null,
  state      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, context, item_key)
);

alter table public.user_progress
  add constraint user_progress_context_check
  check (context in ('portfolio_checklist', 'favorites', 'course_progress', 'quiz_history'));

create index idx_user_progress_user_context
  on public.user_progress (user_id, context);

alter table public.user_progress enable row level security;

create policy "users read own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "users insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "users update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete own progress"
  on public.user_progress for delete
  using (auth.uid() = user_id);

create trigger user_progress_set_updated_at
  before update on public.user_progress
  for each row execute function public.set_updated_at();
