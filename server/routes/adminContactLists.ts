import { Router } from "express";

import {
  ContactImportError,
  importPreview,
  type ImportReport,
  type ImportSource,
  type ParseInput,
} from "../lib/contactImport";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { createError } from "../middleware/error";

// Rotas de import de lista de contatos. Montadas sob /api/admin (ja atras de
// requireAuth + requireAdmin). PRINCIPIO: importar e enviar sao acoes separadas.
// NENHUMA rota aqui dispara envio de e-mail. O envio usa o motor de campanhas.

const router = Router();

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const FILE_SOURCES: ImportSource[] = ["csv", "xlsx", "pdf"];

function decodeBase64File(input: unknown): Buffer {
  if (typeof input !== "string" || !input) {
    throw createError(400, "missing_file", "Arquivo ausente.");
  }
  // Aceita data URL (data:...;base64,<...>) ou base64 puro.
  const commaIdx = input.indexOf(",");
  const b64 =
    input.startsWith("data:") && commaIdx >= 0 ? input.slice(commaIdx + 1) : input;
  const buffer = Buffer.from(b64, "base64");
  if (buffer.length === 0) {
    throw createError(400, "empty_file", "Arquivo vazio ou inválido.");
  }
  if (buffer.length > MAX_FILE_BYTES) {
    throw createError(
      413,
      "file_too_large",
      // TODO(Ana)
      "Arquivo acima de 5 MB. Envie um arquivo menor.",
    );
  }
  return buffer;
}

// Monta o ParseInput a partir do corpo (texto colado OU arquivo base64).
function parseInputFromBody(body: Record<string, unknown>): ParseInput {
  const source = body.source;
  if (source === "paste") {
    const text = typeof body.text === "string" ? body.text : "";
    if (!text.trim()) {
      throw createError(400, "empty_text", "Cole ao menos um e-mail.");
    }
    return { source: "paste", text };
  }
  if (typeof source === "string" && FILE_SOURCES.includes(source as ImportSource)) {
    const buffer = decodeBase64File(body.fileBase64);
    return { source: source as "csv" | "xlsx" | "pdf", buffer };
  }
  throw createError(400, "invalid_source", "Origem inválida.");
}

// POST /preview: parseia e valida; NAO grava nada. Coracao do fluxo. Erro de
// parse vira { error: { code, message } } (nunca lista parcial).
router.post("/preview", async (req, res, next) => {
  try {
    const input = parseInputFromBody((req.body ?? {}) as Record<string, unknown>);
    const report = await importPreview(input);
    res.json({ data: report });
  } catch (err) {
    if (err instanceof ContactImportError) {
      return next(createError(422, err.code, err.message));
    }
    next(err);
  }
});

type ConfirmMember = ImportReport["members"][number];

