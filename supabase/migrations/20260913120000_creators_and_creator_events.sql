-- Creators, lote 01: a concessao de influencer vira concessao de creator, com
-- dois tipos (influencer e afiliado); o codigo de afiliado ganha dono; e nasce
-- um registro por evento para a serie temporal do painel.
--
-- 1. public.influencers e RENOMEADA para public.creators (nao e tabela nova: as
--    linhas, os ids e o historico de concessoes e revogacoes ficam). A coluna
--    kind entra com default 'influencer', que e o que toda linha existente e.
--    Os nomes de indice e de constraint tambem mudam, para o nome nao mentir.
--    Os nomes antigos sao os que o Postgres gerou para a 20260716130000
--    (constraints inline) e os que ela declarou (indices). Se algum nao existir
--    com esse nome, o rename falha e a transacao inteira volta.
--    Logo depois nasce a VIEW public.influencers sobre public.creators, com as
--    colunas da tabela antiga na mesma ordem e sem kind, para o codigo em
--    producao continuar lendo e escrevendo em influencers ate o deploy (ver o
--    bloco dela abaixo). Ela cai em migration posterior.
-- 2. affiliates.user_id: dono do codigo. NAO e unique: uma pessoa pode ter um
--    codigo por rede. O vinculo e manual, feito pelo admin.
-- 3. subscriptions.affiliate_code ganha o indice que so existia na migration
--    arquivada (_archive/20260506_affiliates.sql), que nunca rodou.
-- 4. creator_events: um registro por clique, checkout e venda, escrito pelo
--    server AO LADO dos contadores de affiliates (que continuam). RLS sem
--    policy e sem privilegio para anon e authenticated, igual a affiliates
--    depois de 20260611120000 e a coupons.
-- 5. is_user_pro passa a ler creators. O corpo e o da 20260716130100 com UMA
--    troca (public.influencers por public.creators): qualquer kind ativo
--    concede Pro, como a concessao de influencer ja concedia. Sem este passo, o
--    rename do item 1 faria a funcao falhar em toda chamada, e o Pro de
--    assinante cairia junto (a funcao e um OR numa query so).
--
-- ORDEM DE DEPLOY: o rename sozinho quebraria o codigo que ainda le
-- public.influencers no instante em que rodasse. A view de compatibilidade
-- existe para que esta migration possa rodar ANTES ou DEPOIS do deploy do
-- codigo que le public.creators, sem janela de erro. Continua sendo migration
-- com rename, e por isso segue a janela destrutiva do CLAUDE.md.

BEGIN;

-- 1. influencers vira creators
ALTER TABLE public.influencers RENAME TO creators;

ALTER TABLE public.creators RENAME CONSTRAINT influencers_pkey TO creators_pkey;
ALTER TABLE public.creators
  RENAME CONSTRAINT influencers_user_id_fkey TO creators_user_id_fkey;
ALTER TABLE public.creators
  RENAME CONSTRAINT influencers_granted_by_fkey TO creators_granted_by_fkey;
ALTER TABLE public.creators
  RENAME CONSTRAINT influencers_revoked_by_fkey TO creators_revoked_by_fkey;
ALTER INDEX public.influencers_user_id_idx RENAME TO creators_user_id_idx;
ALTER INDEX public.influencers_active_user_uidx
  RENAME TO creators_active_user_uidx;

ALTER TABLE public.creators
  ADD COLUMN kind text NOT NULL DEFAULT 'influencer'
  CONSTRAINT creators_kind_check CHECK (kind IN ('influencer', 'afiliado'));

COMMENT ON TABLE public.creators IS
  'Concessao de Creator (influencer ou afiliado). Concede Pro enquanto revoked_at e null. Substitui a tabela influencers.';

-- view de compatibilidade: o codigo em producao ainda le e escreve em
-- influencers. Cai em migration posterior, depois que a main sem referencias a
-- influencers estiver no ar.
--
-- As colunas sao EXATAMENTE as da tabela antiga (20260716130000), na mesma
-- ordem, sem kind. View de uma tabela so, sem join, sem agregacao e sem
-- DISTINCT e automaticamente atualizavel no Postgres: o insert do grant antigo
-- (user_id, granted_by, note) chega a creators, e as colunas que ele omite
-- (id, granted_at, created_at, kind) recebem o default da tabela, entao kind
-- vira 'influencer'. O update do revoke antigo tambem passa. security_invoker
-- faz a view checar privilegio e RLS de creators com o papel de quem consulta,
-- em vez do dono da view.
CREATE VIEW public.influencers
  WITH (security_invoker = true)
  AS SELECT id, user_id, granted_by, granted_at, revoked_by, revoked_at, note, created_at
  FROM public.creators;
GRANT SELECT, INSERT, UPDATE ON public.influencers TO service_role;
REVOKE ALL ON public.influencers FROM anon, authenticated;
COMMENT ON VIEW public.influencers IS
  'Compatibilidade temporaria com o codigo anterior ao rename para creators. Remover apos deploy.';

-- 2. dono do codigo
ALTER TABLE public.affiliates
  ADD COLUMN user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX affiliates_user_id_idx
  ON public.affiliates(user_id)
  WHERE user_id IS NOT NULL;

-- 3. indice que faltava
CREATE INDEX subscriptions_affiliate_code_idx
  ON public.subscriptions(affiliate_code)
  WHERE affiliate_code IS NOT NULL;

-- 4. eventos
-- subscription_id e plan_id seguem os tipos de public.subscriptions (id uuid,
-- plan_id uuid). plan_id fica sem FK de proposito: e retrato do que foi
-- vendido, e a serie nao pode perder a linha se um plano for removido.
CREATE TABLE public.creator_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  event_type text NOT NULL
    CHECK (event_type IN ('click', 'checkout', 'sale')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id uuid NULL REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan_id uuid NULL,
  payment_method text NULL,
  revenue_cents integer NULL,
  commission_cents integer NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX creator_events_affiliate_occurred_idx
  ON public.creator_events(affiliate_id, occurred_at DESC);
CREATE INDEX creator_events_type_occurred_idx
  ON public.creator_events(event_type, occurred_at DESC);

ALTER TABLE public.creator_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.creator_events FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.creator_events IS
  'Um registro por evento de creator (clique, checkout, venda). Escrito apenas pelo server ao lado dos contadores de affiliates. Fonte da serie temporal do painel de creators.';

-- 5. is_user_pro passa a ler creators
-- Assinatura, LANGUAGE, STABLE, SECURITY DEFINER e search_path identicos a
-- 20260716130100. Os GRANTs (execute so para service_role) sobrevivem ao
-- CREATE OR REPLACE e nao sao refeitos aqui, como la.
CREATE OR REPLACE FUNCTION "public"."is_user_pro"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select exists (
    select 1
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
    where s.user_id = p_user_id
      and p.code != 'free'
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  )
  or exists (
    select 1
    from public.creators i
    where i.user_id = p_user_id
      and i.revoked_at is null
  );
$$;

ALTER FUNCTION "public"."is_user_pro"("p_user_id" "uuid") OWNER TO "postgres";

COMMIT;
