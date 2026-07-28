// Regua do e-mail de recuperacao de pagamento recusado: DECISAO PURA.
//
// Fica em shared/ e sem I/O de proposito, para o teste exercitar a regra em vez de
// mockar banco. O runner (server/lib/paymentRecovery.ts) so junta os fatos e
// obedece.

/** Motivo agrupado da recusa. Decide QUAL variante de texto o e-mail usa. */
export type ReasonBucket =
  | "insufficient_funds"
  | "try_again_later"
  | "dados_incorretos"
  | "blocked"
  | "outro";

export const DEBOUNCE_MS = 30 * 60 * 1000;
export const SEGUNDO_AVISO_MS = 72 * 60 * 60 * 1000;
/**
 * Depois de 2 e-mails o EPISODIO morre. Um episodio novo abre quando a pessoa
 * passa 30 dias sem contato e volta a falhar.
 */
export const EPISODIO_NOVO_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Teto de episodios por endereco, PARA SEMPRE. 3 episodios = no maximo 6 e-mails
 * na vida daquele e-mail.
 *
 * Existe porque reabrir episodio sem teto significa que quem falha todo mes
 * recebe 2 e-mails a cada 30 dias, 24 por ano. Isso e spam, e spam queima
 * reputacao de dominio, que e dano compartilhado com TODO e-mail do produto
 * (recibo, cancelamento, lembrete de boleto). O teto e o que separa "cliente que
 * voltou" de "cobranca perpetua".
 */
export const MAX_EPISODIOS = 3;

export type EnvioAnterior = {
  stage: number;
  sentAtMs: number;
  /** Qual episodio. Sem isto a UNIQUE do banco impede a reabertura. */
  episodio: number;
};

export type FatosRecuperacao = {
  agoraMs: number;
  /** Tentativa recusada mais RECENTE desta pessoa. */
  ultimaTentativaMs: number;
  /** Envios ja feitos para esta pessoa, em qualquer ordem. */
  enviosAnteriores: EnvioAnterior[];
  /** Assinou / pagou depois da tentativa. */
  converteu: boolean;
  /** Esta em email_suppressions (bounce, reclamacao, descadastro). */
  suprimido: boolean;
  /** Passou por validateEmailForSending. */
  emailValido: boolean;
};

export type DecisaoRecuperacao =
  | { enviar: false; motivo: string }
  | { enviar: true; stage: 1 | 2; episodio: number };

/**
 * A ordem das checagens e deliberada: as razoes ABSOLUTAS (nao pode receber
 * e-mail, ou nao precisa mais) vem antes das de tempo, para o log dizer a causa
 * real em vez de "debounce" quando o motivo verdadeiro era supressao.
 */
export function decidirRecuperacao(
  f: FatosRecuperacao,
): DecisaoRecuperacao {
  if (!f.emailValido) return { enviar: false, motivo: "email_invalido" };
  if (f.suprimido) return { enviar: false, motivo: "suprimido" };
  if (f.converteu) return { enviar: false, motivo: "converteu" };

  // Debounce: enquanto a pessoa esta tentando, nao interrompe. helenadesouza22
  // fez 10 tentativas em ~1h; com isto sai UM e-mail, 30 min depois da ultima.
  if (f.agoraMs - f.ultimaTentativaMs < DEBOUNCE_MS) {
    return { enviar: false, motivo: "debounce" };
  }

  if (f.enviosAnteriores.length === 0) {
    return { enviar: true, stage: 1, episodio: 1 };
  }

  // O episodio corrente e o de numero MAIOR, nao o mais recente por data: um
  // reprocesso fora de ordem nao pode "voltar" para um episodio encerrado.
  const episodioAtual = Math.max(...f.enviosAnteriores.map((e) => e.episodio));
  const doEpisodio = f.enviosAnteriores.filter((e) => e.episodio === episodioAtual);
  const ultimoContatoMs = Math.max(...doEpisodio.map((e) => e.sentAtMs));

  // Episodio NOVO: a tentativa atual e muito posterior ao ultimo contato.
  if (f.ultimaTentativaMs - ultimoContatoMs >= EPISODIO_NOVO_MS) {
    if (episodioAtual >= MAX_EPISODIOS) {
      return { enviar: false, motivo: "teto_de_episodios" };
    }
    return { enviar: true, stage: 1, episodio: episodioAtual + 1 };
  }

  if (Math.max(...doEpisodio.map((e) => e.stage)) >= 2) {
    return { enviar: false, motivo: "episodio_encerrado" };
  }

  // Teto de 1 por pessoa por 72h, que e tambem o intervalo do segundo aviso: as
  // duas regras coincidem de proposito, entao o stage 2 nao fura o teto.
  if (f.agoraMs - ultimoContatoMs < SEGUNDO_AVISO_MS) {
    return { enviar: false, motivo: "teto_72h" };
  }

  return { enviar: true, stage: 2, episodio: episodioAtual };
}

/** Agrupa o motivo cru da Stripe na variante de texto correspondente. */
export function classificarMotivo(dados: {
  outcomeType?: string | null;
  outcomeReason?: string | null;
  adviceCode?: string | null;
  failureCode?: string | null;
}): ReasonBucket {
  if (dados.outcomeType === "blocked") return "blocked";
  const r = dados.outcomeReason ?? "";
  if (r === "insufficient_funds") return "insufficient_funds";
  if (
    ["incorrect_number", "incorrect_cvc", "invalid_cvc", "invalid_account", "expired_card", "incorrect_zip"].includes(r) ||
    ["incorrect_number", "incorrect_cvc", "expired_card"].includes(dados.failureCode ?? "")
  ) {
    return "dados_incorretos";
  }
  if (dados.adviceCode === "try_again_later" || r === "try_again_later") {
    return "try_again_later";
  }
  return "outro";
}
