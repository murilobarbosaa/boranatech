// Fonte unica de verdade das versoes de consentimento. Nenhuma outra parte do
// codigo (server, client, migration) deve repetir estas strings soltas: sempre
// importar daqui. Ao publicar novos Termos ou Politica, bumpar a versao aqui e
// o gate volta a exigir aceite de todo mundo.

export const TERMS_VERSION = "2026-07-13";
export const PRIVACY_VERSION = "2026-07-13";

export type ConsentDocument = "terms" | "privacy";

export const CONSENT_DOCUMENTS: readonly ConsentDocument[] = ["terms", "privacy"];

export function currentVersionFor(document: ConsentDocument): string {
  return document === "terms" ? TERMS_VERSION : PRIVACY_VERSION;
}

// ─── Como o aceite chegou ate o servidor (coluna user_consents.consent_method) ─
//
// O eixo destes valores e o MECANISMO de consentimento, nao a tela. Tela e so o
// desempate quando o mecanismo se repete. O motivo e juridico e nao cosmetico:
// "marcou uma caixa" e "clicou num botao com o aviso ao lado" sao formas
// diferentes de manifestar consentimento, e depois que as linhas estiverem
// gravadas NAO existe forma de separa-las retroativamente se dividirem a mesma
// string. Por isso:
//
//   - uma string nunca e reaproveitada com significado novo. Mudou o mecanismo,
//     nasce um valor novo, mesmo que a tela seja a mesma;
//   - o par (superficie, mecanismo) esta no proprio nome, para que a leitura da
//     coluna nao dependa de saber a data do deploy que trocou a tela.
//
// NULL nao e um valor desta lista e nunca e escrito por nos de proposito. NULL
// NUNCA significa ausencia de consentimento: significa que a linha e anterior a
// coluna, ou que quem gravou foi um cliente anterior a este deploy. A prova
// continua sendo a existencia da linha; este campo e auditoria, nao validacao.
export const CONSENT_METHODS = [
  // Caixa de selecao explicita no formulario de cadastro. Mecanismo em vigor ate
  // o Passo 4; depois dele o checkbox deixa de existir e este valor vira
  // historico, que e exatamente o que ele precisa continuar sendo.
  "signup_form_checkbox",
  // Pos-Passo 4: sign-in wrap. Nao ha caixa; o clique no botao de cadastro, com o
  // aviso de Termos e Politica ao lado, E a manifestacao do consentimento.
  "signup_wrap_implicit",
  // Caixa de selecao explicita no modal bloqueante do ConsentGate. Nomeado pelo
  // mecanismo como os outros: se um dia o gate deixar de usar checkbox, o valor
  // novo nasce ao lado deste em vez de mudar o sentido do que ja foi gravado.
  "consent_gate_checkbox",
] as const;

export type ConsentMethod = (typeof CONSENT_METHODS)[number];

// Resolver com fallback neutro, nunca acesso direto nem confianca no valor cru.
// O valor chega pelo corpo de uma requisicao, ou seja, e escrito pelo cliente:
// um metodo desconhecido vira null (campo de auditoria em branco) em vez de ser
// gravado como veio ou de derrubar a gravacao do consentimento, que e o dado que
// importa de verdade.
export function consentMethodOf(value: unknown): ConsentMethod | null {
  if (typeof value !== "string") return null;
  return (CONSENT_METHODS as readonly string[]).includes(value)
    ? (value as ConsentMethod)
    : null;
}
