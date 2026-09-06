import { Router } from "express";

import {
  aliasesOf,
  dedupeByCanonicalId,
  resolveProjectId,
} from "../../shared/projects/aliases";
import { projetos } from "../../shared/projects/catalog";
import {
  gerarPublicCode,
  parseSubmissionInput,
} from "../../shared/projects/submission";
import { loadProjetoV2 } from "../../shared/projects/v2";
import { montarDbError } from "../lib/dbError";
import { rodarChecagens, type ResultadoCheck } from "../lib/projectAutoChecks";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";

const router = Router();

router.use(requireAuth);

const CAMPOS =
  "project_id, tipo_entrega, deploy_url, repo_url, artifact_url, retro, is_public, public_code, status, auto_check, auto_check_at, created_at, updated_at";

const INTERVALO_VERIFY_MS = 60_000;
const ORCAMENTO_CHECAGEM_MS = 20_000;

type LinhaEntrega = Record<string, unknown>;

/**
 * A tabela pode nao existir ainda: o codigo sobe antes do SQL, por regra da
 * casa. Isso e 503, nao 500: a diferenca e "volte depois" contra "algo
 * quebrou", e so a primeira e verdade nessa janela.
 */
function ehTabelaAusente(error: { code?: string; message?: string }): boolean {
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("project_submissions");
}

function indisponivel() {
  return createError(503, "feature_unavailable", "Entrega indisponível agora.");
}

