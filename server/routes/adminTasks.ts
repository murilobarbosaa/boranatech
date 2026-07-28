import { Router } from "express";
import { z } from "zod";

import {
  positionBetween,
  rebalancePositions,
  POSITION_STEP,
} from "../lib/adminTaskPosition";
import { paginateRange } from "../lib/paginate";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";

// Aba Tarefas do admin: board Kanban interno (backlog, features, melhorias,
// debito tecnico). Sub-montado em admin.ts DEPOIS de requireAuth +
// requireAdmin; nenhum guard local, mesmo desenho de adminBugs.ts.
//
// Tres invariantes que o server IMPOE e nunca aceita do cliente:
//   1. autoria (created_by, updated_by, author_id, actor_id) vem de req.user;
//   2. completed_at e derivado da flag is_done da coluna de destino;
//   3. position e calculada aqui a partir dos vizinhos que o cliente aponta por
//      id, nunca enviada como numero. O cliente diz ONDE soltou, nao QUANTO
//      vale.
//
// O numero do card (o 42 de DEV-42) nao aparece em lugar nenhum deste arquivo:
// quem atribui e o trigger admin_tasks_assign_number, no banco.

const router = Router();

const PRIORITIES = ["baixa", "media", "alta", "urgente"] as const;
const TASK_TYPES = [
  "feature",
  "bug",
  "melhoria",
  "debito_tecnico",
  "tarefa",
] as const;

// Espelha o CHECK de admin_task_activity.action. Alterar aqui sem alterar a
// migration (ou o contrario) faz o insert do log estourar; os dois andam juntos.
type ActivityAction =
  | "created"
  | "moved"
  | "renamed"
  | "assigned"
  | "unassigned"
  | "priority_changed"
  | "type_changed"
  | "due_date_changed"
  | "label_added"
  | "label_removed"
  | "archived"
  | "unarchived"
  | "completed"
  | "reopened";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const BOARD_KEY = /^[A-Z][A-Z0-9]{1,9}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Data pura (a coluna e `date`, nao timestamptz): o vencimento e um DIA, e
// converter para instante introduziria fuso onde nao existe fuso.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Tipos de linha
// ---------------------------------------------------------------------------

type BoardRow = {
  id: string;
  name: string;
  key: string;
  slug: string;
  description: string | null;
  color: string;
  position: number;
  next_number: number;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type ColumnRow = {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: number;
  wip_limit: number | null;
  is_start: boolean;
  is_done: boolean;
  created_at: string;
  updated_at: string;
};

type TaskRow = {
  id: string;
  board_id: string;
  column_id: string;
  number: number;
  title: string;
  description: string | null;
  notes: string | null;
  position: number;
  priority: (typeof PRIORITIES)[number];
  type: (typeof TASK_TYPES)[number];
  assignee_id: string | null;
  created_by: string;
  updated_by: string | null;
  due_date: string | null;
  estimate: number | null;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type LabelRow = {
  id: string;
  board_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

type CommentRow = {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

type ChecklistRow = {
  id: string;
  task_id: string;
  content: string;
  is_done: boolean;
  position: number;
  created_at: string;
  updated_at: string;
};

type ActivityRow = {
  id: string;
  task_id: string;
  actor_id: string | null;
  action: ActivityAction;
  payload: Record<string, unknown>;
  created_at: string;
};

const BOARD_COLUMNS =
  "id, name, key, slug, description, color, position, next_number, archived_at, created_by, created_at, updated_at";
const COLUMN_COLUMNS =
  "id, board_id, name, color, position, wip_limit, is_start, is_done, created_at, updated_at";
const TASK_COLUMNS =
  "id, board_id, column_id, number, title, description, notes, position, priority, type, assignee_id, created_by, updated_by, due_date, estimate, completed_at, archived_at, created_at, updated_at";
const LABEL_COLUMNS = "id, board_id, name, color, created_at, updated_at";
const COMMENT_COLUMNS =
  "id, task_id, author_id, body, created_at, updated_at";
const CHECKLIST_COLUMNS =
  "id, task_id, content, is_done, position, created_at, updated_at";
const ACTIVITY_COLUMNS = "id, task_id, actor_id, action, payload, created_at";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const uuid = z.string().uuid();
const hexColor = z
  .string()
  .trim()
  .regex(HEX_COLOR, "Cor inválida (use #RRGGBB).");
const dateOnly = z
  .string()
  .trim()
  .regex(DATE_ONLY, "Data inválida (use AAAA-MM-DD).");

const CreateBoardSchema = z.object({
  name: z.string().trim().min(1).max(80),
  key: z.string().trim().regex(BOARD_KEY, "Chave inválida (ex: DEV)."),
  slug: z.string().trim().regex(SLUG, "Slug inválido."),
  description: z.string().trim().min(1).max(1000).nullable().optional(),
  color: hexColor.optional(),
});

// `key` e `slug` NAO entram: o ID curto (DEV-42) vai em deep link e em conversa,
// entao renomear a chave quebraria links ja compartilhados de forma invisivel.
// Trocar de chave e criar outro board.
const PatchBoardSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().min(1).max(1000).nullable().optional(),
    color: hexColor.optional(),
    archived: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar.",
  });

const CreateColumnSchema = z.object({
  board_id: uuid,
  name: z.string().trim().min(1).max(60),
  color: hexColor.optional(),
  wip_limit: z.number().int().positive().nullable().optional(),
  is_start: z.boolean().optional(),
  is_done: z.boolean().optional(),
});

const PatchColumnSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    color: hexColor.optional(),
    wip_limit: z.number().int().positive().nullable().optional(),
    is_start: z.boolean().optional(),
    is_done: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar.",
  });

const ReorderSchema = z.object({
  board_id: uuid,
  // Ordem COMPLETA e desejada. Reordenacao nao e "mova este para o indice N":
  // o cliente manda a lista inteira e o server reescreve as posicoes, o que
  // torna a operacao idempotente e imune a divergencia de indice.
  ids: z.array(uuid).min(1).max(100),
});

