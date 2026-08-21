import { Router } from "express";
import { z } from "zod";

import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";

// Aba Bugs & Erros APOSENTADA na Fase 5 (docs/plano-unificar-bugs-tarefas.md).
// Os 25 bugs viraram tarefas no quadro BUG; `admin_bugs` continua de pe com as
// 25 linhas (invariante 4: drop e irreversivel, o ledger de migrations nao e
// confiavel, e nao existe rollback). Dropar a tabela e card no quadro DEV.
//
// O QUE SOBROU AQUI, e por que:
//
//   GET /  -> LEITURA da tabela, sem cliente nenhum chamando. Existe para
//             conferir a migracao sem restaurar backup, e para o dia em que
//             alguem perguntar "o que tinha ali antes". Custa nada e e a unica
//             janela para um dado que ninguem mais enxerga.
//
//   POST, PATCH, DELETE -> 410 Gone. Nao 404: 404 diz "nunca existiu" e mentiria
//             sobre a historia; 410 diz "existia e acabou", que e o fato. A
//             tabela e somente leitura a partir daqui.
//
// O QUE SAIU:
//
//   GET /sentry-issues -> a listagem ao vivo do Sentry pertencia a aba removida.
//             Quem le o Sentry agora e o sync (server/lib/sentryTaskIntake.ts),
//             e manter uma segunda porta para a mesma API seria dois caminhos
//             para a mesma coisa, que e o que este projeto inteiro esta
//             desfazendo.
//
//   Emails e notificacoes de bug novo/resolvido -> saiam da escrita, que acabou.
//             As funcoes em email.ts continuam existindo (ver abaixo).
//
// O QUE FICOU EM OUTRO LUGAR, INTACTO:
//
//   server/lib/sentryBugSync.ts     (syncBugStatusToSentry)
//   server/lib/sentryApi.ts         (updateIssueStatus)
//   server/lib/sentryBugReconcile.ts (retryPendingSyncs e as demais fases)
//   server/lib/email.ts             (sendBugCreatedEmail, sendBugResolvedEmail,
//                                    sendBugReopenedEmail)
//
// Os tres primeiros sobrevivem por causa da EMENDA 1 ao plano, que revogou o
// invariante 6 original: o push de resolucao disparado por transicao HUMANA
// fica, e so o job e proibido de escrever no Sentry.
//
// ATENCAO, E A DIVIDA QUE ESTA FASE CRIA: com o PATCH virando 410, o push
// perdeu seu UNICO gatilho. Ele nao morreu, ficou DORMENTE. Religa-lo na
// transicao do card exige `admin_tasks.sentry_sync_pending`, coluna que NAO
// existe (a Fase 2 nao a criou, porque na epoca o push ainda tinha casa). Isso e
// migration, e migration nova nao cabe nesta fase. Registrado no plano.

const router = Router();

const BUG_STATUSES = ["open", "in_progress", "done"] as const;

type BugRow = {
  id: string;
  title: string;
  description: string | null;
  status: (typeof BUG_STATUSES)[number];
  severity: string;
  sentry_issue_id: string | null;
  sentry_issue_url: string | null;
  sentry_numeric_id: string | null;
  sentry_sync_pending: "resolved" | "unresolved" | null;
  sentry_reopen_event_at: string | null;
  sentry_last_checked_at: string | null;
  sentry_orphaned_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

const BUG_COLUMNS =
  "id, title, description, status, severity, sentry_issue_id, sentry_issue_url, sentry_numeric_id, sentry_sync_pending, sentry_reopen_event_at, sentry_last_checked_at, sentry_orphaned_at, created_by, created_at, updated_at, resolved_at";

const ListQuerySchema = z.object({
  status: z.enum(BUG_STATUSES).optional(),
});

/** Escrita encerrada. Resposta unica para as tres rotas que sobraram. */
function escritaEncerrada(res: import("express").Response) {
  res.status(410).json({
    error: {
      code: "bugs_module_retired",
      message:
        "O módulo de bugs foi unificado com Tarefas. Use o quadro BUG em /admin?section=tarefas&board=bugs.",
    },
  });
}

router.get("/", async (req, res, next) => {
  const parsed = ListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return next(
      createError(
        400,
        "invalid_request",
        parsed.error.issues[0]?.message ?? "Parâmetros inválidos.",
      ),
    );
  }

  let query = supabaseAdmin
    .from("admin_bugs")
    .select(BUG_COLUMNS)
    .order("created_at", { ascending: false });
  if (parsed.data.status) query = query.eq("status", parsed.data.status);

  // Contagem por status independente do filtro (badges das colunas no front).
  const countByStatus = (status: string) =>
    supabaseAdmin
      .from("admin_bugs")
      .select("id", { count: "exact", head: true })
      .eq("status", status);

  const [bugs, ...statusCounts] = await Promise.all([
    query,
    ...BUG_STATUSES.map(countByStatus),
  ]);

  if (bugs.error || statusCounts.some((r) => r.error)) {
    console.error(
      "[admin-bugs] Falha ao listar bugs:",
      bugs.error ?? statusCounts.find((r) => r.error)?.error,
    );
    return next(createError(500, "db_error", "Erro ao listar bugs."));
  }

  res.json({
    bugs: (bugs.data ?? []) as BugRow[],
    counts: Object.fromEntries(
      BUG_STATUSES.map((status, i) => [status, statusCounts[i].count ?? 0]),
    ),
  });
});

router.post("/", (_req, res) => escritaEncerrada(res));
router.patch("/:id", (_req, res) => escritaEncerrada(res));
router.delete("/:id", (_req, res) => escritaEncerrada(res));

export default router;
