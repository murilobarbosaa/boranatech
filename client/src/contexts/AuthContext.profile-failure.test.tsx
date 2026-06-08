import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

// ── Mocks da superfície de auth ──────────────────────────────────────────────
// Mesmo controlador usado em AuthContext.race.test.tsx para emitir eventos do
// supabase e controlar getSession por teste.
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

// getMyProfile é o ponto que manipulamos por teste. Hoisted para o vi.mock
// conseguir referenciar a mesma função em todas as suites.
const profileSvc = vi.hoisted(() => {
  const fn = vi.fn();
  return { fn };
});

vi.mock("@/services/profileService", () => ({
  getMyProfile: profileSvc.fn,
}));

vi.mock("posthog-js", () => ({
  default: { identify: vi.fn(), capture: vi.fn(), reset: vi.fn() },
}));

import {
  AuthProvider,
  useAuth,
  __useAuthInternalsForTests,
  type ProfileStatus,
} from "@/contexts/AuthContext";
import type { Profile } from "@/services/contracts";

const validSession = {
  access_token: "tok",
  user: { id: "u1", email: "a@b.com", user_metadata: {} },
} as unknown as Parameters<typeof supa.emit>[1];

const fullProfile = {
  id: "p1",
  user_id: "u1",
  name: "Test User",
  avatar_border: "neon",
  avatar_icon: "rocket",
  avatar_bg: "violet",
} as unknown as Profile;

type Snapshot = {
  loading: boolean;
  hasUser: boolean;
  profile: Profile | null;
  profileStatus: ProfileStatus;
  profileError: Error | null;
};

function makeProbe(records: Snapshot[]) {
  return function Probe() {
    const { loading, user, profile, profileStatus, profileError } = useAuth();
    records.push({
      loading,
      hasUser: user !== null,
      profile,
      profileStatus,
      profileError,
    });
    return null;
  };
}

