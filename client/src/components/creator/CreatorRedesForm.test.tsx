import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CreatorRedesForm: as redes do creator (lote 08b, metade do antigo
 * CreatorPerfilForm).
 *
 * O `contentFetch` e dublado e registra cada chamada com metodo e corpo: o que
 * se afirma e o que o formulario MANDA ao servidor, normalizado pelas regras de
 * shared, e o que ele MOSTRA. Ele NAO busca: o perfil chega por prop, e um GET
 * aqui seria defeito, entao os testes contam as chamadas.
 */

type Chamada = { path: string; method: string; body: unknown };

const estado = vi.hoisted(() => ({
  chamadas: [] as Chamada[],
  responder: (async () => ({})) as (
    path: string,
    method: string,
    body: unknown,
  ) => Promise<unknown>,
  toastOk: vi.fn(),
  toastErro: vi.fn(),
}));

vi.mock("@/lib/adminApi", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/adminApi")>();
  return {
    ...real,
    contentFetch: async (path: string, options?: RequestInit) => {
      const method = options?.method ?? "GET";
      const body =
        typeof options?.body === "string" ? JSON.parse(options.body) : null;
      estado.chamadas.push({ path, method, body });
      return estado.responder(path, method, body);
    },
  };
});
vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => estado.toastOk(...a),
    error: (...a: unknown[]) => estado.toastErro(...a),
  },
}));

import { AdminApiError } from "@/lib/adminApi";
import type { CreatorPerfilDados } from "@shared/creatorProfile";
import { CreatorRedesForm } from "./CreatorRedesForm";

const PERFIL_VAZIO: CreatorPerfilDados = {
  instagram_handle: null,
  tiktok_handle: null,
  instagram_followers: null,
  tiktok_followers: null,
  followers_updated_at: null,
  visible_to_creators: false,
  pix: null,
};

const PERFIL_COMPLETO: CreatorPerfilDados = {
  instagram_handle: "ana.cria",
  tiktok_handle: "ana.cria",
  instagram_followers: 12500,
  tiktok_followers: 800,
  followers_updated_at: "2026-09-14T12:00:00Z",
  visible_to_creators: true,
  pix: {
    tipo: "cpf",
    mascarada: "***.***.247-**",
    updated_at: "2026-09-14T12:00:00Z",
  },
};

function chamadasCom(method: string): Chamada[] {
  return estado.chamadas.filter((c) => c.method === method);
}

function campo(rotulo: string): HTMLInputElement {
  return screen.getByLabelText(rotulo) as HTMLInputElement;
}

function desenhar(perfil: CreatorPerfilDados, onSalvo = vi.fn()) {
  render(<CreatorRedesForm perfil={perfil} onSalvo={onSalvo} />);
  return onSalvo;
}

beforeEach(() => {
  estado.chamadas = [];
  estado.toastOk = vi.fn();
  estado.toastErro = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe("CreatorRedesForm: resumo do que esta salvo (lote 10)", () => {
  it("com @ salvo: mostra o resumo, e o formulario fica atras do Alterar", () => {
    desenhar(PERFIL_COMPLETO);
    expect(screen.getByTestId("creator-redes-instagram").textContent).toContain(
      "@ana.cria",
    );
    // O numero sai formatado, como no cartao do admin.
    expect(screen.getByTestId("creator-redes-instagram").textContent).toContain(
      "12.500 seguidores",
    );
    expect(screen.getByTestId("creator-redes-tiktok").textContent).toContain(
      "800 seguidores",
    );
    expect(
      screen.getByTestId("creator-perfil-seguidores-data").textContent,
    ).toBe("Seguidores informados em 14/09/2026");
    // Nenhum campo de texto na tela: o cadastro esta pronto, nao pendente.
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryByTestId("creator-perfil-salvar")).toBeNull();
    expect(estado.chamadas).toHaveLength(0);
  });

  it("so uma rede salva: so a linha dela aparece", () => {
    desenhar({
      ...PERFIL_COMPLETO,
      tiktok_handle: null,
      tiktok_followers: null,
    });
    expect(screen.getByTestId("creator-redes-instagram")).toBeTruthy();
    expect(screen.queryByTestId("creator-redes-tiktok")).toBeNull();
  });

  it("o chip diz o que esta valendo: visivel ou so o time", () => {
    desenhar(PERFIL_COMPLETO);
    expect(screen.getByTestId("creator-redes-visivel").textContent).toBe(
      "visível aos creators",
    );
    expect(screen.queryByTestId("creator-redes-reservado")).toBeNull();
    cleanup();

    desenhar({ ...PERFIL_COMPLETO, visible_to_creators: false });
    expect(screen.getByTestId("creator-redes-reservado").textContent).toBe(
      "só o time vê",
    );
    expect(screen.queryByTestId("creator-redes-visivel")).toBeNull();
  });

  it("sem seguidores informados nao ha data para mostrar", () => {
    desenhar({ ...PERFIL_COMPLETO, followers_updated_at: null });
    expect(screen.queryByTestId("creator-perfil-seguidores-data")).toBeNull();
  });

  it("Alterar abre o formulario ja preenchido, e Cancelar volta ao resumo", () => {
    desenhar(PERFIL_COMPLETO);
    fireEvent.click(screen.getByTestId("creator-redes-alterar"));

    expect(campo("Instagram @").value).toBe("ana.cria");
    expect(campo("Seguidores no Instagram").value).toBe("12500");
    expect(campo("TikTok @").value).toBe("ana.cria");
    expect(campo("Seguidores no TikTok").value).toBe("800");
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      true,
    );

    fireEvent.click(screen.getByTestId("creator-redes-cancelar"));
    expect(screen.getByTestId("creator-redes-instagram")).toBeTruthy();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    // Nada foi ao servidor: abrir e fechar a edicao nao grava.
    expect(estado.chamadas).toHaveLength(0);
  });

  it("sem @ salvo: o formulario aparece direto, e nao ha Cancelar", () => {
    desenhar(PERFIL_VAZIO);
    expect(campo("Instagram @").value).toBe("");
    expect(screen.getByTestId("creator-perfil-salvar")).toBeTruthy();
    // Sem cadastro, nao existe resumo para onde voltar.
    expect(screen.queryByTestId("creator-redes-cancelar")).toBeNull();
    expect(screen.queryByTestId("creator-redes-alterar")).toBeNull();
  });
});

