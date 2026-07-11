import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchUsdBrlRate, resetPtaxCacheForTests } from "./ptax";

// So o Date e falsificado (setSystemTime controla o recuo de datas e o TTL);
// setTimeout fica real porque o fetchWithTimeout usa timer.unref().

function ptaxJson(value: Array<{ cotacaoVenda: number }>): Response {
  return new Response(JSON.stringify({ value }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchUsdBrlRate", () => {
  beforeEach(() => {
    resetPtaxCacheForTests();
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("usa a cotacao do proprio dia quando existe", async () => {
    vi.setSystemTime(new Date("2026-07-15T12:00:00"));
    const fetchMock = vi
      .fn()
      .mockResolvedValue(ptaxJson([{ cotacaoVenda: 5.43 }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchUsdBrlRate();

    expect(result).toEqual({ usdBrl: 5.43, quoteDate: "2026-07-15" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("'07-15-2026'");
  });

  it("recua dia a dia no fim de semana ate achar cotacao (domingo -> sexta)", async () => {
    vi.setSystemTime(new Date("2026-07-12T12:00:00"));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ptaxJson([]))
      .mockResolvedValueOnce(ptaxJson([]))
      .mockResolvedValueOnce(ptaxJson([{ cotacaoVenda: 5.5 }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchUsdBrlRate();

    expect(result).toEqual({ usdBrl: 5.5, quoteDate: "2026-07-10" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0][0])).toContain("'07-12-2026'");
    expect(String(fetchMock.mock.calls[1][0])).toContain("'07-11-2026'");
    expect(String(fetchMock.mock.calls[2][0])).toContain("'07-10-2026'");
  });

  it("falha total devolve null depois de tentar hoje + 7 dias de recuo", async () => {
    vi.setSystemTime(new Date("2026-07-15T12:00:00"));
    const fetchMock = vi.fn().mockRejectedValue(new Error("rede fora"));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchUsdBrlRate();

    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it("serve do cache dentro do TTL de 12h (sem novo fetch, mesmo se a rede cair) e rebusca depois", async () => {
    vi.setSystemTime(new Date("2026-07-15T08:00:00"));
    const fetchMock = vi
      .fn()
      .mockResolvedValue(ptaxJson([{ cotacaoVenda: 5.43 }]));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchUsdBrlRate()).toEqual({
      usdBrl: 5.43,
      quoteDate: "2026-07-15",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Dentro do TTL: nem tenta a rede (falha de rede nao derruba cache bom).
    fetchMock.mockRejectedValue(new Error("rede fora"));
    vi.setSystemTime(new Date("2026-07-15T19:00:00"));
    expect(await fetchUsdBrlRate()).toEqual({
      usdBrl: 5.43,
      quoteDate: "2026-07-15",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // TTL vencido: rebusca e atualiza a cotacao.
    fetchMock.mockResolvedValue(ptaxJson([{ cotacaoVenda: 5.6 }]));
    vi.setSystemTime(new Date("2026-07-16T09:00:00"));
    expect(await fetchUsdBrlRate()).toEqual({
      usdBrl: 5.6,
      quoteDate: "2026-07-16",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("TTL vencido com falha total devolve null (cache expirado nao e servido)", async () => {
    vi.setSystemTime(new Date("2026-07-15T08:00:00"));
    const fetchMock = vi
      .fn()
      .mockResolvedValue(ptaxJson([{ cotacaoVenda: 5.43 }]));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchUsdBrlRate()).not.toBeNull();

    fetchMock.mockRejectedValue(new Error("rede fora"));
    vi.setSystemTime(new Date("2026-07-16T09:00:00"));
    expect(await fetchUsdBrlRate()).toBeNull();
  });
});
