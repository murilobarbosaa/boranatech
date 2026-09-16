import { Router } from "express";

import { LIMITE_DE_REGISTROS_POR_DIA } from "../../shared/creatorPost";
import type { CodigoDeChavePix } from "../../shared/creatorProfile";
import {
  montarPainelDoCreator,
  parseJanelaDoPainel,
} from "../lib/creatorDashboard";
import {
  listarPublicacoes,
  registrarPublicacao,
  removerPublicacao,
  type CodigoDeRegistro,
} from "../lib/creatorPosts";
import {
  lerPerfilDoCreator,
  removerChavePix,
  salvarChavePix,
  salvarPerfilDoCreator,
  validarEntradaDoPerfil,
  type CodigoDoPerfil,
} from "../lib/creatorProfile";
import { montarDbError } from "../lib/dbError";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/error";
import {
  requireCreator,
  resolverCreatorKind,
} from "../middleware/requireCreator";

const router = Router();

router.use(requireAuth);

// Status de creator do usuario logado. So requireAuth, NAO requireCreator: e o
// que o header usa para decidir se mostra o botao "Creator", entao responde
// para qualquer usuario autenticado, creator ou nao.
//
// Erro de consulta vira 503 `creator_status_unavailable`, NUNCA `kind: null`:
// null quer dizer "nao e creator", e devolve-lo por falha de infraestrutura
// esconderia o botao de um creator como se ele nao fosse um.
router.get("/status", async (req, res, next) => {
  try {
    const kind = await resolverCreatorKind(req.user!.id);
    // Envelope `data` como o resto da API (/me e as rotas do admin): o client
    // do lote 03 le todas as respostas de sucesso do mesmo jeito.
    res.json({ data: { kind } });
  } catch (err) {
    return next(
      createError(
        503,
        "creator_status_unavailable",
        // TODO(Ana)
        "Não foi possível verificar seu acesso de creator agora.",
        { cause: err, context: { op: "creator status" } },
      ),
    );
  }
});

// Painel do proprio creator. requireCreator aqui, e nao no router inteiro,
// porque /status acima responde para qualquer usuario autenticado.
router.get("/me", requireCreator, async (req, res, next) => {
  const janela = parseJanelaDoPainel(req.query.janela);
  if (!janela) {
    return next(
      createError(
        400,
        "invalid_janela",
        // TODO(Ana)
        "Janela inválida. Use 7d, 30d, 90d ou all.",
      ),
    );
  }
  try {
    const resultado = await montarPainelDoCreator(
      req.user!.id,
      janela,
      "creator",
    );
    // A guarda acabou de confirmar a concessao; chegar aqui sem ela e revogacao
    // entre a guarda e a leitura (ou cache de ate 60s). O painel nao abre.
    if (!resultado.ok) {
      return next(
        createError(
          403,
          "not_creator",
          // TODO(Ana)
          "Acesso de creator necessário.",
        ),
      );
    }
    res.json({ data: resultado.painel });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "painel do creator",
        err,
        // TODO(Ana)
        "Erro ao carregar o painel.",
      ),
    );
  }
});

// PERFIL DE CREATOR (lote 08): redes, seguidores declarados, consentimento e a
// chave Pix de comissao. requireCreator em cada rota, como em /me. A chave sai
// sempre MASCARADA: a inteira so existe na revelacao auditada do admin.
//
// Um codigo por campo no 400, que e o que o client usa para apontar o campo.
// As mensagens sao de tela.

// TODO(Ana)
const MENSAGEM_DO_PERFIL: Record<CodigoDoPerfil, string> = {
  invalid_body: "Envie os dados do perfil.",
  invalid_visible_to_creators:
    "Diga se o seu @ pode aparecer para outros creators.",
  invalid_instagram_handle:
    "@ do Instagram inválido. Use até 30 letras, números, ponto ou sublinhado.",
  invalid_tiktok_handle:
    "@ do TikTok inválido. Use de 2 a 24 letras, números, ponto ou sublinhado.",
  invalid_instagram_followers:
    "Seguidores do Instagram: use um número inteiro de 0 a 100 milhões.",
  invalid_tiktok_followers:
    "Seguidores do TikTok: use um número inteiro de 0 a 100 milhões.",
};

// TODO(Ana)
const MENSAGEM_DA_CHAVE: Record<CodigoDeChavePix, string> = {
  invalid_pix_type: "Tipo de chave Pix inválido.",
  invalid_pix_cpf: "CPF inválido.",
  invalid_pix_cnpj: "CNPJ inválido.",
  invalid_pix_email: "E-mail inválido.",
  invalid_pix_telefone: "Telefone inválido. Informe o DDD e o número.",
  invalid_pix_aleatoria: "Chave aleatória inválida.",
};

