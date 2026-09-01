-- Listagem de usuarios do admin em UMA ida ao banco, com last_sign_in_at.
--
-- PROBLEMA. `last_sign_in_at` mora em `auth.users`, nao em `profiles`. Ate aqui
-- o server buscava esse dado varrendo a listagem do Auth em paginas de 1000
-- (`auth.admin.listUsers`) ate achar os ids da pagina: para 50 linhas numa base
-- de alguns milhares, sao 4 a 6 idas ao Auth POR CARREGAMENTO. O custo era alto
-- demais para a coluna existir, entao ela nunca existiu, e o `filter=ativo`
-- pagava esse preco sozinho a cada request.
--
-- O proprio codigo registrava a saida, em dois lugares (server/routes/admin.ts e
-- server/lib/usageRetention.ts): "caminho futuro: um RPC dedicado (profiles JOIN
-- auth.users com limit/offset/count no banco)". E o que esta funcao e.
--
-- SEGURANCA, e por que ela nao e opcional aqui. A funcao le `auth.users`, um
-- schema que o PostgREST nao expoe e que guarda e-mail e metadados de
-- autenticacao de todo mundo. Tres travas, todas nesta migration:
--
--   1. `security definer` para poder atravessar o schema `auth`;
--   2. `set search_path = public, auth` PINADO na definicao. Funcao definer sem
--      search_path pinado e vetor classico de escalonamento: quem controla o
--      search_path da sessao passa a decidir qual `profiles` a funcao le;
--   3. `revoke` de public/anon/authenticated e `grant` SO para `service_role`.
--      Sem isso, qualquer usuario logado chamaria a funcao pelo PostgREST e
--      leria a base inteira de e-mails. O `grant` restrito e o que faz a
--      diferenca entre um RPC de admin e um vazamento.
--
-- ADITIVA: cria uma funcao. Nao altera nem remove dado, e o rollback e um
-- `drop function`. Isenta da janela de migration destrutiva (CLAUDE.md).
--
-- O QUE ELA NAO MUDA: ordenacao, busca e paginacao espelham exatamente o que a
-- rota fazia com o PostgREST, incluindo o desempate por `id` (created_at nao e
-- unico, e sem desempate a paginacao por range pula e repete em silencio). O
-- resultado percebido e o mesmo; o que muda e o custo e a coluna nova.

create or replace function public.admin_list_users_page(
  p_limit int,
  p_offset int,
  p_search text default null,
  p_only_active boolean default false,
  -- Lista de ids para restringir (`p_exclude_ids = false`) ou excluir
  -- (`p_exclude_ids = true`). E como os filtros Pro, nao-Pro e influencer
  -- chegam aqui: a REGRA de quem e Pro continua fora, em
  -- server/lib/userListEnrichment.ts e na funcao is_user_pro, e esta funcao so
  -- recebe o conjunto ja resolvido. Duplicar a regra do Pro dentro deste SQL
  -- criaria uma TERCEIRA copia dela, e a segunda ja custou uma divergencia.
  p_user_ids uuid[] default null,
  p_exclude_ids boolean default false
)
returns table (
  id uuid,
  user_id uuid,
  name text,
  email text,
  created_at timestamptz,
  area_interesse text,
  last_sign_in_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p.id,
    p.user_id,
    p.name,
    p.email,
    p.created_at,
    p.area_interesse,
    -- CAST EXPLICITO. Esta e a UNICA coluna que vem do schema `auth`, e numa
    -- funcao `language sql` o tipo do SELECT tem de casar EXATAMENTE com o do
    -- RETURNS TABLE: divergencia nao aparece ao criar, aparece na primeira
    -- chamada, ja em producao. As demais colunas saem de `public.profiles`, cujos
    -- tipos foram conferidos contra a definicao da tabela (uuid, uuid, text,
    -- text, text, timestamptz) e batem um a um.
    u.last_sign_in_at::timestamptz as last_sign_in_at,
    -- `count(*) over ()` na MESMA passada: uma segunda query de contagem
    -- responderia sobre um instante diferente do da pagina, e as duas
    -- discordariam sob escrita concorrente.
    count(*) over () as total_count
  from public.profiles p
  left join auth.users u on u.id = p.user_id
  where
    (
      p_search is null
      or p.name ilike p_search
      or p.email ilike p_search
    )
    and (
      -- ATIVO = login nos ultimos 30 dias, a MESMA definicao que o server
      -- aplicava (ACTIVE_WINDOW_MS). Quem nunca logou tem `last_sign_in_at`
      -- nulo e fica fora por construcao, nao por acidente: a comparacao com
      -- nulo e nula, e o `and` a descarta.
      not p_only_active
      or u.last_sign_in_at >= now() - interval '30 days'
    )
    and (
      p_user_ids is null
      or (
        case
          when p_exclude_ids then not (p.user_id = any (p_user_ids))
          else p.user_id = any (p_user_ids)
        end
      )
    )
  -- MESMA ordenacao da rota: created_at desc com desempate por id desc.
  order by p.created_at desc, p.id desc
  limit p_limit
  offset p_offset;
$$;

-- Acesso: SO o server. Ver o item 3 do cabecalho.
revoke all on function public.admin_list_users_page(
  int, int, text, boolean, uuid[], boolean
) from public;
revoke all on function public.admin_list_users_page(
  int, int, text, boolean, uuid[], boolean
) from anon, authenticated;
grant execute on function public.admin_list_users_page(
  int, int, text, boolean, uuid[], boolean
) to service_role;

comment on function public.admin_list_users_page(
  int, int, text, boolean, uuid[], boolean
) is
  'Pagina da lista de usuarios do admin, com last_sign_in_at de auth.users e total_count na mesma passada. Restrita a service_role.';
