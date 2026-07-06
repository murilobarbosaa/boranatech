import { NextFunction, Request, Response, Router } from "express";

import { CurriculoSchema, type Curriculo } from "../../shared/curriculo/schema";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

// Persistencia dos curriculos criados pelo gerador com IA (/curriculo/gerar).
// NAO passa por checkAiDailyLimit: salvar/listar/abrir/excluir e persistencia
// de dado do dono, nao uso de IA (a quota ja foi cobrada na geracao).
//
// Gate Pro SO na criacao (POST, mesma regra do gerador). Leitura e exclusao
// sao do dono sem gate: um ex-Pro continua vendo e gerenciando o que criou.
// Identidade sempre do JWT; toda query filtra user_id; 404 nunca vaza
// existencia de linha alheia.

const router = Router();

router.use(requireAuth);
router.use(checkProStatus);

// Teto anti-acumulo por usuario. Ajustavel. // TODO: calibrar.
const MAX_RESUMES_PER_USER = 20;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Titulo default derivado do proprio curriculo: o cargo alvo do objetivo.
// Sem cargo utilizavel, cai em "Curriculo de <data>".
function deriveTitle(curriculo: Curriculo): string {
  const cargo = curriculo.objetivo?.cargo?.trim();
  if (cargo) return cargo.slice(0, 120);
  // TODO(Ana): revisar o titulo default do curriculo salvo.
  return `Curriculo de ${new Date().toLocaleDateString("pt-BR")}`;
}

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  // Fail-closed: qualquer coisa diferente de true e tratada como free.
  if (req.isPro !== true) {
    // TODO(Ana): mensagem de recurso exclusivo Pro.
    return next(
      createError(403, "pro_required", "Salvar curriculos e exclusivo do Plano Pro."),
    );
  }

  const parsed = CurriculoSchema.safeParse(req.body);
  if (!parsed.success) {
    // TODO(Ana): mensagem de curriculo invalido.
    return next(createError(400, "invalid_request", "Curriculo invalido."));
  }
  const curriculo = parsed.data;

  // Anti-acumulo: contagem antes do insert. Falha na contagem e fail-closed
  // (nao insere sem saber o total).
  const { count, error: countError } = await supabaseAdmin
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (countError || count === null) {
    // TODO(Ana): mensagem de falha ao salvar.
    return next(createError(503, "save_failed", "Nao foi possivel salvar agora. Tente novamente."));
  }
  if (count >= MAX_RESUMES_PER_USER) {
    // TODO(Ana): mensagem de limite de curriculos salvos.
    return next(
      createError(
        409,
        "resume_limit_reached",
        `Voce ja tem ${MAX_RESUMES_PER_USER} curriculos salvos. Exclua algum para salvar um novo.`,
      ),
    );
  }

  const { data, error } = await supabaseAdmin
    .from("resumes")
    .insert({
      user_id: userId,
      title: deriveTitle(curriculo),
      curriculo,
    })
    .select("id, title, created_at")
    .single();
  if (error || !data) {
    // TODO(Ana): mensagem de falha ao salvar.
    return next(createError(503, "save_failed", "Nao foi possivel salvar agora. Tente novamente."));
  }
  res.status(201).json(data);
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { data, error } = await supabaseAdmin
    .from("resumes")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    // TODO(Ana): mensagem de falha ao listar curriculos.
    return next(createError(500, "list_failed", "Nao foi possivel listar seus curriculos."));
  }
  res.json({ resumes: data ?? [] });
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const id = req.params.id;
  if (!UUID_RE.test(id)) {
    // TODO(Ana): mensagem de curriculo nao encontrado.
    return next(createError(404, "not_found", "Curriculo nao encontrado."));
  }
  const { data, error } = await supabaseAdmin
    .from("resumes")
    .select("id, title, curriculo, created_at, updated_at")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    // TODO(Ana): mensagem de falha ao carregar o curriculo.
    return next(createError(500, "load_failed", "Nao foi possivel carregar o curriculo."));
  }
  if (!data) {
    // 404 tambem para linha de OUTRO usuario: nao vaza existencia.
    // TODO(Ana): mensagem de curriculo nao encontrado.
    return next(createError(404, "not_found", "Curriculo nao encontrado."));
  }
  res.json(data);
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const id = req.params.id;
  if (!UUID_RE.test(id)) {
    // TODO(Ana): mensagem de curriculo nao encontrado.
    return next(createError(404, "not_found", "Curriculo nao encontrado."));
  }
  const { data, error } = await supabaseAdmin
    .from("resumes")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .select("id");
  if (error) {
    // TODO(Ana): mensagem de falha ao excluir.
    return next(createError(500, "delete_failed", "Nao foi possivel excluir o curriculo."));
  }
  if (!data || data.length === 0) {
    // TODO(Ana): mensagem de curriculo nao encontrado.
    return next(createError(404, "not_found", "Curriculo nao encontrado."));
  }
  res.json({ ok: true });
});

export default router;
