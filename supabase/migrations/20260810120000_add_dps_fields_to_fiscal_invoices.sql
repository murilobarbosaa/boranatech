-- Numeracao e identificacao da DPS (Fase 5 da NFS-e: Emissor Nacional).
--
-- ADITIVA: colunas nullable e uma sequence nova. Nenhum dado tocado, isenta da
-- janela de migration destrutiva; o rollback e o drop das colunas e da sequence.
--
-- POR QUE UMA SEQUENCE E NAO MAX(nDPS)+1. A DPS tem numeracao sequencial por
-- emitente/serie, e o numero entra na composicao do Id (que e unico no Sistema
-- Nacional). `MAX+1` sob concorrencia devolve o MESMO numero para dois
-- processos, e o segundo documento e rejeitado por Id duplicado (ou, pior,
-- substitui o primeiro). `nextval` e atomico e nao volta atras nem em rollback,
-- que e exatamente a propriedade desejada: numero de documento fiscal QUEIMADO
-- e melhor que numero reaproveitado.
--
-- A sequence e por SERIE na pratica porque hoje ha uma serie so. Se um dia
-- houver mais de uma, cada serie precisa da propria sequence: o par
-- (serie, numero) e que precisa ser unico, nao o numero sozinho.

create sequence if not exists public.dps_numero_seq
  as bigint
  start with 1
  increment by 1
  no maxvalue
  no cycle;

comment on sequence public.dps_numero_seq is
  'Numero sequencial da DPS (infDPS/nDPS). nextval e atomico; nunca usar MAX+1.';

alter table public.fiscal_invoices
  -- Serie da DPS: ate 5 digitos no leiaute (TSSerieDPS). Vem de env, porque e
  -- decisao de cadastro do emitente e nao do codigo.
  add column if not exists dps_serie text,
  -- Numero da DPS reservado por nextval ANTES da emissao. bigint porque o
  -- leiaute permite ate 15 digitos (TSNumDPS), que nao cabe em integer.
  add column if not exists dps_numero bigint,
  -- Id de 45 posicoes: "DPS" + Cod.Mun(7) + TpInscFed(1) + InscFed(14) +
  -- Serie(5) + Num(15). Padrao DPS[0-9]{42} (TSIdDPS, XSD v1.01).
  -- Guardado porque e a chave de idempotencia no provedor: GET/HEAD /dps/{id}
  -- responde se aquela DPS ja gerou NFS-e.
  add column if not exists dps_id text,
  -- Chave de acesso da NFS-e: 50 digitos (TSChaveNFSe, XSD v1.01). E por ela
  -- que se consulta a nota, o DANFSe e os eventos.
  add column if not exists chave_acesso text;

-- UNIQUE PARCIAL em dps_id: duas notas com o mesmo Id seriam duas tentativas de
-- emitir o MESMO documento fiscal, e o banco e o unico lugar que consegue
-- recusar isso de forma atomica. Parcial porque a coluna e nullable e todas as
-- linhas anteriores a esta fase (e as do caminho municipal) tem NULL.
create unique index if not exists fiscal_invoices_dps_id_key
  on public.fiscal_invoices (dps_id)
  where dps_id is not null;

create unique index if not exists fiscal_invoices_chave_acesso_key
  on public.fiscal_invoices (chave_acesso)
  where chave_acesso is not null;

comment on column public.fiscal_invoices.dps_id is
  'Id de 45 posicoes da DPS (TSIdDPS). Chave de idempotencia em GET/HEAD /dps/{id}.';
comment on column public.fiscal_invoices.chave_acesso is
  'Chave de acesso da NFS-e, 50 digitos. Usada em DANFSe e eventos.';
