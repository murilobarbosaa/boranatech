-- Adiciona public.subscriptions.affiliate_code.
-- A coluna estava sendo escrita pelo webhook do Asaas em billing.ts
-- (baseRequired.affiliate_code), mas a migration original que a criaria
-- (supabase/migrations/_archive/20260506_affiliates.sql) foi arquivada e nunca
-- rodou em producao. INSERTs entao falhavam com 42703 (column does not exist),
-- erro engolido como "db_error" generico (corrigido em commit anterior).
-- Idempotente via IF NOT EXISTS.

alter table public.subscriptions
  add column if not exists affiliate_code text;
