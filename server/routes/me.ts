import * as Sentry from "@sentry/node";
import { Router } from "express";
import type { Request } from "express";

import { isValidCpf } from "../../shared/certificates/types";
import {
  isFiscalDocumentType,
  isValidCep,
  isValidCnpj,
  isValidUf,
  onlyDigits,
  resolveFiscalDocumentType,
  type FiscalIdentityFields,
} from "../../shared/fiscalIdentity";
import { prepararExclusaoDeConta } from "../lib/accountDeletion";
import { PRO_AVATAR_BORDERS } from "../lib/avatarBorders";
import { env } from "../lib/env";
import { unblockFiscalInvoices } from "../lib/fiscalQueue";
import { enqueueEmail } from "../lib/queue";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { checkProStatus, requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import { GENDER_VALUES, type Gender } from "../../shared/gender";
import { montarDbError } from "../lib/dbError";

/**
 * `db_error` COM a causa real encadeada.
 *
 * Sem isto o 500 chega ao Sentry so com a mensagem generica: sem codigo do
 * Postgres, sem operacao, sem nada que diga o que quebrou. Foi assim que
 * "Erro ao atualizar perfil" e "Erro ao buscar notas fiscais" viraram cards
 * indiagnosticaveis. `erroEncadeavel` existe porque o postgrest-js, no modo
 * `{ data, error }`, devolve um objeto PLANO, e o `linkedErrorsIntegration`
 * do Sentry so percorre `cause` que passe em `instanceof Error`.
 *
 * `pgCode` entra SO quando existe: num `catch` o que chega e um `Error`, que
 * nao tem `code`, e um campo vazio no contexto seria ruido para alguem
 * interpretar depois.
 */
function dbError(
  op: string,
  error: unknown,
  message: string,
  extra?: Record<string, unknown>,
) {
  return montarDbError("me", op, error, message, extra);
}

import {
  MAX_PROFILE_SKILLS,
  SKILL_KINDS,
  SKILL_LEVELS,
  type SkillKind,
  type SkillLevel,
} from "../../shared/profileSkills";
import {
  EDITABLE_FIELDS,
  PROFILE_TEXT_LIMITS,
  PROFILE_URL_FIELDS,
  PROFILE_URL_MAX,
  validateProfileTextValue,
  validateProfileUrlValue,
} from "../../shared/profileFields";

const router = Router();

const GENDER_SET = new Set<string>(GENDER_VALUES);
const SKILL_KIND_SET = new Set<string>(SKILL_KINDS);
const SKILL_LEVEL_SET = new Set<string>(SKILL_LEVELS);

const SKILL_TEXT_MAX = 80;

const AVATAR_VALUES = {
  avatar_border: new Set([
    "classic",
    "purple",
    "gold",
    "pink",
    "green",
    "blue",
    "orange",
    "red",
    "cyan",
    "pro-rgb",
    "pro-holo",
    "pro-godzilla",
    "pro-storm",
  ]),
  avatar_icon: new Set([
    "initials",
    "code",
    "sparkles",
    "rocket",
    "brain",
    "laptop",
    "star",
    "target",
    "crown",
  ]),
  avatar_bg: new Set([
    "slate",
    "yellow",
    "purple",
    "pink",
    "green",
    "blue",
    "orange",
    "cream",
    "white",
  ]),
} as const;

router.use(requireAuth);

function profileNameFromAuth(req: Request) {
  const metadata = req.user?.userMetadata || {};
  const metadataName =
    metadata.name || metadata.full_name || metadata.user_name;
  if (typeof metadataName === "string" && metadataName.trim())
    return metadataName.trim();
  return req.user!.email.split("@")[0];
}

function validateAvatarPreference(
  field: keyof typeof AVATAR_VALUES,
  value: unknown,
) {
  if (typeof value !== "string" || !AVATAR_VALUES[field].has(value)) {
    return createError(
      400,
      "invalid_avatar_preference",
      `Valor inválido para ${field}.`,
    );
  }

  return null;
}

// Regra em shared/profileFields.ts: a MESMA que o admin usa. Aqui so envelopa
// no createError do Express.
function validateProfileText(field: string, value: unknown) {
  const erro = validateProfileTextValue(field, value);
  return erro ? createError(400, erro.code, erro.message) : null;
}

function validateProfileUrl(field: string, value: unknown) {
  const erro = validateProfileUrlValue(field, value);
  return erro ? createError(400, erro.code, erro.message) : null;
}

async function enqueueWelcomeEmailIfNeeded(
  profile: Record<string, unknown>,
  userId: string,
  email: string,
) {
  if (profile.welcome_email_sent === true) return;

  try {
    await enqueueEmail({
      type: "welcome",
      to: email,
      name: String(profile.name || email.split("@")[0]),
      gender: (profile.gender as Gender | null | undefined) ?? null,
    });
  } catch (emailError) {
    console.error("[email] Erro ao enfileirar boas-vindas", emailError);
    return;
  }

  const { error: flagError } = await supabaseAdmin
    .from("profiles")
    .update({ welcome_email_sent: true })
    .eq("user_id", userId);
  if (flagError) {
    console.error("[email] Erro ao marcar welcome_email_sent", flagError);
  }
}

router.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error?.code === "PGRST116" || !profile) {
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: userId,
          email: req.user!.email,
          name: profileNameFromAuth(req),
        })
        .select()
        .single();

      if (insertError) {
        // 23505: outra requisicao/replica criou o profile entre o select e o
        // insert. Caso esperado sob corrida, nao erro: devolve o profile que
        // ja existe. O e-mail de boas-vindas fica por conta do vencedor da
        // corrida (que acabou de enfileirar), pra nao duplicar o envio.
        if (insertError.code === "23505") {
          const { data: existing, error: refetchError } = await supabaseAdmin
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

          if (refetchError || !existing) {
            return next(
              dbError(
                "me create profile refetch",
                refetchError,
                "Erro ao criar perfil.",
              ),
            );
          }

          return res.json({ data: existing });
        }

        return next(
          dbError(
            "me create profile insert",
            insertError,
            "Erro ao criar perfil.",
          ),
        );
      }

      void enqueueWelcomeEmailIfNeeded(newProfile, userId, req.user!.email);

      return res.json({ data: newProfile });
    }

    if (error) {
      return next(dbError("me load profile", error, "Erro ao buscar perfil."));
    }

    void enqueueWelcomeEmailIfNeeded(profile, userId, req.user!.email);

    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