const CreateTaskSchema = z.object({
  board_id: uuid,
  // Ausente = coluna inicial do board (is_start, ou a de menor posicao).
  column_id: uuid.optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20000).nullable().optional(),
  notes: z.string().trim().min(1).max(20000).nullable().optional(),
  priority: z.enum(PRIORITIES).optional(),
  type: z.enum(TASK_TYPES).optional(),
  assignee_id: uuid.nullable().optional(),
  due_date: dateOnly.nullable().optional(),
  estimate: z.number().positive().nullable().optional(),
  // Onde entrar na coluna. Ausente = fim.
  before_task_id: uuid.nullable().optional(),
  after_task_id: uuid.nullable().optional(),
});

const PatchTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(20000).nullable().optional(),
    notes: z.string().trim().max(20000).nullable().optional(),
    priority: z.enum(PRIORITIES).optional(),
    type: z.enum(TASK_TYPES).optional(),
    assignee_id: uuid.nullable().optional(),
    due_date: dateOnly.nullable().optional(),
    estimate: z.number().positive().nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar.",
  });

const MoveTaskSchema = z.object({
  column_id: uuid,
  before_task_id: uuid.nullable().optional(),
  after_task_id: uuid.nullable().optional(),
});

const CreateLabelSchema = z.object({
  board_id: uuid,
  name: z.string().trim().min(1).max(40),
  color: hexColor.optional(),
});

const PatchLabelSchema = z
  .object({
    name: z.string().trim().min(1).max(40).optional(),
    color: hexColor.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar.",
  });

const AttachLabelSchema = z.object({ label_id: uuid });

const CommentSchema = z.object({
  body: z.string().trim().min(1).max(10000),
});

const CreateChecklistSchema = z.object({
  content: z.string().trim().min(1).max(500),
});

const PatchChecklistSchema = z
  .object({
    content: z.string().trim().min(1).max(500).optional(),
    is_done: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nenhum campo para atualizar.",
  });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function invalid(message: string | undefined, fallback: string) {
  return createError(400, "invalid_request", message ?? fallback);
}

function parseId(value: string) {
  return uuid.safeParse(value);
}

/**
 * Grava uma linha no log de atividade.
 *
 * Best-effort deliberado: o supabase-js nao expoe transacao, entao a mutacao
 * principal ja foi confirmada quando chegamos aqui. Falhar a resposta agora
 * mentiria para o cliente ("nao salvou") sobre uma escrita que salvou. Perder
 * uma linha de log e o dano menor, e ele vai para o console.error.
 *
 * A guarda de autoria mora DENTRO: actorId sempre vem do chamador com
 * req.user.id, e nao ha caminho que aceite ator vindo do body.
 */
async function logActivity(
  taskId: string,
  actorId: string | null,
  action: ActivityAction,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabaseAdmin.from("admin_task_activity").insert({
    task_id: taskId,
    actor_id: actorId,
    action,
    payload,
  });
  if (error) {
    console.error(
      `[admin-tasks] Falha ao registrar atividade ${action} da task ${taskId}:`,
      error,
    );
  }
}

/** Coluna onde um card novo nasce: a is_start, ou a de menor posicao. */
async function resolveDefaultColumn(boardId: string): Promise<ColumnRow | null> {
  const { data, error } = await supabaseAdmin
    .from("admin_task_columns")
    .select(COLUMN_COLUMNS)
    .eq("board_id", boardId)
    .order("is_start", { ascending: false })
    .order("position", { ascending: true })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0] as ColumnRow;
}

/**
 * Reescreve as posicoes de uma colecao em espacamento inteiro.
 * Usada tanto pelo rebalanceamento quanto pelas rotas de reordenacao.
 */
async function writePositions(
  table:
    | "admin_tasks"
    | "admin_task_columns"
    | "admin_task_checklist_items"
    | "admin_task_boards",
  orderedIds: string[],
): Promise<{ error: string | null }> {
  const positions = rebalancePositions(orderedIds.length);
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabaseAdmin
        .from(table)
        .update({ position: positions[index] })
        .eq("id", id),
    ),
  );
  const failed = results.find((result) => result.error);
  return { error: failed?.error?.message ?? null };
}

/**
 * Posicao para um card dentro de `columnId`, entre os vizinhos apontados.
 *
 * SEMANTICA DOS VIZINHOS, em relacao a ORDEM VISUAL depois do movimento (este e
 * o par de nomes que todo mundo troca, entao fica explicito):
 *
 *   beforeTaskId = o card que fica ACIMA do card movido. "before" = vem antes na
 *                  tela. null = o card movido vai para o TOPO da coluna.
 *   afterTaskId  = o card que fica ABAIXO do card movido. "after" = vem depois
 *                  na tela. null = o card movido vai para o FIM da coluna.
 *
 * Os dois nulos significam coluna vazia (ou "solte no fim", que da no mesmo
 * quando nao ha vizinho de baixo). NAO sao "o card que estava antes de mover":
 * a referencia e sempre o estado FINAL desejado.
 *
 * Quando o intervalo entre os vizinhos acabou (positionBetween devolve
 * "rebalance"), a coluna INTEIRA e reescrita em espacamento inteiro e o calculo
 * refeito sobre as posicoes novas. O rebalanceamento acontece aqui dentro,
 * nunca no chamador: e o unico jeito de nao existir rota que esqueca dele.
 */
