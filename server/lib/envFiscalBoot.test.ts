import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * BOOT FAIL-CLOSED de NFSE_MEIOS_EMISSAO (regra R1): com a emissao ligada, o
 * processo NAO sobe sem a lista de meios.
 *
 * Importa o `env.ts` REAL, porque a verificacao e codigo de nivel de modulo
 * que chama `process.exit`. O `dotenv` e dublado para o `.env` do disco nao
 * entrar: o teste precisa dar o mesmo resultado com e sem o arquivo, e e
 * exatamente isso que a suite sem `.env` confere.
 */

vi.mock("dotenv", () => ({ config: () => ({ parsed: {} }) }));

const ORIGINAL = { ...process.env };

class SaidaDoProcesso extends Error {
  constructor(public codigo: number | undefined) {
    super(`process.exit(${codigo})`);
  }
}

function ambienteFiscal(extra: Record<string, string | undefined>) {
  for (const chave of Object.keys(process.env)) {
    if (chave.startsWith("NFSE_") || chave.startsWith("FISCAL_")) {
      delete process.env[chave];
    }
  }
  process.env.NODE_ENV = "test";
  delete process.env.BILLING_ENABLED;
  delete process.env.ASAAS_ENABLED;
  process.env.NFSE_ENABLED = "true";
  process.env.NFSE_PROVIDER = "mock";
  process.env.NFSE_EMITIR_DESDE = "2026-10-01";
  for (const [chave, valor] of Object.entries(extra)) {
    if (valor === undefined) delete process.env[chave];
    else process.env[chave] = valor;
  }
}

beforeEach(() => {
  vi.resetModules();
  vi.spyOn(process, "exit").mockImplementation((codigo) => {
    throw new SaidaDoProcesso(codigo as number | undefined);
  });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
});

describe("boot com NFSE_ENABLED=true", () => {
  it("ABORTA sem NFSE_MEIOS_EMISSAO", async () => {
    ambienteFiscal({ NFSE_MEIOS_EMISSAO: undefined });
    await expect(import("./env")).rejects.toThrow("process.exit(1)");
  });

  it("ABORTA com valor fora do vocabulario", async () => {
    ambienteFiscal({ NFSE_MEIOS_EMISSAO: "cartao,credito" });
    await expect(import("./env")).rejects.toThrow("process.exit(1)");
  });

  it("sobe com a lista valida", async () => {
    ambienteFiscal({ NFSE_MEIOS_EMISSAO: "cartao,pix,boleto" });
    const { env } = await import("./env");
    expect(env.nfseMeiosEmissao).toEqual(["cartao", "pix", "boleto"]);
  });
});

describe("boot com a emissao DESLIGADA", () => {
  it("sobe sem NFSE_MEIOS_EMISSAO", async () => {
    ambienteFiscal({ NFSE_ENABLED: undefined, NFSE_MEIOS_EMISSAO: undefined });
    const { env } = await import("./env");
    expect(env.nfseEnabled).toBe(false);
    expect(env.nfseMeiosEmissao).toBeNull();
  });
});
