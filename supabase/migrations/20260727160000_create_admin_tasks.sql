-- Modulo Tarefas do admin (aba Tarefas): board Kanban interno para backlog,
-- features, melhorias e debito tecnico. Oito tabelas, todas com prefixo
-- admin_task*, no mesmo espirito de admin_bugs: dado de OPERACAO INTERNA, nunca
-- exposto ao usuario final.
--
-- Recorte em relacao ao bug tracker: aqui as colunas do board sao DADO
-- (admin_task_columns), nao um CHECK de status como em admin_bugs. O admin cria,
-- renomeia e reordena etapa sem migration. Em troca, "concluido" deixa de ser um
-- valor fixo e passa a ser a flag is_done da coluna de destino, que e o que
-- alimenta completed_at.
--
-- Ordenacao por posicao FRACIONARIA (double precision), nao por indice inteiro
-- sequencial: mover um card reescreve UMA linha, nao a coluna inteira. O calculo
-- do ponto medio e do rebalanceamento mora no server (server/routes/adminTasks.ts).
--
-- Migration puramente ADITIVA (cria tabelas novas e vazias, uma funcao e um
-- trigger). Isenta da janela de migration destrutiva: nao ha dado a perder e o
-- rollback e o drop do que acabou de ser criado.

begin;

-- ---------------------------------------------------------------------------
-- Boards
-- ---------------------------------------------------------------------------