function serializar(row: LinhaEntrega) {
  return {
    projectId: row.project_id as string,
    tipoEntrega: row.tipo_entrega as string,
    deployUrl: (row.deploy_url ?? null) as string | null,
    repoUrl: (row.repo_url ?? null) as string | null,
    artifactUrl: (row.artifact_url ?? null) as string | null,
    retro: (row.retro ?? {}) as Record<string, unknown>,
    isPublic: row.is_public === true,
    publicCode: row.public_code as string,
    status: row.status as string,
    autoCheck: (row.auto_check ?? null) as ResultadoCheck[] | null,
    autoCheckAt: (row.auto_check_at ?? null) as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Resolve o id, confere o catalogo e carrega o detalhe v2. Ordem fail-closed. */
async function resolverProjeto(bruto: string) {
  const projectId = resolveProjectId(bruto);
  const projeto = projetos.find((p) => p.id === projectId);
  if (!projeto)
    return { erro: createError(404, "not_found", "Projeto não encontrado.") };
  const detalhe = await loadProjetoV2(projectId);
  if (!detalhe)
    return {
      erro: createError(
        400,
        "validation_unavailable",
        "Este projeto ainda não tem entrega por link.",
      ),
    };
  return { projectId, detalhe };
}

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("project_submissions")
      .select(CAMPOS)
      .eq("user_id", req.user!.id)
      .order("updated_at", { ascending: false });

    if (error) {
      if (ehTabelaAusente(error)) return next(indisponivel());
      return next(
        montarDbError(
          "project-submission",
          "project-submissions list",
          error,
          "Erro ao buscar entregas.",
        ),
      );
    }

    const linhas = (data ?? []).map((row) => serializar(row as LinhaEntrega));
    res.json({
      data: dedupeByCanonicalId(
        linhas,
        (r) => r.projectId,
        (r, projectId) => ({ ...r, projectId }),
      ),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:projectId", async (req, res, next) => {
  try {
    const projectId = resolveProjectId(req.params.projectId);
    const { data, error } = await supabaseAdmin
      .from("project_submissions")
      .select(CAMPOS)
      .eq("user_id", req.user!.id)
      .in("project_id", [projectId, ...aliasesOf(projectId)])
      .order("updated_at", { ascending: false });

    if (error) {
      if (ehTabelaAusente(error)) return next(indisponivel());
      return next(
        montarDbError(
          "project-submission",
          "project-submissions load",
          error,
          "Erro ao buscar a entrega.",
        ),
      );
    }

    const linhas = data ?? [];
    if (linhas.length === 0)
      return next(
        createError(404, "not_found", "Nenhuma entrega para este projeto."),
      );
    res.json({
      data: { ...serializar(linhas[0] as LinhaEntrega), projectId },
    });
  } catch (err) {
    next(err);
  }
});

router.put("/:projectId", async (req, res, next) => {
  try {
    const alvo = await resolverProjeto(req.params.projectId);
    if (alvo.erro) return next(alvo.erro);
    const { projectId, detalhe } = alvo;

    const parsed = parseSubmissionInput(req.body, detalhe.tipoEntrega);
    if (!parsed.ok)
      return next(createError(400, "invalid_request", parsed.reason));

    const { data: existente, error: erroLeitura } = await supabaseAdmin
      .from("project_submissions")
      .select("public_code")
      .eq("user_id", req.user!.id)
      .eq("project_id", projectId)
      .maybeSingle();

    if (erroLeitura) {
      if (ehTabelaAusente(erroLeitura)) return next(indisponivel());
      return next(
        montarDbError(
          "project-submission",
          "project-submissions read before upsert",
          erroLeitura,
          "Erro ao salvar a entrega.",
        ),
      );
    }

    const codigoExistente = (existente as { public_code?: string } | null)
      ?.public_code;

    // Reenviar zera a verificacao: os links mudaram, entao o resultado antigo
    // deixou de valer. Manter o `verificado` seria afirmar sobre um link que
    // ninguem conferiu.
    const base = {
      user_id: req.user!.id,
      project_id: projectId,
      tipo_entrega: detalhe.tipoEntrega,
      deploy_url: parsed.value.deployUrl ?? null,
      repo_url: parsed.value.repoUrl ?? null,
      artifact_url: parsed.value.artifactUrl ?? null,
      retro: parsed.value.retro ?? {},
      is_public: parsed.value.isPublic,
      status: "entregue",
      auto_check: null,
      auto_check_at: null,
      updated_at: new Date().toISOString(),
    };

    for (let tentativa = 0; tentativa < 3; tentativa += 1) {
      const { data, error } = await supabaseAdmin
        .from("project_submissions")
        .upsert(
          { ...base, public_code: codigoExistente ?? gerarPublicCode() },
          { onConflict: "user_id,project_id" },
        )
        .select(CAMPOS)
        .single();

      if (!error) return res.json({ data: serializar(data as LinhaEntrega) });
      if (ehTabelaAusente(error)) return next(indisponivel());
      // 23505 no indice do codigo publico: sorteio colidiu, tenta de novo.
      const colisaoDeCodigo =
        error.code === "23505" && (error.message ?? "").includes("public_code");
      if (!colisaoDeCodigo || codigoExistente) {
        return next(
          montarDbError(
            "project-submission",
            "project-submissions upsert",
            error,
            "Erro ao salvar a entrega.",
          ),
        );
      }
    }

    return next(createError(500, "db_error", "Erro ao salvar a entrega."));
  } catch (err) {
    next(err);
  }
});

router.post("/:projectId/verify", async (req, res, next) => {
  try {
    const alvo = await resolverProjeto(req.params.projectId);
    if (alvo.erro) return next(alvo.erro);
    const { projectId, detalhe } = alvo;

    const { data: linha, error: erroLeitura } = await supabaseAdmin
      .from("project_submissions")
      .select(CAMPOS)
      .eq("user_id", req.user!.id)
      .eq("project_id", projectId)
      .maybeSingle();

    if (erroLeitura) {
      if (ehTabelaAusente(erroLeitura)) return next(indisponivel());
      return next(
        montarDbError(
          "project-submission",
          "project-submissions read before verify",
          erroLeitura,
          "Erro ao verificar a entrega.",
        ),
      );
    }
    if (!linha)
      return next(
        createError(404, "not_found", "Nenhuma entrega para este projeto."),
      );

    const entrega = serializar(linha as LinhaEntrega);
    if (entrega.autoCheckAt) {
      const desde = Date.now() - new Date(entrega.autoCheckAt).getTime();
      if (desde < INTERVALO_VERIFY_MS) {
        const retryAfter = Math.ceil((INTERVALO_VERIFY_MS - desde) / 1000);
        return next(
          createError(
            429,
            "rate_limited",
            `Espere ${retryAfter}s para verificar de novo.`,
            { context: { retryAfter } },
          ),
        );
      }
    }

    const resultados = await rodarChecagens(
      {
        checks: detalhe.verificacaoAutomatica ?? [],
        deployUrl: entrega.deployUrl,
        repoUrl: entrega.repoUrl,
        artifactUrl: entrega.artifactUrl,
      },
      AbortSignal.timeout(ORCAMENTO_CHECAGEM_MS),
    );

    // `verificado` so com TODAS em ok. Uma checagem em `erro` nao vira
    // aprovacao: nao conseguimos olhar nao e o mesmo que estar certo.
    const todasOk =
      resultados.length > 0 && resultados.every((r) => r.status === "ok");
    const agora = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("project_submissions")
      .update({
        auto_check: resultados,
        auto_check_at: agora,
        status: todasOk ? "verificado" : "entregue",
        updated_at: agora,
      })
      .eq("user_id", req.user!.id)
      .eq("project_id", projectId)
      .select(CAMPOS)
      .single();

    if (error) {
      if (ehTabelaAusente(error)) return next(indisponivel());
      return next(
        montarDbError(
          "project-submission",
          "project-submissions save verify",
          error,
          "Erro ao verificar a entrega.",
        ),
      );
    }

    res.json({ data: serializar(data as LinhaEntrega) });
  } catch (err) {
    next(err);
  }
});

export default router;
