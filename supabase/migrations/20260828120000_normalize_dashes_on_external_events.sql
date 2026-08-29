-- Normaliza travessao (U+2014) e meia-risca (U+2013) para hifen comum nos
-- campos de texto de public.external_events, na ESCRITA.
--
-- POR QUE NO BANCO E NAO NA ROTINA. As linhas chegam de uma rotina agendada
-- externa (coleta diaria de eventos), que nao vive neste repositorio: nao ha
-- onde colocar a normalizacao no caminho de escrita sem depender de alguem
-- alterar aquele codigo e lembrar de manter. O trigger cobre TODO caminho de
-- escrita por construcao, inclusive o CRUD do admin, a rotina e um UPDATE
-- manual no SQL Editor, e cobre os que ainda nao existem. E a mesma escolha do
-- `logAiUsage`: guarda dentro da funcao, nunca no call site.
--
-- ESTA MIGRATION E ADITIVA e portanto ISENTA da janela de migration destrutiva:
-- cria uma funcao e um trigger, e nao toca em nenhuma linha ja gravada. A
-- limpeza das linhas que JA estao no banco com os caracteres antigos e outro
-- artefato, claude/produto/06-janela-normalizacao-e-dedup.sql, que altera dado
-- e por isso roda na janela de 05h as 09h.
--
-- OS CARACTERES SAO ESCRITOS COMO chr(8211) E chr(8212), NUNCA LITERAIS. Um
-- arquivo cuja finalidade e remover esses dois caracteres nao pode conte-los:
-- o proprio scanner que verifica a base ficaria com um falso positivo
-- permanente aqui, e falso positivo em guard e o comeco de alguem desligar o
-- guard.
--
-- `translate` e nao dois `replace` aninhados: ele mapeia caractere a caractere,
-- entao a origem tem dois caracteres e o destino tem dois hifens, uma passada
-- so. Coluna nula continua nula (translate de NULL e NULL), que e o desejado:
-- normalizar nao pode inventar string vazia onde nao havia texto.

-- O DESTINO DO translate E chr(45) || chr(45), E NAO A STRING '- -' SEM ESPACO.
-- Motivo medido em 2026-08-28: aquela string, dentro de um arquivo .sql, e um
-- campo minado para qualquer leitor que remova comentario por "corta do tracinho
-- duplo ate o fim da linha". Um validador escrito nesta propria sessao fez
-- exatamente isso, comeu a aspa de fechamento e reportou erro de sintaxe num SQL
-- correto. O Postgres le certo, mas ferramenta ingenua no meio do caminho nao, e
-- o custo de nao depender disso e um `chr()`.
create or replace function public.external_events_normaliza_travessao()
returns trigger
language plpgsql
as $function$
begin
  new.title          := translate(new.title,          chr(8211) || chr(8212), chr(45) || chr(45));
  new.description    := translate(new.description,    chr(8211) || chr(8212), chr(45) || chr(45));
  new.date_label     := translate(new.date_label,     chr(8211) || chr(8212), chr(45) || chr(45));
  new.location_label := translate(new.location_label, chr(8211) || chr(8212), chr(45) || chr(45));
  new.organizer      := translate(new.organizer,      chr(8211) || chr(8212), chr(45) || chr(45));
  return new;
end $function$;

-- Nome PROPRIO, sem colidir com os dois triggers que a tabela ja tem
-- (external_events_no_delete, que bloqueia DELETE, e external_events_touch, que
-- carimba updated_at). Os triggers BEFORE do Postgres rodam em ordem
-- alfabetica do nome, entao este roda antes do _touch; os dois devolvem NEW e
-- nao disputam campo nenhum.
drop trigger if exists external_events_normaliza_travessao on public.external_events;
create trigger external_events_normaliza_travessao
  before insert or update on public.external_events
  for each row execute function public.external_events_normaliza_travessao();