create table if not exists public.admin_task_boards (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  -- Prefixo do ID curto do card (DEV-42). Maiusculo e unico no projeto inteiro,
  -- porque o ID curto e o que vai no deep link e no que a pessoa fala em voz
  -- alta; ambiguidade entre boards tornaria o link inutil.
  key text not null unique check (key ~ '^[A-Z][A-Z0-9]{1,9}$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (
    description is null or char_length(description) between 1 and 1000
  ),
  -- Cor de acento do board na UI. Hex de 6 digitos; a UI resolve com fallback
  -- neutro, entao valor desconhecido degrada em vez de quebrar.
  color text not null default '#FFB800' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position double precision not null default 1000,
  -- Proximo numero a distribuir para um card deste board. Incrementado pelo
  -- trigger de admin_tasks, nunca pela aplicacao.
  next_number integer not null default 1 check (next_number >= 1),
  archived_at timestamptz,
  -- NULLABLE, ao contrario de admin_bugs.created_by: o board semeado por esta
  -- migration nao tem autor humano. Board criado pela UI sempre grava
  -- req.user!.id.
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_task_boards_position_idx
  on public.admin_task_boards (position);
create index if not exists admin_task_boards_archived_at_idx
  on public.admin_task_boards (archived_at);

-- ---------------------------------------------------------------------------
-- Colunas (etapas)
-- ---------------------------------------------------------------------------

create table if not exists public.admin_task_columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null
    references public.admin_task_boards (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  color text not null default '#94A3B8' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position double precision not null,
  -- Limite de work in progress. Null = sem limite. O limite e AVISO visual, nao
  -- bloqueio: o server nao recusa a movimentacao, so a UI sinaliza o estouro.
  wip_limit integer check (wip_limit is null or wip_limit > 0),
  -- Coluna onde card novo nasce quando o cliente nao manda column_id. NAO ha
  -- unicidade: se houver mais de uma (ou nenhuma), o server cai na coluna de
  -- menor position. Ver resolveDefaultColumn em server/routes/adminTasks.ts.
  is_start boolean not null default false,
  -- Marca a etapa como terminal. Entrar em QUALQUER coluna is_done carimba
  -- completed_at; sair de todas elas limpa. Multiplas colunas terminais sao
  -- legitimas (ex: "Concluido" e "Cancelado"), por isso nao ha unicidade aqui.
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_task_columns_board_position_idx
  on public.admin_task_columns (board_id, position);

-- ---------------------------------------------------------------------------
-- Tarefas
-- ---------------------------------------------------------------------------

create table if not exists public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null
    references public.admin_task_boards (id) on delete cascade,
  -- RESTRICT de proposito: apagar uma etapa que ainda tem card e sempre erro de
  -- operacao, nunca intencao. A rota DELETE /columns/:id exige ?moveTo= para
  -- esvaziar antes.
  column_id uuid not null
    references public.admin_task_columns (id) on delete restrict,
  -- ID curto do card dentro do board (o 42 de DEV-42). Atribuido pelo trigger
  -- assign_admin_task_number, nunca pelo cliente.
  number integer not null check (number >= 1),
  title text not null check (char_length(title) between 1 and 200),
  -- Markdown puro (react-markdown + remark-gfm renderizam no front). Texto, nao
  -- HTML nem JSON: mantem a busca por descricao trivial no filtro do board.
  description text check (
    description is null or char_length(description) between 1 and 20000
  ),
  -- Campo SEPARADO da descricao de proposito: rascunho/contexto operacional que
  -- nao e a especificacao do card. Tambem markdown.
  notes text check (
    notes is null or char_length(notes) between 1 and 20000
  ),
  position double precision not null,
  priority text not null default 'media'
    check (priority in ('baixa', 'media', 'alta', 'urgente')),
  type text not null default 'tarefa'
    check (type in ('feature', 'bug', 'melhoria', 'debito_tecnico', 'tarefa')),
  assignee_id uuid references auth.users (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete restrict,
  updated_by uuid references auth.users (id) on delete set null,
  due_date date,
  -- Estimativa livre em horas. Numeric para aceitar meia hora.
  estimate numeric check (estimate is null or estimate > 0),
  -- Derivado da flag is_done da coluna, imposto pelo server. Nunca aceito do
  -- client, mesmo contrato do resolved_at em admin_bugs.
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_tasks_board_number_key unique (board_id, number)
);

create index if not exists admin_tasks_board_id_idx
  on public.admin_tasks (board_id);
create index if not exists admin_tasks_column_position_idx
  on public.admin_tasks (column_id, position);
create index if not exists admin_tasks_assignee_id_idx
  on public.admin_tasks (assignee_id);
create index if not exists admin_tasks_archived_at_idx
  on public.admin_tasks (archived_at);
create index if not exists admin_tasks_due_date_idx
  on public.admin_tasks (due_date);

-- Distribuicao do ID curto. BEFORE INSERT e nao RPC: o UPDATE ... RETURNING
-- pega lock da linha do board dentro da MESMA transacao do insert, entao dois
-- inserts concorrentes serializam e nenhum recebe o mesmo numero. Sendo trigger,
-- vale tambem para insert feito fora da rota (script, SQL editor), que uma RPC
-- so protegeria se alguem lembrasse de chama-la.
--
-- O numero e SEMPRE atribuido aqui: valor vindo no insert e ignorado.
--
-- Consequencia aceita: insert que falha DEPOIS do trigger (constraint violada,
-- rollback) queima o numero e deixa buraco na sequencia, exatamente como uma
-- sequence do Postgres. Numeracao de card e identidade, nao contagem.
create or replace function public.assign_admin_task_number()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  update public.admin_task_boards
  set next_number = next_number + 1
  where id = new.board_id
  returning next_number - 1 into new.number;

  if new.number is null then
    raise exception 'board % nao existe', new.board_id;
  end if;

  return new;
end;
$$;

drop trigger if exists admin_tasks_assign_number on public.admin_tasks;
create trigger admin_tasks_assign_number
  before insert on public.admin_tasks
  for each row execute function public.assign_admin_task_number();

-- ---------------------------------------------------------------------------
-- Etiquetas
-- ---------------------------------------------------------------------------

create table if not exists public.admin_task_labels (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null
    references public.admin_task_boards (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color text not null default '#C4B5FD' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unico por nome case-insensitive: a criacao inline no modal digita o nome, e
-- "Frontend" e "frontend" seriam a mesma etiqueta para quem esta olhando.
create unique index if not exists admin_task_labels_board_name_key
  on public.admin_task_labels (board_id, lower(name));

create table if not exists public.admin_task_label_links (
  task_id uuid not null references public.admin_tasks (id) on delete cascade,
  label_id uuid not null
    references public.admin_task_labels (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, label_id)
);

create index if not exists admin_task_label_links_label_id_idx
  on public.admin_task_label_links (label_id);

-- ---------------------------------------------------------------------------
-- Comentarios
-- ---------------------------------------------------------------------------

create table if not exists public.admin_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.admin_tasks (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete restrict,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_task_comments_task_created_idx
  on public.admin_task_comments (task_id, created_at);

-- ---------------------------------------------------------------------------
-- Checklist
-- ---------------------------------------------------------------------------

create table if not exists public.admin_task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.admin_tasks (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  is_done boolean not null default false,
  position double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_task_checklist_task_position_idx
  on public.admin_task_checklist_items (task_id, position);

-- ---------------------------------------------------------------------------
-- Log de atividade
-- ---------------------------------------------------------------------------

create table if not exists public.admin_task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.admin_tasks (id) on delete cascade,
  -- Nullable: sobra o registro quando a conta do autor e removida, e abre espaco
  -- para evento de origem automatica no futuro.
  actor_id uuid references auth.users (id) on delete set null,
  -- Lista fechada por CHECK, no padrao de status/severity de admin_bugs. Ampliar
  -- e ato deliberado numa migration. O front resolve o rotulo por mapa COM
  -- fallback neutro (regra de lookup por valor do servidor no CLAUDE.md), entao
  -- um valor que o bundle antigo nao conhece degrada em vez de derrubar a aba.
  action text not null check (
    action in (
      'created', 'moved', 'renamed', 'assigned', 'unassigned',
      'priority_changed', 'type_changed', 'due_date_changed',
      'label_added', 'label_removed', 'archived', 'unarchived',
      'completed', 'reopened'
    )
  ),
  -- { from, to } com o que mudou. Jsonb porque o formato varia por action e o
  -- log e lido inteiro, nunca filtrado por dentro do payload.
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_task_activity_task_created_idx
  on public.admin_task_activity (task_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at automatico (reusa public.set_updated_at de remote_schema)
-- ---------------------------------------------------------------------------

drop trigger if exists admin_task_boards_set_updated_at on public.admin_task_boards;
create trigger admin_task_boards_set_updated_at
  before update on public.admin_task_boards
  for each row execute function public.set_updated_at();

drop trigger if exists admin_task_columns_set_updated_at on public.admin_task_columns;
create trigger admin_task_columns_set_updated_at
  before update on public.admin_task_columns
  for each row execute function public.set_updated_at();

drop trigger if exists admin_tasks_set_updated_at on public.admin_tasks;
create trigger admin_tasks_set_updated_at
  before update on public.admin_tasks
  for each row execute function public.set_updated_at();

drop trigger if exists admin_task_labels_set_updated_at on public.admin_task_labels;
create trigger admin_task_labels_set_updated_at
  before update on public.admin_task_labels
  for each row execute function public.set_updated_at();

drop trigger if exists admin_task_comments_set_updated_at on public.admin_task_comments;
create trigger admin_task_comments_set_updated_at
  before update on public.admin_task_comments
  for each row execute function public.set_updated_at();

drop trigger if exists admin_task_checklist_set_updated_at on public.admin_task_checklist_items;
create trigger admin_task_checklist_set_updated_at
  before update on public.admin_task_checklist_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- SEM policies de proposito, mesmo desenho de admin_bugs e notifications: todo
-- acesso passa pelo server (service role, que faz bypass de RLS) atras de
-- requireAuth + requireAdmin. Expor select direto ao client vazaria roadmap
-- interno, prioridade e discussao de time para qualquer usuario autenticado.
--
-- O REVOKE e camada SEPARADA da RLS, nao redundancia: RLS sem policy nega
-- LINHA, o REVOKE nega o ACESSO A TABELA. A auditoria ja confundiu as duas uma
-- vez (35 tabelas reportadas como cobertas por policy quando estavam cobertas
-- por privilegio), entao aqui as duas sao explicitas.

alter table public.admin_task_boards enable row level security;
alter table public.admin_task_columns enable row level security;
alter table public.admin_tasks enable row level security;
alter table public.admin_task_labels enable row level security;
alter table public.admin_task_label_links enable row level security;
alter table public.admin_task_comments enable row level security;
alter table public.admin_task_checklist_items enable row level security;
alter table public.admin_task_activity enable row level security;

revoke all on table public.admin_task_boards from public, anon, authenticated;
revoke all on table public.admin_task_columns from public, anon, authenticated;
revoke all on table public.admin_tasks from public, anon, authenticated;
revoke all on table public.admin_task_labels from public, anon, authenticated;
revoke all on table public.admin_task_label_links from public, anon, authenticated;
revoke all on table public.admin_task_comments from public, anon, authenticated;
revoke all on table public.admin_task_checklist_items from public, anon, authenticated;
revoke all on table public.admin_task_activity from public, anon, authenticated;

revoke all on function public.assign_admin_task_number() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Seed: board Desenvolvimento
-- ---------------------------------------------------------------------------
-- Idempotente em tres niveis, cada um com sua condicao propria:
--   board  -> on conflict (key) do nothing;
--   etapas -> so semeia se o board estiver SEM nenhuma etapa (nao ha unicidade
--             por nome em admin_task_columns, e inventar uma so para servir de
--             alvo de conflito restringiria o produto por causa do seed);
--   labels -> on conflict no indice unico (board_id, lower(name)).
-- Reexecutar a migration nao duplica nada e nao desfaz renomeacao feita na UI.

insert into public.admin_task_boards (name, key, slug, description, color, position)
values (
  'Desenvolvimento',
  'DEV',
  'desenvolvimento',
  'Backlog, features, melhorias e debito tecnico da plataforma.',
  '#FFB800',
  1000
)
on conflict (key) do nothing;

insert into public.admin_task_columns (board_id, name, color, position, is_start, is_done)
select
  b.id,
  etapa.name,
  etapa.color,
  etapa.position,
  etapa.is_start,
  etapa.is_done
from public.admin_task_boards b
cross join (
  values
    ('Backlog',      '#94A3B8', 1000::double precision, true,  false),
    ('A Fazer',      '#38BDF8', 2000::double precision, false, false),
    ('Em Progresso', '#FFB800', 3000::double precision, false, false),
    ('Em Revisao',   '#C4B5FD', 4000::double precision, false, false),
    ('Concluido',    '#34D399', 5000::double precision, false, true)
) as etapa(name, color, position, is_start, is_done)
where b.key = 'DEV'
  and not exists (
    select 1 from public.admin_task_columns c where c.board_id = b.id
  );

insert into public.admin_task_labels (board_id, name, color)
select b.id, etiqueta.name, etiqueta.color
from public.admin_task_boards b
cross join (
  values
    ('Frontend', '#38BDF8'),
    ('Backend',  '#34D399'),
    ('Banco',    '#F59E0B'),
    ('UI/UX',    '#C4B5FD'),
    ('Urgente',  '#F43F5E'),
    ('Infra',    '#64748B')
) as etiqueta(name, color)
where b.key = 'DEV'
on conflict do nothing;

commit;
