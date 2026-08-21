-- Reembolso que zera o saldo passa a REVOGAR o acesso, e passa a existir o
-- registro de uma devolução feita FORA da plataforma. Duas mudanças aditivas,
-- no mesmo commit porque as duas são pré-requisito do mesmo código.
--
-- ORDEM DE DEPLOY: ANTES do código, pelas mesmas duas razões da 20260730140000
-- e da 20260730160000:
--
--   (a) audit fail-closed: gravar action='refund_external' ou 'revoke_pro'
--       contra a CHECK velha faz o insert falhar e a rota responder 500 ANTES
--       de tocar dinheiro ou acesso;
--   (b) o código escreve a coluna `settlement`. Código que escreve coluna
--       INEXISTENTE falha na hora, não degrada.
--
-- As duas falham ALTO se a migration não chegar, e é por isso que esta
-- migration NÃO ganha asserção comportamental em scripts/checkMigrationsApplied.mts.
-- A regra do CLAUDE.md existe para a migration que fica INVISÍVEL ao guard E
-- ao runtime (o caso do `create or replace` de get_ai_usage_today, que ficou
-- verde por 17 dias cobrando cota a mais). Aqui não há esse silêncio: sem a
-- coluna o insert estoura, sem a CHECK o audit estoura, e o audit é
-- fail-closed, então a ação não acontece. O guard não é o único detector.
--
-- ADITIVA e ISENTA da janela destrutiva: acrescenta coluna com default e amplia
-- uma CHECK. Não apaga, não converte e não altera dado existente.

BEGIN;

-- (1) COMO a devolução foi liquidada. É o discriminador que decide se a linha
-- CONTA na agregação do extrato ou se ela seria contagem dupla.
--
--   stripe_api        resultado de refunds.create feito por nós
--                     (POST /users/:id/refunds). O dinheiro sai pela Stripe e a
--                     balance transaction correspondente vira linha em
--                     finance_transactions pelo syncBalanceTransactions.
--
--   stripe_dashboard  DECLARAÇÃO de um reembolso emitido no painel da Stripe.
--                     Existe objeto Refund na Stripe, então a balance
--                     transaction vem pelo sync do mesmo jeito. A linha aqui
--                     guarda ator, motivo e vínculo com a auditoria, que o sync
--                     não tem. NÃO conta na agregação: contaria duas vezes.
--
--   external          DECLARAÇÃO de uma devolução feita totalmente fora da
--                     Stripe (PIX, TED, transferência da conta da empresa). A
--                     Stripe nunca soube, nenhum sync vai trazer, e esta linha é
--                     o ÚNICO registro que existe. CONTA na agregação.
--
-- A distinção entre os dois últimos NÃO vem do que o admin declara: ela é
-- derivada de refunds.list({ charge }) na Stripe no momento do registro. A
-- existência do objeto Refund é a MESMA condição que produz a linha em
-- finance_transactions, então não é um proxy da pergunta, é a pergunta.
--
-- DEFAULT 'stripe_api' é o que as linhas existentes são: até esta migration o
-- único caminho de escrita era a rota que chama refunds.create.
ALTER TABLE "public"."admin_refunds"
    ADD COLUMN IF NOT EXISTS "settlement" "text" NOT NULL DEFAULT 'stripe_api';

ALTER TABLE "public"."admin_refunds"
    DROP CONSTRAINT IF EXISTS "admin_refunds_settlement_check";

ALTER TABLE "public"."admin_refunds"
    ADD CONSTRAINT "admin_refunds_settlement_check"
    CHECK (("settlement" = ANY (ARRAY[
        'stripe_api'::"text",
        'stripe_dashboard'::"text",
        'external'::"text"
    ])));

COMMENT ON COLUMN "public"."admin_refunds"."settlement" IS
    'Como a devolução foi liquidada. stripe_api: refunds.create chamado por nós. stripe_dashboard: declaração de reembolso que JA existe como objeto Refund na Stripe (o sync traz a linha de dinheiro). external: declaração de devolução feita fora da Stripe (a Stripe nunca soube; esta linha é o único registro e é a única que CONTA na agregação do extrato). Derivado de refunds.list, nunca do que o admin afirma.';

-- AVISO DE DIVERGÊNCIA CONHECIDA, registrado no objeto para quem abrir a tabela
-- encontrar sem depender de achar o doc. Ver o bloco equivalente no topo de
-- server/lib/financeMetrics.ts.
--
-- Uma linha com settlement='external' entra no extrato DO USUÁRIO (a agregação
-- de server/lib/userTransactions.ts a soma) e NÃO entra no FinanceDashboard
-- global, que lê finance_transactions direto. Medido: com uma devolução externa
-- de N centavos registrada, getFinanceSummary reporta reembolsosCents
-- SUBESTIMADO em N e receitaLiquidaCents/lucroCents/margemPercent
-- SUPERESTIMADOS em N; getFinanceTimeseries superestima receita e lucro no mês
-- da declaração. Hoje o efeito é ZERO porque não existe nenhuma linha external.
COMMENT ON TABLE "public"."admin_refunds" IS
    'Reembolsos emitidos E devoluções declaradas pelo admin. ATENÇÃO: linhas com settlement=external não existem em finance_transactions, então o FinanceDashboard global (server/lib/financeMetrics.ts) não as desconta da receita enquanto a reconciliação descrita lá não for feita.';

-- (2) Duas actions próprias na auditoria.
--
-- 'refund_external': registrar um fato externo NÃO é emitir reembolso. Misturar
-- os dois na mesma action faria o filtro do histórico não distinguir "devolvi
-- dinheiro por aqui" de "declarei que devolvi por fora", que é exatamente a
-- distinção que o registro existe para preservar.
--
-- 'revoke_pro': a revogação é um efeito SEPARADO do reembolso e pode falhar
-- sozinha (o dinheiro já saiu quando ela é tentada). Com action própria ela
-- ganha a própria linha de intenção e o próprio cruzamento intenção-vs-resultado
-- da Fatia 8: quando a revogação falha depois de um reembolso bem-sucedido, a
-- linha aparece como "Sem confirmação" no histórico, que é o rastro DURÁVEL de
-- que alguém precisa revogar à mão. Um campo dentro do after_json de 'refund'
-- não teria cruzamento próprio e o estado meio-feito ficaria invisível.
--
-- 'revoke' NÃO serve: ela já significa "acesso de influencer revogado" na tela
-- (client/src/components/admin/users/UserAuditHistory.tsx) e as duas ações
-- tocam coisas diferentes (influencers x subscriptions).
ALTER TABLE "public"."content_audit_logs"
    DROP CONSTRAINT IF EXISTS "content_audit_logs_action_check";

ALTER TABLE "public"."content_audit_logs"
    ADD CONSTRAINT "content_audit_logs_action_check"
    CHECK (("action" = ANY (ARRAY[
        'create'::"text",
        'update'::"text",
        'delete'::"text",
        'publish'::"text",
        'unpublish'::"text",
        'reveal'::"text",
        'grant'::"text",
        'revoke'::"text",
        'update_profile'::"text",
        'update_email'::"text",
        'cancel_subscription'::"text",
        'refund'::"text",
        'refund_external'::"text",
        'revoke_pro'::"text"
    ])));

COMMIT;
