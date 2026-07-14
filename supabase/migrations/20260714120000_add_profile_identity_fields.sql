-- Identidade formal do titular, usada exclusivamente na emissao de
-- certificado (C1). Ambas as colunas sao nullable e aditivas: signup e perfis
-- existentes continuam validos sem preencher nada.
--
-- NAO ha unique em cpf de proposito: uma pessoa pode ter mais de uma conta e
-- policiar isso nao e papel desta feature; um unique quebraria o signup.
-- RLS de profiles intocada.

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists cpf text;

comment on column public.profiles.cpf is
  'Somente digitos. Usado exclusivamente para emissao de certificado.';
