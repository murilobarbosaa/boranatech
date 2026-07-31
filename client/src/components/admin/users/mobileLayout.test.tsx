import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

/**
 * POLIMENTO MOBILE da aba Usuarios.
 *
 * O QUE ESTE ARQUIVO NAO FAZ: medir pixel. jsdom nao faz layout, entao
 * `getBoundingClientRect` devolve zero para tudo e qualquer asserção de altura,
 * largura ou quebra de linha aqui seria teatro. Altura de card, fechamento das
 * duas linhas do grid de filtros e ausencia de overflow horizontal a 390px
 * ficaram FORA do alcance do teste, de propósito, e estao declarados assim no
 * relatorio em vez de virarem um verde que nao mede nada.
 *
 * O QUE ELE FAZ: travar o que sobrevive sem layout, que e estrutura e intencao.
 *   - o andaime de rotulos so-mobile sumiu do DOM (nao ficou escondido por CSS);
 *   - a acao destrutiva e DISTINGUIVEL de uma acao comum no proprio DOM;
 *   - existe uma saida do modal no cabecalho, e ela passa pelo mesmo funil;
 *   - o indicador de foco existe em todo controle (a11y), com o token do projeto.
 */

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));

import { UserListRow } from "./UserListRow";
import { UserDetailModal } from "./UserDetailModal";
import { UsersDashboard } from "./UsersDashboard";

const LINHA = {
  user_id: "u1",
  name: "Ana Moura",
  email: "ana@exemplo.com",
  created_at: "2026-07-30T12:00:00Z",
  is_pro: true,
  pro_source: "subscription",
  plan_code: "pro_monthly",
  subscription_status: "active",
};

const DETALHE = {
  data: {
    user_id: "u1",
    name: "Ana Moura",
    full_name: "Ana Ferreira Moura",
    email: "ana@exemplo.com",
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
    cpf_masked: null,
    has_cpf: false,
    avatar: { url: null, mode: "icon", moderation_status: "clean" },
    subscription: {
      plan_code: "pro_monthly",
      status: "active",
      payment_method: "card",
      renewal_type: "auto",
      created_at: null,
      current_period_end: null,
      cancel_at_period_end: false,
    },
    cancellation_intent: null,
    influencer: null,
    paid_total_cents: 0,
    activity_status: "active",
    created_at: null,
    updated_at: null,
  },
};

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation((path: string) => {
    if (path.includes("/audit"))
      return Promise.resolve({
        data: {
          entries: [],
          truncated: false,
          limit: 100,
          cross_reference_ok: true,
        },
      });
    if (path.includes("/activity"))
      return Promise.resolve({ data: { state: "ok", hasData: false } });
    if (path.includes("/transactions"))
      return Promise.resolve({
        data: { items: [], truncated: false, limit: 200 },
      });
    if (path.includes("/users/u1")) return Promise.resolve(DETALHE);
    return Promise.resolve({
      data: { items: [LINHA], total: 1, page: 1, pageSize: 50 },
    });
  });
});

afterEach(cleanup);

const FOCO = "focus-visible:ring-violet-400";

