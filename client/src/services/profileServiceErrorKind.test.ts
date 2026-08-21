import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `getMyProfile` declara o TIPO da falha em campo, nao no texto.
 *
 * Os dois erros que ele lanca ja se distinguiam pelo `status` (numero contra
 * null), mas essa distincao morre no consumidor: `AuthContext` faz
 * `?.status ?? null`, e presente-com-null fica identico a ausente. Como o
 * terceiro desfecho (rede) e um TypeError cru, SEM propriedade `status`, os dois
 * viram o mesmo `http_status: "none"` no Sentry.
 *
 * `authErrorKind` resolve isso na origem. Mesmo motivo do `status` ter virado
 * campo em vez de ficar so dentro do texto da mensagem (ver o comentario de
 * `profileError`): texto de mensagem nao e campo, e recuperar o dado de volta
 * exigiria casar um padrao sobre a nossa propria saida.
 */

vi.mock("@/lib/api", () => ({ apiUrl: (p: string) => `https://api.test${p}` }));

const supaSpy = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { getSession: supaSpy.getSession } },
}));

import { getMyProfile } from "./profileService";

function resposta(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  supaSpy.getSession.mockResolvedValue({
    data: { session: { access_token: "tok" } },
  });
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
});

describe("getMyProfile: tipo da falha como campo", () => {
  it("HTTP nao-ok lanca com authErrorKind http e o status numerico", async () => {
    fetchSpy.mockResolvedValue(resposta(503, null));

    const err = await getMyProfile().catch((e) => e);

    expect(err.authErrorKind).toBe("http");
    expect(err.status).toBe(503);
  });

  it("200 com corpo invalido lanca com authErrorKind invalid_body", async () => {
    fetchSpy.mockResolvedValue(resposta(200, { data: null }));

    const err = await getMyProfile().catch((e) => e);

    expect(err.authErrorKind).toBe("invalid_body");
    expect(err.status).toBeNull();
  });

  /**
   * CONTROLE NEGATIVO: o caso de rede NAO pode ganhar marcador. E a ausencia do
   * campo que o identifica ("nao passou pelo nosso profileError"), entao marcar
   * o TypeError aqui destruiria a unica evidencia que separa rede de corpo
   * invalido, que e o que este item existe para separar.
   */
  it("CONTROLE NEGATIVO: rejeicao de rede continua SEM authErrorKind", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));

    const err = await getMyProfile().catch((e) => e);

    expect(err).toBeInstanceOf(TypeError);
    expect("authErrorKind" in err).toBe(false);
  });

  it("CONTROLE NEGATIVO: sucesso nao lanca e devolve o perfil", async () => {
    fetchSpy.mockResolvedValue(resposta(200, { data: { id: "u-1" } }));

    await expect(getMyProfile()).resolves.toEqual({ id: "u-1" });
  });
});