describe("CreatorRedesForm: gravacao", () => {
  it("salvar manda o corpo normalizado e devolve o perfil relido", async () => {
    const salvo = { ...PERFIL_VAZIO, instagram_handle: "ana.cria" };
    estado.responder = async () => ({ data: salvo });
    const onSalvo = desenhar(PERFIL_VAZIO);
    fireEvent.change(campo("Instagram @"), {
      target: { value: "https://www.instagram.com/Ana.Cria/" },
    });
    fireEvent.change(campo("Seguidores no Instagram"), {
      target: { value: "12500" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByTestId("creator-perfil-salvar"));
    await waitFor(() => expect(chamadasCom("PUT")).toHaveLength(1));
    expect(chamadasCom("PUT")[0]).toEqual({
      path: "/creator/profile",
      method: "PUT",
      body: {
        instagram_handle: "ana.cria",
        tiktok_handle: null,
        instagram_followers: 12500,
        tiktok_followers: null,
        visible_to_creators: true,
      },
    });
    await waitFor(() => expect(onSalvo).toHaveBeenCalledWith(salvo));
    expect(estado.toastOk).toHaveBeenCalledTimes(1);
  });

  it("@ invalido: erro no campo e NADA e enviado", async () => {
    const onSalvo = desenhar(PERFIL_VAZIO);
    fireEvent.change(campo("TikTok @"), { target: { value: "ana cria" } });
    fireEvent.click(screen.getByTestId("creator-perfil-salvar"));
    await screen.findByText(
      "@ do TikTok inválido. Use de 2 a 24 letras, números, ponto ou sublinhado.",
    );
    expect(chamadasCom("PUT")).toHaveLength(0);
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it("seguidores com ponto de milhar: erro no campo, nada enviado", async () => {
    desenhar(PERFIL_VAZIO);
    fireEvent.change(campo("Seguidores no Instagram"), {
      target: { value: "1.200" },
    });
    fireEvent.click(screen.getByTestId("creator-perfil-salvar"));
    await screen.findByText("Use um número inteiro de 0 a 100 milhões.");
    expect(chamadasCom("PUT")).toHaveLength(0);
  });

  it("400 do servidor aponta o campo pelo codigo", async () => {
    estado.responder = async () => {
      throw new AdminApiError(
        "@ do Instagram inválido.",
        400,
        "invalid_instagram_handle",
      );
    };
    const onSalvo = desenhar(PERFIL_VAZIO);
    fireEvent.change(campo("Instagram @"), { target: { value: "ana.cria" } });
    fireEvent.click(screen.getByTestId("creator-perfil-salvar"));
    await screen.findByText(
      "@ do Instagram inválido. Use até 30 letras, números, ponto ou sublinhado.",
    );
    expect(estado.toastErro).toHaveBeenCalledTimes(1);
    expect(onSalvo).not.toHaveBeenCalled();
  });
});
