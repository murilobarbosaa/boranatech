-- Limpeza pontual dos 5 registros com dominio reservado (example.com),
-- probes/testes de 2026-07-07 identificados no diagnostico do NODE-EXPRESS-3.
-- Restrita a esses registros especificos (prefixo conhecido + dominio reservado
-- + janela de data), NUNCA um DELETE amplo por regex que pudesse pegar dado
-- futuro legitimo. Idempotente: reexecucao nao afeta mais nada.
--
-- NAO deleta a conta em auth.users de redteam-probe-unb@example.com: decisao
-- separada. As 2 linhas em email_campaign_recipients sao snapshot de texto (sem
-- FK para profiles), entao apagar so elas nao cascateia nem quebra nada.

BEGIN;

-- 4 linhas de teste na waitlist (*latency-test*@example.com, 2026-07-07): cobre
-- tanto latency-test-local-* quanto o prefixo waitlist-latency-test. lower() por
-- robustez de caixa; a janela de data pina exatamente esses probes.
DELETE FROM public.waitlist
WHERE lower(email) LIKE '%latency-test%@example.com'
  AND created_at >= '2026-07-07' AND created_at < '2026-07-08';

-- 2 linhas do probe redteam em email_campaign_recipients (zero progresso).
DELETE FROM public.email_campaign_recipients
WHERE lower(email) = 'redteam-probe-unb@example.com';

-- Supressao global do e-mail do probe (cinto-e-suspensorio; a barreira de envio
-- ja bloqueia example.com). reason 'manual' = insercao administrativa; email em
-- minusculas pelo CHECK email = lower(email).
INSERT INTO public.email_suppressions (email, reason, source)
VALUES ('redteam-probe-unb@example.com', 'manual', 'admin')
ON CONFLICT (email) DO NOTHING;

COMMIT;
