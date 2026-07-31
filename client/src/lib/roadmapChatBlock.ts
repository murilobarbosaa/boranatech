import { IntakeChatApiError } from "@/services/aiRoadmapService";

// Bloqueios do chat de intake do Roadmap com IA.
//
// Extraido da pagina para ser testavel sem DOM. O que se prova aqui e o
// INVARIANTE da fase 2: em nenhum estado alcancavel a pessoa fica sem caminho
// adiante. Antes, todo erro virava a mesma tela com um botao "Tentar de novo"
// que reenviava o MESMO corpo e recebia o MESMO erro, entao quem batia no teto
// de turnos ficava preso ate o rascunho expirar em 24h.
//
// `transient` e o unico kind em que tentar de novo faz sentido: nos demais a
// causa e deterministica.

export type ChatBlockKind =
  | "transient"
  | "turn_limit"
  | "quota"
  | "payload"
  | "pro"
  | "invalid";

export interface ChatBlock {
  kind: ChatBlockKind;
  // So o transient carrega mensagem do servidor; os outros tem copy fixa.
  message?: string;
}

export function isTransient(block: ChatBlock | null): boolean {
  return block?.kind === "transient";
}

// TODO(Ana): revisar a copy de bloqueio. Regra: cada uma diz O QUE aconteceu; a
// proxima acao vem dos botoes logo abaixo (gerar, formulario ou recomecar).
export const BLOCK_COPY: Record<Exclude<ChatBlockKind, "transient">, string> = {
  turn_limit: "Esta conversa chegou ao limite de mensagens.",
  quota:
    "Voce atingiu o limite diario de mensagens do chat. Ele reseta a meia-noite (horario de Brasilia) e e separado da cota de gerar roadmap.",
  payload: "Esta conversa ficou longa demais para continuar.",
  pro: "O Roadmap com IA e exclusivo do Plano Pro.",
  invalid: "Nao consegui continuar esta conversa.",
};

/** Traduz o codigo de erro da API no kind de bloqueio. */
export function blockFromError(
  err: unknown,
  fallbackMessage: string,
): ChatBlock {
  if (err instanceof IntakeChatApiError) {
    if (err.code === "turn_limit") return { kind: "turn_limit" };
    if (err.code === "rate_limited") return { kind: "quota" };
    if (err.code === "payload_too_large") return { kind: "payload" };
    if (err.code === "pro_required") return { kind: "pro" };
    if (err.code === "invalid_request") return { kind: "invalid" };
  }
  return { kind: "transient", message: fallbackMessage };
}

/**
 * As SAIDAS oferecidas num estado de bloqueio.
 *
 * Espelha o que a pagina renderiza, e existe para o invariante ser afirmavel por
 * teste em vez de por leitura de JSX. Regra, na ordem em que a tela mostra:
 *
 *  - `gerar`: so quando o intake ja da para gerar. E a melhor saida quando existe.
 *  - `formulario`: quando falta campo. A lista do que falta vira formulario, e
 *    responder ali gera o roadmap sem depender do chat.
 *  - `recomecar`: sempre. E a saida de ultimo recurso, e por ser incondicional e
 *    ela que garante o invariante mesmo num kind que ninguem previu.
 *  - `tentarDeNovo`: SO no transient. Em qualquer outro kind ele reenviaria o
 *    mesmo corpo para o mesmo erro, que era o bug.
 */
export interface ChatExits {
  gerar: boolean;
  formulario: boolean;
  recomecar: boolean;
  tentarDeNovo: boolean;
}

export function exitsForBlock(
  block: ChatBlock | null,
  canGenerate: boolean,
): ChatExits {
  return {
    gerar: canGenerate,
    formulario: !canGenerate,
    recomecar: true,
    tentarDeNovo: isTransient(block),
  };
}
