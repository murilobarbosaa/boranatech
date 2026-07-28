-- Criacao de quadro do modulo Tarefas numa unica transacao.
--
-- Antes disto o POST /crm/boards fazia quatro idas ao PostgREST (ler a maior
-- position, inserir o quadro, inserir as etiquetas, inserir as etapas), cada uma
-- com o proprio round trip contra o Supabase. Duas consequencias:
--
--   1. lento o bastante para a pessoa ver o intervalo;
--   2. sem transacao, uma falha no meio deixava um quadro DE PE E VAZIO, sem
--      etapa nenhuma. O modulo tem resgate para esse estado (o botao "Criar
--      primeira etapa"), e o resgate continua existindo como rede, mas o caminho
--      que levava a ele deixa de existir aqui.
--
-- Migration puramente ADITIVA: cria uma funcao, nao toca em dado. Isenta da
-- janela de migration destrutiva.

begin;

-- As etapas e etiquetas padrao sao os MESMOS valores de
-- shared/tasks/boardDefaults.ts (fonte unica declarada) e do bloco de seed da
-- migration 20260727160000. Esta e a terceira copia, e ela nao pode importar TS.
-- A paridade e travada por teste: shared/tasks/boardDefaults.test.ts le ESTE
-- arquivo e o da criacao, compara com o TS e afirma os totais (5 e 6), entao um
-- regex que encolher derruba o teste em vez de passar em silencio.
create or replace function public.create_admin_task_board(
  p_name text,
  p_key text,
  p_slug text,
  p_color text,
  p_created_by uuid
)
  returns public.admin_task_boards
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  v_board public.admin_task_boards;
begin
  -- position explicita e deterministica: sempre no fim, com passo de 1000. Sem
  -- isto o quadro novo aparece em ponto imprevisivel da lista, que era a segunda
  -- hipotese investigada para o "sumiu do seletor".
  insert into public.admin_task_boards (name, key, slug, color, position, created_by)
  values (
    p_name,
    p_key,
    p_slug,
    coalesce(p_color, '#FFB800'),
    coalesce((select max(position) from public.admin_task_boards), 0) + 1000,
    p_created_by
  )
  returning * into v_board;

  insert into public.admin_task_columns (board_id, name, color, position, is_start, is_done)
  values
    (v_board.id, 'Backlog',      '#94A3B8', 1000, true,  false),
    (v_board.id, 'A Fazer',      '#38BDF8', 2000, false, false),
    (v_board.id, 'Em Progresso', '#FFB800', 3000, false, false),
    (v_board.id, 'Em Revisao',   '#C4B5FD', 4000, false, false),
    (v_board.id, 'Concluido',    '#34D399', 5000, false, true);

  insert into public.admin_task_labels (board_id, name, color)
  values
    (v_board.id, 'Frontend', '#38BDF8'),
    (v_board.id, 'Backend',  '#34D399'),
    (v_board.id, 'Banco',    '#F59E0B'),
    (v_board.id, 'UI/UX',    '#C4B5FD'),
    (v_board.id, 'Urgente',  '#F43F5E'),
    (v_board.id, 'Infra',    '#64748B');

  return v_board;
end;
$$;

-- Mesma postura das demais funcoes desta base (ver increment_coupon_redemption,
-- reserve_ai_usage_slot): revoga de todo mundo e concede SO ao service_role, que
-- e quem o server usa atras de requireAuth + requireAdmin.
--
-- O GRANT nao e opcional: sem ele o revoke tira tambem o acesso do service_role
-- e a rota passa a receber 401 do PostgREST. Verificado no harness: sem o grant,
-- a chamada devolve 401; com ele, 200.
revoke all on function public.create_admin_task_board(text, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.create_admin_task_board(text, text, text, text, uuid)
  to service_role;

commit;
