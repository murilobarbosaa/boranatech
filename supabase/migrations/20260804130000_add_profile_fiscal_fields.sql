-- Dados fiscais do TOMADOR, para a emissao de NFS-e (Fase 2).
--
-- ADITIVA e toda nullable, no precedente exato da
-- 20260714120000_add_profile_identity_fields.sql (que trouxe full_name e cpf
-- para o certificado): signup e perfis existentes continuam validos sem
-- preencher nada, e nenhuma coluna existente e alterada. Isenta da janela de
-- migration destrutiva; o rollback e o drop das colunas.
--
-- NAO ha unique em cnpj, pelo mesmo motivo declarado la para o cpf: a mesma
-- empresa pode ter mais de uma conta, policiar isso nao e papel desta feature, e
-- um unique quebraria o signup. RLS de profiles intocada.
--
-- Por que os campos de endereco sao text SOLTOS e nao um jsonb: eles sao
-- editados campo a campo num formulario, validados campo a campo e preenchidos
-- em parte por consulta de CEP. jsonb aqui trocaria oito colunas conferiveis por
-- um blob sem schema, que e exatamente a razao pela qual `preferences` esta na
-- lista de campos que o admin nao edita. O jsonb existe do outro lado, em
-- fiscal_invoices.tomador_endereco, e la ele e CORRETO: e snapshot congelado, um
-- documento imutavel, nao um formulario.
--
-- ESTE ARQUIVO RODA EM DUAS TRANSACOES, de proposito, e a segunda comeca depois
-- do COMMIT explicito la embaixo. O motivo esta no comentario do CHECK: o
-- `validate constraint` PRECISA estar fora da transacao do `add constraint`,
-- senao o lock exclusivo do ADD fica retido ate o commit e a separacao nao
-- economiza nada. O precedente de controle explicito de transacao neste
-- diretorio e a 20260804140100_schedule_reconcile_fiscal_invoices.sql.

BEGIN;

alter table public.profiles
  add column if not exists cnpj text,
  add column if not exists razao_social text,
  -- Qual documento vai na nota quando os dois existirem. NULL = CPF, que e o
  -- unico que o produto coletava antes desta migration: sem backfill, toda
  -- conta anterior continua resolvendo como pessoa fisica.
  add column if not exists fiscal_documento_preferencia text,
  add column if not exists endereco_cep text,
  add column if not exists endereco_logradouro text,
  add column if not exists endereco_numero text,
  add column if not exists endereco_complemento text,
  add column if not exists endereco_bairro text,
  add column if not exists endereco_cidade text,
  add column if not exists endereco_uf text,
  -- Codigo IBGE do municipio (7 digitos). E ele que a maioria das prefeituras
  -- usa para identificar o municipio do tomador, nao o nome da cidade, que tem
  -- grafia variavel. Preenchido pela consulta de CEP quando disponivel.
  add column if not exists endereco_codigo_municipio text;

-- CHECK adicionado separado do add column para poder ser nomeado e para nao
-- falhar caso a coluna ja exista de uma execucao anterior.
alter table public.profiles
  drop constraint if exists profiles_fiscal_documento_preferencia_check;

-- NOT VALID: o ADD toma ACCESS EXCLUSIVE em `profiles`, e sem esta clausula ele
-- SEGURA o lock enquanto varre a tabela inteira para validar as linhas que ja
-- existem. `profiles` e a tabela do caminho de login, entao essa varredura
-- bloqueia leitura e escrita do site inteiro pelo tempo que durar. Com NOT VALID
-- o lock exclusivo dura um instante, porque so o catalogo e escrito.
--
-- A validacao nao e dispensada, so adiada para a segunda transacao: o
-- `validate constraint` la embaixo varre com SHARE UPDATE EXCLUSIVE, que NAO
-- bloqueia leitura nem escrita normal. O resultado final e identico ao do ADD
-- sem NOT VALID, com a constraint valida e verificada; muda so o custo de
-- chegar la.
--
-- A varredura nao pode falhar aqui: a coluna nasce nesta mesma migration e esta
-- NULL em todas as linhas, e `null in ('cpf','cnpj')` e NULL, que satisfaz o
-- CHECK. Ainda assim ela nasce NOT VALID por principio, e nao pelo tamanho de
-- hoje: quem aplicar esta migration daqui a um ano nao vai reconferir isso.
alter table public.profiles
  add constraint profiles_fiscal_documento_preferencia_check
  check (fiscal_documento_preferencia in ('cpf', 'cnpj')) not valid;

comment on column public.profiles.cnpj is
  'Somente digitos. Usado exclusivamente para emissao de NFS-e.';
comment on column public.profiles.razao_social is
  'Razao social do tomador pessoa juridica. Vai na nota no lugar do nome civil.';
comment on column public.profiles.fiscal_documento_preferencia is
  'cpf | cnpj. NULL equivale a cpf. Decide qual documento vai na NFS-e.';
comment on column public.profiles.endereco_codigo_municipio is
  'Codigo IBGE do municipio (7 digitos), preenchido pela consulta de CEP.';

COMMIT;

-- SEGUNDA TRANSACAO. O `validate constraint` so entrega o ganho do NOT VALID se
-- rodar fora da transacao que criou a constraint: dentro dela, o ACCESS
-- EXCLUSIVE tomado pelo ADD continua retido ate o COMMIT acima, e a varredura
-- aconteceria sob esse mesmo lock, que e exatamente o que esta separacao evita.
-- Aqui ele varre com SHARE UPDATE EXCLUSIVE e marca a constraint como valida.
alter table public.profiles
  validate constraint profiles_fiscal_documento_preferencia_check;