describe("card da lista: o andaime saiu, a informação ficou", () => {
  it("os rótulos só-mobile não estão mais no DOM", () => {
    // Nao basta esconder por CSS: rotulo escondido continua sendo lido por
    // leitor de tela e continua ocupando no com no DOM. Ele SAIU.
    const { container } = render(<UserListRow row={LINHA} onOpen={() => {}} />);
    const texto = container.textContent ?? "";
    for (const andaime of ["Acesso", "Assinatura", "Cadastro"]) {
      expect(texto).not.toContain(andaime);
    }
  });

  it("nenhuma informação foi perdida junto com os rótulos", () => {
    render(<UserListRow row={LINHA} onOpen={() => {}} />);
    for (const valor of [
      "Ana Moura",
      "ana@exemplo.com",
      "Pro",
      "Ativa",
      "Pro Mensal",
    ]) {
      expect(screen.getAllByText(valor).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/30\/07\/2026/)).toBeTruthy();
  });

  it("a data ganha contexto por prefixo, sem gastar uma linha de rótulo", () => {
    render(<UserListRow row={LINHA} onOpen={() => {}} />);
    expect(screen.getByText("desde")).toBeTruthy();
  });

  it("sem assinatura, o traço órfão não aparece no mobile", () => {
    // No desktop ele continua, porque a coluna precisa de conteudo para a grade
    // nao desalinhar e o cabecalho da o significado. No mobile nao ha cabecalho,
    // entao um "—" solto nao significa nada.
    const { container } = render(
      <UserListRow
        row={{ ...LINHA, subscription_status: null, plan_code: null }}
        onOpen={() => {}}
      />,
    );
    const traco = screen.getByText("—");
    expect(traco.className).toContain("hidden");
    expect(traco.className).toContain("md:inline");
    expect(container.textContent).toContain("Ana Moura");
  });

  it("a linha inteira continua sendo UM botão clicável", () => {
    const onOpen = vi.fn();
    render(<UserListRow row={LINHA} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledWith("u1");
  });

  it("a linha tem indicador de foco do projeto", () => {
    render(<UserListRow row={LINHA} onOpen={() => {}} />);
    expect(screen.getByRole("button").className).toContain(FOCO);
  });
});

describe("filtros: grade que fecha, em vez de wrap solto", () => {
  it("as 5 opções continuam todas visíveis, nenhuma escondida atrás de scroll", async () => {
    render(<UsersDashboard />);
    for (const label of [
      "Todos",
      "Assinantes",
      "Sem assinatura",
      "Influencers",
      "Ativo",
    ]) {
      expect(await screen.findByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("as pills se organizam em grade no mobile e viram linha no desktop", async () => {
    render(<UsersDashboard />);
    const pill = await screen.findByRole("button", { name: "Todos" });
    const caixa = pill.parentElement!;
    expect(caixa.className).toContain("grid-cols-3");
    expect(caixa.className).toContain("sm:flex");
  });

  it("a quarta pill fecha a segunda linha ocupando duas colunas", async () => {
    // 5 itens em 3 colunas deixam um vao. Com a quarta ocupando 2 colunas, a
    // segunda linha fecha e as divisorias alinham com as de cima.
    render(<UsersDashboard />);
    const quarta = await screen.findByRole("button", { name: "Influencers" });
    expect(quarta.className).toContain("col-span-2");
    expect(quarta.className).toContain("sm:col-span-1");
  });
});

describe("rodapé do modal: hierarquia explícita", () => {
  async function abrir() {
    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    await screen.findByText("Ana Ferreira Moura");
  }

  it("as ações destrutivas são distinguíveis de uma ação comum no DOM", async () => {
    await abrir();
    const comum = screen.getByRole("button", { name: "Editar" });
    for (const nome of ["Cancelar no fim do período", "Encerrar Pro agora"]) {
      const destrutiva = screen.getByRole("button", { name: nome });
      expect(destrutiva.className, nome).not.toBe(comum.className);
      expect(destrutiva.className, nome).toContain("rose");
    }
    expect(comum.className).not.toContain("rose");
  });

  it("as DUAS destrutivas se distinguem ENTRE SI, e não só das comuns", async () => {
    // Duas ações vermelhas sobre a mesma assinatura convivem no rodapé desde a
    // revogação avulsa. Cor igual entre elas não diz qual é qual: quem carrega a
    // diferença é o rótulo, e ele precisa nomear QUANDO o acesso cai.
    await abrir();
    const agendada = screen.getByRole("button", {
      name: "Cancelar no fim do período",
    });
    const imediata = screen.getByRole("button", { name: "Encerrar Pro agora" });

    expect(agendada.className).not.toBe(imediata.className);
    // O prazo está no PRÓPRIO rótulo, não só na cor.
    expect(agendada.textContent).toContain("fim do período");
    expect(imediata.textContent).toContain("agora");
  });

  it("as destrutivas ocupam a linha inteira no mobile, para não serem tocadas por engano", async () => {
    await abrir();
    for (const nome of ["Cancelar no fim do período", "Encerrar Pro agora"]) {
      expect(
        screen.getByRole("button", { name: nome }).className,
        nome,
      ).toContain("col-span-2");
    }
  });

  it("existe saída no cabeçalho, e ela passa pelo mesmo funil de fechamento", async () => {
    const onClose = vi.fn();
    render(<UserDetailModal userId="u1" onClose={onClose} />);
    await screen.findByText("Ana Ferreira Moura");
    // Pelo testid do CABECALHO, nao por nome: existe um "Fechar" no rodape, e
    // casar por nome faria este teste passar sem o X existir.
    fireEvent.click(screen.getByTestId("header-fechar"));
    expect(onClose).toHaveBeenCalled();
  });

  it("o Fechar do rodapé sai no mobile e fica no desktop", async () => {
    await abrir();
    const rodape = screen.getByTestId("footer-fechar");
    expect(rodape.className).toContain("hidden");
    expect(rodape.className).toContain("sm:inline-flex");
  });

  it("todo botão do rodapé tem indicador de foco do projeto", async () => {
    await abrir();
    for (const nome of [
      "Editar",
      "Trocar e-mail",
      "Cancelar no fim do período",
      "Encerrar Pro agora",
    ]) {
      expect(screen.getByRole("button", { name: nome }).className).toContain(
        FOCO,
      );
    }
  });
});
