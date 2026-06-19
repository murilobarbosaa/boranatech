import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

// =============================================================================
// Mock de framer-motion: AnimatedCounter exibe o `value` no DOM (sem animação
// de viewport), permitindo provar o que aparece na tela após cada cenário.
// =============================================================================
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

  function useInView() {
    return true;
  }

  return {
    motion: fakeMotion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useInView,
    useMotionValue,
    useTransform,
    animate,
  };
});

import Hero from "./Hero";

const LS_KEY = "bnt_users_count";
const PLACEHOLDER_TEXT = "Já estão encontrando o caminho em tech";

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
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
  return (document.body.textContent ?? "").replace(/\s+/g, " ").trim();
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

  it("[localStorage-throw-no-crash] getItem lança (modo privado, cookies bloqueados): placeholder, sem crash de render", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    fetchSpy.mockReturnValue(new Promise(() => {}));

    expect(() => renderHero()).not.toThrow();
    expectsPlaceholder();
  });

  it("[zero-real-renderiza-+0-e-cacheia] backend devolve {count: 0} legítimo (tabela vazia): mostra +0 e grava '0' no LS", async () => {
    fetchSpy.mockResolvedValue(jsonResponse({ count: 0 }));

    renderHero();
    await flushMicrotasks();
    await expectsNumber("0");

    expect(window.localStorage.getItem(LS_KEY)).toBe("0");
  });
});
