-- Dados do Auth por RPC, no lugar de varrer auth.admin.listUsers por HTTP.
--
-- PROBLEMA, medido em 31/08/2026. `GET /api/admin/churn-risk` quebrou com
-- `AuthRetryableFetchError: The operation was aborted due to timeout`, com o
-- stack em `GoTrueAdminApi.listUsers` chamado de `fetchAuthUsersByIds`
-- (server/routes/admin.ts). A funcao pagina o Auth de 1000 em 1000 sobre TODOS
-- os usuarios so para achar os ~60 assinantes ativos da tela: com 8.317 perfis
-- sao ate 9 requisicoes HTTP carregando metadata de mil pessoas cada, a cada
-- abertura da pagina. O custo cresce com a base inteira, e o que a tela precisa
-- nao. Nenhum indice ajuda, porque o gargalo nao e a query, e a travessia HTTP.
--
-- O mesmo scan existia em `fetchAuthTimes` (server/lib/authUsers.ts), que
-- alimenta as metricas de retencao: varredura completa, mesmo custo, mesmo risco
-- de timeout. As duas funcoes abaixo cobrem os dois casos, e o comentario da
-- propria `fetchAuthUsersByIds` ja previa a saida ("se a base crescer muito,
-- avaliar um RPC dedicado").
--
-- SEGURANCA, e por que ela nao e opcional aqui. As duas leem `auth.users`, um
-- schema que o PostgREST nao expoe e que guarda e-mail e metadados de
-- autenticacao de todo mundo. Tres travas, iguais as de
-- 20260830140000_admin_list_users_page.sql:
--
--   1. `security definer` para poder atravessar o schema `auth`;
--   2. `set search_path = public, auth` PINADO na definicao. Funcao definer sem
--      search_path pinado e vetor classico de escalonamento: quem controla o
--      search_path da sessao passa a decidir qual tabela a funcao le;
--   3. `revoke` de public/anon/authenticated e `grant` SO para `service_role`.
--      Sem isso, qualquer usuario logado chamaria a funcao pelo PostgREST e
--      leria a base inteira de e-mails. O `grant` restrito e o que separa um RPC
--      de admin de um vazamento.
--
-- CAST EXPLICITO em `email`. Numa funcao `language sql` o tipo do SELECT tem de
-- casar EXATAMENTE com o do RETURNS TABLE, e divergencia nao aparece ao criar:
-- aparece na primeira chamada, ja em producao. `auth.users.email` e varchar no
-- schema do GoTrue, e o `::text` deixa a funcao correta tanto se for varchar
-- quanto se for text, porque text para text e no-op. Mesmo motivo do
-- `last_sign_in_at::timestamptz` da migration de 30/08.
--
-- ADITIVA: cria duas funcoes, nao altera nem remove dado. Rollback e
-- `drop function`. Isenta da janela de migration destrutiva (CLAUDE.md).

-- 1) Lote por ids: o que a tela de churn-risk consome de cada assinante.
--
-- As colunas sao EXATAMENTE as quatro que `AuthUserLite` carrega hoje (email,
-- last_sign_in_at, created_at, name), conferidas contra o consumo em
-- server/routes/admin.ts: o churn-risk le `lastSignInAt`, `createdAt`, `name` e
-- `email`, e nenhuma outra chave de metadata. Devolver mais que isso ampliaria
-- de graca a superficie de um RPC que le a tabela de autenticacao.
create or replace function public.admin_auth_users_lite(p_user_ids uuid[])
returns table (
  user_id uuid,
  email text,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  name text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    u.id as user_id,
    u.email::text as email,
    u.last_sign_in_at,
    u.created_at,
    u.raw_user_meta_data->>'name' as name
  from auth.users u
  where u.id = any (p_user_ids);
$$;

-- 2) Tempos de todo mundo: o que as metricas de retencao montam hoje varrendo o
-- Auth inteiro. Sem argumento de proposito, porque o consumidor
-- (server/lib/usageRetention.ts) precisa da base completa; a diferenca e que
-- agora e UMA query no banco em vez de N requisicoes HTTP.
--
-- NAO devolve email nem metadata: retencao so usa as duas datas, e um RPC que
-- varre a base inteira nao tem por que carregar e-mail junto.
create or replace function public.admin_auth_times()
returns table (
  user_id uuid,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    u.id as user_id,
    u.last_sign_in_at,
    u.created_at
  from auth.users u;
$$;

-- Acesso: SO o server. Ver o item 3 do cabecalho.
revoke all on function public.admin_auth_users_lite(uuid[]) from public;
revoke all on function public.admin_auth_users_lite(uuid[]) from anon, authenticated;
grant execute on function public.admin_auth_users_lite(uuid[]) to service_role;

revoke all on function public.admin_auth_times() from public;
revoke all on function public.admin_auth_times() from anon, authenticated;
grant execute on function public.admin_auth_times() to service_role;

comment on function public.admin_auth_users_lite(uuid[]) is
  'Dados de auth.users (email, last_sign_in_at, created_at, name) para um lote de ids. Substitui a paginacao de auth.admin.listUsers no churn-risk. Restrita a service_role.';
comment on function public.admin_auth_times() is
  'last_sign_in_at e created_at de todos os usuarios, para as metricas de retencao. Substitui a varredura completa de auth.admin.listUsers. Restrita a service_role.';
