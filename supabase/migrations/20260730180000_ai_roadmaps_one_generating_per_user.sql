-- Uma geracao ATIVA por usuario, garantida pelo banco.
--
-- PROBLEMA. A rota /api/roadmaps-ia/generate ja checava "existe linha
-- generating recente deste usuario?" antes de gerar, mas a checagem roda ANTES
-- do insert, e entre as duas cabe outra requisicao inteira. Dois cliques no
-- botao (que ate a fase 2 nao tinha `disabled`) faziam as duas requisicoes
-- lerem "nenhuma geracao ativa", as duas passarem, e nascerem dois roadmaps
-- cobrando duas unidades de cota. Checagem ler-depois-escrever nao fecha
-- corrida; e a mesma classe do TOCTOU que a 20260727150000 fechou na cota.
--
-- SOLUCAO. Indice unico PARCIAL sobre (user_id) onde status = 'generating'. A
-- segunda insercao concorrente falha com 23505 e a rota a traduz no MESMO 429
-- generation_in_progress que a checagem devolveria, entao o contrato da API nao
-- muda. A checagem antiga continua onde esta: ela evita o custo do insert no
-- caso comum, e o indice cobre a corrida que ela nao cobre.
--
-- Nome do indice e acoplado ao codigo: server/routes/aiRoadmap.ts distingue por
-- ele a colisao de slug (que se resolve gerando outro slug) da corrida de
-- geracao (que precisa devolver 429). Renomear aqui exige renomear la.
--
-- PRE-CONDICAO VERIFICADA em 2026-07-30, antes de escrever esta migration:
-- `select status, count(*) from public.ai_roadmaps group by status` devolveu
-- 18 ready e 2 partial, NENHUMA linha generating. Nao ha duplicata que faca a
-- criacao do indice falhar.
--
-- ADITIVA: cria indice, nao altera nem remove dado. Isenta da janela de
-- migration destrutiva (CLAUDE.md).
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.

CREATE UNIQUE INDEX IF NOT EXISTS ai_roadmaps_one_generating_per_user
  ON public.ai_roadmaps (user_id)
  WHERE status = 'generating';