async function resolveTaskPosition(
  columnId: string,
  beforeTaskId: string | null,
  afterTaskId: string | null,
): Promise<{ position: number } | { failure: string }> {
  const readNeighbour = async (id: string | null) => {
    if (!id) return null;
    const { data } = await supabaseAdmin
      .from("admin_tasks")
      .select("id, position, column_id")
      .eq("id", id)
      .maybeSingle();
    // Vizinho que nao existe mais, ou que ja saiu desta coluna, e tratado como
    // ausente: o card cai na ponta correspondente em vez de derrubar a operacao
    // por causa de um board desatualizado na tela de quem arrastou.
    if (!data || data.column_id !== columnId) return null;
    return data.position as number;
  };

  let before = await readNeighbour(beforeTaskId);
  let after = await readNeighbour(afterTaskId);
  let result = positionBetween(before, after);

  if (result.kind === "rebalance") {
    const { data, error } = await supabaseAdmin
      .from("admin_tasks")
      .select("id")
      .eq("column_id", columnId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return { failure: error.message };
    const ids = (data ?? []).map((row) => row.id as string);
    const written = await writePositions("admin_tasks", ids);
    if (written.error) return { failure: written.error };

    before = await readNeighbour(beforeTaskId);
    after = await readNeighbour(afterTaskId);
    result = positionBetween(before, after);
    if (result.kind === "rebalance") {
      // Depois de reescrever em passos de POSITION_STEP nao existe intervalo
      // apertado. Chegar aqui e defeito de logica, nao estado possivel.
      return { failure: "rebalanceamento nao liberou espaco" };
    }
  }

  return { position: result.position };
}

/** Posicao no fim de uma colecao ordenada (maior posicao + passo). */
async function nextPositionAtEnd(
  table: "admin_task_columns" | "admin_task_checklist_items" | "admin_task_boards",
  filterColumn: "board_id" | "task_id" | null,
  filterValue: string | null,
): Promise<number> {
  let query = supabaseAdmin
    .from(table)
    .select("position")
    .order("position", { ascending: false })
    .limit(1);
  if (filterColumn && filterValue) query = query.eq(filterColumn, filterValue);
  const { data } = await query;
  const highest = data && data.length > 0 ? (data[0].position as number) : null;
  return highest === null ? POSITION_STEP : highest + POSITION_STEP;
}

async function fetchTask(id: string): Promise<TaskRow | null> {
  const { data } = await supabaseAdmin
    .from("admin_tasks")
    .select(TASK_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as TaskRow | null) ?? null;
}

async function fetchColumn(id: string): Promise<ColumnRow | null> {
  const { data } = await supabaseAdmin
    .from("admin_task_columns")
    .select(COLUMN_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as ColumnRow | null) ?? null;
}

/**
 * Administradores elegiveis como responsavel, com o que a UI precisa para o
 * avatar. Fonte: admin_roles (a MESMA tabela que is_user_admin consulta), com
 * profiles so para nome, email e imagem.
 */
async function listAdmins(): Promise<
  Array<{ user_id: string; name: string | null; email: string | null; avatar_url: string | null }>
> {
  const { data: roles, error } = await supabaseAdmin
    .from("admin_roles")
    .select("user_id");
  if (error || !roles) return [];
  const userIds = Array.from(new Set(roles.map((row) => row.user_id as string)));
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("user_id, name, email, avatar_url")
    .in("user_id", userIds);
  const byUser = new Map(
    (profiles ?? []).map((row) => [row.user_id as string, row]),
  );

  return userIds.map((userId) => {
    const profile = byUser.get(userId);
    return {
      user_id: userId,
      name: (profile?.name as string | null) ?? null,
      email: (profile?.email as string | null) ?? null,
      avatar_url: (profile?.avatar_url as string | null) ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------------

router.get("/boards", async (req, res, next) => {
  const includeArchived = req.query.includeArchived === "1";
  let query = supabaseAdmin
    .from("admin_task_boards")
    .select(BOARD_COLUMNS)
    .order("position", { ascending: true });
  if (!includeArchived) query = query.is("archived_at", null);

  const { data, error } = await query;
  if (error) {
    console.error("[admin-tasks] Falha ao listar boards:", error);
    return next(createError(500, "db_error", "Erro ao listar quadros."));
  }
  res.json({ boards: (data ?? []) as BoardRow[] });
});

router.post("/boards", async (req, res, next) => {
  const parsed = CreateBoardSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const position = await nextPositionAtEnd("admin_task_boards", null, null);
  const { data, error } = await supabaseAdmin
    .from("admin_task_boards")
    .insert({
      name: parsed.data.name,
      key: parsed.data.key,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      color: parsed.data.color ?? "#FFB800",
      position,
      created_by: req.user!.id,
    })
    .select(BOARD_COLUMNS)
    .single();

  if (error?.code === "23505") {
    return next(
      createError(409, "duplicate_board", "Já existe um quadro com essa chave ou slug."),
    );
  }
  if (error || !data) {
    console.error("[admin-tasks] Falha ao criar board:", error);
    return next(createError(500, "db_error", "Erro ao criar quadro."));
  }
  res.status(201).json(data as BoardRow);
});

router.patch("/boards/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Quadro não encontrado."));
  }
  const parsed = PatchBoardSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const { archived, ...fields } = parsed.data;
  const update: Record<string, unknown> = { ...fields };
  if (archived !== undefined) {
    update.archived_at = archived ? new Date().toISOString() : null;
  }

  const { data, error } = await supabaseAdmin
    .from("admin_task_boards")
    .update(update)
    .eq("id", id.data)
    .select(BOARD_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("[admin-tasks] Falha ao atualizar board:", error);
    return next(createError(500, "db_error", "Erro ao atualizar quadro."));
  }
  if (!data) return next(createError(404, "not_found", "Quadro não encontrado."));
  res.json(data as BoardRow);
});

router.delete("/boards/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Quadro não encontrado."));
  }

  // O cascade de admin_task_boards leva colunas, tarefas, etiquetas,
  // comentarios, checklist e log junto. Destrutivo e irreversivel: a confirmacao
  // e responsabilidade da UI, aqui so executa.
  const { data, error } = await supabaseAdmin
    .from("admin_task_boards")
    .delete()
    .eq("id", id.data)
    .select("id");

  if (error) {
    console.error("[admin-tasks] Falha ao excluir board:", error);
    return next(createError(500, "db_error", "Erro ao excluir quadro."));
  }
  if (!data || data.length === 0) {
    return next(createError(404, "not_found", "Quadro não encontrado."));
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Snapshot: o payload UNICO que a tela carrega
// ---------------------------------------------------------------------------

router.get("/boards/:id/snapshot", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Quadro não encontrado."));
  }
  const includeArchived = req.query.includeArchived === "1";

  const { data: board, error: boardError } = await supabaseAdmin
    .from("admin_task_boards")
    .select(BOARD_COLUMNS)
    .eq("id", id.data)
    .maybeSingle();
  if (boardError) {
    console.error("[admin-tasks] Falha ao ler board:", boardError);
    return next(createError(500, "db_error", "Erro ao carregar o quadro."));
  }
  if (!board) return next(createError(404, "not_found", "Quadro não encontrado."));

  try {
    const [columnsResult, labelsResult, admins] = await Promise.all([
      supabaseAdmin
        .from("admin_task_columns")
        .select(COLUMN_COLUMNS)
        .eq("board_id", id.data)
        .order("position", { ascending: true }),
      supabaseAdmin
        .from("admin_task_labels")
        .select(LABEL_COLUMNS)
        .eq("board_id", id.data)
        .order("name", { ascending: true }),
      listAdmins(),
    ]);
    if (columnsResult.error) throw new Error(columnsResult.error.message);
    if (labelsResult.error) throw new Error(labelsResult.error.message);

    // Varredura paginada (paginateRange) em vez de um select solto: o PostgREST
    // capa em db-max-rows e um board grande voltaria truncado SEM erro, que e
    // exatamente o modo de falha que este projeto ja pagou caro.
    const tasks: TaskRow[] = [];
    for await (const row of paginateRange<TaskRow>(
      (from, to) => {
        let query = supabaseAdmin
          .from("admin_tasks")
          .select(TASK_COLUMNS)
          .eq("board_id", id.data)
          .order("position", { ascending: true })
          .order("created_at", { ascending: true })
          .range(from, to);
        if (!includeArchived) query = query.is("archived_at", null);
        return query;
      },
      { errorLabel: "tarefas do quadro" },
    )) {
      tasks.push(row);
    }

    const taskIds = tasks.map((task) => task.id);
    const labelsByTask = new Map<string, string[]>();
    const checklistByTask = new Map<string, { total: number; done: number }>();
    const commentsByTask = new Map<string, number>();

    if (taskIds.length > 0) {
      for await (const row of paginateRange<{ task_id: string; label_id: string }>(
        (from, to) =>
          supabaseAdmin
            .from("admin_task_label_links")
            .select("task_id, label_id")
            .in("task_id", taskIds)
            .order("task_id", { ascending: true })
            .range(from, to),
        { errorLabel: "etiquetas das tarefas" },
      )) {
        const current = labelsByTask.get(row.task_id) ?? [];
        current.push(row.label_id);
        labelsByTask.set(row.task_id, current);
      }

      for await (const row of paginateRange<{ task_id: string; is_done: boolean }>(
        (from, to) =>
          supabaseAdmin
            .from("admin_task_checklist_items")
            .select("task_id, is_done")
            .in("task_id", taskIds)
            .order("task_id", { ascending: true })
            .range(from, to),
        { errorLabel: "checklist das tarefas" },
      )) {
        const current = checklistByTask.get(row.task_id) ?? { total: 0, done: 0 };
        current.total += 1;
        if (row.is_done) current.done += 1;
        checklistByTask.set(row.task_id, current);
      }

      for await (const row of paginateRange<{ task_id: string }>(
        (from, to) =>
          supabaseAdmin
            .from("admin_task_comments")
            .select("task_id")
            .in("task_id", taskIds)
            .order("task_id", { ascending: true })
            .range(from, to),
        { errorLabel: "comentários das tarefas" },
      )) {
        commentsByTask.set(row.task_id, (commentsByTask.get(row.task_id) ?? 0) + 1);
      }
    }

    res.json({
      board: board as BoardRow,
      columns: (columnsResult.data ?? []) as ColumnRow[],
      labels: (labelsResult.data ?? []) as LabelRow[],
      admins,
      tasks: tasks.map((task) => ({
        ...task,
        label_ids: labelsByTask.get(task.id) ?? [],
        checklist_total: checklistByTask.get(task.id)?.total ?? 0,
        checklist_done: checklistByTask.get(task.id)?.done ?? 0,
        comment_count: commentsByTask.get(task.id) ?? 0,
      })),
    });
  } catch (error) {
    console.error("[admin-tasks] Falha ao montar snapshot:", error);
    return next(createError(500, "db_error", "Erro ao carregar o quadro."));
  }
});

