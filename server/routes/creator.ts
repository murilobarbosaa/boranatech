import { Router } from "express";

import { diaBrasilia, formatarDiaCivil } from "../../shared/brasiliaDay";
import {
  JANELA_DE_DIAS,
  LIMITE_DE_PEDIDOS_POR_DIA,
  MENSAGEM_MAX,
  NOTA_MAX,
  parseMesDoCalendario,
} from "../../shared/creatorCalendar";
import { LIMITE_DE_REGISTROS_POR_DIA } from "../../shared/creatorPost";
import type {
  CodigoDeChavePix,
  RedeDeCreator,
} from "../../shared/creatorProfile";
import {
  desmarcarDia,
  lerContato,
  listarMesDoCalendario,
  listarPedidosDeCollab,
  marcarDia,
  pedirCollab,
  responderPedidoDeCollab,
  type CodigoDaResposta,
  type CodigoDeMarcacao,
  type CodigoDoPedido,
  type ContatoDoCreator,
  type MarcacaoDoCalendario,
  type PedidoDeCollab,
} from "../lib/creatorCalendar";
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
import {
  sendCreatorCollabRequestEmail,
  sendCreatorCollabResponseEmail,
} from "../lib/email";
import { createTargetedNotification } from "../lib/targetedNotifications";
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

// CALENDARIO COMPARTILHADO E COLLAB (lote 10). A leitura do mes devolve as
// marcacoes de TODOS os creators; a escrita e sempre do proprio. Os avisos
// (notificacao in-app e e-mail) saem DEPOIS de a escrita ter dado certo, e a
// falha deles NAO desfaz o pedido: quem pediu ja pediu, e perder o pedido para
// salvar o aviso seria trocar o dado pelo recado.

const STATUS_DA_MARCACAO: Record<CodigoDeMarcacao, number> = {
  invalid_date: 400,
  date_out_of_window: 400,
  invalid_note: 400,
  invalid_network: 400,
  event_already_marked: 409,
};

// TODO(Ana)
const MENSAGEM_DA_MARCACAO: Record<CodigoDeMarcacao, string> = {
  invalid_date: "Data inválida.",
  date_out_of_window: `Escolha um dia entre hoje e os próximos ${JANELA_DE_DIAS} dias.`,
  invalid_note: `O assunto pode ter até ${NOTA_MAX} caracteres.`,
  invalid_network: "Escolha Instagram ou TikTok.",
  event_already_marked: "Você já marcou esse dia nessa rede.",
};

const STATUS_DO_PEDIDO: Record<CodigoDoPedido, number> = {
  invalid_message: 400,
  event_not_found: 404,
  own_event: 400,
  collab_already_requested: 409,
  collab_daily_limit: 429,
};

// TODO(Ana)
const MENSAGEM_DO_PEDIDO: Record<CodigoDoPedido, string> = {
  invalid_message: `O recado pode ter até ${MENSAGEM_MAX} caracteres.`,
  event_not_found: "Essa marcação não existe mais.",
  own_event: "Essa marcação é sua. Peça collab na de outro creator.",
  collab_already_requested: "Você já pediu collab nessa marcação.",
  // O numero sai da constante: mensagem com o teto escrito a mao diverge da
  // regra na primeira vez que alguem mudar o teto.
  collab_daily_limit: `Você já pediu ${LIMITE_DE_PEDIDOS_POR_DIA} collabs hoje. Tente de novo amanhã.`,
};

const STATUS_DA_RESPOSTA: Record<CodigoDaResposta, number> = {
  collab_not_found: 404,
  collab_already_answered: 409,
};

// TODO(Ana)
const MENSAGEM_DA_RESPOSTA: Record<CodigoDaResposta, string> = {
  collab_not_found: "Pedido não encontrado.",
  collab_already_answered: "Esse pedido já foi respondido.",
};

// Rede -> rotulo do e-mail. Acesso direto e nao resolver com fallback: a chave
// vem da uniao fechada que o proprio server validou na escrita, e nao de um
// valor livre do banco (o criterio e a ORIGEM da chave, nao a forma do acesso).
// TODO(Ana)
const ROTULO_DA_REDE: Record<RedeDeCreator, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
};

/** Dia civil de Brasilia de agora. Nunca nulo: a entrada e um ISO que nos
 * mesmos acabamos de gerar, entao null aqui seria defeito nosso, nao do
 * usuario. */
function hojeEmBrasilia(): string {
  const dia = diaBrasilia(new Date().toISOString());
  if (!dia) throw new Error("[creator] instante invalido ao resolver hoje");
  return dia;
}

