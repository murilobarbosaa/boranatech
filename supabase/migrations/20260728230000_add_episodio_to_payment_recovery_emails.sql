-- Corrige um bug de desenho da 20260728210000: a reabertura de episodio era
-- INALCANCAVEL.
--
-- O QUE ESTAVA ERRADO
-- ---------------------------------------------------------------------------
-- A tabela nasceu com UNIQUE (email, stage) e CHECK (stage IN (1,2)), ou seja, no
-- maximo DUAS linhas por endereco, para sempre. Mas a regua
-- (shared/paymentRecovery.ts) tem EPISODIO_NOVO_MS: passados 30 dias sem contato,
-- uma falha nova reabre o ciclo e a decisao devolve stage 1 de novo.
--
-- Com a UNIQUE antiga, esse stage 1 novo colidia com o stage 1 do episodio
-- anterior. O upsert usa ignoreDuplicates, entao o conflito virava DO NOTHING, o
-- runner lia zero linha e contava `ja_registrado`, e NENHUM e-mail saia. Quem
-- falhasse em agosto e voltasse em outubro nunca receberia nada, e o contador do
-- cron diria "ja tratado". Falha em silencio, com nome de sucesso.
--
-- A regra que faltava no schema estava escrita no codigo, e as duas se
-- contradiziam. Os 17 testes da regua nao pegaram porque exercitam a DECISAO
-- pura, e a decisao estava certa: quem barrava era a constraint.
--
-- A CORRECAO
-- ---------------------------------------------------------------------------
-- `episodio` entra na chave: UNIQUE (email, episodio, stage). A idempotencia que
-- a UNIQUE original dava continua valendo DENTRO do episodio (duas execucoes
-- concorrentes do cron nao mandam dois e-mails), e a reabertura passa a ser
-- representavel.
--
-- O teto agora e MAX_EPISODIOS = 3 no codigo, ou seja, no maximo 6 e-mails na vida
-- de um endereco. Sem teto, quem falha todo mes receberia 2 e-mails a cada 30
-- dias, 24 por ano, e isso queima reputacao de dominio, que e dano compartilhado
-- com todo e-mail transacional do produto.
--
-- SEGURANCA DESTA MIGRATION
-- ---------------------------------------------------------------------------
-- A tabela esta VAZIA (0 linhas, conferido em 2026-07-28) e nenhum codigo em
-- producao a le: `payment_recovery_emails` nao aparece em origin/main. Entao
-- trocar a constraint nao poe dado nenhum em risco e nao muda comportamento de
-- producao.
--
-- Nao e "puramente aditiva" no sentido estrito, porque DROPA uma constraint. Mas a
-- razao pela qual a janela destrutiva existe (RPO de 24h, dado que nao volta) nao
-- se aplica: nao ha linha para perder. O rollback e recolocar a constraint antiga,
-- e ele tambem e trivial enquanto a tabela estiver vazia.
--
-- ROLLBACK
--   alter table public.payment_recovery_emails
--     drop constraint payment_recovery_emails_email_episodio_stage_key,
--     drop column episodio,
--     add constraint payment_recovery_emails_email_stage_key unique (email, stage);

BEGIN;

-- DEFAULT 1 e depois DROP DEFAULT: se por acaso existir linha, ela pertence ao
-- primeiro episodio, o que e factualmente correto. Linha NOVA precisa do valor
-- explicito, vindo da decisao, e nao de um default que mascararia bug.
ALTER TABLE public.payment_recovery_emails
  ADD COLUMN IF NOT EXISTS episodio smallint NOT NULL DEFAULT 1;

ALTER TABLE public.payment_recovery_emails
  ALTER COLUMN episodio DROP DEFAULT;

-- Teto de episodios espelhado no banco. MAX_EPISODIOS vive em
-- shared/paymentRecovery.ts e e a fonte da decisao; este CHECK e a rede: se um
-- bug tentar gravar episodio 9, a escrita falha em vez de mandar o nono e-mail.
ALTER TABLE public.payment_recovery_emails
  ADD CONSTRAINT payment_recovery_emails_episodio_check
  CHECK (episodio BETWEEN 1 AND 3);

ALTER TABLE public.payment_recovery_emails
  DROP CONSTRAINT IF EXISTS payment_recovery_emails_email_stage_key;

ALTER TABLE public.payment_recovery_emails
  ADD CONSTRAINT payment_recovery_emails_email_episodio_stage_key
  UNIQUE (email, episodio, stage);

COMMENT ON COLUMN public.payment_recovery_emails.episodio IS
  'Ciclo de recuperacao (1..3). Um episodio novo abre depois de EPISODIO_NOVO_MS sem contato. Entra na UNIQUE para a reabertura ser possivel; sem ele o stage 1 do episodio 2 colidiria com o do episodio 1.';

COMMIT;