// ---------------------------------------------------------------------------
// Colunas
// ---------------------------------------------------------------------------

router.post("/columns", async (req, res, next) => {
  const parsed = CreateColumnSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const position = await nextPositionAtEnd(
    "admin_task_columns",
    "board_id",
    parsed.data.board_id,
  );
  const { data, error } = await supabaseAdmin
    .from("admin_task_columns")
    .insert({
      board_id: parsed.data.board_id,
      name: parsed.data.name,
      color: parsed.data.color ?? "#94A3B8",
      wip_limit: parsed.data.wip_limit ?? null,
      is_start: parsed.data.is_start ?? false,
      is_done: parsed.data.is_done ?? false,
      position,
    })
    .select(COLUMN_COLUMNS)
    .single();

  if (error?.code === "23503") {
    return next(createError(404, "not_found", "Quadro não encontrado."));
  }
  if (error || !data) {
    console.error("[admin-tasks] Falha ao criar coluna:", error);
    return next(createError(500, "db_error", "Erro ao criar etapa."));
  }
  res.status(201).json(data as ColumnRow);
});

// ATENCAO A ORDEM: esta rota vem ANTES de /columns/:id de proposito. O Express
// casa na primeira que bater, e "reorder" cairia em :id, falharia o parse de
// uuid e devolveria 404 em vez de reordenar.
router.patch("/columns/reorder", async (req, res, next) => {
  const parsed = ReorderSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  // O conjunto enviado tem que ser EXATAMENTE o conjunto de colunas do board.
  // Aceitar uma lista parcial deixaria as colunas de fora com posicao antiga e
  // ordem indefinida em relacao as reescritas, e nada acusaria.
  const { data: existing, error } = await supabaseAdmin
    .from("admin_task_columns")
    .select("id")
    .eq("board_id", parsed.data.board_id);
  if (error) {
    console.error("[admin-tasks] Falha ao ler colunas para reordenar:", error);
    return next(createError(500, "db_error", "Erro ao reordenar etapas."));
  }
  const knownIds = (existing ?? []).map((row) => row.id as string);
  // Set no lado enviado tambem pega id repetido: com duplicata, sent.size fica
  // menor que a lista e a comparacao de tamanho ja recusa.
  const sent = new Set(parsed.data.ids);
  if (knownIds.length !== sent.size || knownIds.some((columnId) => !sent.has(columnId))) {
    return next(
      createError(
        400,
        "incomplete_order",
        "A ordem enviada precisa conter todas as etapas do quadro.",
      ),
    );
  }

  const written = await writePositions("admin_task_columns", parsed.data.ids);
  if (written.error) {
    console.error("[admin-tasks] Falha ao reordenar colunas:", written.error);
    return next(createError(500, "db_error", "Erro ao reordenar etapas."));
  }

  const { data } = await supabaseAdmin
    .from("admin_task_columns")
    .select(COLUMN_COLUMNS)
    .eq("board_id", parsed.data.board_id)
    .order("position", { ascending: true });
  res.json({ columns: (data ?? []) as ColumnRow[] });
});