router.patch("/", checkProStatus, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const body = req.body as Record<string, unknown>;

    const updates: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // Fora da whitelist de proposito: o carimbo (marketing_opt_in_at) e gravado
    // pelo SERVER, nunca vindo do cliente. Nao toca a supressao global
    // (email_suppressions), que e outra camada e vale acima do opt-in.
    //
    // Item 5.2. O carimbo passou a significar "quando a DECISAO foi registrada", e
    // nao mais "quando a pessoa consentiu". Ou seja, `false` tambem carimba.
    //
    // O motivo e que precisamos distinguir "nunca perguntado" de "perguntado e
    // recusado", e sem uma coluna nova (decisao D: sem migration neste passo) o
    // unico sinal disponivel e este carimbo. Com a regra antiga (`false` zerava o
    // carimbo) os dois estados eram literalmente a mesma linha, e por isso o card
    // do /bem-vindo voltava a perguntar a quem ja tinha dispensado.
    //
    // NULL agora significa exatamente uma coisa: nunca perguntamos.
    //
    // Seguro para o envio de e-mail: TODA decisao de envio promocional filtra por
    // `marketing_opt_in === true` (o booleano), nunca pelo carimbo. Conferido em
    // audienceReach, emailCampaignQueue, notificationAudience e
    // adminEmailCampaigns; o carimbo so aparece na listagem do admin.
    if ("marketing_opt_in" in body) {
      const value = body.marketing_opt_in;
      if (typeof value !== "boolean") {
        return next(
          createError(
            400,
            "invalid_marketing_opt_in",
            "Valor inválido para marketing_opt_in.",
          ),
        );
      }
      updates.marketing_opt_in = value;
      updates.marketing_opt_in_at = new Date().toISOString();
    }

    for (const field of Object.keys(AVATAR_VALUES) as Array<
      keyof typeof AVATAR_VALUES
    >) {
      if (field in updates) {
        const validationError = validateAvatarPreference(field, updates[field]);
        if (validationError) return next(validationError);
      }
    }

    // Pro-gate no write: borda Pro so pra quem e Pro. Usa o mesmo mecanismo do
    // upload de foto (checkProStatus monta req.isPro, com atalho de dev/localhost
    // e admin). Defesa server-side. Fail-closed: req.isPro != true -> 403.
    if (
      typeof updates.avatar_border === "string" &&
      PRO_AVATAR_BORDERS.has(updates.avatar_border) &&
      req.isPro !== true
    ) {
      return next(
        createError(
          403,
          "forbidden_pro_border",
          "Essa borda é exclusiva do Plano Pro.",
        ),
      );
    }

    if ("gender" in updates) {
      const value = updates.gender;
      if (
        value !== null &&
        (typeof value !== "string" || !GENDER_SET.has(value))
      ) {
        return next(
          createError(400, "invalid_gender", "Valor inválido para gender."),
        );
      }
    }

    // Todo campo de TEXTO passa por aqui: os que tem limite declarado (tipo +
    // tamanho) e `handle`, que nao tem limite mas precisa da checagem de TIPO.
    // Sem ela, um objeto no corpo chegava ao Postgres e virava erro de banco em
    // vez de 400 (achado da Fatia 5a). A regra e a mesma que a rota do admin
    // usa: shared/profileFields.ts.
    for (const field of [...Object.keys(PROFILE_TEXT_LIMITS), "handle"]) {
      if (field in updates) {
        const textError = validateProfileText(field, updates[field]);
        if (textError) return next(textError);
      }
    }

    // Identidade do certificado (C1). Ambos opcionais: mandar so um nao apaga
    // o outro (so entram em updates quando presentes no body).
    if ("full_name" in updates) {
      const value = updates.full_name;
      const trimmed = typeof value === "string" ? value.trim() : "";
      const words = trimmed.split(/\s+/).filter(Boolean);
      if (
        typeof value !== "string" ||
        trimmed.length > 120 ||
        words.length < 2 ||
        !words.every((word) => word.length >= 2)
      ) {
        return next(
          createError(
            400,
            "invalid_full_name",
            "Informe o nome completo (nome e sobrenome).",
          ),
        );
      }
      updates.full_name = trimmed;
    }

    // CPF: aceita mascara, GRAVA SO DIGITOS. 400 se os digitos verificadores
    // nao baterem.
    if ("cpf" in updates) {
      const value = updates.cpf;
      const digits = typeof value === "string" ? value.replace(/\D/g, "") : "";
      if (typeof value !== "string" || !isValidCpf(digits)) {
        return next(createError(400, "invalid_cpf", "CPF inválido."));
      }
      updates.cpf = digits;
    }

    // ---------------------------------------------------------------------
    // Identidade fiscal (Fase 2 da NFS-e).
    //
    // Os campos abaixo aceitam LIMPEZA (null ou string vazia viram null), ao
    // contrario do cpf logo acima, que so aceita um CPF valido. A diferenca e
    // deliberada e tem caso de uso: quem troca a preferencia de CNPJ para CPF
    // precisa poder apagar o CNPJ, e quem digitou o endereco errado precisa
    // poder esvaziar o campo. Nao mexi na regra do cpf porque ela e do
    // certificado e mudar o contrato dela nao e desta tarefa.
    // ---------------------------------------------------------------------

    /**
     * null/"" -> null (limpar). Qualquer outra coisa devolve a string crua, e
     * `undefined` sinaliza tipo errado no corpo.
     *
     * Arrow function em `const`, e nao `function`: declaracao de funcao dentro
     * de bloco nao e permitida com o `target` deste tsconfig (o `tsc` reprova
     * com TS1252).
     */
    const fiscalRawValue = (value: unknown): string | null | undefined => {
      if (value === null) return null;
      if (typeof value !== "string") return undefined; // tipo errado
      return value.trim() === "" ? null : value;
    };

    if ("cnpj" in updates) {
      const raw = fiscalRawValue(updates.cnpj);
      if (raw === undefined) {
        return next(createError(400, "invalid_cnpj", "CNPJ inválido."));
      }
      if (raw === null) {
        updates.cnpj = null;
      } else {
        const digits = onlyDigits(raw);
        if (!isValidCnpj(digits)) {
          return next(createError(400, "invalid_cnpj", "CNPJ inválido."));
        }
        updates.cnpj = digits;
      }
    }

    if ("fiscal_documento_preferencia" in updates) {
      const raw = fiscalRawValue(updates.fiscal_documento_preferencia);
      if (raw === undefined || (raw !== null && !isFiscalDocumentType(raw))) {
        return next(
          createError(
            400,
            "invalid_fiscal_document_type",
            "Tipo de documento fiscal inválido.",
          ),
        );
      }
      updates.fiscal_documento_preferencia = raw;
    }

    if ("endereco_cep" in updates) {
      const raw = fiscalRawValue(updates.endereco_cep);
      if (raw === undefined) {
        return next(createError(400, "invalid_cep", "CEP inválido."));
      }
      if (raw === null) {
        updates.endereco_cep = null;
      } else {
        const digits = onlyDigits(raw);
        if (!isValidCep(digits)) {
          return next(createError(400, "invalid_cep", "CEP inválido."));
        }
        updates.endereco_cep = digits;
      }
    }

    if ("endereco_uf" in updates) {
      const raw = fiscalRawValue(updates.endereco_uf);
      if (raw === undefined || (raw !== null && !isValidUf(raw))) {
        return next(createError(400, "invalid_uf", "UF inválida."));
      }
      // Normaliza para maiuscula: a lista e fechada e "sp" e "SP" sao a mesma
      // UF, mas gravar as duas grafias faria qualquer comparacao futura errar.
      updates.endereco_uf = raw === null ? null : raw.trim().toUpperCase();
    }

    if ("endereco_codigo_municipio" in updates) {
      const raw = fiscalRawValue(updates.endereco_codigo_municipio);
      if (raw === undefined) {
        return next(
          createError(
            400,
            "invalid_municipio",
            "Código de município inválido.",
          ),
        );
      }
      if (raw === null) {
        updates.endereco_codigo_municipio = null;
      } else {
        const digits = onlyDigits(raw);
        // Codigo IBGE de municipio tem 7 digitos, sempre.
        if (digits.length !== 7) {
          return next(
            createError(
              400,
              "invalid_municipio",
              "Código de município inválido.",
            ),
          );
        }
        updates.endereco_codigo_municipio = digits;
      }
    }

    // Consistencia da PESSOA JURIDICA, verificada sobre o estado FINAL (o que
    // esta no banco mais o que este PATCH muda), nunca so sobre o corpo.
    //
    // O corpo sozinho nao responde a pergunta: um PATCH que manda apenas
    // `fiscal_documento_preferencia: "cnpj"` e valido se o CNPJ e a razao social
    // ja estiverem gravados, e invalido se nao estiverem. Validar so o payload
    // deixaria passar o segundo caso, e o resultado seria uma nota bloqueada
    // depois do pagamento, que e tarde demais para descobrir.
    const FISCAL_FIELDS = [
      "cnpj",
      "razao_social",
      "fiscal_documento_preferencia",
      "endereco_cep",
      "endereco_logradouro",
      "endereco_numero",
      "endereco_complemento",
      "endereco_bairro",
      "endereco_cidade",
      "endereco_uf",
      "endereco_codigo_municipio",
      "full_name",
      "cpf",
    ];
    const tocaFiscal = FISCAL_FIELDS.some((field) => field in updates);

    if (tocaFiscal) {
      const { data: atual } = await supabaseAdmin
        .from("profiles")
        .select("cnpj, razao_social, fiscal_documento_preferencia")
        .eq("user_id", userId)
        .maybeSingle();

      const final = {
        ...(atual ?? {}),
        ...updates,
      } as FiscalIdentityFields;

      if (resolveFiscalDocumentType(final) === "cnpj") {
        const cnpjFinal = onlyDigits(final.cnpj);
        const razaoFinal = (final.razao_social ?? "").trim();
        if (!isValidCnpj(cnpjFinal) || !razaoFinal) {
          return next(
            createError(
              400,
              "fiscal_cnpj_incomplete",
              "Para emitir nota com CNPJ, informe CNPJ válido e razão social.",
            ),
          );
        }
      }
    }

    for (const field of PROFILE_URL_FIELDS) {
      if (field in updates) {
        const urlError = validateProfileUrl(field, updates[field]);
        if (urlError) return next(urlError);
      }
    }

    if (Object.keys(updates).length === 0) {
      return next(
        createError(
          400,
          "invalid_request",
          "Nenhum campo válido para atualizar.",
        ),
      );
    }

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return next(
        dbError("me update profile", error, "Erro ao atualizar perfil."),
      );
    }

    // Destravamento das notas fiscais que pararam por falta de cadastro.
    //
    // MESMO CONTRATO DE ERRO DOS GANCHOS DA FASE 1: nada aqui pode derrubar o
    // save do perfil. O usuario acabou de corrigir um dado; devolver erro
    // porque a fila fiscal falhou faria a correcao parecer recusada, e ele
    // tentaria de novo (gravando o mesmo dado) sem que o problema real fosse
    // esse. O que escapar daqui e coberto pela reconciliacao da Fase 4, que
    // chama exatamente esta funcao.
    if (env.nfseEnabled && tocaFiscal) {
      try {
        await unblockFiscalInvoices(userId);
      } catch (fiscalErr) {
        console.error(
          `[fiscal] falha ao destravar notas do usuario ${userId}; perfil SALVO normalmente:`,
          fiscalErr,
        );
        Sentry.captureException(fiscalErr);
      }
    }

    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

