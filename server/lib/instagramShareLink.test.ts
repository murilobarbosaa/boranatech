import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ehLinkDeCompartilhamentoDoInstagram,
  resolverLinkDeCompartilhamentoDoInstagram,
} from "./instagramShareLink";

/**
 * Resolvedor do link de compartilhamento do Instagram (lote 11k), no mesmo
 * desenho e com o mesmo harness do resolvedor do TikTok
 * (server/lib/tiktokShortLink.test.ts): `fetch` dublado com `vi.stubGlobal`,
 * respostas SEM corpo, e o que se afirma e o contrato de seguranca (HEAD,
 * redirect manual, hosts fechados, dois saltos) mais o tipo escolhido.
 */

const CODIGO = "DAbCdEfGhIj";
const REEL = `https://www.instagram.com/reel/${CODIGO}/`;
const POST = `https://www.instagram.com/p/${CODIGO}/`;
const COMPARTILHADO = "https://www.instagram.com/share/reel/BAJ4kQ7Xyz";

function redireciona(location: string, status = 302): Response {
  return new Response(null, { status, headers: { location } });
}

function dublarFetch(...respostas: Response[]) {
  const fetchMock = vi.fn();
  for (const r of respostas) fetchMock.mockResolvedValueOnce(r);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ehLinkDeCompartilhamentoDoInstagram", () => {
  it("reconhece share/reel, share/p e share/<token>, com e sem www e protocolo", () => {
    for (const link of [
      COMPARTILHADO,
      "https://instagram.com/share/p/BAJ4kQ7Xyz",
      "instagram.com/share/BAJ4kQ7Xyz/",
      "https://www.instagram.com/SHARE/reel/BAJ4kQ7Xyz?igsh=abc",
    ]) {
      expect(ehLinkDeCompartilhamentoDoInstagram(link), link).toBe(true);
    }
  });

  it("nao reconhece a publicacao, o perfil, outros hosts nem o instagr.am", () => {
    for (const link of [
      REEL,
      "https://www.instagram.com/share.cria/",
      "https://instagr.am/share/reel/BAJ4kQ7Xyz",
      "https://www.instagram.com.evil.com/share/reel/BAJ4kQ7Xyz",
      "https://vm.tiktok.com/ZMabc1234/",
      "",
      null,
    ]) {
      expect(ehLinkDeCompartilhamentoDoInstagram(link), String(link)).toBe(
        false,
      );
    }
  });
});

describe("resolverLinkDeCompartilhamentoDoInstagram", () => {
  it("um salto para o reel: devolve a canonica, com HEAD, redirect manual, timeout e UA desktop", async () => {
    const fetchMock = dublarFetch(redireciona(`${REEL}?igsh=abc`));
    const r = await resolverLinkDeCompartilhamentoDoInstagram(
      COMPARTILHADO,
      "reel",
    );
    expect(r).toEqual({
      ok: true,
      valor: {
        network: "instagram",
        kind: "reel",
        external_id: CODIGO,
        url: REEL,
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(COMPARTILHADO);
    const opcoes = fetchMock.mock.calls[0][1] as RequestInit;
    expect(opcoes.method).toBe("HEAD");
    expect(opcoes.redirect).toBe("manual");
    expect(opcoes.signal).toBeInstanceOf(AbortSignal);
    const ua = (opcoes.headers as Record<string, string>)["user-agent"];
    expect(ua).toContain("Mozilla/5.0");
    expect(ua).not.toMatch(/Mobile|Android|iPhone/);
  });

  it("destino de OUTRO tipo: devolve o post_type_mismatch do shared, com o tipo detectado", async () => {
    dublarFetch(redireciona(REEL));
    expect(
      await resolverLinkDeCompartilhamentoDoInstagram(COMPARTILHADO, "post"),
    ).toEqual({
      ok: false,
      code: "post_type_mismatch",
      tipo_detectado: "reel",
    });
    dublarFetch(redireciona(POST));
    expect(
      await resolverLinkDeCompartilhamentoDoInstagram(COMPARTILHADO, "reel"),
    ).toEqual({
      ok: false,
      code: "post_type_mismatch",
      tipo_detectado: "post",
    });
  });

  it("dois saltos dentro do Instagram sao aceitos; o terceiro nao e tentado", async () => {
    const fetchMock = dublarFetch(
      redireciona("https://instagram.com/share/p/BAJ4kQ7Xyz", 301),
      redireciona(POST, 307),
    );
    const r = await resolverLinkDeCompartilhamentoDoInstagram(
      COMPARTILHADO,
      "post",
    );
    expect(r.ok && r.valor.url).toBe(POST);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const tresSaltos = dublarFetch(
      redireciona("https://instagram.com/share/p/BAJ4kQ7Xyz"),
      redireciona("https://www.instagram.com/share/p/BAJ4kQ7Xyz"),
      redireciona(POST),
    );
    expect(
      await resolverLinkDeCompartilhamentoDoInstagram(COMPARTILHADO, "post"),
    ).toEqual({ ok: false, code: "share_link_unresolved" });
    expect(tresSaltos).toHaveBeenCalledTimes(2);
  });

  it("location para host de fora: recusa e NAO segue", async () => {
    const fetchMock = dublarFetch(
      redireciona(`https://evil.example/reel/${CODIGO}/`),
      redireciona(REEL),
    );
    expect(
      await resolverLinkDeCompartilhamentoDoInstagram(COMPARTILHADO, "reel"),
    ).toEqual({ ok: false, code: "share_link_unresolved" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("200 (pagina de login para robo), redirecionamento sem location, ou location que nao e publicacao: recusa", async () => {
    dublarFetch(new Response(null, { status: 200 }));
    expect(
      await resolverLinkDeCompartilhamentoDoInstagram(COMPARTILHADO, "reel"),
    ).toEqual({ ok: false, code: "share_link_unresolved" });

    dublarFetch(new Response(null, { status: 302 }));
    expect(
      await resolverLinkDeCompartilhamentoDoInstagram(COMPARTILHADO, "reel"),
    ).toEqual({ ok: false, code: "share_link_unresolved" });

    const fetchMock = dublarFetch(
      redireciona("https://www.instagram.com/accounts/login/?next=/reel/x/"),
      redireciona("https://www.instagram.com/accounts/login/"),
    );
    expect(
      await resolverLinkDeCompartilhamentoDoInstagram(COMPARTILHADO, "reel"),
    ).toEqual({ ok: false, code: "share_link_unresolved" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
    expect(
      await resolverLinkDeCompartilhamentoDoInstagram(COMPARTILHADO, "reel"),
    ).toEqual({ ok: false, code: "share_link_unresolved" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("o que nao e link de compartilhamento nem chega a abrir conexao", async () => {
    const fetchMock = dublarFetch(redireciona(REEL));
    for (const link of [REEL, "https://instagr.am/p/Cx1AbCdEf_-/", "x"]) {
      expect(
        await resolverLinkDeCompartilhamentoDoInstagram(link, "reel"),
        link,
      ).toEqual({ ok: false, code: "share_link_unresolved" });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
