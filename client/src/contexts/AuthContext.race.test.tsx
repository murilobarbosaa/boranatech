import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

// ── Mocks da superfície de auth ──────────────────────────────────────────────
// Controller compartilhado p/ emitir eventos do supabase na ordem que quisermos.
const supa = vi.hoisted(() => {
  type Cb = (event: string, session: unknown) => void;
  const state: {
    authCb: Cb | null;
    getSession: () => Promise<{ data: { session: unknown } }>;
  } = {
    authCb: null,
    getSession: async () => ({ data: { session: null } }),
  };

  const client = {
    auth: {
      getSession: () => state.getSession(),
      onAuthStateChange: (cb: Cb) => {
        state.authCb = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
  };

  return {
    client,
    emit: (event: string, session: unknown) => state.authCb?.(event, session),
    setGetSession: (impl: () => Promise<{ data: { session: unknown } }>) => {
      state.getSession = impl;
    },
    reset: () => {
      state.authCb = null;
      state.getSession = async () => ({ data: { session: null } });
    },
  };
});

vi.mock("@/lib/supabase", () => ({
  supabase: supa.client,
  assertSupabaseConfigured: () => supa.client,
  isSupabaseConfigured: true,
}));

vi.mock("@/services/profileService", () => ({
  getMyProfile: vi.fn(async () => ({ id: "u1", name: "Test User" })),
  // Constante re-exportada pelo modulo real; o AuthContext le no fluxo de
  // opt-in de marketing pos-OAuth.
  PENDING_MARKETING_OPTIN_KEY: "bnt_pending_marketing_optin",
}));

vi.mock("posthog-js", () => ({
  default: { identify: vi.fn(), capture: vi.fn(), reset: vi.fn() },
}));

// Importado DEPOIS dos mocks (vi.mock é hoisted, mas mantemos a ordem clara).
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Sessão válida mínima, AuthContext deriva `user: session?.user ?? null`.
const validSession = {
  access_token: "tok",
  user: { id: "u1", email: "a@b.com", user_metadata: {} },
} as unknown as Parameters<typeof supa.emit>[1];

type Snapshot = { loading: boolean; hasUser: boolean };

function makeProbe(records: Snapshot[]) {
  return function Probe() {
    const { loading, user } = useAuth();
    // Captura o par {loading, user} a CADA render.
    records.push({ loading, hasUser: user !== null });
    return null;
  };
}

// Invariante: nunca expor (loading=false && user=null) num render que é
// SEGUIDO por um render com user válido. Esse é exatamente o "buraco" em que
// os guards (Perfil/Admin) interpretam "não autenticado" e redirecionam/erram.
function hasUnauthWindowBeforeAuth(records: Snapshot[]): boolean {
  return records.some(
    (r, i) =>
      r.loading === false &&
      r.hasUser === false &&
      records.slice(i + 1).some((later) => later.hasUser === true),
  );
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("AuthContext: race de hidratação (callback de OAuth)", () => {
  beforeEach(() => {
    supa.reset();
    vi.clearAllMocks();
    // URL limpa por padrão (sem callback de OAuth).
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
  });

  it("[RACE] getSession=null e depois SIGNED_IN(válido) NÃO deve abrir janela (loading=false, user=null)", async () => {
    const records: Snapshot[] = [];
    const Probe = makeProbe(records);

    // OAuth callback em andamento: a URL tem ?code= e a troca PKCE ainda não
    // concluiu -> getSession resolve null no boot. SIGNED_IN chega depois.
    window.history.replaceState({}, "", "/perfil?code=fake_oauth_code");
    supa.setGetSession(async () => ({ data: { session: null } }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    // tick 1: getSession().then -> setSession(null) + setLoading(false)
    await flushMicrotasks();

    // tick 2: a troca conclui e o supabase emite SIGNED_IN com a sessão real
    await act(async () => {
      supa.emit("SIGNED_IN", validSession);
    });
    await flushMicrotasks();

    // Estado final correto (autenticado)...
    expect(records.at(-1)).toEqual({ loading: false, hasUser: true });
    // ...mas a invariante não pode ter sido violada no meio do caminho.
    // Com o código atual, espera-se que ISTO FALHE (prova da causa raiz):
    expect(hasUnauthWindowBeforeAuth(records)).toBe(false);
  });

  it("[SAUDÁVEL] getSession=válido direto mantém a invariante (sem regressão)", async () => {
    const records: Snapshot[] = [];
    const Probe = makeProbe(records);

    // Caso normal: sessão já persistida -> getSession resolve com sessão válida.
    supa.setGetSession(async () => ({ data: { session: validSession } }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await flushMicrotasks();

    expect(records.at(-1)).toEqual({ loading: false, hasUser: true });
    expect(hasUnauthWindowBeforeAuth(records)).toBe(false);
  });
});
