-- Origem do aceite de consentimento, para auditoria.
--
-- PURAMENTE ADITIVA: uma coluna nullable numa tabela existente. Isenta da janela
-- de migration destrutiva (nao altera nem remove dado; o rollback e um drop do
-- que acabou de ser criado). Pode rodar a qualquer hora.
--
-- ORDEM DE DEPLOY: esta migration vai ANTES do codigo, e nao depois.
--
-- A regra geral do projeto (codigo antes da migration) protege contra schema novo
-- que o codigo antigo nao tolera, e por isso ela e sobre migration DESTRUTIVA.
-- Aqui e o inverso: a coluna nova e simplesmente ignorada pelo codigo antigo, que
-- nunca a menciona, entao aplicar antes nao quebra nada. Mas o codigo NOVO manda
-- `consent_method` no upsert, e se a coluna ainda nao existir o PostgREST recusa
-- o corpo inteiro: TODA gravacao de consentimento falharia na janela entre o
-- deploy e a migration. Aditiva primeiro, codigo depois.
--
-- O servidor ainda assim regrava sem o campo se encontrar a coluna ausente (ver
-- isMissingColumnError em server/routes/consent.ts), mas isso e rede de seguranca
-- para a ordem errada, nao autorizacao para usa-la.
--
-- NULL aqui NUNCA significa ausencia de consentimento. Toda linha ja existente
-- foi gravada antes desta coluna e fica NULL; linhas novas vindas de
-- um frontend anterior a este deploy tambem ficam NULL, porque o backend novo
-- aceita o campo ausente em vez de recusar a gravacao (deploy nao e atomico e o
-- que nao pode falhar e o registro do consentimento). A prova continua sendo a
-- existencia da linha.
--
-- Sem CHECK constraint de proposito: o conjunto de valores validos vive em
-- shared/consent.ts (CONSENT_METHODS) e e aplicado pelo servidor, que ja resolve
-- valor desconhecido para NULL. Um CHECK aqui obrigaria uma migration a cada
-- metodo novo e transformaria um campo de auditoria em causa de erro de escrita.
alter table public.user_consents
  add column if not exists consent_method text;

comment on column public.user_consents.consent_method is
  'Mecanismo pelo qual o aceite foi manifestado. Valores em shared/consent.ts (CONSENT_METHODS): signup_form_checkbox (caixa explicita no cadastro, ate o Passo 4), signup_wrap_implicit (sign-in wrap: o clique no botao e o consentimento), consent_gate_checkbox (caixa explicita no modal bloqueante). String nunca e reaproveitada com significado novo. NULL = gravado antes desta coluna existir, ou por cliente anterior ao deploy. NUNCA significa ausencia de consentimento.';
