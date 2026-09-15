-- A view de compatibilidade nasceu na 20260913120000 para o codigo anterior ao
-- rename continuar lendo influencers ate o deploy. O deploy (d6a0b93c) esta no
-- ar e nenhuma funcao ou rota le a view, entao ela cai.
--
-- Nao remove dado: a view nao guarda linha nenhuma, as linhas moram em
-- public.creators. O rollback e recriar a view com o bloco da 20260913120000.
DROP VIEW IF EXISTS public.influencers;
