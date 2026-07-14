-- Certificados de conclusao de trilha (C1).
--
-- Escrita EXCLUSIVA do service role (server), que bypassa a RLS: de proposito
-- NAO ha policy de insert/update/delete, espelhando roadmap_completions e
-- project_validations. A policy de SELECT own-row e defesa em profundidade; a
-- barreira real e o filtro explicito por user_id nas queries do server. A
-- pagina publica de verificacao (fase futura) le pelo code via service role,
-- fora da RLS.
--
-- TODOS os campos de identidade e conteudo sao SNAPSHOT congelado na emissao,
-- nunca join: holder_name/holder_cpf/roadmap_title/hours/score/cert_score/
-- syllabus refletem o estado no momento em que o certificado nasceu. Se a
-- pessoa trocar o nome depois, ou a ementa da trilha mudar, o certificado
-- emitido permanece igual.
--
-- Unique parcial certificates_one_per_roadmap: no maximo UM certificado NAO
-- revogado por (user, trilha); revogar (revoked_at not null) libera reemissao.

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_slug text not null,
  code text not null,
  holder_name text not null,
  holder_cpf text not null,
  roadmap_title text not null,
  hours integer not null,
  score integer not null,
  cert_score integer not null,
  quiz_attempt_id uuid not null references public.roadmap_quiz_attempts(id),
  syllabus jsonb not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text
);

create unique index certificates_code_key on public.certificates (code);

create unique index certificates_one_per_roadmap
  on public.certificates (user_id, roadmap_slug) where revoked_at is null;

create index certificates_user_idx
  on public.certificates (user_id, issued_at desc);

alter table public.certificates enable row level security;

create policy "certificates_select_own" on public.certificates
  for select using ((select auth.uid()) = user_id);
