import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

/**
 * CONCESSAO DE CREATOR COM KIND e o bloco "Codigos de creator" do modal.
 *
 * O BntSelect e trocado por um select nativo AQUI: o que este arquivo trava e o
 * que o bloco oferece e o que ele manda, nao o componente de select. O popup
 * real do Radix abre no jsdom (pelo teclado), e a camada dele acima do modal e
 * travada em CreatorCodesBlock.camada.test.tsx.
 */

const fetchMock = vi.hoisted(() => vi.fn());
const toastSpy = vi.hoisted(() => ({ acao: vi.fn(), erro: vi.fn() }));

vi.mock("@/lib/adminApi", () => {
  class AdminApiError extends Error {
    readonly status: number;
    readonly code: string | null;
    constructor(message: string, status: number, code: string | null) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }
  return {
    adminFetch: (...args: unknown[]) => fetchMock(...args),
    AdminApiError,
  };
});
vi.mock("@/lib/notify", () => ({
  showActionToast: (...a: unknown[]) => toastSpy.acao(...a),
  showErrorToast: (...a: unknown[]) => toastSpy.erro(...a),
}));
vi.mock("@/components/shared/BntSelect", () => ({
  BntSelect: ({
    label,
    placeholder,
    value,
    onValueChange,
    options,
  }: {
    label?: string;
    placeholder?: string;
    value: string;
    onValueChange: (valor: string) => void;
    options: Array<{ value: string; label: string }>;
  }) => (
    <select
      aria-label={label}
      value={value}
      onChange={(evento) => onValueChange(evento.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((opcao) => (
        <option key={opcao.value} value={opcao.value}>
          {opcao.label}
        </option>
      ))}
    </select>
  ),
}));

import { AdminApiError } from "@/lib/adminApi";
import { UserDetailModal } from "./UserDetailModal";

const CONCESSAO = {
  kind: "influencer",
  granted_at: "2026-05-02T12:00:00Z",
  granted_by_name: "Ana Moura",
  granted_by_email: "ana@exemplo.com",
  note: "Parceria de conteúdo.",
};

function detalhe(over: Record<string, unknown> = {}) {
  return {
    data: {
      name: "Rafa Lima",
      full_name: "Rafael Lima",
      email: "rafa@exemplo.com",
      gender: null,
      bio: null,
      area_interesse: null,
      nivel_atual: null,
      objetivo: null,
      onboarding_completed: true,
      onboarding_step: 3,
      marketing_opt_in: false,
      marketing_opt_in_at: null,
      welcome_email_sent: true,
      cpf_masked: "***.456.789-**",
      has_cpf: true,
      avatar: { url: null, mode: "icon", moderation_status: "clean" },
      subscription: null,
      cancellation_intent: null,
      influencer: null,
      paid_total_cents: 0,
      is_pro: false,
      pro_source: null,
      activity_status: "active",
      created_at: "2026-07-01T12:00:00Z",
      updated_at: "2026-07-02T12:00:00Z",
      ...over,
    },
  };
}

function codigo(over: Record<string, unknown>) {
  return {
    discount_percent: 10,
    commission_percent: 20,
    status: "active",
    clicks: 5,
    sales: 1,
    revenue_cents: 2093,
    ...over,
  };
}

// Quatro codigos: um do usuario aberto (u1), um de OUTRA pessoa e dois sem
// dono, fora de ordem alfabetica para o teste da ordenacao ter o que provar.
const CODIGOS = {
  data: [
    codigo({ id: "a1", name: "Rafa Lima", code: "RAFA10", user_id: "u1" }),
    codigo({ id: "a2", name: "Outra Pessoa", code: "OUTRA15", user_id: "u2" }),
    codigo({ id: "a3", name: "Zeca Sem Dono", code: "ZECA5", user_id: null }),
    codigo({ id: "a4", name: "Bia Sem Dono", code: "BIA5", user_id: null }),
  ],
};

type Escrita = { path: string; method: string; body: unknown };
const escritas: Escrita[] = [];

function rotear(
  resposta: unknown,
  extras: { codigos?: unknown; escrita?: unknown } = {},
) {
  escritas.length = 0;
  fetchMock.mockImplementation(
    (path: string, init?: { method?: string; body?: string }) => {
      if (init?.method && init.method !== "GET") {
        escritas.push({
          path,
          method: init.method,
          body: init.body ? JSON.parse(init.body) : undefined,
        });
        const r = extras.escrita;
        if (r instanceof Error) return Promise.reject(r);
        return Promise.resolve({ data: {} });
      }
      if (path === "/affiliates-stats") {
        return Promise.resolve(extras.codigos ?? CODIGOS);
      }
      if (path.endsWith("/activity")) {
        return Promise.resolve({ data: { state: "ok", hasData: false } });
      }
      return Promise.resolve(resposta);
    },
  );
}

function leiturasDeCodigos(): number {
  return fetchMock.mock.calls.filter((c) => c[0] === "/affiliates-stats")
    .length;
}

async function abrir(resposta: unknown, extras = {}) {
  rotear(resposta, extras);
  render(<UserDetailModal userId="u1" onClose={() => {}} />);
  await waitFor(() =>
    expect(screen.queryByTestId("user-detail-skeleton")).toBeNull(),
  );
}

async function blocoPronto() {
  const bloco = await screen.findByTestId("creator-codigos");
  await waitFor(() =>
    expect(within(bloco).queryByText("Carregando códigos...")).toBeNull(),
  );
  return bloco;
}

beforeEach(() => {
  fetchMock.mockReset();
  toastSpy.acao.mockReset();
  toastSpy.erro.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("tornar creator pede o tipo", () => {
  it("sem tipo escolhido, Conceder fica desabilitado e nada e enviado", async () => {
    await abrir(detalhe());
    fireEvent.click(screen.getByRole("button", { name: "Tornar creator" }));

    const conceder = screen.getByRole("button", {
      name: "Conceder",
    }) as HTMLButtonElement;
    expect(conceder.disabled).toBe(true);
    expect(
      screen
        .getAllByRole("radio")
        .map((r) => r.getAttribute("aria-checked")),
    ).toEqual(["false", "false"]);

    fireEvent.click(conceder);
    expect(escritas).toEqual([]);
  });

  it("Afiliado escolhido: POST com a nota e kind afiliado", async () => {
    await abrir(detalhe());
    fireEvent.click(screen.getByRole("button", { name: "Tornar creator" }));
    fireEvent.click(screen.getByRole("radio", { name: "Afiliado" }));
    fireEvent.change(
      screen.getByPlaceholderText(/Por que este usuário está recebendo acesso/),
      { target: { value: "Parceria de cupom" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Conceder" }));

    await waitFor(() =>
      expect(escritas).toEqual([
        {
          path: "/users/u1/influencer",
          method: "POST",
          body: { note: "Parceria de cupom", kind: "afiliado" },
        },
      ]),
    );
    await waitFor(() =>
      expect(toastSpy.acao).toHaveBeenCalledWith({
        message: "Afiliado concedido. O Pro já está ativo.",
      }),
    );
  });

  it("o cartao de status diz o tipo da concessao", async () => {
    await abrir(
      detalhe({
        influencer: { ...CONCESSAO, kind: "afiliado" },
        is_pro: true,
        pro_source: "afiliado",
      }),
    );
    expect(screen.getByTestId("creator-kind-status").textContent).toBe(
      "Afiliado",
    );
  });
});

describe("bloco Codigos de creator", () => {
  it("lista SO os codigos deste usuario", async () => {
    await abrir(detalhe({ influencer: CONCESSAO, is_pro: true }));
    const bloco = await blocoPronto();

    expect(within(bloco).getByTestId("creator-codigo-RAFA10")).toBeTruthy();
    expect(within(bloco).queryByTestId("creator-codigo-OUTRA15")).toBeNull();
    expect(within(bloco).queryByTestId("creator-codigo-ZECA5")).toBeNull();
    expect(within(bloco).queryByTestId("creator-codigo-BIA5")).toBeNull();
  });

  it("sem codigo proprio, diz que nao ha nenhum vinculado", async () => {
    await abrir(detalhe({ influencer: CONCESSAO, is_pro: true }), {
      codigos: { data: [CODIGOS.data[1], CODIGOS.data[2]] },
    });
    const bloco = await blocoPronto();
    expect(within(bloco).getByTestId("creator-codigos-vazio").textContent).toBe(
      "Nenhum código vinculado a este usuário.",
    );
  });

  it("resposta que nao e lista vira erro, nunca lista vazia", async () => {
    await abrir(detalhe({ influencer: CONCESSAO, is_pro: true }), {
      codigos: { data: null },
    });
    const bloco = await blocoPronto();
    expect(within(bloco).getByTestId("creator-codigos-erro")).toBeTruthy();
    expect(within(bloco).queryByTestId("creator-codigos-vazio")).toBeNull();
  });

  it("Vincular oferece so codigos sem dono, em ordem de nome, e manda PATCH user_id", async () => {
    await abrir(detalhe({ influencer: CONCESSAO, is_pro: true }));
    const bloco = await blocoPronto();

    fireEvent.click(
      within(bloco).getByRole("button", { name: "Vincular código existente" }),
    );
    const select = within(bloco).getByLabelText(
      "Código sem dono",
    ) as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual([
      "Escolha um código...",
      "Bia Sem Dono (BIA5)",
      "Zeca Sem Dono (ZECA5)",
    ]);

    fireEvent.change(select, { target: { value: "a3" } });
    fireEvent.click(within(bloco).getByRole("button", { name: "Vincular" }));

    await waitFor(() =>
      expect(escritas).toEqual([
        {
          path: "/content/affiliates/a3",
          method: "PATCH",
          body: { user_id: "u1" },
        },
      ]),
    );
    await waitFor(() => expect(leiturasDeCodigos()).toBe(2));
  });

  it("Desvincular pede confirmacao e manda PATCH user_id null", async () => {
    await abrir(detalhe({ influencer: CONCESSAO, is_pro: true }));
    const bloco = await blocoPronto();
    const cartao = within(bloco).getByTestId("creator-codigo-RAFA10");

    fireEvent.click(within(cartao).getByRole("button", { name: "Desvincular" }));
    expect(escritas).toEqual([]);

    fireEvent.click(
      within(cartao).getByRole("button", { name: "Confirmar desvínculo" }),
    );

    await waitFor(() =>
      expect(escritas).toEqual([
        {
          path: "/content/affiliates/a1",
          method: "PATCH",
          body: { user_id: null },
        },
      ]),
    );
    await waitFor(() => expect(leiturasDeCodigos()).toBe(2));
  });

  it("Criar manda POST com user_id, codigo em caixa alta e nome preenchido", async () => {
    await abrir(detalhe({ influencer: CONCESSAO, is_pro: true }));
    const bloco = await blocoPronto();

    fireEvent.click(
      within(bloco).getByRole("button", {
        name: "Criar código para este usuário",
      }),
    );
    expect(
      (within(bloco).getByLabelText("Nome") as HTMLInputElement).value,
    ).toBe("Rafa Lima");
    fireEvent.change(within(bloco).getByLabelText("Código"), {
      target: { value: "rafa20" },
    });
    fireEvent.change(within(bloco).getByLabelText("Desconto (%)"), {
      target: { value: "10" },
    });
    fireEvent.change(within(bloco).getByLabelText("Comissão (%)"), {
      target: { value: "25" },
    });
    fireEvent.click(within(bloco).getByRole("button", { name: "Criar código" }));

    await waitFor(() =>
      expect(escritas).toEqual([
        {
          path: "/content/affiliates",
          method: "POST",
          body: {
            name: "Rafa Lima",
            code: "RAFA20",
            discount_percent: 10,
            commission_percent: 25,
            status: "active",
            user_id: "u1",
          },
        },
      ]),
    );
    await waitFor(() => expect(leiturasDeCodigos()).toBe(2));
  });

  it("codigo repetido: o 409 vira frase inline nomeando o codigo", async () => {
    await abrir(detalhe({ influencer: CONCESSAO, is_pro: true }), {
      escrita: new AdminApiError(
        "Já existe um item com este slug.",
        409,
        "conflict",
      ),
    });
    const bloco = await blocoPronto();

    fireEvent.click(
      within(bloco).getByRole("button", {
        name: "Criar código para este usuário",
      }),
    );
    fireEvent.change(within(bloco).getByLabelText("Código"), {
      target: { value: "RAFA10" },
    });
    fireEvent.change(within(bloco).getByLabelText("Desconto (%)"), {
      target: { value: "10" },
    });
    fireEvent.change(within(bloco).getByLabelText("Comissão (%)"), {
      target: { value: "20" },
    });
    fireEvent.click(within(bloco).getByRole("button", { name: "Criar código" }));

    expect(
      (await within(bloco).findByTestId("creator-codigos-erro-acao"))
        .textContent,
    ).toBe("Já existe o código RAFA10. Escolha outro.");
  });

  it("codigo fora do padrao nao chama o servidor", async () => {
    await abrir(detalhe({ influencer: CONCESSAO, is_pro: true }));
    const bloco = await blocoPronto();

    fireEvent.click(
      within(bloco).getByRole("button", {
        name: "Criar código para este usuário",
      }),
    );
    fireEvent.change(within(bloco).getByLabelText("Código"), {
      target: { value: "RA" },
    });
    fireEvent.change(within(bloco).getByLabelText("Desconto (%)"), {
      target: { value: "10" },
    });
    fireEvent.change(within(bloco).getByLabelText("Comissão (%)"), {
      target: { value: "20" },
    });
    fireEvent.click(within(bloco).getByRole("button", { name: "Criar código" }));

    expect(
      within(bloco).getByTestId("creator-codigos-erro-acao").textContent,
    ).toBe(
      "O código precisa ter de 3 a 32 letras ou números, sem espaços nem acentos.",
    );
    expect(escritas).toEqual([]);
  });

  it("sem concessao ativa, avisa que o codigo so aparece depois dela", async () => {
    await abrir(detalhe());
    const bloco = await blocoPronto();
    expect(within(bloco).getByTestId("creator-codigos-aviso").textContent).toBe(
      "Este usuário ainda não é creator; o código só aparece no painel dele depois da concessão.",
    );
  });

  it("com concessao ativa, o aviso nao aparece", async () => {
    await abrir(detalhe({ influencer: CONCESSAO, is_pro: true }));
    const bloco = await blocoPronto();
    expect(within(bloco).queryByTestId("creator-codigos-aviso")).toBeNull();
  });
});