// Replica EXATA da fórmula em client/src/components/Header.tsx após a correção.
function avatarLoadingFrom(s: Snapshot): boolean {
  return Boolean(
    s.hasUser && !s.profile && (s.loading || s.profileStatus === "loading"),
  );
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("AuthContext: resiliência do carregamento de perfil (sem skeleton eterno, sem regredir perfil bom)", () => {
  beforeEach(() => {
    supa.reset();
    profileSvc.fn.mockReset();
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("[H1-terminal] boot + 2 retries TODOS falham: status='error', profile=null, avatarLoading=false (fallback, nunca skeleton)", async () => {
    vi.useFakeTimers();
    // Math.random=0.5 -> jitter zero -> delays exatos (3000ms, 12000ms).
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const records: Snapshot[] = [];
    const Probe = makeProbe(records);

    supa.setGetSession(async () => ({ data: { session: validSession } }));
    profileSvc.fn.mockRejectedValue(new Error("backend down"));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await flushMicrotasks();

    // Pós-boot imediato: fetch inicial já rejeitou, retry #1 agendado em 3s.
    // status ainda é 'loading' (skeleton timeout não disparou).
    let s = records.at(-1)!;
    expect(s.hasUser).toBe(true);
    expect(s.loading).toBe(false);
    expect(s.profile).toBeNull();
    expect(s.profileStatus).toBe("loading");
    expect(avatarLoadingFrom(s)).toBe(true);

    // t=3000: retry #1 dispara, falha. retry #2 agendado em +12s (t=15000).
    await advance(3000);
    s = records.at(-1)!;
    expect(s.profileStatus).toBe("loading");
    expect(s.profile).toBeNull();

    // t=6000: skeleton timeout dispara -> status='error' (fallback na tela).
    // MAS retry #2 continua agendado.
    await advance(3000);
    s = records.at(-1)!;
    expect(s.profileStatus).toBe("error");
    expect(s.profile).toBeNull();
    expect(avatarLoadingFrom(s)).toBe(false);

    // t=15000: retry #2 dispara, falha. Retries esgotados. Estado terminal.
    await advance(9000);
    s = records.at(-1)!;
    expect(s.profileStatus).toBe("error");
    expect(s.profile).toBeNull();
    expect(s.profileError).toBeInstanceOf(Error);
    expect(avatarLoadingFrom(s)).toBe(false);

    // Total de chamadas: 1 inicial + 2 retries.
    expect(profileSvc.fn).toHaveBeenCalledTimes(3);

    // Avançando muito mais tempo: NENHUM retry adicional. Espera evento natural.
    await advance(120_000);
    expect(profileSvc.fn).toHaveBeenCalledTimes(3);
    s = records.at(-1)!;
    expect(s.profileStatus).toBe("error");
    expect(avatarLoadingFrom(s)).toBe(false);

    errorSpy.mockRestore();
  });

  it("[boot-late-recovery] skeleton timeout aos 6s mostra fallback; retry tardio com sucesso restaura profile sobre o fallback", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const records: Snapshot[] = [];
    const Probe = makeProbe(records);

    supa.setGetSession(async () => ({ data: { session: validSession } }));
    // Inicial falha, retry #1 falha, retry #2 finalmente sucesso.
    profileSvc.fn
      .mockRejectedValueOnce(new Error("cold start"))
      .mockRejectedValueOnce(new Error("still warming"))
      .mockResolvedValueOnce(fullProfile);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await flushMicrotasks();

    // t=0+: inicial rejeitou, ainda em 'loading' (dentro da janela de 6s).
    expect(records.at(-1)!.profileStatus).toBe("loading");

    // t=3000: retry #1 falha. Continua em 'loading'.
    await advance(3000);
    expect(records.at(-1)!.profileStatus).toBe("loading");

    // t=6000: skeleton timeout dispara. status='error', avatarLoading=false.
    await advance(3000);
    let s = records.at(-1)!;
    expect(s.profileStatus).toBe("error");
    expect(avatarLoadingFrom(s)).toBe(false);
    expect(s.profile).toBeNull();
    // Crucial: retry #2 NÃO foi cancelado pelo skeleton timeout.

    // t=15000: retry #2 dispara, finalmente sucesso. Perfil restaurado.
    await advance(9000);
    s = records.at(-1)!;
    expect(s.profileStatus).toBe("ready");
    expect(s.profile).toEqual(fullProfile);
    expect(s.profileError).toBeNull();
    expect(avatarLoadingFrom(s)).toBe(false);

    errorSpy.mockRestore();
  });

  it("[H2] TOKEN_REFRESHED com loadProfile que rejeita: profile bom NÃO regride", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const records: Snapshot[] = [];
    const Probe = makeProbe(records);

    supa.setGetSession(async () => ({ data: { session: validSession } }));
    // Boot OK; refresh seguinte e todos os retries falham.
    profileSvc.fn
      .mockResolvedValueOnce(fullProfile)
      .mockRejectedValue(new Error("transient 401 mid-rotation"));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await flushMicrotasks();

    // Pós-boot: avatar carregado normalmente.
    let s = records.at(-1)!;
    expect(s.profile).toEqual(fullProfile);
    expect(s.profileStatus).toBe("ready");
    expect(avatarLoadingFrom(s)).toBe(false);

    // Rotação de token: handleAuthChange dispara loadProfile em modo background.
    await act(async () => {
      supa.emit("TOKEN_REFRESHED", validSession);
    });
    await flushMicrotasks();

    // Refresh falhou. profile preservado, status continua 'ready', profileError setado.
    s = records.at(-1)!;
    expect(s.profile).toEqual(fullProfile); // NUNCA null aqui
    expect(s.profileStatus).toBe("ready");
    expect(s.profileError).toBeInstanceOf(Error);
    expect(avatarLoadingFrom(s)).toBe(false);

    // Mesmo passando por todos os retries em background (também falham),
    // profile continua igual ao último bom. Status permanece 'ready'.
    await advance(20_000);
    s = records.at(-1)!;
    expect(s.profile).toEqual(fullProfile);
    expect(s.profileStatus).toBe("ready");
    expect(avatarLoadingFrom(s)).toBe(false);

    errorSpy.mockRestore();
  });

  it("[H3] backend devolve {data:null}: profileService rejeita explicitamente (sem caminho silencioso de sucesso com null)", async () => {
    const actual = await vi.importActual<
      typeof import("@/services/profileService")
    >("@/services/profileService");

    // 1) {data: null} -> reject
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ data: null }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(actual.getMyProfile()).rejects.toThrow(
      /resposta vazia|inválida/i,
    );

    // 2) Corpo sem data -> reject
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(actual.getMyProfile()).rejects.toThrow(
      /resposta vazia|inválida/i,
    );

    // 3) JSON malformado (HTML do SPA, p.ex. apiUrl errado) -> reject sem SyntaxError vazado
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response("<!doctype html><html></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );
    await expect(actual.getMyProfile()).rejects.toThrow();

    // 4) HTTP !ok -> reject com status no erro
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }));
    await expect(actual.getMyProfile()).rejects.toThrow(/HTTP 503/);

    // 5) Sucesso real ainda funciona (sanity).
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ data: fullProfile }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(actual.getMyProfile()).resolves.toEqual(fullProfile);
  });

  it("[signOut-cancels-retries] SIGNED_OUT cancela retry pendente e zera para idle", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const records: Snapshot[] = [];
    const Probe = makeProbe(records);

    supa.setGetSession(async () => ({ data: { session: validSession } }));
    profileSvc.fn.mockRejectedValue(new Error("boot fail"));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await flushMicrotasks();

    // Inicial falhou. Um retry está agendado em 3s.
    expect(profileSvc.fn).toHaveBeenCalledTimes(1);

    // SIGNED_OUT antes do retry disparar.
    await act(async () => {
      supa.emit("SIGNED_OUT", null);
    });
    await flushMicrotasks();

    const s = records.at(-1)!;
    expect(s.profileStatus).toBe("idle");
    expect(s.profile).toBeNull();
    expect(s.profileError).toBeNull();

    // Avançando o tempo: o retry agendado NÃO deve mais chamar getMyProfile.
    await advance(60_000);
    expect(profileSvc.fn).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it("[ref-sync] auth event chegando entre setProfile e o commit escolhe mode='background' (DOCUMENTAÇÃO de intenção, não regression guard)", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const fullProfile2 = { ...fullProfile, name: "After refresh" } as Profile;

    // ATENÇÃO: este teste documenta a intenção mas NÃO trava a regressão.
    // jsdom+act flushiam effects em fronteiras de microtask de forma mais
    // agressiva que o navegador, então este teste passa com sync inline E com
    // useEffect espelho. A regressão é travada pelo teste [ref-sync-surgical]
    // logo abaixo, que compara profileRef.current com profile a cada render.
    profileSvc.fn
      .mockImplementationOnce(
        () =>
          new Promise<Profile>((resolve) => {
            queueMicrotask(() => {
              resolve(fullProfile);
              queueMicrotask(() => supa.emit("TOKEN_REFRESHED", validSession));
            });
          }),
      )
      .mockResolvedValueOnce(fullProfile2);

    supa.setGetSession(async () => ({ data: { session: validSession } }));

    const records: Snapshot[] = [];
    const Probe = makeProbe(records);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await flushMicrotasks();

    const last = records.at(-1)!;
    expect(last.profile).toEqual(fullProfile2);
    expect(last.profileStatus).toBe("ready");
    expect(avatarLoadingFrom(last)).toBe(false);

    // Invariante: a partir do primeiro render em que profile foi setado, status
    // NUNCA pode regredir para 'loading'. Esse é o flash de skeleton que o
    // sync do profileRef previne.
    const firstWithProfile = records.findIndex((r) => r.profile !== null);
    expect(firstWithProfile).toBeGreaterThanOrEqual(0);
    for (let i = firstWithProfile; i < records.length; i++) {
      expect(records[i].profileStatus).not.toBe("loading");
    }

    errorSpy.mockRestore();
  });

  it("[ref-sync-surgical] profileRef.current === profile em TODO render (regression guard contra reintrodução do useEffect espelho)", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    profileSvc.fn.mockResolvedValue(fullProfile);
    supa.setGetSession(async () => ({ data: { session: validSession } }));

    type Divergence = {
      renderIndex: number;
      profile: Profile | null;
      refCurrent: Profile | null;
    };
    const divergences: Divergence[] = [];
    let renderIndex = 0;

    function RefSyncProbe() {
      const auth = useAuth();
      const internals = __useAuthInternalsForTests();
      const idx = renderIndex++;
      if (internals && internals.profileRef.current !== auth.profile) {
        divergences.push({
          renderIndex: idx,
          profile: auth.profile,
          refCurrent: internals.profileRef.current,
        });
      }
      return null;
    }

    render(
      <AuthProvider>
        <RefSyncProbe />
      </AuthProvider>,
    );
    await flushMicrotasks();
    expect(divergences).toEqual([]);

    // Transição 2: refresh em background mantém invariante.
    await act(async () => {
      supa.emit("TOKEN_REFRESHED", validSession);
    });
    await flushMicrotasks();
    expect(divergences).toEqual([]);

    // Transição 3: SIGNED_OUT zera profile e ref na MESMA mutação síncrona.
    await act(async () => {
      supa.emit("SIGNED_OUT", null);
    });
    await flushMicrotasks();
    expect(divergences).toEqual([]);

    // Transição 4: novo SIGNED_IN re-popula tudo.
    await act(async () => {
      supa.emit("SIGNED_IN", validSession);
    });
    await flushMicrotasks();
    expect(divergences).toEqual([]);

    errorSpy.mockRestore();
  });

  it("[race-B-signout] refreshProfile em voo + SIGNED_OUT: resolução tardia NÃO ressuscita perfil deslogado", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    let resolveRefresh: ((p: Profile) => void) | undefined;
    profileSvc.fn
      .mockResolvedValueOnce(fullProfile) // boot
      .mockImplementationOnce(
        () =>
          new Promise<Profile>((resolve) => {
            resolveRefresh = resolve;
          }),
      ); // refreshProfile fica pendurado

    supa.setGetSession(async () => ({ data: { session: validSession } }));

    const records: Snapshot[] = [];
    const Probe = makeProbe(records);

    let refreshHandle: () => Promise<void> = () => Promise.resolve();
    function Grabber() {
      const { refreshProfile } = useAuth();
      refreshHandle = refreshProfile;
      return null;
    }

    render(
      <AuthProvider>
        <Probe />
        <Grabber />
      </AuthProvider>,
    );
    await flushMicrotasks();

    // Boot OK.
    expect(records.at(-1)!.profile).toEqual(fullProfile);
    expect(records.at(-1)!.profileStatus).toBe("ready");

    // Usuário chama refreshProfile. Fica pendurado.
    let refreshSettled = false;
    let refreshThrew = false;
    const refreshPromise = refreshHandle()
      .then(() => {
        refreshSettled = true;
      })
      .catch(() => {
        refreshThrew = true;
      });
    await flushMicrotasks();
    expect(resolveRefresh).toBeDefined();
    expect(refreshSettled).toBe(false);

    // SIGNED_OUT chega DURANTE o refresh em voo. cancelProfileLifecycle bumpa
    // a geração, limpa estado para idle.
    await act(async () => {
      supa.emit("SIGNED_OUT", null);
    });
    await flushMicrotasks();

    let s = records.at(-1)!;
    expect(s.hasUser).toBe(false);
    expect(s.profile).toBeNull();
    expect(s.profileStatus).toBe("idle");

    // Agora o refreshProfile pendente resolve com o perfil do usuário JÁ
    // deslogado. Sob o código antigo (sem generation guard no refreshProfile),
    // isso ressuscitaria o profile. Com o guard, deve ser descartado.
    await act(async () => {
      resolveRefresh!(fullProfile);
    });
    await flushMicrotasks();
    await refreshPromise;

    // INVARIANTE CRÍTICA: perfil deslogado NÃO ressuscita.
    s = records.at(-1)!;
    expect(s.profile).toBeNull();
    expect(s.profileStatus).toBe("idle");
    expect(s.hasUser).toBe(false);

    // refreshProfile resolveu (não rejeitou) mas registrou a suplantação no
    // console.info para não virar silêncio (regra anti-H3).
    expect(refreshSettled).toBe(true);
    expect(refreshThrew).toBe(false);
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringMatching(/refreshProfile suplantado/i),
    );

    errorSpy.mockRestore();
    infoSpy.mockRestore();
  });

  it("[generation-guard] background fetch lento que volta com sucesso TARDIO não suplanta perfil bom posterior", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const records: Snapshot[] = [];
    const Probe = makeProbe(records);

    const olderProfile = { ...fullProfile, name: "Older" } as Profile;
    const newerProfile = { ...fullProfile, name: "Newer" } as Profile;

    // Bola 1: boot resolve com olderProfile rapidamente.
    // Bola 2: refresh em background resolve LENTAMENTE com um perfil "antigo"
    //         que chegaria depois do refresh seguinte.
    // Bola 3: refresh subsequente resolve com newerProfile.
    let resolveSlow: ((p: Profile) => void) | undefined;
    profileSvc.fn
      .mockResolvedValueOnce(olderProfile) // chamada #1 (boot)
      .mockImplementationOnce(
        () =>
          new Promise<Profile>((resolve) => {
            resolveSlow = resolve;
          }),
      ) // chamada #2 (refresh lento)
      .mockResolvedValueOnce(newerProfile); // chamada #3 (refresh novo)

    supa.setGetSession(async () => ({ data: { session: validSession } }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await flushMicrotasks();

    expect(records.at(-1)!.profile).toEqual(olderProfile);

    // Dispara o refresh lento.
    await act(async () => {
      supa.emit("TOKEN_REFRESHED", validSession);
    });
    await flushMicrotasks();

    // Dispara um refresh subsequente que resolve com newerProfile,
    // bumpando a geração e suplantando o lento.
    await act(async () => {
      supa.emit("TOKEN_REFRESHED", validSession);
    });
    await flushMicrotasks();

    expect(records.at(-1)!.profile).toEqual(newerProfile);

    // Agora o lento resolve, mas com geração antiga -> deve ser DESCARTADO.
    await act(async () => {
      resolveSlow!({ ...fullProfile, name: "Stale" } as Profile);
    });
    await flushMicrotasks();

    // Profile permanece o newerProfile.
    expect(records.at(-1)!.profile).toEqual(newerProfile);

    errorSpy.mockRestore();
  });
});
