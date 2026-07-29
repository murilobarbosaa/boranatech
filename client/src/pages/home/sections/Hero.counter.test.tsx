import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

// =============================================================================
// Mock de framer-motion: AnimatedCounter exibe o `value` no DOM (sem animação
// de viewport), permitindo provar o que aparece na tela após cada cenário.
// =============================================================================
// Ambiente de movimento controlado pelo teste (prefers-reduced-motion).
const motionEnv = vi.hoisted(() => ({ prefersReduced: false }));

vi.mock("framer-motion", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  type Listener = (n: number) => void;
  type FakeMotionValue = {
    get: () => number;
    set: (n: number) => void;
    on: (event: string, fn: Listener) => () => void;
  };

  const fakeMotion = new Proxy({} as Record<string, unknown>, {
    get(_, tag: string) {
      return React.forwardRef(
        (props: Record<string, unknown>, ref: unknown) => {
          const {
            children,
            animate: _a,
            initial: _i,
            transition: _t,
            whileHover: _wh,
            whileTap: _wt,
            whileInView: _wv,
            exit: _e,
            variants: _v,
            viewport: _vp,
            ...rest
          } = props as { children?: unknown } & Record<string, unknown>;
          return React.createElement(
            tag,
            { ...rest, ref },
            children as React.ReactNode,
          );
        },
      );
    },
  });

  function useMotionValue(initial: number): FakeMotionValue {
    return React.useMemo<FakeMotionValue>(() => {
      let v = initial;
      const listeners = new Set<Listener>();
      return {
        get: () => v,
        set: (n: number) => {
          v = n;
          listeners.forEach((fn) => fn(n));
        },
        on: (_event: string, fn: Listener) => {
          listeners.add(fn);
          return () => {
            listeners.delete(fn);
          };
        },
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  }

  function useTransform<T>(mv: FakeMotionValue, fn: (n: number) => T): T {
    const [v, setV] = React.useState<T>(() => fn(mv.get()));
    React.useEffect(() => {
      const off = mv.on("change", (n: number) => setV(fn(n)));
      return off;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mv]);
    return v;
  }

  function animate(mv: FakeMotionValue, target: number) {
    mv.set(target);
    return { stop: () => {} };
  }

  const actual =
    await vi.importActual<typeof import("framer-motion")>("framer-motion");

  return {
    motion: fakeMotion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    // useInView REAL, de propósito. A versão anterior deste mock era
    // `useInView: () => true`, o que excluía da suíte exatamente o mecanismo
    // que estava quebrado: o contador travava em 0 porque o observer nunca
    // disparava, e o teste passava verde porque nunca exercitou o observer.
    // Aqui ele roda de verdade, contra o IntersectionObserver stubado abaixo,
    // que o teste controla (dispara / nunca dispara / ausente).
    useInView: actual.useInView,
    useReducedMotion: () => motionEnv.prefersReduced,
    useMotionValue,
    useTransform,
    animate,
  };
});

// =============================================================================
// Mock do Sentry: withScope executa o callback com um scope espião, pra provar
// que cada ramo antes mudo agora captura, sem rede.
// =============================================================================
const sentrySpy = vi.hoisted(() => {
  const setTag = vi.fn();
  const setLevel = vi.fn();
  const setContext = vi.fn();
  const scope = { setTag, setLevel, setContext };
  const captureMessage = vi.fn();
  const captureException = vi.fn();
  const withScope = vi.fn((cb: (s: typeof scope) => void) => cb(scope));
  return {
    setTag,
    setLevel,
    setContext,
    captureMessage,
    captureException,
    withScope,
  };
});

vi.mock("@sentry/react", () => ({
  withScope: sentrySpy.withScope,
  captureMessage: sentrySpy.captureMessage,
  captureException: sentrySpy.captureException,
}));

import Hero from "./Hero";

const LS_KEY = "bnt_users_count";
const PLACEHOLDER_TEXT = "Já estão encontrando o caminho em tech";

let fetchSpy: ReturnType<typeof vi.fn>;

// Modo do IntersectionObserver stubado:
//   "fire"  -> o alvo é reportado como visível (situação normal do badge, que
//              fica acima da dobra);
//   "never" -> o observer nunca chama o callback. É o cenário do bug: o alvo
//              cai fora da root e a animação nunca é disparada.
let ioMode: "fire" | "never" = "fire";
// rootMargins efetivamente pedidos ao IntersectionObserver, pra travar a
// decisão de não usar margem negativa nos lados.
let ioRootMargins: string[] = [];

function stubIntersectionObserver() {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      private cb: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback, opts?: { rootMargin?: string }) {
        this.cb = cb;
        ioRootMargins.push(opts?.rootMargin ?? "");
      }
      observe(target: Element) {
        if (ioMode === "never") return;
        const entry = {
          target,
          isIntersecting: true,
          intersectionRatio: 1,
        } as unknown as IntersectionObserverEntry;
        // assíncrono, como o observer real
        setTimeout(() => this.cb([entry], this as never), 0);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
}

beforeEach(() => {
  ioMode = "fire";
  ioRootMargins = [];
  motionEnv.prefersReduced = false;
  stubIntersectionObserver();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  sentrySpy.setTag.mockClear();
  sentrySpy.setLevel.mockClear();
  sentrySpy.setContext.mockClear();
  sentrySpy.captureMessage.mockClear();
  sentrySpy.captureException.mockClear();
  sentrySpy.withScope.mockClear();
  try {
    window.localStorage.clear();
  } catch {
    // ignore
  }
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderHero() {
  const { hook } = memoryLocation({ path: "/" });
  return render(
    <Router hook={hook}>
      <Hero />
    </Router>,
  );
}

function bodyText(): string {
  // Lê o DOM SEM os nós marcados como escondidos.
  //
  // O contador reserva a largura da caixa renderizando uma cópia INVISÍVEL do
  // valor final ao lado do número animado (ver AnimatedCounter em Hero.tsx). Ela
  // é `aria-hidden`, mas `textContent` não liga para isso: sem removê-la a
  // leitura sai duplicada ("+2.7760 pessoas...", a cópia mais o valor corrente) e
  // toda asserção sobre o número reprova por dígitos que ninguém vê.
  //
  // A remoção fica AQUI, no leitor único, e não em cada asserção: 14 testes
  // dependem desta função, e guarda escrita no chamador sumiria no primeiro que
  // alguém esquecesse. Mesmo princípio do `logAiUsage` citado no CLAUDE.md.
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
}

function expectsPlaceholder() {
  const txt = bodyText();
  expect(txt, `expected placeholder, got: ${txt.slice(0, 300)}`).toContain(
    PLACEHOLDER_TEXT,
  );
  // Invariante: jamais há "+N pessoas" no DOM no estado placeholder.
  expect(txt).not.toMatch(/\+\s*\d+\s*pessoas/);
  // Anti-regressão dura: nunca, em nenhum estado, deve aparecer "4800".
  expect(txt).not.toContain("4800");
}

async function expectsNumber(expected: string) {
  await waitFor(() => {
    const txt = bodyText();
    const m = txt.match(/\+\s*([\d.]+)\s*pessoas já encontraram seu caminho/);
    expect(
      m,
      `expected "+N pessoas..." in body, got: ${txt.slice(0, 300)}`,
    ).not.toBeNull();
    expect(m![1].replace(/[. ]/g, "")).toBe(expected);
  });
  // Em nenhum cenário deste teste o placeholder e o número coexistem.
  expect(bodyText()).not.toContain(PLACEHOLDER_TEXT);
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("Hero: contador do hero (last-known-good no localStorage, sem default 4800, sem 0 inventado)", () => {
  it("[primeira-visita-sem-cache-mostra-placeholder] localStorage vazio + fetch pendurado: badge mostra a frase, sem '+', sem dígitos, sem 4800", () => {
    fetchSpy.mockReturnValue(new Promise(() => {}));

    renderHero();

    expectsPlaceholder();
  });

  it("[visita-recorrente-mostra-cache-imediato] localStorage='32' + fetch pendurado: mostra +32 (last-known-good local) sem flash de 4800", async () => {
    window.localStorage.setItem(LS_KEY, "32");
    fetchSpy.mockReturnValue(new Promise(() => {}));

    renderHero();

    await expectsNumber("32");
    expect(bodyText()).not.toContain("4800");
  });

  it("[http-not-ok-mantem-cache] localStorage='32' + HTTP 500: continua em +32, nunca regride para 4800 nem placeholder", async () => {
    window.localStorage.setItem(LS_KEY, "32");
    fetchSpy.mockResolvedValue(new Response("", { status: 500 }));

    renderHero();
    await flushMicrotasks();

    await expectsNumber("32");
  });

  it("[network-error-mantem-cache] localStorage='32' + fetch rejeita: continua em +32", async () => {
    window.localStorage.setItem(LS_KEY, "32");
    fetchSpy.mockRejectedValue(new Error("network failure"));

    renderHero();
    await flushMicrotasks();

    await expectsNumber("32");
  });

  it("[count-null-mantem-cache] localStorage='32' + backend devolve {count: null}: continua em +32 (não regride)", async () => {
    window.localStorage.setItem(LS_KEY, "32");
    fetchSpy.mockResolvedValue(jsonResponse({ count: null }));

    renderHero();
    await flushMicrotasks();

    await expectsNumber("32");
  });

  it("[html-response-mantem-cache] localStorage='32' + backend devolve HTML (cenário Vercel sem VITE_API_URL): continua em +32", async () => {
    window.localStorage.setItem(LS_KEY, "32");
    fetchSpy.mockResolvedValue(
      new Response("<!doctype html><html></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );

    renderHero();
    await flushMicrotasks();

    await expectsNumber("32");
  });

  it("[count-null-sem-cache-mantem-placeholder] localStorage vazio + backend devolve {count: null}: continua no placeholder, sem inventar número", async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ count: null }));

    renderHero();
    await flushMicrotasks();

    expectsPlaceholder();
  });

  it("[primeira-visita-sucesso-popula-cache] localStorage vazio + fetch {count: 32}: tela vai pra +32 E grava '32' no localStorage", async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ count: 32 }));

    renderHero();
    await flushMicrotasks();
    await expectsNumber("32");

    expect(window.localStorage.getItem(LS_KEY)).toBe("32");
  });

  it("[count-novo-sobrescreve-cache] localStorage='32' + fetch {count: 45}: tela vai pra +45 E localStorage='45'", async () => {
    window.localStorage.setItem(LS_KEY, "32");
    fetchSpy.mockResolvedValue(jsonResponse({ count: 45 }));

    renderHero();
    await flushMicrotasks();
    await expectsNumber("45");

    expect(window.localStorage.getItem(LS_KEY)).toBe("45");
  });

  it("[localStorage-corrompido-vira-placeholder] valor não-numérico no LS é tratado como ausente: placeholder, sem crash", () => {
    window.localStorage.setItem(LS_KEY, "abc-not-a-number");
    fetchSpy.mockReturnValue(new Promise(() => {}));

    renderHero();

    expectsPlaceholder();
  });

  it("[localStorage-negativo-vira-placeholder] valor negativo no LS é rejeitado: placeholder, sem crash", () => {
    window.localStorage.setItem(LS_KEY, "-5");
    fetchSpy.mockReturnValue(new Promise(() => {}));

    renderHero();

    expectsPlaceholder();
  });

  it("[localStorage-zero-vira-placeholder] cache envenenado com '0' é rejeitado: placeholder, nunca '+0'", () => {
    window.localStorage.setItem(LS_KEY, "0");
    fetchSpy.mockReturnValue(new Promise(() => {}));

    renderHero();

    expectsPlaceholder();
  });

  it("[localStorage-throw-no-crash] getItem lança (modo privado, cookies bloqueados): placeholder, sem crash de render", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    fetchSpy.mockReturnValue(new Promise(() => {}));

    expect(() => renderHero()).not.toThrow();
    expectsPlaceholder();
  });

  it("[zero-do-backend-vira-placeholder-e-nao-cacheia] backend devolve {count: 0} (degradação, não estado real): fica no placeholder e NÃO grava '0' no LS", async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ count: 0 }));

    renderHero();
    await flushMicrotasks();
    expectsPlaceholder();

    expect(window.localStorage.getItem(LS_KEY)).toBeNull();
  });

  it("[zero-do-backend-nao-sobrescreve-cache-bom] localStorage='32' + backend {count: 0}: continua em +32, não regride para +0", async () => {
    window.localStorage.setItem(LS_KEY, "32");
    fetchSpy.mockResolvedValue(jsonResponse({ count: 0 }));

    renderHero();
    await flushMicrotasks();

    await expectsNumber("32");
    expect(window.localStorage.getItem(LS_KEY)).toBe("32");
  });
});