router.patch("/columns/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Etapa não encontrada."));
  }
  const parsed = PatchColumnSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const { data, error } = await supabaseAdmin
    .from("admin_task_columns")
    .update(parsed.data)
    .eq("id", id.data)
    .select(COLUMN_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("[admin-tasks] Falha ao atualizar coluna:", error);
    return next(createError(500, "db_error", "Erro ao atualizar etapa."));
  }
  if (!data) return next(createError(404, "not_found", "Etapa não encontrada."));
  res.json(data as ColumnRow);
});

router.delete("/columns/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Etapa não encontrada."));
  }

  const column = await fetchColumn(id.data);
  if (!column) return next(createError(404, "not_found", "Etapa não encontrada."));

  const { count, error: countError } = await supabaseAdmin
    .from("admin_tasks")
    .select("id", { count: "exact", head: true })
    .eq("column_id", id.data);
  if (countError) {
    console.error("[admin-tasks] Falha ao contar tarefas da coluna:", countError);
    return next(createError(500, "db_error", "Erro ao excluir etapa."));
  }

  if ((count ?? 0) > 0) {
    const moveTo = typeof req.query.moveTo === "string" ? req.query.moveTo : null;
    const target = moveTo ? parseId(moveTo) : null;
    if (!target?.success) {
      return next(
        createError(
          409,
          "column_not_empty",
          `A etapa tem ${count} tarefa(s). Informe para qual etapa mover antes de excluir.`,
        ),
      );
    }
    const destination = await fetchColumn(target.data);
    if (!destination || destination.board_id !== column.board_id) {
      return next(
        createError(400, "invalid_target", "Etapa de destino inválida."),
      );
    }
    if (destination.id === column.id) {
      return next(
        createError(400, "invalid_target", "A etapa de destino é a própria etapa."),
      );
    }

    const { error: moveError } = await supabaseAdmin
      .from("admin_tasks")
      .update({ column_id: destination.id })
      .eq("column_id", column.id);
    if (moveError) {
      console.error("[admin-tasks] Falha ao mover tarefas da coluna:", moveError);
      return next(createError(500, "db_error", "Erro ao mover as tarefas."));
    }
    // Posicoes dos dois grupos podem colidir depois da fusao; reescreve a coluna
    // de destino inteira para restaurar uma ordem total bem definida.
    const { data: merged } = await supabaseAdmin
      .from("admin_tasks")
      .select("id")
      .eq("column_id", destination.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    await writePositions(
      "admin_tasks",
      (merged ?? []).map((row) => row.id as string),
    );
  }

  const { error } = await supabaseAdmin
    .from("admin_task_columns")
    .delete()
    .eq("id", id.data);
  if (error) {
    console.error("[admin-tasks] Falha ao excluir coluna:", error);
    return next(createError(500, "db_error", "Erro ao excluir etapa."));
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Tarefas
// ---------------------------------------------------------------------------

router.post("/tasks", async (req, res, next) => {
  const parsed = CreateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const column = parsed.data.column_id
    ? await fetchColumn(parsed.data.column_id)
    : await resolveDefaultColumn(parsed.data.board_id);
  if (!column || column.board_id !== parsed.data.board_id) {
    return next(createError(400, "invalid_column", "Etapa inválida para este quadro."));
  }

  const placement = await resolveTaskPosition(
    column.id,
    parsed.data.before_task_id ?? null,
    parsed.data.after_task_id ?? null,
  );
  if ("failure" in placement) {
    console.error("[admin-tasks] Falha ao posicionar tarefa:", placement.failure);
    return next(createError(500, "db_error", "Erro ao posicionar a tarefa."));
  }

  const { data, error } = await supabaseAdmin
    .from("admin_tasks")
    .insert({
      board_id: parsed.data.board_id,
      column_id: column.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      notes: parsed.data.notes ?? null,
      position: placement.position,
      priority: parsed.data.priority ?? "media",
      type: parsed.data.type ?? "tarefa",
      assignee_id: parsed.data.assignee_id ?? null,
      due_date: parsed.data.due_date ?? null,
      estimate: parsed.data.estimate ?? null,
      // Coluna terminal ja carimba a conclusao na criacao: o estado do card tem
      // que ser consistente com a coluna dele desde a primeira linha.
      completed_at: column.is_done ? new Date().toISOString() : null,
      created_by: req.user!.id,
      updated_by: req.user!.id,
    })
    .select(TASK_COLUMNS)
    .single();

  if (error || !data) {
    console.error("[admin-tasks] Falha ao criar tarefa:", error);
    return next(createError(500, "db_error", "Erro ao criar tarefa."));
  }

  const task = data as TaskRow;
  await logActivity(task.id, req.user!.id, "created", {
    column_id: column.id,
    column_name: column.name,
  });
  res.status(201).json(task);
});

router.get("/tasks/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Tarefa não encontrada."));
  }

  const task = await fetchTask(id.data);
  if (!task) return next(createError(404, "not_found", "Tarefa não encontrada."));

  const [links, comments, checklist, activity] = await Promise.all([
    supabaseAdmin
      .from("admin_task_label_links")
      .select("label_id")
      .eq("task_id", task.id),
    supabaseAdmin
      .from("admin_task_comments")
      .select(COMMENT_COLUMNS)
      .eq("task_id", task.id)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("admin_task_checklist_items")
      .select(CHECKLIST_COLUMNS)
      .eq("task_id", task.id)
      .order("position", { ascending: true }),
    supabaseAdmin
      .from("admin_task_activity")
      .select(ACTIVITY_COLUMNS)
      .eq("task_id", task.id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (links.error || comments.error || checklist.error || activity.error) {
    console.error(
      "[admin-tasks] Falha ao carregar detalhe da tarefa:",
      links.error ?? comments.error ?? checklist.error ?? activity.error,
    );
    return next(createError(500, "db_error", "Erro ao carregar a tarefa."));
  }

  res.json({
    task,
    label_ids: (links.data ?? []).map((row) => row.label_id as string),
    comments: (comments.data ?? []) as CommentRow[],
    checklist: (checklist.data ?? []) as ChecklistRow[],
    activity: (activity.data ?? []) as ActivityRow[],
  });
});

router.patch("/tasks/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Tarefa não encontrada."));
  }
  const parsed = PatchTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const current = await fetchTask(id.data);
  if (!current) return next(createError(404, "not_found", "Tarefa não encontrada."));

  const { archived, ...fields } = parsed.data;
  const update: Record<string, unknown> = {
    ...fields,
    updated_by: req.user!.id,
  };
  // String vazia vinda de um textarea limpo significa "sem conteudo", e a coluna
  // so aceita null ou 1+ caracteres. Normaliza aqui para nao estourar o CHECK.
  if (fields.description === "") update.description = null;
  if (fields.notes === "") update.notes = null;
  if (archived !== undefined) {
    update.archived_at = archived ? new Date().toISOString() : null;
  }

  const { data, error } = await supabaseAdmin
    .from("admin_tasks")
    .update(update)
    .eq("id", id.data)
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("[admin-tasks] Falha ao atualizar tarefa:", error);
    return next(createError(500, "db_error", "Erro ao atualizar tarefa."));
  }
  if (!data) return next(createError(404, "not_found", "Tarefa não encontrada."));
  const task = data as TaskRow;

  // Um evento por campo que mudou DE FATO (comparado com o estado anterior), e
  // nao um por campo enviado: reenviar o mesmo valor nao polui o historico.
  const actor = req.user!.id;
  if (fields.title !== undefined && fields.title !== current.title) {
    await logActivity(task.id, actor, "renamed", {
      from: current.title,
      to: task.title,
    });
  }
  if (fields.priority !== undefined && fields.priority !== current.priority) {
    await logActivity(task.id, actor, "priority_changed", {
      from: current.priority,
      to: task.priority,
    });
  }
  if (fields.type !== undefined && fields.type !== current.type) {
    await logActivity(task.id, actor, "type_changed", {
      from: current.type,
      to: task.type,
    });
  }
  if (
    fields.assignee_id !== undefined &&
    (fields.assignee_id ?? null) !== current.assignee_id
  ) {
    await logActivity(
      task.id,
      actor,
      task.assignee_id ? "assigned" : "unassigned",
      { from: current.assignee_id, to: task.assignee_id },
    );
  }
  if (
    fields.due_date !== undefined &&
    (fields.due_date ?? null) !== current.due_date
  ) {
    await logActivity(task.id, actor, "due_date_changed", {
      from: current.due_date,
      to: task.due_date,
    });
  }
  if (archived !== undefined && Boolean(task.archived_at) !== Boolean(current.archived_at)) {
    await logActivity(task.id, actor, task.archived_at ? "archived" : "unarchived");
  }

  res.json(task);
});