router.get("/roadmaps", async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const { data: progress, error: progressError } = await supabaseAdmin
      .from("user_roadmap_progress")
      .select("roadmap_id, step_id, status")
      .eq("user_id", userId);

    if (progressError) {
      return next(
        dbError(
          "me load roadmap progress",
          progressError,
          "Erro ao buscar progresso de roadmaps.",
        ),
      );
    }

    if (!progress || progress.length === 0) {
      return res.json({ data: [] });
    }

    const completedByRoadmap = new Map<string, number>();
    for (const row of progress) {
      if (row.status !== "completed") continue;
      const id = String(row.roadmap_id);
      completedByRoadmap.set(id, (completedByRoadmap.get(id) || 0) + 1);
    }

    const roadmapIds = Array.from(
      new Set(progress.map((row) => String(row.roadmap_id))),
    );

    const { data: roadmaps, error: roadmapsError } = await supabaseAdmin
      .from("roadmaps")
      .select("id, slug, title, area_slug, roadmap_steps(count)")
      .in("id", roadmapIds);

    if (roadmapsError) {
      return next(
        dbError("me load roadmaps", roadmapsError, "Erro ao buscar trilhas."),
      );
    }

    const result = (roadmaps || [])
      .map((roadmap) => {
        const totalSteps = Number(
          Array.isArray(roadmap.roadmap_steps) &&
            roadmap.roadmap_steps.length > 0
            ? roadmap.roadmap_steps[0].count || 0
            : 0,
        );
        const completed = completedByRoadmap.get(String(roadmap.id)) || 0;
        const progressPercent =
          totalSteps > 0
            ? Math.min(Math.round((completed / totalSteps) * 100), 100)
            : 0;

        return {
          id: roadmap.id,
          slug: roadmap.slug,
          title: roadmap.title,
          areaSlug: roadmap.area_slug,
          total_steps: totalSteps,
          completed_steps: completed,
          progress: progressPercent,
        };
      })
      .sort((a, b) => b.progress - a.progress);

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// EXCLUSAO DE CONTA. A ORDEM AQUI E A CORRECAO (D8).
//
// Ate 2026-08-14 esta rota chamava `deleteUser` e nada mais. Como todos os FKs
// para `auth.users` sao ON DELETE CASCADE, `subscriptions` (e com ela o
// `provider_customer_id`) desaparecia no mesmo instante, e a assinatura na
// Stripe ficava viva, cobrando alguem que nao existe mais no produto. Foi
// exatamente isso que aconteceu com `sub_1Tv4SX...` (ver
// docs/investigacoes/2026-08-14-admin-visao-metricas.md).
//
// Por isso a Stripe vem PRIMEIRO: depois do delete nao ha mais como descobrir
// quem era o customer. E por isso a falha dela ABORTA a exclusao: conta apagada
// com cobranca viva e o pior dos estados possiveis, e e irreversivel do lado do
// banco.
router.delete("/", async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // FAIL-CLOSED. Se isto lancar, o `deleteUser` abaixo NAO roda.
    let preparacao;
    try {
      preparacao = await prepararExclusaoDeConta(userId);
    } catch (err) {
      const mensagem =
        `[me] exclusao ABORTADA para ${userId}: nao foi possivel encerrar a ` +
        `assinatura na Stripe. Causa: ${err instanceof Error ? err.message : String(err)}`;
      console.error(mensagem);
      try {
        Sentry.captureException(err, {
          level: "error",
          tags: { area: "account-deletion", etapa: "stripe" },
          extra: { deleted_user_id: userId },
          fingerprint: ["account-deletion-stripe"],
        });
      } catch {
        // Sentry desligado: no-op, o console.error acima ja e o rastro.
      }
      return next(
        createError(
          502,
          "subscription_cancel_failed",
          "Não foi possível encerrar sua assinatura agora, então a conta NÃO foi excluída. Tente de novo em alguns minutos.",
        ),
      );
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      // A assinatura JA foi cancelada e a conta continua de pe. E um estado
      // meio-feito, e ele precisa aparecer nomeado em vez de virar so um 500.
      console.error(
        `[me] INCONSISTENCIA: assinatura de ${userId} cancelada na Stripe, mas a conta NAO foi excluida:`,
        error,
      );
      try {
        Sentry.captureMessage(
          "[account-deletion] assinatura cancelada e conta NAO excluida",
          {
            level: "error",
            tags: { area: "account-deletion", etapa: "supabase" },
            extra: {
              deleted_user_id: userId,
              canceladas: preparacao.canceladas,
            },
            fingerprint: ["account-deletion-supabase"],
          },
        );
      } catch {
        // Sentry desligado: no-op.
      }
      return next(
        createError(500, "delete_account_failed", "Erro ao excluir conta."),
      );
    }

    console.log(
      `[me] Conta excluída: ${userId} (assinaturas canceladas: ${preparacao.canceladas.length})`,
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

type SkillRow = {
  user_id: string;
  kind: SkillKind;
  slug: string;
  label: string;
  level: SkillLevel;
};

router.get("/skills", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { data, error } = await supabaseAdmin
      .from("profile_skills")
      .select("kind, slug, label, level")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      return next(dbError("me load skills", error, "Erro ao buscar skills."));
    }

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.put("/skills", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const body = req.body as { skills?: unknown };
    const rawSkills = body.skills;

    if (!Array.isArray(rawSkills)) {
      return next(
        createError(400, "invalid_request", "skills deve ser uma lista."),
      );
    }
    if (rawSkills.length > MAX_PROFILE_SKILLS) {
      return next(
        createError(
          400,
          "invalid_request",
          `Máximo de ${MAX_PROFILE_SKILLS} skills.`,
        ),
      );
    }

    const seen = new Set<string>();
    const rows: SkillRow[] = [];

    for (const item of rawSkills) {
      if (typeof item !== "object" || item === null) {
        return next(
          createError(400, "invalid_request", "Item de skill inválido."),
        );
      }
      const entry = item as Record<string, unknown>;
      const { kind, slug, label, level } = entry;

      if (typeof kind !== "string" || !SKILL_KIND_SET.has(kind)) {
        return next(createError(400, "invalid_request", "kind inválido."));
      }
      if (typeof level !== "string" || !SKILL_LEVEL_SET.has(level)) {
        return next(createError(400, "invalid_request", "level inválido."));
      }
      if (
        typeof slug !== "string" ||
        !slug.trim() ||
        slug.length > SKILL_TEXT_MAX
      ) {
        return next(createError(400, "invalid_request", "slug inválido."));
      }
      if (
        typeof label !== "string" ||
        !label.trim() ||
        label.length > SKILL_TEXT_MAX
      ) {
        return next(createError(400, "invalid_request", "label inválido."));
      }

      const key = `${kind}:${slug.trim()}`;
      if (seen.has(key)) {
        return next(
          createError(400, "invalid_request", "skill duplicada (kind + slug)."),
        );
      }
      seen.add(key);

      rows.push({
        user_id: userId,
        kind: kind as SkillKind,
        slug: slug.trim(),
        label: label.trim(),
        level: level as SkillLevel,
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("profile_skills")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      return next(
        dbError(
          "me replace skills delete",
          deleteError,
          "Erro ao atualizar skills.",
        ),
      );
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("profile_skills")
        .insert(rows);

      if (insertError) {
        return next(
          dbError(
            "me replace skills insert",
            insertError,
            "Erro ao salvar skills.",
          ),
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("profile_skills")
      .select("kind, slug, label, level")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      return next(dbError("me reload skills", error, "Erro ao buscar skills."));
    }

    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

export default router;