function htmlResponse(): Response {
  return new Response("<!doctype html><html></html>", {
    status: 200,
    headers: { "content-type": "text/html" },
  });
}

describe("Hero: instrumentação Sentry do contador (não muda a UI, só captura o silêncio)", () => {
  it("[429-captura-http] HTTP 429 (rate limit em IP compartilhado): captura warning com status e mantém placeholder", async () => {
    fetchSpy.mockResolvedValue(new Response("", { status: 429 }));

    renderHero();

    await waitFor(() => {
      expect(sentrySpy.captureMessage).toHaveBeenCalledWith(
        "[stats] users-count HTTP 429",
      );
    });
    expect(sentrySpy.setTag).toHaveBeenCalledWith("route", "stats/users-count");
    expect(sentrySpy.setContext).toHaveBeenCalledWith(
      "stats_users_count",
      expect.objectContaining({ status: 429, hadCache: false }),
    );
    // UI intocada: sem número, placeholder.
    expectsPlaceholder();
  });

  it("[html-captura-non-json] resposta HTML (Vercel sem VITE_API_URL): captura non-JSON em vez de deixar o parse lançar, mantém cache", async () => {
    window.localStorage.setItem(LS_KEY, "32");
    fetchSpy.mockResolvedValue(htmlResponse());

    renderHero();

    await waitFor(() => {
      expect(sentrySpy.captureMessage).toHaveBeenCalledWith(
        "[stats] users-count non-JSON response",
      );
    });
    expect(sentrySpy.setContext).toHaveBeenCalledWith(
      "stats_users_count",
      expect.objectContaining({ contentType: "text/html", hadCache: true }),
    );
    // UI intocada: segue no last-known-good local.
    await expectsNumber("32");
  });

  it("[count-null-captura-degraded] backend {count: null}: captura payload degradado, mantém placeholder", async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ count: null }));

    renderHero();

    await waitFor(() => {
      expect(sentrySpy.captureMessage).toHaveBeenCalledWith(
        "[stats] users-count degraded payload",
      );
    });
    expectsPlaceholder();
  });

  it("[network-error-captura-exception] fetch rejeita (CORS/ad-block/rede): captura a exceção, mantém cache", async () => {
    window.localStorage.setItem(LS_KEY, "32");
    const err = new Error("network failure");
    fetchSpy.mockRejectedValue(err);

    renderHero();

    await waitFor(() => {
      expect(sentrySpy.captureException).toHaveBeenCalledWith(err);
    });
    expect(sentrySpy.setTag).toHaveBeenCalledWith("route", "stats/users-count");
    await expectsNumber("32");
  });

  it("[sucesso-nao-captura] resposta saudável {count: 45}: mostra +45 e não captura nada", async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ count: 45 }));

    renderHero();
    await flushMicrotasks();

    await expectsNumber("45");
    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
    expect(sentrySpy.captureException).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Gatilho da animação. Estes testes existem porque o contador ficou travado em
