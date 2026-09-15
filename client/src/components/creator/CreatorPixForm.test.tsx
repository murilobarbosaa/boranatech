import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
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
 * CreatorPixForm: a chave Pix do creator (lote 08b, a outra metade do antigo
 * CreatorPerfilForm).
 *
 * A chave de teste e o mesmo CPF valido de shared/creatorProfile.test.ts, e a
 * asserção que se repete e que os onze digitos NAO ficam na tela depois de
 * salvar: o formulario manda a chave e guarda so o que o servidor devolveu,
 * que e a mascara.
 *
 * Ele NAO busca: a chave chega por prop, e quem atualiza a tela depois de
 * salvar e a pagina, pelo `onSalvo`.
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

import type { CreatorPixMascarada } from "@shared/creatorProfile";
import { CreatorPixForm, rotuloDoTipoDePix } from "./CreatorPixForm";

const CPF_DE_TESTE = "52998224725";

const CHAVE: CreatorPixMascarada = {
  tipo: "cpf",
  mascarada: "***.***.247-**",
  updated_at: "2026-09-14T12:00:00Z",
};

function chamadasCom(method: string): Chamada[] {
  return estado.chamadas.filter((c) => c.method === method);
}

function campo(rotulo: string): HTMLInputElement {
  return screen.getByLabelText(rotulo) as HTMLInputElement;
}

function desenhar(pix: CreatorPixMascarada | null, onSalvo = vi.fn()) {
  render(<CreatorPixForm pix={pix} onSalvo={onSalvo} />);
  return onSalvo;
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

describe("CreatorPixForm: leitura", () => {
  it("com chave: mostra so a mascara, o tipo e a data", () => {
    desenhar(CHAVE);
    const bloco = screen.getByTestId("creator-perfil-pix");
    expect(screen.getByTestId("creator-pix-mascarada").textContent).toBe(
      "***.***.247-**",
    );
    expect(bloco.textContent).toContain("CPF");
    expect(bloco.textContent).toContain("Atualizada em 14/09/2026");
    expect(bloco.textContent).not.toContain(CPF_DE_TESTE);
    expect(screen.queryByTestId("creator-pix-form")).toBeNull();
    expect(estado.chamadas).toHaveLength(0);
  });

  it("sem chave: o formulario aparece direto, e sem o Cancelar", () => {
    desenhar(null);
    expect(screen.getByTestId("creator-pix-form")).toBeTruthy();
    expect(screen.queryByTestId("creator-pix-mascarada")).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancelar" })).toBeNull();
  });

  it("tipo de chave desconhecido cai no rotulo neutro", () => {
    expect(rotuloDoTipoDePix("cpf")).toBe("CPF");
    expect(rotuloDoTipoDePix("boleto")).toBe("Chave Pix");
  });
});

describe("CreatorPixForm: gravacao", () => {
  it("salvar manda tipo e valor, avisa a pagina e nao guarda o que foi digitado", async () => {
    const nova: CreatorPixMascarada = {
      tipo: "cpf",
      mascarada: "***.***.247-**",
      updated_at: "2026-09-15T12:00:00Z",
    };
    estado.responder = async () => ({ data: { pix: nova } });
    const onSalvo = desenhar(null);
    await escolherTipo("CPF");
    fireEvent.change(campo("Chave"), { target: { value: "529.982.247-25" } });
    fireEvent.click(screen.getByTestId("creator-pix-salvar"));
    await waitFor(() => expect(onSalvo).toHaveBeenCalledWith(nova));
    expect(chamadasCom("PUT")).toEqual([
      {
        path: "/creator/pix",
        method: "PUT",
        body: { tipo: "cpf", valor: "529.982.247-25" },
      },
    ]);
    expect(document.body.textContent).not.toContain(CPF_DE_TESTE);
    expect(document.body.innerHTML).not.toContain("529.982.247-25");
    expect(estado.toastOk).toHaveBeenCalledTimes(1);
  });

  it("chave invalida: erro no campo e nada e enviado", async () => {
    const onSalvo = desenhar(null);
    await escolherTipo("CPF");
    fireEvent.change(campo("Chave"), { target: { value: "529.982.247-26" } });
    fireEvent.click(screen.getByTestId("creator-pix-salvar"));
    await screen.findByText("CPF inválido.");
    expect(chamadasCom("PUT")).toHaveLength(0);
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it("sem tipo escolhido: pede o tipo e nada e enviado", async () => {
    desenhar(null);
    fireEvent.change(campo("Chave"), { target: { value: CPF_DE_TESTE } });
    fireEvent.click(screen.getByTestId("creator-pix-salvar"));
    await screen.findByText("Escolha o tipo da chave.");
    expect(chamadasCom("PUT")).toHaveLength(0);
  });

  it("remover pede confirmacao antes de apagar", async () => {
    estado.responder = async () => ({ data: { pix: null } });
    const onSalvo = desenhar(CHAVE);
    fireEvent.click(screen.getByTestId("creator-pix-remover"));
    expect(chamadasCom("DELETE")).toHaveLength(0);
    fireEvent.click(screen.getByTestId("creator-pix-confirmar-remocao"));
    await waitFor(() => expect(onSalvo).toHaveBeenCalledWith(null));
    expect(chamadasCom("DELETE")).toEqual([
      { path: "/creator/pix", method: "DELETE", body: null },
    ]);
  });

  it("manter a chave fecha a confirmacao sem chamar o servidor", () => {
    const onSalvo = desenhar(CHAVE);
    fireEvent.click(screen.getByTestId("creator-pix-remover"));
    fireEvent.click(screen.getByRole("button", { name: "Manter a chave" }));
    expect(screen.getByTestId("creator-pix-remover")).toBeTruthy();
    expect(chamadasCom("DELETE")).toHaveLength(0);
    expect(onSalvo).not.toHaveBeenCalled();
  });

  it("alterar abre o formulario, e cancelar volta para a mascara", () => {
    desenhar(CHAVE);
    fireEvent.click(screen.getByTestId("creator-pix-alterar"));
    expect(screen.getByTestId("creator-pix-form")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByTestId("creator-pix-mascarada")).toBeTruthy();
  });
});