// POST /: confirma e grava a lista + membros. Recebe o relatorio JA revisado
// (reparseia NAO acontece aqui; o client manda os membros do preview). lgpd_basis
// e OBRIGATORIO: sem base legal declarada, nao grava.
router.post("/", async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return next(createError(400, "missing_name", "Nome da lista obrigatório."));
    }
    const lgpdBasis =
      typeof body.lgpd_basis === "string" ? body.lgpd_basis.trim() : "";
    if (!lgpdBasis) {
      return next(
        createError(
          400,
          "missing_lgpd_basis",
          // TODO(Ana)
          "Declare a base legal (LGPD) da lista antes de salvar.",
        ),
      );
    }
    const source = body.source;
    if (
      source !== "paste" &&
      !(typeof source === "string" && FILE_SOURCES.includes(source as ImportSource))
    ) {
      return next(createError(400, "invalid_source", "Origem inválida."));
    }
    const members = Array.isArray(body.members)
      ? (body.members as ConfirmMember[])
      : [];
    if (members.length === 0) {
      return next(createError(400, "empty_members", "Lista sem contatos."));
    }

    const counts = members.reduce(
      (acc, m) => {
        if (m.status === "valid") acc.valid += 1;
        else if (m.status === "invalid") acc.invalid += 1;
        else if (m.status === "duplicate") acc.duplicate += 1;
        else if (m.status === "suppressed") acc.suppressed += 1;
        return acc;
      },
      { valid: 0, invalid: 0, duplicate: 0, suppressed: 0 },
    );

    const { data: list, error: listError } = await supabaseAdmin
      .from("contact_lists")
      .insert({
        name,
        description:
          typeof body.description === "string" ? body.description.trim() : null,
        source,
        original_filename:
          typeof body.original_filename === "string"
            ? body.original_filename
            : null,
        lgpd_basis: lgpdBasis,
        lgpd_note: typeof body.lgpd_note === "string" ? body.lgpd_note.trim() : null,
        total_rows: members.length,
        valid_count: counts.valid,
        invalid_count: counts.invalid,
        duplicate_count: counts.duplicate,
        suppressed_count: counts.suppressed,
        created_by: req.user!.id,
      })
      .select("id")
      .single();
    if (listError || !list) {
      return next(createError(500, "db_error", "Erro ao criar a lista."));
    }

    // Dedup por email dentro do proprio insert (a tabela tem unique(list_id,email)):
    // mantem a primeira ocorrencia de cada email, na ordem do relatorio.
    const seen = new Set<string>();
    const rows = members
      .filter((m) => typeof m.email === "string" && m.email.trim())
      .filter((m) => {
        const key = m.email.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((m) => ({
        list_id: list.id,
        email: m.email,
        name: typeof m.name === "string" ? m.name : null,
        status: m.status,
        invalid_reason: m.invalidReason ?? null,
        user_id: m.userId ?? null,
      }));

    const { error: membersError } = await supabaseAdmin
      .from("contact_list_members")
      .insert(rows);
    if (membersError) {
      // Best-effort de limpeza: sem os membros a lista fica inconsistente.
      await supabaseAdmin.from("contact_lists").delete().eq("id", list.id);
      return next(createError(500, "db_error", "Erro ao gravar os contatos."));
    }

    res.status(201).json({ data: { id: list.id } });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const pageRaw = parseInt(String(req.query.page ?? "1"), 10);
    const sizeRaw = parseInt(String(req.query.pageSize ?? "25"), 10);
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
    const pageSize = Math.min(
      Math.max(Number.isFinite(sizeRaw) ? sizeRaw : 25, 1),
      100,
    );
    const from = (page - 1) * pageSize;

    const { data, count, error } = await supabaseAdmin
      .from("contact_lists")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error)
      return next(createError(500, "db_error", "Erro ao buscar as listas."));

    res.json({ data: { rows: data ?? [], total: count ?? 0, page, pageSize } });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { data: list, error: listError } = await supabaseAdmin
      .from("contact_lists")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (listError)
      return next(createError(500, "db_error", "Erro ao buscar a lista."));
    if (!list) return next(createError(404, "not_found", "Lista não encontrada."));

    const pageRaw = parseInt(String(req.query.page ?? "1"), 10);
    const sizeRaw = parseInt(String(req.query.pageSize ?? "50"), 10);
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
    const pageSize = Math.min(
      Math.max(Number.isFinite(sizeRaw) ? sizeRaw : 50, 1),
      200,
    );
    const from = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from("contact_list_members")
      .select("*", { count: "exact" })
      .eq("list_id", req.params.id)
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);
    const statusFilter =
      typeof req.query.status === "string" ? req.query.status : "";
    if (statusFilter) query = query.eq("status", statusFilter);

    const { data: members, count, error: membersError } = await query;
    if (membersError)
      return next(createError(500, "db_error", "Erro ao buscar os contatos."));

    res.json({
      data: {
        list,
        members: members ?? [],
        pagination: { page, pageSize, total: count ?? 0 },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    // members caem por ON DELETE CASCADE.
    const { error } = await supabaseAdmin
      .from("contact_lists")
      .delete()
      .eq("id", req.params.id);
    if (error)
      return next(createError(500, "db_error", "Erro ao remover a lista."));
    res.json({ data: { deleted: true, id: req.params.id } });
  } catch (err) {
    next(err);
  }
});

function csvCell(value: string | null): string {
  const v = value ?? "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

// GET /:id/export: baixa CSV de todos os membros (para o Murilo conferir).
router.get("/:id/export", async (req, res, next) => {
  try {
    const { data: members, error } = await supabaseAdmin
      .from("contact_list_members")
      .select("email, name, status, invalid_reason, user_id")
      .eq("list_id", req.params.id)
      .order("created_at", { ascending: true });
    if (error)
      return next(createError(500, "db_error", "Erro ao exportar a lista."));

    const header = "email,name,status,invalid_reason,is_existing_user";
    const lines = (members ?? []).map((m) =>
      [
        csvCell(m.email),
        csvCell(m.name),
        csvCell(m.status),
        csvCell(m.invalid_reason),
        m.user_id ? "yes" : "no",
      ].join(","),
    );
    const csv = [header, ...lines].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="contact-list-${req.params.id}.csv"`,
    );
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

export default router;