router.patch("/tasks/:id/move", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Tarefa não encontrada."));
  }
  const parsed = MoveTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const current = await fetchTask(id.data);
  if (!current) return next(createError(404, "not_found", "Tarefa não encontrada."));

  const destination = await fetchColumn(parsed.data.column_id);
  if (!destination || destination.board_id !== current.board_id) {
    return next(createError(400, "invalid_column", "Etapa inválida para este quadro."));
  }
  const origin = await fetchColumn(current.column_id);

  const placement = await resolveTaskPosition(
    destination.id,
    parsed.data.before_task_id ?? null,
    parsed.data.after_task_id ?? null,
  );
  if ("failure" in placement) {
    console.error("[admin-tasks] Falha ao posicionar tarefa:", placement.failure);
    return next(createError(500, "db_error", "Erro ao mover a tarefa."));
  }

  // completed_at derivado, nunca aceito do client: entrar em coluna terminal
  // carimba, sair de terminal para nao-terminal limpa, e terminal -> terminal
  // preserva o carimbo original (o card nao foi "concluido de novo").
  const wasDone = Boolean(origin?.is_done);
  const update: Record<string, unknown> = {
    column_id: destination.id,
    position: placement.position,
    updated_by: req.user!.id,
  };
  if (destination.is_done && !wasDone) {
    update.completed_at = new Date().toISOString();
  } else if (!destination.is_done && wasDone) {
    update.completed_at = null;
  }

  const { data, error } = await supabaseAdmin
    .from("admin_tasks")
    .update(update)
    .eq("id", id.data)
    .select(TASK_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("[admin-tasks] Falha ao mover tarefa:", error);
    return next(createError(500, "db_error", "Erro ao mover a tarefa."));
  }
  if (!data) return next(createError(404, "not_found", "Tarefa não encontrada."));
  const task = data as TaskRow;

  const actor = req.user!.id;
  if (destination.id !== current.column_id) {
    await logActivity(task.id, actor, "moved", {
      from_column_id: current.column_id,
      from_column_name: origin?.name ?? null,
      to_column_id: destination.id,
      to_column_name: destination.name,
    });
    if (destination.is_done && !wasDone) {
      await logActivity(task.id, actor, "completed");
    } else if (!destination.is_done && wasDone) {
      await logActivity(task.id, actor, "reopened");
    }
  }

  res.json(task);
});

