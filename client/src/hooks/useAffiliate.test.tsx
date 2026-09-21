import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * useAffiliate (lote 11g): um clique por captura, deduplicado por sessao.
 *
 * O hook vive em tres lugares ao mesmo tempo (AffiliateTracker, Checkout,
 * Cadastro). Antes, cada instancia capturava a URL e registrava o clique, e o
 * contador subia tres vezes por visita. Aqui: tres instancias com `?ref=`
 * disparam UM `POST /click`; recarregar a mesma URL na mesma sessao (a captura
 * memorizada e esquecida, como numa carga nova) valida e grava de novo mas
 * NAO dispara; outro codigo dispara.
 */

const estado = vi.hoisted(() => ({
  chamadas: [] as Array<{ url: string; method: string }>,
  reportes: [] as Array<{ path: string; body: unknown }>,
  responderReporte: (async () => ({
    registrado: true,
  })) as () => Promise<unknown>,
}));

vi.mock("@/lib/adminApi", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/adminApi")>();
  return {
    ...real,
    contentFetch: async (path: string, options?: RequestInit) => {
      estado.reportes.push({
        path,
        body: options?.body ? JSON.parse(String(options.body)) : null,
      });
      return estado.responderReporte();
    },
  };
});

import { AdminApiError } from "@/lib/adminApi";
import {
  AFFILIATE_STORAGE_KEY,
  reportarCadastro,
  resetarCapturaDeAfiliado,
  useAffiliate,
} from "./useAffiliate";

function Instancia() {
  const { affiliateCode } = useAffiliate();
  return <span data-testid="codigo">{affiliateCode ?? ""}</span>;
}

