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

alter table public.profiles
  add constraint profiles_fiscal_documento_preferencia_check
  check (fiscal_documento_preferencia in ('cpf', 'cnpj'));

comment on column public.profiles.cnpj is
  'Somente digitos. Usado exclusivamente para emissao de NFS-e.';
comment on column public.profiles.razao_social is
  'Razao social do tomador pessoa juridica. Vai na nota no lugar do nome civil.';
comment on column public.profiles.fiscal_documento_preferencia is
  'cpf | cnpj. NULL equivale a cpf. Decide qual documento vai na NFS-e.';
comment on column public.profiles.endereco_codigo_municipio is
  'Codigo IBGE do municipio (7 digitos), preenchido pela consulta de CEP.';
