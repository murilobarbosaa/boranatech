-- Indice de JANELA para linkedin_analyses.
--
-- ADITIVA: cria indice, nao toca dado nenhum. Isenta da janela de migration
-- destrutiva; o rollback e o drop do indice.
--
-- POR QUE AGORA. O painel de violacoes de lastro do admin
-- (`GET /api/admin/linkedin-lastro`, criado no lote anterior) filtra por
-- `created_at >= agora menos a janela` SEM filtro de usuario, e ordena por
-- `created_at desc`. O unico indice existente na tabela e
-- `linkedin_analyses_user_idx (user_id, created_at desc)`, que NAO serve para
-- essa consulta: sem igualdade na primeira coluna, o Postgres cai em varredura
-- sequencial mais ordenacao.
--
-- Com o volume atual (recurso Pro, produto novo) isso e trivial, e a rota ja
-- carrega um teto de sanidade que limita o custo. Este indice e o conserto da
-- CAUSA, para o teto nunca precisar virar a defesa principal.
--
-- `desc` na definicao acompanha a ordenacao da consulta. O Postgres consegue
-- percorrer um indice ascendente para tras, entao a direcao nao muda o que e
-- possivel; ela evita o passo de ordenacao no plano.

create index if not exists linkedin_analyses_created_at_idx
  on public.linkedin_analyses (created_at desc);

comment on index public.linkedin_analyses_created_at_idx is
  'Agregacoes por janela de tempo sem filtro de usuario (painel de lastro do admin).';
