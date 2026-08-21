-- Serializacao de analises CONCORRENTES do mesmo usuario, na reserva de vaga.
--
-- PROBLEMA (achado 2 da investigacao da Fase 4). A reserva ja e atomica, mas o
-- advisory lock so decide UMA coisa: se cabe na cota. Duas abas do mesmo usuario
-- com cota livre entram uma depois da outra, as duas veem vaga, as duas
-- reservam, e as duas processam em paralelo. Efeito para quem usa: duas
-- chamadas pagas de IA pelo mesmo perfil, duas linhas no historico, e a segunda
-- sobrescrevendo a primeira na tela. O `if (loading)` do cliente nao alcanca
-- isso: ele e estado local de UMA pagina React e a segunda aba tem o seu.
--
-- SOLUCAO. Dentro do MESMO advisory lock que ja existe, antes de contar a cota:
-- se ja houver reserva pendente (`status = 'reserved'`) do mesmo usuario e da
-- mesma ferramenta, com idade menor que uma janela informada pelo chamador,
-- recusa com desfecho NOMEADO e nao cria reserva nenhuma.
--
-- POR QUE UM PARAMETRO, e nao um valor fixo aqui dentro: esta RPC serve NOVE
-- ferramentas de IA. Um valor fixo mudaria o comportamento das outras oito de
-- carona, e so o caminho da analise de LinkedIn foi medido. Quem nao passa a
-- janela continua com o comportamento de sempre, byte a byte.
--
-- POR QUE UMA SOBRECARGA DE QUATRO ARGUMENTOS, e nao um DEFAULT no parametro
-- novo. Esta e a decisao mais importante deste arquivo, e ela e de SEGURANCA
-- operacional. Se o parametro novo tivesse DEFAULT, existiriam ao mesmo tempo
-- `reserve_ai_usage_slot(uuid, text, integer)` e
-- `reserve_ai_usage_slot(uuid, text, integer, integer DEFAULT ...)`, e as duas
-- aceitariam uma chamada de TRES argumentos. O Postgres nao escolhe entre elas:
-- ele reporta `function ... is not unique`. Quem paga essa conta e o backend que
-- estiver rodando no momento em que a migration for aplicada, ou seja TODAS as
-- nove ferramentas, e o efeito nao seria nem um erro visivel: `checkAiDailyLimit`
-- captura a falha da RPC e cai no MODO DEGRADADO, em que a cota volta a ser
-- verificada de forma nao-atomica. A plataforma inteira ficaria com a corrida de
-- cota reaberta, em silencio (o aviso do Sentry sai no maximo uma vez a cada
-- cinco minutos). Sem um banco onde testar isso antes, e proibido aplicar
-- migration por este caminho, nao ha como verificar a suposicao: entao o desenho
-- escolhido e o que NAO depende dela.
--
-- Com duas aridades distintas e nenhum DEFAULT, a resolucao e exata: chamada de
-- tres argumentos so casa a de tres, chamada de quatro so casa a de quatro.
-- Nao existe ambiguidade possivel, nem hoje nem depois.
--
-- E PARA NAO DUPLICAR A LOGICA DE COTA, que e o defeito que a propria
-- 20260730170000_ai_usage_excluded_tools.sql existe para ter fechado: a versao de
-- tres argumentos deixa de ter corpo proprio e passa a DELEGAR para a de quatro,
-- com a janela em zero. Um corpo so, dois pontos de entrada. O comportamento de
-- quem chama com tres argumentos e identico ao de antes por construcao, nao por
-- alguem ter copiado certo.
--
-- ADITIVA: cria uma funcao e substitui o corpo de outra por uma delegacao. Nao
-- altera nem remove dado. Isenta da janela de migration destrutiva (CLAUDE.md).
--
-- ORDEM DE DEPLOY, OBRIGATORIA: esta migration vai ANTES do backend que a
-- consome. O backend novo chama a versao de QUATRO argumentos; num banco sem
-- esta migration essa funcao nao existe, a RPC falha, e `checkAiDailyLimit` cai
-- no modo degradado (nao bloqueia a analise, mas reabre a corrida de cota do
-- analisador de LinkedIn e some com a serializacao que este arquivo entrega).
-- Mesma ordem obrigatoria da coluna do lote 5 da Fase 3.
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.

-- ============================================================================
-- A de QUATRO argumentos: o corpo de verdade.
--
-- Tudo que vinha de 20260730170000 esta preservado sem alteracao: o advisory
-- lock por usuario, a lista canonica de tools excluidas via
-- ai_usage_excluded_tools(), a expiracao de reserva orfa em 10 minutos, a
-- comparacao com p_limit, e o insert da vaga.
--
-- A coluna `motivo` e a UNICA adicao ao contrato de retorno, e ela existe porque
-- sem ela o desfecho novo seria indistinguivel do antigo: os dois sairiam como
-- `allowed = false` com `reservation_id` nulo, e o servidor nao teria como
-- responder 409 para um e 429 para o outro. As tres colunas de antes seguem
-- na mesma ordem e com os mesmos tipos, entao quem ja lia por nome continua
-- lendo. Sentinela em `usage_count` (um -1, por exemplo) foi descartada de
-- proposito: numero plausivel no lugar de um estado e a familia de defeito que o
-- CLAUDE.md deste projeto documenta como a pior.
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."reserve_ai_usage_slot"(
  "p_user_id" "uuid",
  "p_tool" "text",
  "p_limit" integer,
  "p_janela_andamento_ms" integer
)
RETURNS TABLE(
  "allowed" boolean,
  "usage_count" integer,
  "reservation_id" "uuid",
  "motivo" "text"
)
LANGUAGE "plpgsql" VOLATILE SECURITY DEFINER
SET "search_path" = 'pg_catalog', 'public'
AS $$
DECLARE
  v_count integer;
  v_id uuid;
  v_em_andamento boolean;