router.delete("/tasks/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Tarefa não encontrada."));
  }

  const { data, error } = await supabaseAdmin
    .from("admin_tasks")
    .delete()
    .eq("id", id.data)
    .select("id");

  if (error) {
    console.error("[admin-tasks] Falha ao excluir tarefa:", error);
    return next(createError(500, "db_error", "Erro ao excluir tarefa."));
  }
  if (!data || data.length === 0) {
    return next(createError(404, "not_found", "Tarefa não encontrada."));
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Etiquetas
// ---------------------------------------------------------------------------

router.post("/labels", async (req, res, next) => {
  const parsed = CreateLabelSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const { data, error } = await supabaseAdmin
    .from("admin_task_labels")
    .insert({
      board_id: parsed.data.board_id,
      name: parsed.data.name,
      color: parsed.data.color ?? "#C4B5FD",
    })
    .select(LABEL_COLUMNS)
    .single();

  // A criacao inline do modal digita um nome; colidir com uma etiqueta que ja
  // existe e o caso COMUM, nao excecao. Devolve a existente para o cliente
  // simplesmente usar, em vez de obrigar a tratar um erro.
  //
  // A busca da existente compara em minusculas NO JS, e nao com .ilike(): o
  // indice unico e sobre lower(name), e `%` ou `_` dentro de um nome digitado
  // pela pessoa (ex: "50% pronto", "meta_infra") viram curinga no ilike e
  // casariam a etiqueta ERRADA. O conjunto e pequeno (etiquetas de um quadro),
  // entao a comparacao exata sai barata e nao sub-casa.
  if (error?.code === "23505") {
    const wanted = parsed.data.name.toLowerCase();
    const { data: boardLabels } = await supabaseAdmin
      .from("admin_task_labels")
      .select(LABEL_COLUMNS)
      .eq("board_id", parsed.data.board_id);
    const existing = (boardLabels ?? []).find(
      (row) => (row.name as string).toLowerCase() === wanted,
    );
    if (existing) return res.status(200).json(existing as LabelRow);
  }
  if (error?.code === "23503") {
    return next(createError(404, "not_found", "Quadro não encontrado."));
  }
  if (error || !data) {
    console.error("[admin-tasks] Falha ao criar etiqueta:", error);
    return next(createError(500, "db_error", "Erro ao criar etiqueta."));
  }
  res.status(201).json(data as LabelRow);
});

router.patch("/labels/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Etiqueta não encontrada."));
  }
  const parsed = PatchLabelSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const { data, error } = await supabaseAdmin
    .from("admin_task_labels")
    .update(parsed.data)
    .eq("id", id.data)
    .select(LABEL_COLUMNS)
    .maybeSingle();

  if (error?.code === "23505") {
    return next(
      createError(409, "duplicate_label", "Já existe uma etiqueta com esse nome."),
    );
  }
  if (error) {
    console.error("[admin-tasks] Falha ao atualizar etiqueta:", error);
    return next(createError(500, "db_error", "Erro ao atualizar etiqueta."));
  }
  if (!data) return next(createError(404, "not_found", "Etiqueta não encontrada."));
  res.json(data as LabelRow);
});

router.delete("/labels/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Etiqueta não encontrada."));
  }

  const { data, error } = await supabaseAdmin
    .from("admin_task_labels")
    .delete()
    .eq("id", id.data)
    .select("id");

  if (error) {
    console.error("[admin-tasks] Falha ao excluir etiqueta:", error);
    return next(createError(500, "db_error", "Erro ao excluir etiqueta."));
  }
  if (!data || data.length === 0) {
    return next(createError(404, "not_found", "Etiqueta não encontrada."));
  }
  res.json({ ok: true });
});

router.post("/tasks/:id/labels", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Tarefa não encontrada."));
  }
  const parsed = AttachLabelSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const task = await fetchTask(id.data);
  if (!task) return next(createError(404, "not_found", "Tarefa não encontrada."));

  const { data: label } = await supabaseAdmin
    .from("admin_task_labels")
    .select(LABEL_COLUMNS)
    .eq("id", parsed.data.label_id)
    .maybeSingle();
  if (!label || (label as LabelRow).board_id !== task.board_id) {
    return next(
      createError(400, "invalid_label", "Etiqueta inválida para este quadro."),
    );
  }

  const { error } = await supabaseAdmin
    .from("admin_task_label_links")
    .insert({ task_id: task.id, label_id: parsed.data.label_id });

  // 23505 = ja estava vinculada. Idempotente de proposito: o resultado que o
  // cliente pediu (a etiqueta esta na task) e verdadeiro nos dois casos.
  if (error && error.code !== "23505") {
    console.error("[admin-tasks] Falha ao vincular etiqueta:", error);
    return next(createError(500, "db_error", "Erro ao aplicar etiqueta."));
  }
  if (!error) {
    await logActivity(task.id, req.user!.id, "label_added", {
      label_id: parsed.data.label_id,
      label_name: (label as LabelRow).name,
    });
  }
  res.json({ ok: true });
});

