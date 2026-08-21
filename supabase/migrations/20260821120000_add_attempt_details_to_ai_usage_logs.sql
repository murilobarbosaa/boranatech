-- Detalhe POR TENTATIVA da chamada de IA, em coluna estruturada.
--
-- ADITIVA: coluna nova, nullable, SEM default, sem backfill e sem indice.
-- Nenhum dado existente e tocado, entao e isenta da janela de migration
-- destrutiva e o rollback e o drop da coluna.
--
-- O QUE ELA RESOLVE. Ate aqui o detalhe de cada tentativa (numero, desfecho
-- classificado, tokens medidos ou o estado nomeado de usage indisponivel,
-- chars) era espremido numa STRING dentro de `error_message`, com teto de 500
-- caracteres, porque nao havia campo estruturado. Duas consequencias, e a
-- segunda e a que dava dano de verdade:
--
--   1. `error_message` passou a carregar duas coisas de naturezas diferentes,
--      a mensagem do erro e a contabilidade da chamada, coladas por um pipe;
--   2. o dado ficava inconsultavel. Somar tokens por desfecho, ou responder
--      "quantas analises gastaram duas tentativas nesta semana", exigiria
--      parsear texto livre em SQL, que e a forma mais fragil possivel de
--      guardar numero.
--
-- SEM DEFAULT, e isso e deliberado. Linha antiga fica com NULL, e NULL aqui
-- significa "esta linha e anterior a esta coluna", nao "esta chamada nao teve
-- tentativa". Um `default '[]'::jsonb` apagaria essa distincao no ato: array
-- vazio e uma MEDICAO (o atalho sem IA de fato nao chama a OpenAI), e usa-lo
-- para ausencia de medicao e o colapso que o reader do lado do codigo existe
-- para impedir.
--
-- SEM INDICE, por ora. Nao ha consulta sobre esta coluna ainda; a superficie de
-- admin para o detalhe esta no backlog. Indice sem consulta e custo de escrita
-- em toda chamada de IA para nada.
--
-- ORDEM DE DEPLOY, obrigatoria: esta migration ANTES do backend. Backend antigo
-- contra banco novo e inofensivo (ele simplesmente nao escreve a coluna);
-- backend novo contra banco antigo FALHA no insert, porque o PostgREST recusa
-- coluna que nao existe. Nao ha codigo defensivo para coluna ausente de
-- proposito: a ordem e o contrato.

alter table public.ai_usage_logs
  add column if not exists attempt_details jsonb;

comment on column public.ai_usage_logs.attempt_details is
  'Array com o detalhe de cada tentativa da chamada (desfecho, tokens medidos ou estado nomeado, chars). NULL = linha anterior a esta coluna, e nao ausencia de tentativa.';
