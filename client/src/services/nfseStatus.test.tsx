import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getNfseStatus,
  peekNfseStatus,
  resetNfseStatusCache,
  useNfseEnabled,
} from "./nfseStatus";

/**
 * O PONTO UNICO DE VERDADE do gate fiscal do frontend, nos quatro estados que
 * importam. Tres deles sao a mesma decisao vista de angulos diferentes: na
 * duvida, ESCONDE.
 *
 * Nada de rede: `fetch` global e um spy e as respostas sao forjadas.
 */

function responderCom(body: unknown, ok = true) {
  return vi.fn(async () => ({
    ok,
    json: async () => body,
  })) as unknown as typeof fetch;
}

beforeEach(() => {
  resetNfseStatusCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetNfseStatusCache();
});

describe("getNfseStatus", () => {
  it('resolve "enabled" so com o literal exato', async () => {
    vi.stubGlobal("fetch", responderCom({ data: { nfse: "enabled" } }));
    await expect(getNfseStatus()).resolves.toBe("enabled");
  });

  it('resolve "disabled" quando o backend declara desligado', async () => {
    vi.stubGlobal("fetch", responderCom({ data: { nfse: "disabled" } }));
    await expect(getNfseStatus()).resolves.toBe("disabled");
  });

  it("JANELA DE DEPLOY: campo ausente resolve para desligado", async () => {
    // Backend antigo, que ainda nao conhece a rota nem o campo. A Vercel sobe
    // antes do Railway, entao este e o estado real por alguns minutos a cada
    // deploy. Adivinhar "ligado" aqui mostraria superficie fiscal contra um
    // servidor que recusa tudo.
    vi.stubGlobal("fetch", responderCom({ data: {} }));
    await expect(getNfseStatus()).resolves.toBe("disabled");
  });

  it("resposta malformada resolve para desligado", async () => {
    vi.stubGlobal("fetch", responderCom({ qualquer: "coisa" }));
    await expect(getNfseStatus()).resolves.toBe("disabled");
  });

  it("dedupa a chamada em voo e cacheia por carga de app", async () => {
    const spy = responderCom({ data: { nfse: "enabled" } });
    vi.stubGlobal("fetch", spy);

    const [a, b] = await Promise.all([getNfseStatus(), getNfseStatus()]);
    await getNfseStatus();

    expect(a).toBe("enabled");
    expect(b).toBe("enabled");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(peekNfseStatus()).toBe("enabled");
  });

  it("erro NAO e cacheado: a chamada seguinte tenta de novo", async () => {
    const spy = vi.fn(async () => {
      throw new Error("rede caiu");
    }) as unknown as typeof fetch;
    vi.stubGlobal("fetch", spy);

    await expect(getNfseStatus()).rejects.toThrow();
    expect(peekNfseStatus()).toBeNull();

    vi.stubGlobal("fetch", responderCom({ data: { nfse: "enabled" } }));
    await expect(getNfseStatus()).resolves.toBe("enabled");
  });
});

describe("useNfseEnabled", () => {
  it('devolve true so com "enabled"', async () => {
    vi.stubGlobal("fetch", responderCom({ data: { nfse: "enabled" } }));
    const { result } = renderHook(() => useNfseEnabled());
    // Comeca falso: o default e esconder ate ter a resposta na mao.
    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('devolve false com "disabled"', async () => {
    vi.stubGlobal("fetch", responderCom({ data: { nfse: "disabled" } }));
    const { result } = renderHook(() => useNfseEnabled());
    await waitFor(() => expect(peekNfseStatus()).toBe("disabled"));
    expect(result.current).toBe(false);
  });

  it("JANELA DE DEPLOY: campo ausente devolve false", async () => {
    vi.stubGlobal("fetch", responderCom({ data: {} }));
    const { result } = renderHook(() => useNfseEnabled());
    await waitFor(() => expect(peekNfseStatus()).toBe("disabled"));
    expect(result.current).toBe(false);
  });

  it("fetch rejeitado devolve false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("rede caiu");
      }) as unknown as typeof fetch,
    );
    const { result } = renderHook(() => useNfseEnabled());
    await waitFor(() => expect(result.current).toBe(false));
    expect(peekNfseStatus()).toBeNull();
  });

  it("resposta HTTP de erro devolve false", async () => {
    vi.stubGlobal("fetch", responderCom({ data: { nfse: "enabled" } }, false));
    const { result } = renderHook(() => useNfseEnabled());
    await waitFor(() => expect(result.current).toBe(false));
  });
});