function urls(filtro: string) {
  return estado.chamadas.filter((c) => c.url.includes(filtro));
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetarCapturaDeAfiliado();
  estado.chamadas = [];
  estado.reportes = [];
  estado.responderReporte = async () => ({ registrado: true });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      estado.chamadas.push({ url, method: init?.method ?? "GET" });
      if (url.includes("/click")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ recorded: true }),
        } as Response;
      }
      const code = url.split("/api/affiliates/")[1] ?? "";
      return {
        ok: true,
        status: 200,
        json: async () => ({ valid: true, code, discount_percent: 15 }),
      } as Response;
    }) as unknown as typeof fetch,
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("useAffiliate: clique por captura", () => {
  it("tres instancias com ?ref= na URL: uma validacao e UM clique", async () => {
    window.history.replaceState({}, "", "/planos?ref=ANACRIA");
    const { getAllByTestId } = render(
      <>
        <Instancia />
        <Instancia />
        <Instancia />
      </>,
    );
    await waitFor(() =>
      expect(getAllByTestId("codigo").map((el) => el.textContent)).toEqual([
        "ANACRIA",
        "ANACRIA",
        "ANACRIA",
      ]),
    );
    expect(urls("/api/affiliates/ANACRIA/click")).toHaveLength(1);
    expect(urls("/click")[0].method).toBe("POST");
    // Uma validacao so, tambem: as tres esperaram a mesma promessa.
    expect(
      urls("/api/affiliates/ANACRIA").filter((c) => !c.url.includes("/click")),
    ).toHaveLength(1);
    expect(
      JSON.parse(window.localStorage.getItem(AFFILIATE_STORAGE_KEY)!).code,
    ).toBe("ANACRIA");
    expect(window.sessionStorage.getItem("bnt:affiliate-click:ANACRIA")).toBe(
      "1",
    );
  });

  it("recarregar a mesma URL na mesma sessao valida e grava de novo, mas NAO clica", async () => {
    window.history.replaceState({}, "", "/planos?ref=ANACRIA");
    render(<Instancia />);
    await waitFor(() => expect(urls("/click")).toHaveLength(1));

    // "Recarga": a captura memorizada some, o sessionStorage fica.
    cleanup();
    resetarCapturaDeAfiliado();
    window.localStorage.clear();
    estado.chamadas = [];
    render(<Instancia />);
    await waitFor(() =>
      expect(
        urls("/api/affiliates/ANACRIA").filter(
          (c) => !c.url.includes("/click"),
        ),
      ).toHaveLength(1),
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(urls("/click")).toHaveLength(0);
    expect(
      JSON.parse(window.localStorage.getItem(AFFILIATE_STORAGE_KEY)!).code,
    ).toBe("ANACRIA");
  });

  it("outro codigo na mesma sessao conta", async () => {
    window.history.replaceState({}, "", "/planos?ref=ANACRIA");
    render(<Instancia />);
    await waitFor(() => expect(urls("/click")).toHaveLength(1));

    cleanup();
    resetarCapturaDeAfiliado();
    estado.chamadas = [];
    window.history.replaceState({}, "", "/planos?cupom=OUTRO10");
    render(<Instancia />);
    await waitFor(() =>
      expect(urls("/api/affiliates/OUTRO10/click")).toHaveLength(1),
    );
    expect(
      JSON.parse(window.localStorage.getItem(AFFILIATE_STORAGE_KEY)!).code,
    ).toBe("OUTRO10");
  });

  it("sem codigo na URL nao chama a API e le o storage", async () => {
    window.localStorage.setItem(
      AFFILIATE_STORAGE_KEY,
      JSON.stringify({
        code: "GUARDADO",
        discount_percent: 10,
        expires: Date.now() + 60_000,
      }),
    );
    const { getByTestId } = render(<Instancia />);
    await waitFor(() =>
      expect(getByTestId("codigo").textContent).toBe("GUARDADO"),
    );
    expect(estado.chamadas).toHaveLength(0);
  });
});

describe("reportarCadastro (lote 11i)", () => {
  function guardar(code: string) {
    window.localStorage.setItem(
      AFFILIATE_STORAGE_KEY,
      JSON.stringify({
        code,
        discount_percent: 15,
        expires: Date.now() + 60_000,
      }),
    );
  }

  it("com afiliado guardado: chama POST /affiliates/signup uma vez e grava a flag; a segunda nao chama", async () => {
    guardar("ANACRIA");
    await Promise.all([reportarCadastro(), reportarCadastro()]);
    expect(estado.reportes).toEqual([
      { path: "/affiliates/signup", body: { code: "ANACRIA" } },
    ]);
    expect(
      window.localStorage.getItem("bnt:affiliate-signup-reported:ANACRIA"),
    ).toBe("1");
    await reportarCadastro();
    expect(estado.reportes).toHaveLength(1);
  });

  it("sem afiliado guardado nao chama; com a flag ja gravada nao chama", async () => {
    await reportarCadastro();
    expect(estado.reportes).toHaveLength(0);
    guardar("ANACRIA");
    window.localStorage.setItem("bnt:affiliate-signup-reported:ANACRIA", "1");
    await reportarCadastro();
    expect(estado.reportes).toHaveLength(0);
  });

  it("409 (conta antiga) e 403 (dono) gravam a flag: nao insiste", async () => {
    for (const [status, code] of [
      [409, "account_too_old"],
      [403, "own_code"],
    ] as const) {
      window.localStorage.clear();
      resetarCapturaDeAfiliado();
      estado.reportes = [];
      guardar("ANACRIA");
      estado.responderReporte = async () => {
        throw new AdminApiError("nao", status, code);
      };
      await reportarCadastro();
      expect(estado.reportes, String(status)).toHaveLength(1);
      expect(
        window.localStorage.getItem("bnt:affiliate-signup-reported:ANACRIA"),
        String(status),
      ).toBe("1");
    }
  });

  it("erro de rede ou 5xx NAO grava a flag: tenta de novo no proximo acesso", async () => {
    guardar("ANACRIA");
    estado.responderReporte = async () => {
      throw new AdminApiError("boom", 500, "db_error");
    };
    await reportarCadastro();
    expect(estado.reportes).toHaveLength(1);
    expect(
      window.localStorage.getItem("bnt:affiliate-signup-reported:ANACRIA"),
    ).toBeNull();
    estado.responderReporte = async () => ({ registrado: true });
    await reportarCadastro();
    expect(estado.reportes).toHaveLength(2);
    expect(
      window.localStorage.getItem("bnt:affiliate-signup-reported:ANACRIA"),
    ).toBe("1");
  });
});