router.delete("/tasks/:id/labels/:labelId", async (req, res, next) => {
  const id = parseId(req.params.id);
  const labelId = parseId(req.params.labelId);
  if (!id.success || !labelId.success) {
    return next(createError(404, "not_found", "Vínculo não encontrado."));
  }

  const { data, error } = await supabaseAdmin
    .from("admin_task_label_links")
    .delete()
    .eq("task_id", id.data)
    .eq("label_id", labelId.data)
    .select("label_id");

  if (error) {
    console.error("[admin-tasks] Falha ao remover etiqueta:", error);
    return next(createError(500, "db_error", "Erro ao remover etiqueta."));
  }
  if (data && data.length > 0) {
    await logActivity(id.data, req.user!.id, "label_removed", {
      label_id: labelId.data,
    });
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Comentarios
// ---------------------------------------------------------------------------

router.post("/tasks/:id/comments", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Tarefa não encontrada."));
  }
  const parsed = CommentSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const { data, error } = await supabaseAdmin
    .from("admin_task_comments")
    .insert({
      task_id: id.data,
      author_id: req.user!.id,
      body: parsed.data.body,
    })
    .select(COMMENT_COLUMNS)
    .single();

  if (error?.code === "23503") {
    return next(createError(404, "not_found", "Tarefa não encontrada."));
  }
  if (error || !data) {
    console.error("[admin-tasks] Falha ao criar comentário:", error);
    return next(createError(500, "db_error", "Erro ao comentar."));
  }
  res.status(201).json(data as CommentRow);
});

router.patch("/comments/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Comentário não encontrado."));
  }
  const parsed = CommentSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  // So o autor edita o proprio comentario. A checagem e por author_id no
  // WHERE, nao um if depois de ler: assim nao existe janela entre a leitura e
  // a escrita, e um id de outra pessoa simplesmente nao casa nenhuma linha.
  const { data, error } = await supabaseAdmin
    .from("admin_task_comments")
    .update({ body: parsed.data.body })
    .eq("id", id.data)
    .eq("author_id", req.user!.id)
    .select(COMMENT_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("[admin-tasks] Falha ao editar comentário:", error);
    return next(createError(500, "db_error", "Erro ao editar comentário."));
  }
  if (!data) {
    return next(
      createError(404, "not_found", "Comentário não encontrado ou de outro autor."),
    );
  }
  res.json(data as CommentRow);
});

router.delete("/comments/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Comentário não encontrado."));
  }

  const { data, error } = await supabaseAdmin
    .from("admin_task_comments")
    .delete()
    .eq("id", id.data)
    .eq("author_id", req.user!.id)
    .select("id");

  if (error) {
    console.error("[admin-tasks] Falha ao excluir comentário:", error);
    return next(createError(500, "db_error", "Erro ao excluir comentário."));
  }
  if (!data || data.length === 0) {
    return next(
      createError(404, "not_found", "Comentário não encontrado ou de outro autor."),
    );
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

router.post("/tasks/:id/checklist", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Tarefa não encontrada."));
  }
  const parsed = CreateChecklistSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const position = await nextPositionAtEnd(
    "admin_task_checklist_items",
    "task_id",
    id.data,
  );
  const { data, error } = await supabaseAdmin
    .from("admin_task_checklist_items")
    .insert({ task_id: id.data, content: parsed.data.content, position })
    .select(CHECKLIST_COLUMNS)
    .single();

  if (error?.code === "23503") {
    return next(createError(404, "not_found", "Tarefa não encontrada."));
  }
  if (error || !data) {
    console.error("[admin-tasks] Falha ao criar item de checklist:", error);
    return next(createError(500, "db_error", "Erro ao criar item."));
  }
  res.status(201).json(data as ChecklistRow);
});

router.patch("/checklist/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Item não encontrado."));
  }
  const parsed = PatchChecklistSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  const { data, error } = await supabaseAdmin
    .from("admin_task_checklist_items")
    .update(parsed.data)
    .eq("id", id.data)
    .select(CHECKLIST_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error("[admin-tasks] Falha ao atualizar item de checklist:", error);
    return next(createError(500, "db_error", "Erro ao atualizar item."));
  }
  if (!data) return next(createError(404, "not_found", "Item não encontrado."));
  res.json(data as ChecklistRow);
});

router.delete("/checklist/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Item não encontrado."));
  }

  const { data, error } = await supabaseAdmin
    .from("admin_task_checklist_items")
    .delete()
    .eq("id", id.data)
    .select("id");

  if (error) {
    console.error("[admin-tasks] Falha ao excluir item de checklist:", error);
    return next(createError(500, "db_error", "Erro ao excluir item."));
  }
  if (!data || data.length === 0) {
    return next(createError(404, "not_found", "Item não encontrado."));
  }
  res.json({ ok: true });
});

router.patch("/tasks/:id/checklist/reorder", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id.success) {
    return next(createError(404, "not_found", "Tarefa não encontrada."));
  }
  const parsed = z
    .object({ ids: z.array(uuid).min(1).max(200) })
    .safeParse(req.body);
  if (!parsed.success) {
    return next(invalid(parsed.error.issues[0]?.message, "Payload inválido."));
  }

  // Mesma exigencia de conjunto COMPLETO da reordenacao de colunas, pelo mesmo
  // motivo: lista parcial deixaria os itens de fora com ordem indefinida.
  const { data: existing, error } = await supabaseAdmin
    .from("admin_task_checklist_items")
    .select("id")
    .eq("task_id", id.data);
  if (error) {
    console.error("[admin-tasks] Falha ao ler checklist para reordenar:", error);
    return next(createError(500, "db_error", "Erro ao reordenar itens."));
  }
  const knownIds = (existing ?? []).map((row) => row.id as string);
  const sent = new Set(parsed.data.ids);
  if (knownIds.length !== sent.size || knownIds.some((itemId) => !sent.has(itemId))) {
    return next(
      createError(
        400,
        "incomplete_order",
        "A ordem enviada precisa conter todos os itens do checklist.",
      ),
    );
  }

  const written = await writePositions(
    "admin_task_checklist_items",
    parsed.data.ids,
  );
  if (written.error) {
    console.error("[admin-tasks] Falha ao reordenar checklist:", written.error);
    return next(createError(500, "db_error", "Erro ao reordenar itens."));
  }

  const { data } = await supabaseAdmin
    .from("admin_task_checklist_items")
    .select(CHECKLIST_COLUMNS)
    .eq("task_id", id.data)
    .order("position", { ascending: true });
  res.json({ checklist: (data ?? []) as ChecklistRow[] });
});

export default router;
