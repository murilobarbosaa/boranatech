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
 * Depois de 2 e-mails o assunto morre para aquela pessoa, e so volta se ela
 * passar 30 dias sem nova tentativa (episodio novo) ou converter. Sem esse corte,
 * quem falha todo mes receberia a regua para sempre.
 */
export const EPISODIO_NOVO_MS = 30 * 24 * 60 * 60 * 1000;

export type EnvioAnterior = { stage: number; sentAtMs: number };

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
  | { enviar: true; stage: 1 | 2 };

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

  const ordenados = [...f.enviosAnteriores].sort(
    (a, b) => b.sentAtMs - a.sentAtMs,
  );
  const ultimo = ordenados[0];
  if (!ultimo) return { enviar: true, stage: 1 };

  // Episodio novo: a tentativa atual e muito posterior ao ultimo contato, entao o
  // ciclo anterior encerrou e a pessoa volta a ser elegivel do stage 1.
  if (f.ultimaTentativaMs - ultimo.sentAtMs >= EPISODIO_NOVO_MS) {
    return { enviar: true, stage: 1 };
  }

  if (ultimo.stage >= 2) return { enviar: false, motivo: "episodio_encerrado" };

  // Teto de 1 por pessoa por 72h. Tambem e o intervalo do segundo aviso: as duas
  // regras coincidem de proposito, entao nao ha como o stage 2 furar o teto.
  if (f.agoraMs - ultimo.sentAtMs < SEGUNDO_AVISO_MS) {
    return { enviar: false, motivo: "teto_72h" };
  }

  return { enviar: true, stage: 2 };
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