function nomeOu(contato: ContatoDoCreator | null, padrao: string): string {
  const nome = contato?.name?.trim();
  return nome ? nome : padrao;
}

/**
 * Avisa o dono de que pediram collab. NUNCA LANCA: a falha vai para o log e o
 * pedido, que ja esta gravado, continua de pe.
 *
 * Sem e-mail em `profiles` nao ha aviso: a notificacao in-app tambem e chaveada
 * por e-mail (createTargetedNotification resolve o user_id a partir dele).
 */
async function avisarPedidoDeCollab(
  pedido: PedidoDeCollab,
  marcacao: MarcacaoDoCalendario,
): Promise<void> {
  try {
    const [dono, pedinte] = await Promise.all([
      lerContato(pedido.owner_id),
      lerContato(pedido.requester_id),
    ]);
    if (!dono?.email) {
      console.warn(
        `[creator] dono ${pedido.owner_id} sem e-mail; pedido de collab gravado sem aviso.`,
      );
      return;
    }
    // TODO(Ana)
    const pedinteNome = nomeOu(pedinte, "Outro creator");
    const diaLabel =
      formatarDiaCivil(marcacao.event_date) ?? marcacao.event_date;
    const redeLabel = ROTULO_DA_REDE[marcacao.network];
    await createTargetedNotification({
      email: dono.email,
      // TODO(Ana)
      title: "Pediram collab na sua marcação",
      body: `${pedinteNome} quer gravar uma collab com você em ${diaLabel}, no ${redeLabel}.`,
      ctaUrl: "/creator?aba=comunidade",
      // TODO(Ana)
      ctaLabel: "Ver o pedido",
    });
    await sendCreatorCollabRequestEmail(dono.email, {
      // TODO(Ana)
      donoNome: nomeOu(dono, "Oi"),
      pedinteNome,
      diaLabel,
      redeLabel,
      mensagem: pedido.message,
    });
  } catch (err) {
    console.warn("[creator] falha ao avisar do pedido de collab:", err);
  }
}

/** Avisa quem pediu do veredito. Mesmas regras do aviso acima. */
async function avisarRespostaDeCollab(
  pedido: PedidoDeCollab,
  marcacao: MarcacaoDoCalendario,
): Promise<void> {
  try {
    const [dono, pedinte] = await Promise.all([
      lerContato(pedido.owner_id),
      lerContato(pedido.requester_id),
    ]);
    if (!pedinte?.email) {
      console.warn(
        `[creator] pedinte ${pedido.requester_id} sem e-mail; resposta gravada sem aviso.`,
      );
      return;
    }
    const aceita = pedido.status === "aceita";
    // TODO(Ana)
    const donoNome = nomeOu(dono, "O creator");
    const diaLabel =
      formatarDiaCivil(marcacao.event_date) ?? marcacao.event_date;
    const redeLabel = ROTULO_DA_REDE[marcacao.network];
    await createTargetedNotification({
      email: pedinte.email,
      // TODO(Ana)
      title: aceita ? "Sua collab foi aceita!" : "Resposta sobre a sua collab",
      body: aceita
        ? `${donoNome} aceitou a collab de ${diaLabel}, no ${redeLabel}.`
        : `${donoNome} não vai fechar collab em ${diaLabel}, no ${redeLabel}.`,
      ctaUrl: "/creator?aba=comunidade",
      // TODO(Ana)
      ctaLabel: "Ver o calendário",
    });
    await sendCreatorCollabResponseEmail(pedinte.email, {
      // TODO(Ana)
      pedinteNome: nomeOu(pedinte, "Oi"),
      donoNome,
      diaLabel,
      redeLabel,
      aceita,
    });
  } catch (err) {
    console.warn("[creator] falha ao avisar da resposta de collab:", err);
  }
}

router.get("/calendar", requireCreator, async (req, res, next) => {
  const mes = parseMesDoCalendario(req.query.mes);
  if (!mes) {
    return next(
      createError(
        400,
        "month_out_of_range",
        // TODO(Ana)
        "Mês inválido. Use o formato AAAA-MM.",
      ),
    );
  }
  try {
    const marcacoes = await listarMesDoCalendario(mes.ano, mes.mes);
    res.json({ data: { marcacoes } });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "calendario do mes",
        err,
        // TODO(Ana)
        "Erro ao carregar o calendário.",
      ),
    );
  }
});