router.get("/profile", requireCreator, async (req, res, next) => {
  try {
    res.json({ data: await lerPerfilDoCreator(req.user!.id) });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "perfil do creator",
        err,
        // TODO(Ana)
        "Erro ao carregar o seu perfil.",
      ),
    );
  }
});

router.put("/profile", requireCreator, async (req, res, next) => {
  const entrada = validarEntradaDoPerfil(req.body);
  if (!entrada.ok) {
    return next(
      createError(400, entrada.code, MENSAGEM_DO_PERFIL[entrada.code]),
    );
  }
  try {
    res.json({
      data: await salvarPerfilDoCreator(req.user!.id, entrada.valor),
    });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "salvar perfil do creator",
        err,
        // TODO(Ana)
        "Erro ao salvar o seu perfil.",
      ),
    );
  }
});

router.put("/pix", requireCreator, async (req, res, next) => {
  const corpo: Record<string, unknown> =
    typeof req.body === "object" && req.body !== null ? req.body : {};
  try {
    const chave = await salvarChavePix(req.user!.id, corpo.tipo, corpo.valor);
    if (!chave.ok) {
      return next(createError(400, chave.code, MENSAGEM_DA_CHAVE[chave.code]));
    }
    res.json({ data: { pix: chave.valor } });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "salvar chave pix",
        err,
        // TODO(Ana)
        "Erro ao salvar a sua chave Pix.",
      ),
    );
  }
});

router.delete("/pix", requireCreator, async (req, res, next) => {
  try {
    await removerChavePix(req.user!.id);
    res.json({ data: { pix: null } });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "remover chave pix",
        err,
        // TODO(Ana)
        "Erro ao remover a sua chave Pix.",
      ),
    );
  }
});

// PUBLICACOES REGISTRADAS (lote 09): o creator cola o link de um post ou reel
// do Instagram, ou de um video do TikTok, e a plataforma registra. Sem
// verificacao de conteudo: quem julga e o admin, que ve a lista e remove.
//
// Um codigo por causa, e um status por codigo: link errado e 400, publicacao
// repetida e 409 (vem do unique do banco, nao de um select antes), e teto
// diario e 429. Tres coisas diferentes que a tela precisa dizer diferente.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS_DA_PUBLICACAO: Record<CodigoDeRegistro, number> = {
  invalid_post_url: 400,
  short_link_unsupported: 400,
  post_already_registered: 409,
  post_daily_limit: 429,
};

// TODO(Ana)
const MENSAGEM_DA_PUBLICACAO: Record<CodigoDeRegistro, string> = {
  invalid_post_url:
    "Link inválido. Cole o link de um post ou reel do Instagram, ou de um vídeo do TikTok.",
  short_link_unsupported:
    "Link curto não dá para registrar. Abra o link e cole o endereço completo da publicação.",
  post_already_registered: "Você já registrou esta publicação.",
  // O numero sai da constante: mensagem com o teto escrito a mao diverge da
  // regra na primeira vez que alguem mudar o teto.
  post_daily_limit: `Você já registrou ${LIMITE_DE_REGISTROS_POR_DIA} publicações hoje. Tente de novo amanhã.`,
};

router.get("/posts", requireCreator, async (req, res, next) => {
  try {
    res.json({ data: await listarPublicacoes(req.user!.id) });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "publicacoes do creator",
        err,
        // TODO(Ana)
        "Erro ao carregar as suas publicações.",
      ),
    );
  }
});

router.post("/posts", requireCreator, async (req, res, next) => {
  const corpo: Record<string, unknown> =
    typeof req.body === "object" && req.body !== null ? req.body : {};
  try {
    const registro = await registrarPublicacao(req.user!.id, corpo.url);
    if (!registro.ok) {
      return next(
        createError(
          STATUS_DA_PUBLICACAO[registro.code],
          registro.code,
          MENSAGEM_DA_PUBLICACAO[registro.code],
        ),
      );
    }
    res.status(201).json({ data: { post: registro.valor } });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "registrar publicacao",
        err,
        // TODO(Ana)
        "Erro ao registrar a publicação.",
      ),
    );
  }
});

router.delete("/posts/:id", requireCreator, async (req, res, next) => {
  const id = req.params.id;
  if (!UUID_RE.test(id)) {
    return next(
      createError(
        400,
        "invalid_post_id",
        // TODO(Ana)
        "Identificador de publicação inválido.",
      ),
    );
  }
  try {
    // O dono entra no proprio DELETE (server/lib/creatorPosts.ts), entao id de
    // outra pessoa nao apaga nada e cai no 404 abaixo.
    const removida = await removerPublicacao(req.user!.id, id);
    if (!removida) {
      return next(
        createError(
          404,
          "post_not_found",
          // TODO(Ana)
          "Publicação não encontrada.",
        ),
      );
    }
    res.json({ data: { id } });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "remover publicacao",
        err,
        // TODO(Ana)
        "Erro ao remover a publicação.",
      ),
    );
  }
});

export default router;
