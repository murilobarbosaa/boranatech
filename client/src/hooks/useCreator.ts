import { useEffect, useSyncExternalStore } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { contentFetch } from "@/lib/adminApi";

// Status de Creator do usuario logado, lido de GET /api/creator/status UMA vez
// por sessao autenticada.
//
// TRES ESTADOS, sem colapsar erro em "nao e creator": `ready` com `kind: null`
// quer dizer que o servidor respondeu que a pessoa nao e creator; `error` quer
// dizer que nao deu para saber (o servidor devolve 503 nesse caso de proposito).
// O botao do Header so aparece em `ready` com kind, entao os dois escondem o
// botao, mas por motivos que o teste e o log conseguem separar.
//
// CACHE EM MODULO, e nao em estado local: o Header remonta a cada navegacao
// (CLAUDE.md, "Header/Footer remontam"), e estado local renasceria a cada
// troca de rota, refazendo a chamada. Mesmo desenho do `newsletterState.ts`,
// com a diferenca de que aqui o valor DEPENDE do usuario: a entrada guarda o
// `userId` dono dela, e um id diferente (login de outra conta) ou nenhum
// (logout) descarta o que havia.
//
// Em erro, UMA retentativa depois de 5s, e para. Um loop de retentativa contra
// um servidor que responde 503 multiplicaria a carga justamente quando ele esta
// mal.

export type CreatorKindDoCliente = "influencer" | "afiliado";

export type CreatorStatusState =
  | { status: "loading" }
  | { status: "ready"; kind: CreatorKindDoCliente | null }
  | { status: "error" };

const RETENTATIVA_MS = 5_000;

const CARREGANDO: CreatorStatusState = { status: "loading" };
const SEM_SESSAO: CreatorStatusState = { status: "ready", kind: null };
const ERRO: CreatorStatusState = { status: "error" };

type Entrada = {
  userId: string;
  estado: CreatorStatusState;
  retentativaFeita: boolean;
  timer: ReturnType<typeof setTimeout> | null;
};

let entrada: Entrada | null = null;
const ouvintes = new Set<() => void>();

function notificar() {
  // forEach e nao for..of: o target do tsconfig nao habilita iterar Set.
  ouvintes.forEach((ouvinte) => ouvinte());
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

function lerEstado(userId: string | null): CreatorStatusState {
  if (!userId) return SEM_SESSAO;
  if (!entrada || entrada.userId !== userId) return CARREGANDO;
  return entrada.estado;
}

function kindDaResposta(json: unknown): CreatorKindDoCliente | null | undefined {
  if (typeof json !== "object" || json === null) return undefined;
  const data = (json as { data?: unknown }).data;
  if (typeof data !== "object" || data === null || !("kind" in data)) {
    return undefined;
  }
  const kind = (data as { kind: unknown }).kind;
  if (kind === null || kind === "influencer" || kind === "afiliado") {
    return kind;
  }
  // Kind que este bundle nao conhece (servidor mais novo): nao e "nao e
  // creator", e nao da para rotular. Vira erro, e o botao fica escondido.
  return undefined;
}

function definir(userId: string, estado: CreatorStatusState) {
  if (!entrada || entrada.userId !== userId) return;
  entrada.estado = estado;
  notificar();
}

async function buscar(userId: string): Promise<void> {
  try {
    const json: unknown = await contentFetch("/creator/status");
    const kind = kindDaResposta(json);
    if (kind === undefined) throw new Error("resposta de status inesperada");
    definir(userId, { status: "ready", kind });
  } catch {
    if (!entrada || entrada.userId !== userId) return;
    definir(userId, ERRO);
    if (!entrada.retentativaFeita) {
      entrada.retentativaFeita = true;
      entrada.timer = setTimeout(() => {
        if (!entrada || entrada.userId !== userId) return;
        entrada.timer = null;
        void buscar(userId);
      }, RETENTATIVA_MS);
    }
  }
}

function descartar() {
  if (entrada?.timer) clearTimeout(entrada.timer);
  entrada = null;
}

function garantirStatus(userId: string) {
  if (entrada?.userId === userId) return;
  descartar();
  entrada = {
    userId,
    estado: CARREGANDO,
    retentativaFeita: false,
    timer: null,
  };
  notificar();
  void buscar(userId);
}

export function useCreator(): CreatorStatusState {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const estado = useSyncExternalStore(assinar, () => lerEstado(userId));

  useEffect(() => {
    if (userId) garantirStatus(userId);
    else descartar();
  }, [userId]);

  return estado;
}

/** Limpa o cache do modulo. Para os testes. */
export function resetCreatorStatus(): void {
  descartar();
  notificar();
}
