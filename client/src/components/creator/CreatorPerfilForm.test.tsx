import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

/**
 * CreatorPerfilForm: o perfil de creator no /creator (lote 08).
 *
 * O `contentFetch` e dublado e registra cada chamada com metodo e corpo: o que
 * se afirma e o que o formulario MANDA ao servidor (normalizado pelas regras de
 * shared) e o que ele MOSTRA. A chave de teste e o mesmo CPF valido de
 * shared/creatorProfile.test.ts, e a asserção que se repete e que os onze
 * digitos nunca aparecem na tela depois de salvar.
 */

type Chamada = { path: string; method: string; body: unknown };

const estado = vi.hoisted(() => ({
  chamadas: [] as Array<{ path: string; method: string; body: unknown }>,
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
import { CreatorPerfilForm, rotuloDoTipoDePix } from "./CreatorPerfilForm";

const CPF_DE_TESTE = "52998224725";

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

// O jsdom nao tem estas APIs, e o Radix Select (o BntSelect) as chama ao abrir
// o popup. Mesmos stubs de CreatorCodesBlock.camada.test.tsx.
beforeAll(() => {
  if (!("ResizeObserver" in globalThis)) {
    class ResizeObserverDeTeste {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver =
      ResizeObserverDeTeste;
  }
  Element.prototype.scrollIntoView ||= () => {};
  Element.prototype.hasPointerCapture ||= () => false;
  Element.prototype.releasePointerCapture ||= () => {};
});

/**
 * Escolhe o tipo da chave pelo teclado, como a pessoa faria: abre com a seta,
 * confirma com Enter, e ESPERA o popup fechar. Enquanto ele esta aberto o resto
 * do formulario fica fora de alcance, e seguir antes disso faz o teste falhar
 * por um motivo que nao e o que ele mede.
 */
async function escolherTipo(nome: string): Promise<void> {
  fireEvent.keyDown(
    screen.getByRole("combobox", { name: "Tipo da chave Pix" }),
    {
      key: "ArrowDown",
    },
  );
  const opcao = await screen.findByRole("option", { name: nome });
  fireEvent.keyDown(opcao, { key: "Enter" });
  await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
}

beforeEach(() => {
  estado.chamadas = [];
  estado.toastOk = vi.fn();
  estado.toastErro = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe("CreatorPerfilForm: leitura", () => {
  it("busca GET /creator/profile uma vez e preenche os campos", async () => {
    estado.responder = async () => ({ data: PERFIL_COMPLETO });
    render(<CreatorPerfilForm />);
    await screen.findByTestId("creator-perfil-redes");
    expect(estado.chamadas).toEqual([
      { path: "/creator/profile", method: "GET", body: null },
    ]);
    expect(campo("Instagram @").value).toBe("ana.cria");
    expect(campo("Seguidores no Instagram").value).toBe("12500");
    expect(campo("TikTok @").value).toBe("ana.cria");
    expect(campo("Seguidores no TikTok").value).toBe("800");
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
      true,
    );
    expect(
      screen.getByTestId("creator-perfil-seguidores-data").textContent,
    ).toBe("Seguidores informados em 14/09/2026");
  });

  it("com chave: mostra so a mascara, o tipo e a data", async () => {
    estado.responder = async () => ({ data: PERFIL_COMPLETO });
    render(<CreatorPerfilForm />);
    const mascarada = await screen.findByTestId("creator-pix-mascarada");
    expect(mascarada.textContent).toBe("***.***.247-**");
    const bloco = screen.getByTestId("creator-perfil-pix");
    expect(bloco.textContent).toContain("CPF");
    expect(bloco.textContent).toContain("Atualizada em 14/09/2026");
    expect(bloco.textContent).not.toContain(CPF_DE_TESTE);
    expect(screen.queryByTestId("creator-pix-form")).toBeNull();
  });

  it("sem chave: o formulario de chave aparece direto", async () => {
    estado.responder = async () => ({ data: PERFIL_VAZIO });
    render(<CreatorPerfilForm />);
    await screen.findByTestId("creator-pix-form");
    expect(screen.queryByTestId("creator-pix-mascarada")).toBeNull();
  });

  it("avisa a pagina se ha chave, assim que o perfil chega", async () => {
    const onPixChange = vi.fn();
    estado.responder = async () => ({ data: PERFIL_VAZIO });
    render(<CreatorPerfilForm onPixChange={onPixChange} />);
    await screen.findByTestId("creator-pix-form");
    expect(onPixChange).toHaveBeenCalledWith(false);
    cleanup();
    const outra = vi.fn();
    estado.responder = async () => ({ data: PERFIL_COMPLETO });
    render(<CreatorPerfilForm onPixChange={outra} />);
    await screen.findByTestId("creator-pix-mascarada");
    expect(outra).toHaveBeenCalledWith(true);
  });

  it("erro na busca: bloco de erro e tentar de novo refaz a mesma busca", async () => {
    let vez = 0;
    estado.responder = async () => {
      vez += 1;
      if (vez === 1) throw new AdminApiError("falhou", 500, "db_error");
      return { data: PERFIL_VAZIO };
    };
    render(<CreatorPerfilForm />);
    const erro = await screen.findByTestId("creator-perfil-erro");
    fireEvent.click(
      within(erro).getByRole("button", { name: "Tentar de novo" }),
    );
    await screen.findByTestId("creator-perfil-redes");
    expect(chamadasCom("GET")).toHaveLength(2);
  });

  it("resposta sem o formato do perfil vira erro, nunca formulario vazio", async () => {
    estado.responder = async () => ({ data: { ok: true } });
    render(<CreatorPerfilForm />);
    await screen.findByTestId("creator-perfil-erro");
    expect(screen.queryByTestId("creator-perfil-redes")).toBeNull();
  });

  it("tipo de chave desconhecido cai no rotulo neutro", () => {
    expect(rotuloDoTipoDePix("cpf")).toBe("CPF");
    expect(rotuloDoTipoDePix("boleto")).toBe("Chave Pix");
  });
});

describe("CreatorPerfilForm: redes", () => {
  it("salvar manda o corpo normalizado e o consentimento", async () => {
    estado.responder = async (_path, method) =>
      method === "PUT"
        ? { data: { ...PERFIL_VAZIO, instagram_handle: "ana.cria" } }
        : { data: PERFIL_VAZIO };
    render(<CreatorPerfilForm />);
    await screen.findByTestId("creator-perfil-redes");
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
    await waitFor(() => expect(estado.toastOk).toHaveBeenCalledTimes(1));
  });

  it("@ invalido: erro no campo e NADA e enviado", async () => {
    estado.responder = async () => ({ data: PERFIL_VAZIO });
    render(<CreatorPerfilForm />);
    await screen.findByTestId("creator-perfil-redes");
    fireEvent.change(campo("TikTok @"), { target: { value: "ana cria" } });
    fireEvent.click(screen.getByTestId("creator-perfil-salvar"));
    await screen.findByText(
      "@ do TikTok inválido. Use de 2 a 24 letras, números, ponto ou sublinhado.",
    );
    expect(chamadasCom("PUT")).toHaveLength(0);
  });

  it("seguidores com ponto de milhar: erro no campo, nada enviado", async () => {
    estado.responder = async () => ({ data: PERFIL_VAZIO });
    render(<CreatorPerfilForm />);
    await screen.findByTestId("creator-perfil-redes");
    fireEvent.change(campo("Seguidores no Instagram"), {
      target: { value: "1.200" },
    });
    fireEvent.click(screen.getByTestId("creator-perfil-salvar"));
    await screen.findByText("Use um número inteiro de 0 a 100 milhões.");
    expect(chamadasCom("PUT")).toHaveLength(0);
  });

  it("400 do servidor aponta o campo pelo codigo", async () => {
    estado.responder = async (_path, method) => {
      if (method === "PUT") {
        throw new AdminApiError(
          "@ do Instagram inválido.",
          400,
          "invalid_instagram_handle",
        );
      }
      return { data: PERFIL_VAZIO };
    };
    render(<CreatorPerfilForm />);
    await screen.findByTestId("creator-perfil-redes");
    fireEvent.change(campo("Instagram @"), { target: { value: "ana.cria" } });
    fireEvent.click(screen.getByTestId("creator-perfil-salvar"));
    await screen.findByText(
      "@ do Instagram inválido. Use até 30 letras, números, ponto ou sublinhado.",
    );
    expect(estado.toastErro).toHaveBeenCalledTimes(1);
  });
});

describe("CreatorPerfilForm: chave Pix", () => {
  it("salvar manda tipo e valor, mostra a mascara e apaga o que foi digitado", async () => {
    const onPixChange = vi.fn();
    estado.responder = async (_path, method) =>
      method === "PUT"
        ? {
            data: {
              pix: {
                tipo: "cpf",
                mascarada: "***.***.247-**",
                updated_at: "2026-09-15T12:00:00Z",
              },
            },
          }
        : { data: PERFIL_VAZIO };
    render(<CreatorPerfilForm onPixChange={onPixChange} />);
    await screen.findByTestId("creator-pix-form");
    await escolherTipo("CPF");
    fireEvent.change(campo("Chave"), { target: { value: "529.982.247-25" } });
    fireEvent.click(screen.getByTestId("creator-pix-salvar"));
    await screen.findByTestId("creator-pix-mascarada");
    expect(chamadasCom("PUT")).toEqual([
      {
        path: "/creator/pix",
        method: "PUT",
        body: { tipo: "cpf", valor: "529.982.247-25" },
      },
    ]);
    expect(screen.getByTestId("creator-pix-mascarada").textContent).toBe(
      "***.***.247-**",
    );
    expect(document.body.textContent).not.toContain(CPF_DE_TESTE);
    expect(document.body.innerHTML).not.toContain("529.982.247-25");
    expect(onPixChange).toHaveBeenLastCalledWith(true);
  });

  it("chave invalida: erro no campo e nada e enviado", async () => {
    estado.responder = async () => ({ data: PERFIL_VAZIO });
    render(<CreatorPerfilForm />);
    await screen.findByTestId("creator-pix-form");
    await escolherTipo("CPF");
    fireEvent.change(campo("Chave"), { target: { value: "529.982.247-26" } });
    fireEvent.click(screen.getByTestId("creator-pix-salvar"));
    await screen.findByText("CPF inválido.");
    expect(chamadasCom("PUT")).toHaveLength(0);
  });

  it("sem tipo escolhido: pede o tipo e nada e enviado", async () => {
    estado.responder = async () => ({ data: PERFIL_VAZIO });
    render(<CreatorPerfilForm />);
    await screen.findByTestId("creator-pix-form");
    fireEvent.change(campo("Chave"), { target: { value: CPF_DE_TESTE } });
    fireEvent.click(screen.getByTestId("creator-pix-salvar"));
    await screen.findByText("Escolha o tipo da chave.");
    expect(chamadasCom("PUT")).toHaveLength(0);
  });

  it("remover pede confirmacao antes de apagar", async () => {
    const onPixChange = vi.fn();
    estado.responder = async (_path, method) =>
      method === "DELETE" ? { data: { pix: null } } : { data: PERFIL_COMPLETO };
    render(<CreatorPerfilForm onPixChange={onPixChange} />);
    await screen.findByTestId("creator-pix-mascarada");
    fireEvent.click(screen.getByTestId("creator-pix-remover"));
    expect(chamadasCom("DELETE")).toHaveLength(0);
    fireEvent.click(screen.getByTestId("creator-pix-confirmar-remocao"));
    await screen.findByTestId("creator-pix-form");
    expect(chamadasCom("DELETE")).toEqual([
      { path: "/creator/pix", method: "DELETE", body: null },
    ]);
    expect(onPixChange).toHaveBeenLastCalledWith(false);
  });

  it("alterar abre o formulario, e cancelar volta para a mascara", async () => {
    estado.responder = async () => ({ data: PERFIL_COMPLETO });
    render(<CreatorPerfilForm />);
    await screen.findByTestId("creator-pix-mascarada");
    fireEvent.click(screen.getByTestId("creator-pix-alterar"));
    expect(screen.getByTestId("creator-pix-form")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByTestId("creator-pix-mascarada")).toBeTruthy();
  });
});
