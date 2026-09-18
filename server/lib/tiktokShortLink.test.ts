import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ehLinkCurtoDoTikTok,
  resolverLinkCurtoDoTikTok,
} from "./tiktokShortLink";

/**
 * Resolvedor de link curto do TikTok (lote 10c). O `fetch` e dublado com
 * `vi.stubGlobal`, como em server/lib/fx/ptax.test.ts, e cada resposta e um
 * `Response` de verdade SEM corpo: o que se afirma e o contrato de seguranca
 * (HEAD, redirect manual, hosts de uma lista fechada, no maximo dois saltos)
 * e nao a forma de um HTML que nunca e lido.
 */

const ID = "7311122233344455566";
const FINAL = `https://www.tiktok.com/@ana.cria/video/${ID}`;
const CANONICA = {
  network: "tiktok",
  kind: "video",
  external_id: ID,
  url: FINAL,
};

function redireciona(location: string, status = 301): Response {
  return new Response(null, { status, headers: { location } });
}

function dublarFetch(...respostas: Response[]) {
  const fetchMock = vi.fn();
  for (const r of respostas) fetchMock.mockResolvedValueOnce(r);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function opcoesDaChamada(fetchMock: ReturnType<typeof vi.fn>, i = 0) {
  return fetchMock.mock.calls[i][1] as RequestInit;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ehLinkCurtoDoTikTok", () => {
  it("reconhece vm., vt. e tiktok.com/t/, com e sem protocolo", () => {
    for (const link of [
      "https://vm.tiktok.com/ZMabc1234/",
      "vt.tiktok.com/ZSabc12",
      "https://www.tiktok.com/t/ZTabc123/",
      "tiktok.com/t/ZTabc123",
    ]) {
      expect(ehLinkCurtoDoTikTok(link), link).toBe(true);
    }
  });

  it("nao reconhece o link completo, outros hosts, nem o instagr.am", () => {
    for (const link of [
      FINAL,
      "https://instagr.am/p/Cx1AbCdEf_-/",
      "https://vm.tiktok.com.evil.com/ZMabc1234/",
      "https://www.tiktok.com/t/",
      "https://www.tiktok.com/@ana.cria",
      "",
      null,
    ]) {
      expect(ehLinkCurtoDoTikTok(link), String(link)).toBe(false);
    }
  });
});

describe("resolverLinkCurtoDoTikTok", () => {
  it("um salto para a forma final: devolve a canonica, com HEAD, redirect manual, timeout e UA desktop", async () => {
    const fetchMock = dublarFetch(redireciona(`${FINAL}?_r=1&_t=abc`));
    const r = await resolverLinkCurtoDoTikTok(
      "https://vm.tiktok.com/ZMabc1234/",
    );
    expect(r).toEqual({ ok: true, valor: CANONICA });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://vm.tiktok.com/ZMabc1234/",
    );
    const opcoes = opcoesDaChamada(fetchMock);
    expect(opcoes.method).toBe("HEAD");
    expect(opcoes.redirect).toBe("manual");
    expect(opcoes.signal).toBeInstanceOf(AbortSignal);
    const ua = (opcoes.headers as Record<string, string>)["user-agent"];
    expect(ua).toContain("Mozilla/5.0");
    expect(ua).not.toMatch(/Mobile|Android|iPhone/);
  });

  it("dois saltos dentro do TikTok sao aceitos; o terceiro nao e tentado", async () => {
    const fetchMock = dublarFetch(
      redireciona("https://vm.tiktok.com/ZMabc1234/", 302),
      redireciona(FINAL, 307),
    );
    const r = await resolverLinkCurtoDoTikTok(
      "https://www.tiktok.com/t/ZTabc123/",
    );
    expect(r).toEqual({ ok: true, valor: CANONICA });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const tresSaltos = dublarFetch(
      redireciona("https://vm.tiktok.com/ZMabc1234/"),
      redireciona("https://www.tiktok.com/t/ZTabc999/"),
      redireciona(FINAL),
    );
    const s = await resolverLinkCurtoDoTikTok("https://vt.tiktok.com/ZSabc12/");
    expect(s).toEqual({ ok: false, code: "short_link_unresolved" });
    // A terceira resposta existe no dublê e NUNCA e pedida.
    expect(tresSaltos).toHaveBeenCalledTimes(2);
  });

  it("location para host de fora: recusa e NAO segue", async () => {
    const fetchMock = dublarFetch(
      redireciona("https://evil.example/@ana.cria/video/7311122233344455566"),
      redireciona(FINAL),
    );
    const r = await resolverLinkCurtoDoTikTok(
      "https://vm.tiktok.com/ZMabc1234/",
    );
    expect(r).toEqual({ ok: false, code: "short_link_unresolved" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("location no TikTok mas que nao e video (m.tiktok.com/v/<id>.html) nos dois saltos: recusa", async () => {
    const fetchMock = dublarFetch(
      redireciona(`https://m.tiktok.com/v/${ID}.html`),
      redireciona(`https://m.tiktok.com/v/${ID}.html?refer=embed`),
    );
    const r = await resolverLinkCurtoDoTikTok(
      "https://vm.tiktok.com/ZMabc1234/",
    );
    expect(r).toEqual({ ok: false, code: "short_link_unresolved" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("status que nao e redirecionamento, ou redirecionamento sem location: recusa", async () => {
    dublarFetch(new Response(null, { status: 200 }));
    expect(
      await resolverLinkCurtoDoTikTok("https://vm.tiktok.com/ZMabc1234/"),
    ).toEqual({ ok: false, code: "short_link_unresolved" });

    dublarFetch(new Response(null, { status: 302 }));
    expect(
      await resolverLinkCurtoDoTikTok("https://vm.tiktok.com/ZMabc1234/"),
    ).toEqual({ ok: false, code: "short_link_unresolved" });
  });

  it("timeout ou erro de rede: recusa, sem tentar de novo", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(
        new DOMException(
          "The operation was aborted due to timeout",
          "TimeoutError",
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const r = await resolverLinkCurtoDoTikTok(
      "https://vm.tiktok.com/ZMabc1234/",
    );
    expect(r).toEqual({ ok: false, code: "short_link_unresolved" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("o que nao e link curto do TikTok nem chega a abrir conexao", async () => {
    const fetchMock = dublarFetch(redireciona(FINAL));
    for (const link of [FINAL, "https://instagr.am/p/Cx1AbCdEf_-/", "x"]) {
      expect(await resolverLinkCurtoDoTikTok(link), link).toEqual({
        ok: false,
        code: "short_link_unresolved",
      });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