// "+0" em produção e as duas correções anteriores passaram verde: a suíte
// mockava `useInView` para `true`, então o gatilho, que era o defeito, nunca
// era exercitado. Aqui o `useInView` é o real e quem varia é o observer.
// ===========================================================================
describe("Hero: gatilho da animação do contador (nunca sobra 0 na tela)", () => {
  it("[observer-dispara] alvo reportado visível: anima até o valor final", async () => {
    window.localStorage.setItem(LS_KEY, "2776");
    fetchSpy.mockReturnValue(new Promise(() => {}));

    renderHero();

    await expectsNumber("2776");
  });

  it("[observer-nunca-dispara-cai-no-fallback] observer mudo: o valor final aparece assim mesmo, sem sobrar 0", async () => {
    ioMode = "never";
    window.localStorage.setItem(LS_KEY, "2776");
    fetchSpy.mockReturnValue(new Promise(() => {}));

    renderHero();

    // Antes do fallback o contador está em 0: é o estado que ficava permanente.
    expect(bodyText()).toMatch(/\+\s*0\s*pessoas/);

    // E o fallback tem que resgatar sozinho.
    await waitFor(
      () => {
        const m = bodyText().match(
          /\+\s*([\d.]+)\s*pessoas já encontraram seu caminho/,
        );
        expect(m).not.toBeNull();
        expect(m![1].replace(/[. ]/g, "")).toBe("2776");
      },
      { timeout: 4000 },
    );
  });

  it("[intersection-observer-ausente] ambiente sem IntersectionObserver: ainda chega no valor final", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    window.localStorage.setItem(LS_KEY, "2776");
    fetchSpy.mockReturnValue(new Promise(() => {}));

    renderHero();

    await waitFor(
      () => {
        const m = bodyText().match(
          /\+\s*([\d.]+)\s*pessoas já encontraram seu caminho/,
        );
        expect(m).not.toBeNull();
        expect(m![1].replace(/[. ]/g, "")).toBe("2776");
      },
      { timeout: 4000 },
    );
  });

  it("[movimento-reduzido-valor-final-direto] prefers-reduced-motion + observer mudo: valor final imediato, sem animação e sem 0", async () => {
    motionEnv.prefersReduced = true;
    ioMode = "never";
    window.localStorage.setItem(LS_KEY, "2776");
    fetchSpy.mockReturnValue(new Promise(() => {}));

    renderHero();

    // Imediato: sem esperar observer nem timeout de fallback.
    const txt = bodyText();
    expect(txt).toContain("2.776");
    expect(txt).not.toMatch(/\+\s*0\s*pessoas/);
  });

  it("[sem-margem-negativa-lateral] nenhum observer do hero encolhe a root nos lados", () => {
    window.localStorage.setItem(LS_KEY, "2776");
    fetchSpy.mockReturnValue(new Promise(() => {}));

    renderHero();

    // Controle negativo: se ninguém observou nada, o teste não provou nada.
    expect(ioRootMargins.length).toBeGreaterThan(0);

    for (const margin of ioRootMargins) {
      // rootMargin CSS-like: top right bottom left (1 a 4 valores).
      const parts = margin.trim().split(/\s+/);
      const [top, right = top, bottom = top, left = right] = parts;
      expect(
        parseFloat(right),
        `rootMargin "${margin}" tem margem negativa à direita: encolhe a root e pode excluir alvo estreito`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        parseFloat(left),
        `rootMargin "${margin}" tem margem negativa à esquerda: encolhe a root e pode excluir alvo estreito`,
      ).toBeGreaterThanOrEqual(0);
      // vertical pode ser negativo (dispara um pouco antes de entrar)
      expect(Number.isNaN(parseFloat(top))).toBe(false);
      expect(Number.isNaN(parseFloat(bottom))).toBe(false);
    }
  });
});