router.post("/calendar", requireCreator, async (req, res, next) => {
  const corpo: Record<string, unknown> =
    typeof req.body === "object" && req.body !== null ? req.body : {};
  try {
    const marcada = await marcarDia(req.user!.id, corpo, hojeEmBrasilia());
    if (!marcada.ok) {
      return next(
        createError(
          STATUS_DA_MARCACAO[marcada.code],
          marcada.code,
          MENSAGEM_DA_MARCACAO[marcada.code],
        ),
      );
    }
    res.status(201).json({ data: { marcacao: marcada.valor } });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "marcar dia no calendario",
        err,
        // TODO(Ana)
        "Erro ao marcar o dia.",
      ),
    );
  }
});

router.delete("/calendar/:id", requireCreator, async (req, res, next) => {
  const id = req.params.id;
  if (!UUID_RE.test(id)) {
    return next(
      createError(
        400,
        "invalid_event_id",
        // TODO(Ana)
        "Identificador de marcação inválido.",
      ),
    );
  }
  try {
    // O dono entra no proprio DELETE, entao id de outra pessoa nao apaga nada e
    // cai no 404 abaixo.
    const removida = await desmarcarDia(req.user!.id, id);
    if (!removida) {
      return next(
        createError(
          404,
          "event_not_found",
          // TODO(Ana)
          "Marcação não encontrada.",
        ),
      );
    }
    res.json({ data: { id } });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "desmarcar dia do calendario",
        err,
        // TODO(Ana)
        "Erro ao remover a marcação.",
      ),
    );
  }
});

router.post("/calendar/:id/collab", requireCreator, async (req, res, next) => {
  const id = req.params.id;
  if (!UUID_RE.test(id)) {
    return next(
      createError(
        400,
        "invalid_event_id",
        // TODO(Ana)
        "Identificador de marcação inválido.",
      ),
    );
  }
  const corpo: Record<string, unknown> =
    typeof req.body === "object" && req.body !== null ? req.body : {};
  try {
    const pedido = await pedirCollab(req.user!.id, id, corpo.message);
    if (!pedido.ok) {
      return next(
        createError(
          STATUS_DO_PEDIDO[pedido.code],
          pedido.code,
          MENSAGEM_DO_PEDIDO[pedido.code],
        ),
      );
    }
    // O aviso e depois da gravacao e nao derruba a resposta.
    await avisarPedidoDeCollab(pedido.valor.pedido, pedido.valor.marcacao);
    res.status(201).json({ data: { pedido: pedido.valor.pedido } });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "pedir collab",
        err,
        // TODO(Ana)
        "Erro ao pedir a collab.",
      ),
    );
  }
});

router.get("/collabs", requireCreator, async (req, res, next) => {
  try {
    res.json({ data: await listarPedidosDeCollab(req.user!.id) });
  } catch (err) {
    return next(
      montarDbError(
        "creator",
        "pedidos de collab",
        err,
        // TODO(Ana)
        "Erro ao carregar os pedidos de collab.",
      ),
    );
  }
});

router.post(
  "/collabs/:id/responder",
  requireCreator,
  async (req, res, next) => {
    const id = req.params.id;
    if (!UUID_RE.test(id)) {
      return next(
        createError(
          400,
          "invalid_collab_id",
          // TODO(Ana)
          "Identificador de pedido inválido.",
        ),
      );
    }
    const corpo: Record<string, unknown> =
      typeof req.body === "object" && req.body !== null ? req.body : {};
    // Booleano EXPLICITO: sem isto, um corpo vazio viraria "recusada" em silencio,
    // que e a resposta que nao da para desfazer.
    if (typeof corpo.aceita !== "boolean") {
      return next(
        createError(
          400,
          "invalid_body",
          // TODO(Ana)
          "Diga se você aceita ou recusa o pedido.",
        ),
      );
    }
    try {
      const resposta = await responderPedidoDeCollab(
        req.user!.id,
        id,
        corpo.aceita,
      );
      if (!resposta.ok) {
        return next(
          createError(
            STATUS_DA_RESPOSTA[resposta.code],
            resposta.code,
            MENSAGEM_DA_RESPOSTA[resposta.code],
          ),
        );
      }
      await avisarRespostaDeCollab(
        resposta.valor.pedido,
        resposta.valor.marcacao,
      );
      res.json({ data: { pedido: resposta.valor.pedido } });
    } catch (err) {
      return next(
        montarDbError(
          "creator",
          "responder pedido de collab",
          err,
          // TODO(Ana)
          "Erro ao responder o pedido.",
        ),
      );
    }
  },
);

export default router;