BEGIN
  -- Serializa as concorrentes DO MESMO usuario. Duas pessoas diferentes nao se
  -- bloqueiam; a trava cai sozinha no fim da transacao. Inalterado.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- ANALISE JA EM VOO. Dentro do lock que ja existia, entao duas requisicoes
  -- simultaneas nao conseguem passar as duas por aqui: a segunda so entra
  -- depois que a primeira comitou o insert da reserva, e ai enxerga a reserva
  -- da primeira.
  --
  -- Zero ou NULL desliga a checagem, e e assim que as outras oito ferramentas
  -- continuam funcionando exatamente como antes (elas chegam pela versao de
  -- tres argumentos, que delega com zero).
  --
  -- Por (usuario, ferramenta) e nao so por usuario: o lock e por usuario, mas a
  -- recusa nao pode ser. Uma analise de LinkedIn em voo nao pode impedir a
  -- pessoa de usar o analisador de GitHub no mesmo minuto.
  IF coalesce(p_janela_andamento_ms, 0) > 0 THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.ai_usage_logs
      WHERE user_id = p_user_id
        AND tool = p_tool
        AND status = 'reserved'
        AND created_at > now() - make_interval(
          secs => p_janela_andamento_ms::double precision / 1000.0
        )
    ) INTO v_em_andamento;

    IF v_em_andamento THEN
      -- `usage_count` NULO, e nao zero: nao houve contagem neste caminho, e
      -- zero seria uma medicao ("a pessoa nao usou nada hoje") indistinguivel
      -- de um numero real. O servidor nao le a contagem neste desfecho.
      RETURN QUERY SELECT
        false, NULL::integer, NULL::uuid, 'analise_em_andamento'::text;
      RETURN;
    END IF;
  END IF;

  -- Daqui para baixo, identico a 20260730170000.
  SELECT count(*)::integer INTO v_count
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND status IN ('success', 'reserved')
    AND (tool IS NULL OR tool <> ALL(public.ai_usage_excluded_tools()))
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
    -- Reserva orfa (processo morreu entre reservar e confirmar) expira em 10
    -- minutos em vez de ocupar vaga ate a virada do dia. Auto-cura: sem isso,
    -- um crash custaria uma chamada da cota da pessoa por horas.
    AND (status <> 'reserved' OR created_at > now() - interval '10 minutes');

  IF v_count >= p_limit THEN
    RETURN QUERY SELECT false, v_count, NULL::uuid, 'cota_esgotada'::text;
    RETURN;
  END IF;

  INSERT INTO public.ai_usage_logs (user_id, tool, status)
  VALUES (p_user_id, p_tool, 'reserved')
  RETURNING id INTO v_id;

  RETURN QUERY SELECT true, v_count + 1, v_id, 'reservado'::text;
END;
$$;

-- ============================================================================
-- A de TRES argumentos: mesma assinatura, mesmo contrato de retorno, mesmo
-- comportamento. So que agora sem corpo proprio.
--
-- Chamar com janela zero e exatamente o caminho antigo: a checagem nova fica
-- desligada e a funcao segue direto para a contagem de cota. As oito outras
-- ferramentas chegam por aqui e nao percebem diferenca nenhuma.
-- ============================================================================
CREATE OR REPLACE FUNCTION "public"."reserve_ai_usage_slot"(
  "p_user_id" "uuid",
  "p_tool" "text",
  "p_limit" integer
)
RETURNS TABLE("allowed" boolean, "usage_count" integer, "reservation_id" "uuid")
LANGUAGE "sql" VOLATILE SECURITY DEFINER
SET "search_path" = 'pg_catalog', 'public'
AS $$
  SELECT r.allowed, r.usage_count, r.reservation_id
  FROM public.reserve_ai_usage_slot(p_user_id, p_tool, p_limit, 0) AS r;
$$;

-- Hardening. CREATE OR REPLACE reseta os grants, e uma funcao recem-criada nasce
-- com EXECUTE para PUBLIC: sem estas linhas, a sobrecarga nova ficaria chamavel
-- por `anon` e `authenticated`, o que seria uma regressao de seguranca em
-- relacao a de tres argumentos. Mesmo criterio de
-- 20260702130000_security_hardening_rpc_grants.sql e de 20260730170000.
REVOKE ALL ON FUNCTION public.reserve_ai_usage_slot(uuid, text, integer, integer)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_usage_slot(uuid, text, integer, integer)
  TO service_role;

REVOKE ALL ON FUNCTION public.reserve_ai_usage_slot(uuid, text, integer)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_usage_slot(uuid, text, integer)
  TO service_role;
