-- Move o is_start do quadro BUG da etapa 'Sentry' para 'Bugs Reportados'.
--
-- O QUE ESTA ERRADO HOJE. O quadro BUG foi montado a mao pela interface e a
-- etapa 'Sentry' ficou com is_start = true. resolveDefaultColumn
-- (server/routes/adminTasks.ts) ordena por is_start desc, entao TODO card criado
-- sem column_id explicito nasce dentro da etapa que vai receber o feed
-- automatico do Sentry. Humano e robo escrevendo no mesmo balde.
--
-- POR QUE ISSO E PRE-REQUISITO E NAO ACABAMENTO. Duas decisoes do projeto se
-- apoiam na semantica "a etapa fixada contem apenas card que nunca foi triado":
-- o arquivamento automatico e o bloqueio de entrada manual. E a reabertura de
-- card regredido vai para a etapa is_start justamente para NAO poluir a etapa
-- fixada. Com o is_start no lugar errado, as tres regras se contradizem.
--
-- ALTERA DADO (dois booleanos de configuracao em duas linhas). Nao ha o que
-- perder: nenhuma linha de conteudo e tocada e o rollback e inverter os dois
-- valores. Aplicada fora da janela de migration destrutiva por decisao
-- registrada; o custo de errar aqui e reexecutar o update.
--
-- CASAMENTO POR NOME, E POR ISSO A ASSERCAO. Encontrar as etapas por name e um
-- casamento de padrao, e o CLAUDE.md documenta que instrumento com escopo
-- derivado por casamento falha PASSANDO: se alguem tiver renomeado 'Sentry' ou
-- 'Bugs Reportados' pela interface, os dois updates casariam ZERO linhas e a
-- migration terminaria com sucesso sobre um quadro inalterado. Por isso o bloco
-- final AFIRMA O RESULTADO (existe exatamente uma etapa is_start no quadro BUG,
-- e o nome dela e 'Bugs Reportados') e levanta excecao na divergencia, o que
-- desfaz a transacao inteira. Nomes conferidos contra o banco em 2026-07-31.

begin;

update public.admin_task_columns c
set is_start = false
from public.admin_task_boards b
where c.board_id = b.id
  and b.key = 'BUG'
  and c.name = 'Sentry'
  and c.is_start;

update public.admin_task_columns c
set is_start = true
from public.admin_task_boards b
where c.board_id = b.id
  and b.key = 'BUG'
  and c.name = 'Bugs Reportados'
  and not c.is_start;

-- Afirma o TOTAL, nao a pertinencia. "A etapa que eu queria esta marcada" passa
-- num quadro com tres etapas iniciais; "existe exatamente UMA e e esta" nao.
do $$
declare
  v_total integer;
  v_nome text;
begin
  select count(*) into v_total
  from public.admin_task_columns c
  join public.admin_task_boards b on b.id = c.board_id
  where b.key = 'BUG' and c.is_start;

  if v_total <> 1 then
    raise exception
      'quadro BUG deveria ter exatamente 1 etapa is_start, encontrou %', v_total;
  end if;

  select c.name into v_nome
  from public.admin_task_columns c
  join public.admin_task_boards b on b.id = c.board_id
  where b.key = 'BUG' and c.is_start;

  if v_nome <> 'Bugs Reportados' then
    raise exception
      'etapa inicial do quadro BUG deveria ser "Bugs Reportados", e "%"', v_nome;
  end if;
end $$;

commit;
