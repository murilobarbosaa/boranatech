import { sanitizeReturnTo } from "@/components/auth/RequireAuth";

// Fundacao do gate de autenticacao (Fase 1). Modelo de "intencao" generico,
// desacoplado de favoritos/progresso. A re-execucao real de dominio (favoritos)
// sera mapeada pra DomainIntent na Fase 2; aqui so existe a fundacao.

export type NavigateIntent = { kind: "navigate"; to: string };
export type DomainIntent = {
  kind: "domain";
  domain: string;
  payload?: Record<string, unknown>;
};
export type AuthGateIntent = NavigateIntent | DomainIntent;

export interface PendingGate {
  destination: string;
  intent?: AuthGateIntent;
  timestamp: number;
}

// Chave NOVA e distinta da legada ("boranatech.pending_intent"), que pertence
// ao lib/pendingIntent.ts e NAO e tocada aqui.
const STORAGE_KEY = "boranatech.pending_gate";
const TTL_MS = 5 * 60 * 1000;

function readStored(): PendingGate | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingGate;
    if (!parsed || typeof parsed.timestamp !== "number") return null;
    if (typeof parsed.destination !== "string") return null;
    return parsed;
  } catch {
    // sessionStorage indisponivel ou JSON corrompido: trata como vazio.
    return null;
  }
}

function isExpired(gate: PendingGate): boolean {
  return Date.now() - gate.timestamp > TTL_MS;
}

export function savePendingGate(gate: {
  destination: string;
  intent?: AuthGateIntent;
}): PendingGate | null {
  // Saneamento: nada de URL externa. Destino invalido => nao persiste.
  const destination = sanitizeReturnTo(gate.destination);
  if (!destination) return null;

  let intent = gate.intent;
  if (intent && intent.kind === "navigate") {
    const to = sanitizeReturnTo(intent.to);
    // navigate.to invalido => descarta so a intent, mantem o gate sem ela.
    intent = to ? { kind: "navigate", to } : undefined;
  }

  const payload: PendingGate = {
    destination,
    intent,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage indisponivel (private mode, quota, SSR): silencioso.
  }

  // Mesmo se a gravacao falhar, devolve o gate saneado: o chamador precisa do
  // destino saneado independente do storage.
  return payload;
}

export function peekPendingGate(): PendingGate | null {
  const stored = readStored();
  if (!stored) return null;
  if (isExpired(stored)) {
    clearPendingGate();
    return null;
  }
  return stored;
}

export function consumePendingGate(): PendingGate | null {
  const stored = readStored();
  clearPendingGate();
  if (!stored) return null;
  if (isExpired(stored)) return null;
  return stored;
}

export function clearPendingGate(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
