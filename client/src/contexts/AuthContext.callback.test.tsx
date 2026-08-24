import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

/**
 * Comportamento do retorno de OAuth (itens 1.2 e 1.3).
 *
 * O bug consertado aqui: o timer de salvaguarda de 5000ms chamava
 * `setSession(null)` e fechava o loading, ou seja, o app declarava "nao logado"
 * enquanto a troca PKCE ainda podia estar em voo. Latencia de rede movel virava
 * logout, e o unico rastro era um console.warn.
 *
 * Os testes abaixo travam as tres decisoes: o limite ficou muito mais largo, o
 * estouro NUNCA limpa sessao, e antes de concluir consulta getSession() e confia
 * no resultado.
 */

const supa = vi.hoisted(() => {
  type Cb = (event: string, session: unknown) => void;
  const state: {
    authCb: Cb | null;
    getSession: () => Promise<{ data: { session: unknown } }>;
    getSessionCalls: number;
  } = {
    authCb: null,
    getSession: async () => ({ data: { session: null } }),
    getSessionCalls: 0,
  };

  const client = {
    auth: {
      getSession: () => {
        state.getSessionCalls += 1;
        return state.getSession();
      },
      onAuthStateChange: (cb: Cb) => {
        state.authCb = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
  };

  return {
    client,
    state,
    emit: (event: string, session: unknown) => state.authCb?.(event, session),
    setGetSession: (impl: () => Promise<{ data: { session: unknown } }>) => {
      state.getSession = impl;
    },
    reset: () => {
      state.authCb = null;
      state.getSession = async () => ({ data: { session: null } });
      state.getSessionCalls = 0;
    },
  };
});

const callbackUrl = vi.hoisted(() => ({
  hasCallback: false,
  urlError: null as {
    error: string | null;
    errorCode: string | null;
    description: string | null;
  } | null,
}));

const telemetry = vi.hoisted(() => ({
  report: vi.fn(),
  diagnostic: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: supa.client,
  assertSupabaseConfigured: () => supa.client,
  isSupabaseConfigured: true,
}));

vi.mock("@/lib/authCallback", () => ({
  hasOAuthCallbackInUrl: () => callbackUrl.hasCallback,
  readAuthErrorFromUrl: () => callbackUrl.urlError,
}));

vi.mock("@/lib/authTelemetry", () => ({
  reportAuthFailure: telemetry.report,
  reportAuthDiagnostic: telemetry.diagnostic,
  authErrorFields: (e: unknown) => ({
    code: (e as { code?: string })?.code ?? null,
    message: (e as { message?: string })?.message ?? null,
    status: (e as { status?: number })?.status ?? null,
  }),
  // Nao e exercitado aqui (neste arquivo o perfil sempre resolve), mas o
  // AuthContext importa: mock incompleto so quebraria no dia em que alguem
  // acrescentasse um caso de falha de perfil, com um erro que nao aponta para
  // o mock.
  authErrorKindOf: (e: unknown) =>
    (e as { authErrorKind?: string })?.authErrorKind ?? "unknown",
}));

vi.mock("@/services/profileService", () => ({
  getMyProfile: vi.fn(async () => ({ id: "u1", name: "Test User" })),
  PENDING_MARKETING_OPTIN_KEY: "bnt_pending_marketing_optin",
  recordPendingMarketingOptIn: vi.fn(async () => {}),
}));

vi.mock("@/services/consentService", () => ({
  PENDING_CONSENT_KEY: "bnt_pending_consent",
  recordConsent: vi.fn(async () => {}),
}));

vi.mock("@/services/careerQuizService", () => ({
  reconcilePendingQuizResult: vi.fn(async () => {}),
}));

vi.mock("@/lib/analytics", () => ({
  captureUserSignedUpForEmail: vi.fn(),
  captureUserSignedUpForOAuth: vi.fn(),
  signupSourceFromUrl: () => "unknown",
}));

vi.mock("posthog-js", () => ({
  default: { identify: vi.fn(), capture: vi.fn(), reset: vi.fn() },
}));

import {
  AuthProvider,
  useAuth,
  type AuthCallbackIssue,
} from "@/contexts/AuthContext";

const validSession = {
  access_token: "tok",
  user: { id: "u1", email: "a@b.c", created_at: "2026-01-01T00:00:00Z" },
};

// Espelho do estado observado, para as assercoes lerem sem depender de DOM.
let visto: {
  loading: boolean;
  hasSession: boolean;
  issue: AuthCallbackIssue | null;
  slow: boolean;
  retry: () => Promise<void>;
};

function Probe() {
  const { loading, session, callbackIssue, callbackSlow, retryCallback } =
    useAuth();
  visto = {
    loading,
    hasSession: Boolean(session),
    issue: callbackIssue,
    slow: callbackSlow,
    retry: retryCallback,
  };
  return null;
}

// Estágios de diagnóstico emitidos, na ordem.
function diagnosticos(): string[] {
  return telemetry.diagnostic.mock.calls.map((c) => c[0].stage);
}

function montar() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

// Deixa o boot (getSession inicial) resolver.
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function avancar(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  supa.reset();
  telemetry.report.mockClear();
  telemetry.diagnostic.mockClear();
  callbackUrl.hasCallback = false;
  callbackUrl.urlError = null;
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("retorno de OAuth: limite de espera", () => {
  beforeEach(() => {
    callbackUrl.hasCallback = true;
  });

  it("segura o loading enquanto a troca PKCE esta em voo", async () => {
    montar();
    await flush();
    expect(visto.loading).toBe(true);
    expect(visto.issue).toBeNull();
  });

  /**
   * CONTROLE NEGATIVO do valor do limite. Em 5000ms (o valor antigo) e em qualquer
   * instante anterior a 20s, NADA pode ter sido decidido: sem issue, sem fechar o
   * loading. Este teste fica VERMELHO se alguem devolver o limite para 5s, que e a
   * regressao concreta que causou o relato de "nao consegui entrar".
   */
  it("nao decide nada em 5s, o valor antigo", async () => {
    montar();
    await flush();

    await avancar(5_000);
    expect(visto.loading).toBe(true);
    expect(visto.issue).toBeNull();
    expect(telemetry.report).not.toHaveBeenCalled();

    await avancar(14_000); // 19s no total, ainda dentro do limite
    expect(visto.loading).toBe(true);
    expect(visto.issue).toBeNull();
  });

  it("ao estourar o limite, consulta getSession e ADOTA a sessao encontrada", async () => {
    // A troca concluiu, so a notificacao SIGNED_IN se perdeu. Este e o caso que o
    // timer antigo destruia: ele zerava a sessao sem nunca perguntar.
    montar();
    await flush();
    supa.setGetSession(async () => ({ data: { session: validSession } }));

    await avancar(20_000);

    expect(visto.hasSession).toBe(true);
    expect(visto.issue).toBeNull();
    expect(visto.loading).toBe(false);
    // Nao e falha: nada reportado.
    expect(telemetry.report).not.toHaveBeenCalled();
  });

  it("sem sessao ao estourar, vira estado explicito e reporta com o tempo decorrido", async () => {
    montar();
    await flush();

    await avancar(20_000);

    expect(visto.loading).toBe(false);
    expect(visto.hasSession).toBe(false);
    expect(visto.issue).toEqual({
      kind: "unconfirmed",
      code: null,
      description: null,
    });

    expect(telemetry.report).toHaveBeenCalledTimes(1);
    const payload = telemetry.report.mock.calls[0][0];
    expect(payload.stage).toBe("session_unconfirmed");
    expect(payload.method).toBe("oauth_redirect");
    expect(payload.errorCode).toBe("pkce_exchange_unconfirmed");
    expect(payload.elapsedMs).toBeGreaterThanOrEqual(20_000);
  });

  /**
   * A invariante central do item 1.3, e a que justifica o trabalho todo:
   * o estouro do limite NUNCA limpa sessao. Aqui a sessao chega por SIGNED_IN
   * antes do limite; quando o limite passa, ela tem que continuar de pe.
   */
  it("o limite nunca derruba uma sessao que chegou antes dele", async () => {
    montar();
    await flush();

    await act(async () => {
      supa.emit("SIGNED_IN", validSession);
      await Promise.resolve();
    });
    expect(visto.hasSession).toBe(true);

    await avancar(60_000);

    expect(visto.hasSession).toBe(true);
    expect(visto.issue).toBeNull();
  });

  it("SIGNED_IN tardio limpa o aviso sozinho, sem clique", async () => {
    montar();
    await flush();
    await avancar(20_000);
    expect(visto.issue).not.toBeNull();

    await act(async () => {
      supa.emit("SIGNED_IN", validSession);
      await Promise.resolve();
    });

    expect(visto.issue).toBeNull();
    expect(visto.hasSession).toBe(true);
  });

  it("o retry manual adota a sessao quando ela passa a existir", async () => {
    montar();
    await flush();
    await avancar(20_000);
    expect(visto.issue).not.toBeNull();

    supa.setGetSession(async () => ({ data: { session: validSession } }));
    await act(async () => {
      await visto.retry();
    });

    expect(visto.issue).toBeNull();
    expect(visto.hasSession).toBe(true);
    // Retry nao reporta de novo: a falha ja foi contada no estouro do limite.
    expect(telemetry.report).toHaveBeenCalledTimes(1);
  });

  it("o retry sem sessao mantem o aviso, sem inventar logout", async () => {
    montar();
    await flush();
    await avancar(20_000);

    await act(async () => {
      await visto.retry();
    });

    expect(visto.issue).toEqual({
      kind: "unconfirmed",
      code: null,
      description: null,
    });
    expect(visto.hasSession).toBe(false);
  });
});

describe("diagnostico de timing (itens 1.6, 1.7 e 1.8)", () => {
  it("1.6: sessao achada depois do limite emite session_recovered_after_timeout, NAO falha", async () => {
    callbackUrl.hasCallback = true;
    montar();
    await flush();
    supa.setGetSession(async () => ({ data: { session: validSession } }));

    await avancar(20_000);

    expect(diagnosticos()).toContain("session_recovered_after_timeout");
    // A assercao que separa diagnostico de falha: este caminho e login que DEU
    // CERTO, e contá-lo como falha faria o numero de falhas mentir.
    expect(telemetry.report).not.toHaveBeenCalled();

    const call = telemetry.diagnostic.mock.calls.find(
      (c) => c[0].stage === "session_recovered_after_timeout",
    )!;
    expect(call[0].elapsedMs).toBeGreaterThanOrEqual(20_000);
    expect(call[0].method).toBe("oauth_redirect");
    expect(call[0].provider).toBe("google");
  });

  it("1.7: retorno bem-sucedido emite oauth_return_succeeded com o tempo", async () => {
    callbackUrl.hasCallback = true;
    montar();
    await flush();

    await avancar(1_200);
    await act(async () => {
      supa.emit("SIGNED_IN", validSession);
      await Promise.resolve();
    });

    const call = telemetry.diagnostic.mock.calls.find(
      (c) => c[0].stage === "oauth_return_succeeded",
    );
    expect(call).toBeDefined();
    expect(call![0].elapsedMs).toBeGreaterThanOrEqual(1_200);
    expect(telemetry.report).not.toHaveBeenCalled();
  });

  it("1.7 cobre o caminho RAPIDO, em que a troca termina antes do nosso getSession", async () => {
    // Sem passar pelo ramo que segura o loading: getSession ja devolve sessao.
    // E o caso saudavel, e e o que o histograma mais precisa conter.
    callbackUrl.hasCallback = true;
    supa.setGetSession(async () => ({ data: { session: validSession } }));

    montar();
    await flush();
    await act(async () => {
      supa.emit("SIGNED_IN", validSession);
      await Promise.resolve();
    });

    expect(diagnosticos()).toContain("oauth_return_succeeded");
  });

  /**
   * CONTROLE NEGATIVO do 1.7. Login por e-mail/senha e refresh de token NAO sao
   * retorno de OAuth e nao podem entrar na distribuicao: se entrassem, o
   * histograma mediria outra coisa e ainda pareceria cheio de dados.
   */
  it("1.7 nao conta login sem callback na URL nem TOKEN_REFRESHED", async () => {
    callbackUrl.hasCallback = false;
    montar();
    await flush();

    await act(async () => {
      supa.emit("SIGNED_IN", validSession);
      await Promise.resolve();
    });
    expect(diagnosticos()).not.toContain("oauth_return_succeeded");

    callbackUrl.hasCallback = true;
    cleanup();
    montar();
    await flush();
    await act(async () => {
      supa.emit("SIGNED_IN", validSession);
      await Promise.resolve();
    });
    telemetry.diagnostic.mockClear();
    // Segundo evento na MESMA carga de pagina nao conta de novo.
    await act(async () => {
      supa.emit("TOKEN_REFRESHED", validSession);
      await Promise.resolve();
    });
    expect(diagnosticos()).not.toContain("oauth_return_succeeded");
  });

  it("1.8: aos 6s sinaliza progresso e registra a latencia", async () => {
    callbackUrl.hasCallback = true;
    montar();
    await flush();

    await avancar(5_900);
    expect(visto.slow).toBe(false);

    await avancar(200); // 6.1s
    expect(visto.slow).toBe(true);
    expect(visto.loading).toBe(true);
    // Continua sendo progresso, nao erro: nenhum card de falha.
    expect(visto.issue).toBeNull();
    expect(telemetry.report).not.toHaveBeenCalled();
    expect(diagnosticos()).toContain("oauth_return_slow");
  });

  it("1.8: o SIGNED_IN antes do limiar impede a mensagem de aparecer", async () => {
    callbackUrl.hasCallback = true;
    montar();
    await flush();

    await act(async () => {
      supa.emit("SIGNED_IN", validSession);
      await Promise.resolve();
    });

    await avancar(30_000);
    expect(visto.slow).toBe(false);
    expect(diagnosticos()).not.toContain("oauth_return_slow");
  });

  it("1.8: a mensagem sai quando o desfecho chega", async () => {
    callbackUrl.hasCallback = true;
    montar();
    await flush();
    await avancar(6_100);
    expect(visto.slow).toBe(true);

    await act(async () => {
      supa.emit("SIGNED_IN", validSession);
      await Promise.resolve();
    });
    expect(visto.slow).toBe(false);
  });

  it("1.8: no estouro do limite o card de falha substitui a mensagem", async () => {
    callbackUrl.hasCallback = true;
    montar();
    await flush();
    await avancar(6_100);
    expect(visto.slow).toBe(true);

    await avancar(14_000); // 20.1s
    expect(visto.slow).toBe(false);
    expect(visto.issue).not.toBeNull();
  });
});

describe("retorno de OAuth: erro na URL (item 1.2)", () => {
  it("reporta o codigo exato e mostra estado explicito", async () => {
    callbackUrl.urlError = {
      error: "server_error",
      errorCode: "bad_oauth_state",
      description: "Invalid state",
    };

    montar();
    await flush();

    expect(telemetry.report).toHaveBeenCalledTimes(1);
    const payload = telemetry.report.mock.calls[0][0];
    expect(payload.stage).toBe("provider");
    expect(payload.method).toBe("oauth_redirect");
    expect(payload.errorCode).toBe("bad_oauth_state");

    expect(visto.issue).toEqual({
      kind: "provider_error",
      code: "bad_oauth_state",
      description: "Invalid state",
    });
    expect(visto.loading).toBe(false);
  });

  it("com sessao valida, registra a falha mas NAO bloqueia a tela", async () => {
    callbackUrl.urlError = {
      error: "access_denied",
      errorCode: "access_denied",
      description: null,
    };
    supa.setGetSession(async () => ({ data: { session: validSession } }));

    montar();
    await flush();

    expect(telemetry.report).toHaveBeenCalledTimes(1);
    expect(visto.issue).toBeNull();
    expect(visto.hasSession).toBe(true);
  });

  /**
   * CONTROLE NEGATIVO: sem erro na URL, nada e reportado e nada e bloqueado. Sem
   * esta assercao, uma implementacao que reportasse em TODO boot passaria nos dois
   * testes acima.
   */
  it("boot normal, sem erro na URL, nao reporta nada", async () => {
    supa.setGetSession(async () => ({ data: { session: validSession } }));

    montar();
    await flush();

    expect(telemetry.report).not.toHaveBeenCalled();
    expect(visto.issue).toBeNull();
    expect(visto.loading).toBe(false);
  });
});
