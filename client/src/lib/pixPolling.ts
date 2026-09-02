/**
 * REGRA DE PARADA do polling que confirma o Pix.
 *
 * Extraida como funcao pura porque e a parte do comportamento que pode errar em
 * silencio: um polling que nunca para vira requisicao infinita numa aba
 * esquecida, e um que para cedo demais deixa a tela mentindo que o pagamento
 * nao chegou. Nenhuma das duas falhas aparece na tela; as duas aparecem aqui.
 *
 * O componente fica com o `setTimeout` e o `fetch`, que sao encanamento; a
 * decisao mora aqui.
 */

/** Intervalo entre tentativas. Pix confirma em segundos, entao 4s e generoso. */
export const PIX_POLL_INTERVAL_MS = 4000;

/**
 * Teto de duracao. Dez minutos e muito mais que o tempo de um Pix e muito menos
 * que o prazo do QR: quem passar disso provavelmente fechou o app, e a tela pede
 * uma acao explicita em vez de seguir consultando sozinha.
 */
export const PIX_POLL_TIMEOUT_MS = 10 * 60 * 1000;

export type PixPollDecision =
  | { action: "confirmed" }
  | { action: "stop"; reason: "timeout" }
  | { action: "wait"; delayMs: number };

/**
 * O que fazer depois de uma consulta de status.
 *
 * `isPro` vem do endpoint que a tela ja consome, e e o unico sinal que importa:
 * quem virou Pro teve o pagamento confirmado, independente de por qual caminho.
 * Consultar o estado da COBRANCA seria perguntar ao provedor uma coisa que o
 * nosso banco ja sabe depois do webhook.
 */
export function nextPixPollStep(input: {
  isPro: boolean;
  /** Milissegundos desde que o polling comecou. */
  elapsedMs: number;
}): PixPollDecision {
  // Confirmacao vence o timeout: se as duas condicoes valem na mesma tentativa,
  // a pessoa pagou e a tela precisa mostrar sucesso, nao expiracao.
  if (input.isPro) return { action: "confirmed" };
  if (input.elapsedMs >= PIX_POLL_TIMEOUT_MS) {
    return { action: "stop", reason: "timeout" };
  }
  return { action: "wait", delayMs: PIX_POLL_INTERVAL_MS };
}
