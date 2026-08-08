import {
  ONBOARDING_TOUR_STORAGE_KEY,
  parseOnboardingTourState,
  type OnboardingTourState,
} from "@shared/onboarding/schema";

// Estado do TOUR GUIADO: apenas "esta rolando ou nao", em localStorage.
//
// Fica no localStorage e nao no perfil, logado ou nao, porque o tour e um
// estado de SESSAO DE NAVEGACAO, nao um fato sobre a pessoa. Gravar no perfil
// significaria que abrir o site em outro aparelho retomaria um tour que ficou
// pela metade aqui, o que ninguem pediu. O que e fato sobre a pessoa ("ja vi o
// onboarding de X") continua na persistencia dupla de storage.ts.
//
// A posicao NAO e salva: deriva de TOUR_ORDER mais o que ja esta visto.

/**
 * Tour com mais de 24h e considerado abandonado.
 *
 * Nao veio da especificacao; e uma defesa contra estado zumbi. Sem prazo, um
 * tour interrompido de um jeito que o codigo nao previu ficaria ativo para
 * sempre, e o efeito colateral silencioso seria o SuperInterstitial bloqueado
 * indefinidamente, porque tour ativo bloqueia ele por construcao. Prefiro que
 * o pior caso seja "o tour nao retomou" a "as notificacoes sumiram".
 */
export const TOUR_VALIDADE_MS = 24 * 60 * 60 * 1000;

function storage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Le o estado. Dado invalido ou vencido = tour inativo, e limpa o registro. */
export function lerEstadoDoTour(
  agora = Date.now(),
): OnboardingTourState | null {
  const ls = storage();
  if (!ls) return null;
  let estado: OnboardingTourState | null = null;
  try {
    const raw = ls.getItem(ONBOARDING_TOUR_STORAGE_KEY);
    if (!raw) return null;
    estado = parseOnboardingTourState(JSON.parse(raw));
  } catch {
    estado = null;
  }
  if (!estado) {
    encerrarTour();
    return null;
  }
  const inicio = Date.parse(estado.startedAt);
  // `startedAt` ilegivel conta como vencido: sem instante de inicio nao da para
  // afirmar que o tour e recente, e "nao da para afirmar" nao pode virar "sim".
  if (Number.isNaN(inicio) || agora - inicio > TOUR_VALIDADE_MS) {
    encerrarTour();
    return null;
  }
  return estado;
}

export function tourAtivo(agora = Date.now()): boolean {
  return lerEstadoDoTour(agora) !== null;
}

export function iniciarTour(startedAt = new Date().toISOString()): void {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(
      ONBOARDING_TOUR_STORAGE_KEY,
      JSON.stringify({ active: true, startedAt } satisfies OnboardingTourState),
    );
  } catch {
    // localStorage indisponivel: o tour simplesmente nao sobrevive ao reload.
    // A sequencia dentro da carga atual continua funcionando.
  }
}

export function encerrarTour(): void {
  const ls = storage();
  if (!ls) return;
  try {
    ls.removeItem(ONBOARDING_TOUR_STORAGE_KEY);
  } catch {
    // idem.
  }
}
