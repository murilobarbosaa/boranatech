import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactNode } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

/**
 * PAGINA /creator: quem busca o painel e decide o estado da tela.
 *
 * O CreatorDashboardView e mockado de proposito: a pagina nao desenha o
 * painel, so entrega o payload e a janela. O que se afirma aqui e a busca, a
 * troca de janela e os tres estados que nao sao painel.
 *
 * O 403 `not_creator` NAO redireciona, e isso se prova pelo historico de
 * navegacao do router (memoryLocation com `record`), nao pela ausencia de um
 * texto: uma tela que redirecionasse e depois mostrasse a frase passaria num
 * teste so de texto.
 */

type PropsDoView = {
  painel: unknown;
  janela: string;
  onJanelaChange: (janela: "7d" | "30d" | "90d" | "all") => void;
  visao: string;
  identidade?: string;
};

const estado = vi.hoisted(() => ({
  fetch: vi.fn(),
  props: null as null | {
    painel: unknown;
    janela: string;
    visao: string;
    identidade: string | undefined;
  },
  // O perfil (lote 08b) vem do hook useCreatorPerfil, dublado aqui: quem busca
  // e a PAGINA, e o que se afirma e o que ela faz com o que voltou. Os dois
  // formularios sao dublados porque aqui eles so precisam existir ou nao.
  perfil: { tipo: "carregando" } as
    | { tipo: "carregando" }
    | { tipo: "erro" }
    | { tipo: "ok"; perfil: unknown },
  recarregar: vi.fn(),
  redesForm: { montagens: 0 },
  // O status de creator da sessao (lote 11b): decide as abas. Afiliado por
  // padrao, que e o conjunto completo; os testes do influencer trocam aqui.
  creator: { status: "ready", kind: "afiliado" } as
    | { status: "loading" }
    | { status: "ready"; kind: "influencer" | "afiliado" | null }
    | { status: "error" },
}));

// Sonda: se a pagina voltar a importar o fundo decorado, ele aparece na tela
// com este test id. A leitura da fonte, no teste, cobre o import.
vi.mock("@/components/profile/ProfileBackground", () => ({
  ProfileBackground: () => <div data-testid="profile-background" />,
}));

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/lib/adminApi", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/adminApi")>();
  return {
    ...real,
    contentFetch: (...args: unknown[]) => estado.fetch(...args),
  };
});
vi.mock("@/components/creator/CreatorDashboardView", () => ({
  CreatorDashboardView: (props: PropsDoView) => {
    estado.props = {
      painel: props.painel,
      janela: props.janela,
      visao: props.visao,
      identidade: props.identidade,
    };
    return (
      <div data-testid="view">
        <button type="button" onClick={() => props.onJanelaChange("90d")}>
          trocar para 90 dias
        </button>
      </div>
    );
  },
}));
vi.mock("@/hooks/useCreator", () => ({
  useCreator: () => estado.creator,
}));
vi.mock("@/components/creator/useCreatorPerfil", () => ({
  useCreatorPerfil: () => ({
    estado: estado.perfil,
    recarregar: estado.recarregar,
    definirPerfil: vi.fn(),
    definirPix: vi.fn(),
  }),
}));
vi.mock("@/components/creator/CreatorRedesForm", async () => {
  const { useEffect } = await import("react");
  return {
    CreatorRedesForm: () => {
      useEffect(() => {
        estado.redesForm.montagens += 1;
      }, []);
      return <div data-testid="redes-form" />;
    },
  };
});
vi.mock("@/components/creator/CreatorPixForm", () => ({
  CreatorPixForm: () => <div data-testid="pix-form" />,
}));
// O cartao de publicacoes (lote 09) busca sozinho; aqui o que se afirma e onde
// a pagina o poe, nao o que ele desenha.
vi.mock("@/components/creator/CreatorPublicacoes", () => ({
  CreatorPublicacoes: () => <div data-testid="publicacoes" />,
}));
// O calendario (lote 10) tambem busca sozinho, e por conta propria: dublado
// aqui, o que se afirma e onde a pagina o poe. Sem o dublê, montar a aba
// Comunidade dispararia duas requisicoes reais dentro do teste da pagina.
vi.mock("@/components/creator/CreatorCalendario", () => ({
  CreatorCalendario: () => <div data-testid="calendario" />,
}));
// O ranking (lote 11) busca sozinho, como o calendario: dublado pelo mesmo
// motivo.
vi.mock("@/components/creator/CreatorRanking", () => ({
  CreatorRanking: () => <div data-testid="ranking" />,
}));
// O cartao do ranking na aba Numeros (lote 11) tambem busca sozinho.
vi.mock("@/components/creator/CartaoDoRanking", () => ({
  CartaoDoRanking: () => <div data-testid="cartao-ranking" />,
}));

import { AdminApiError } from "@/lib/adminApi";
import type { CreatorDashboard } from "@shared/creatorDashboard";
import Creator from "./Creator";

const PAINEL: CreatorDashboard = {
  creator: {
    kind: "afiliado",
    granted_at: "2026-09-01T12:00:00Z",
    revoked_at: null,
  },
  perfil: { name: "Ana Creator", handle: "anacreator", avatar_url: null },
  janela: "30d",
  totais: {
    clicks: 140,
    sales: 3,
    revenue_cents: 6279,
    commission_due_cents: 1884,
    commission_paid_cents: 0,
    conversao_pct: 2.14,
  },
  codigos: [],
  eventos: {
    clicks_since: null,
    sales_since: null,
    events_since: null,
    serie: [],
    periodo: {
      clicks: 0,
      checkouts: 0,
      sales: 0,
      revenue_cents: 0,
      commission_cents: 0,
    },
    periodo_anterior: {
      clicks: 0,
      checkouts: 0,
      sales: 0,
      revenue_cents: 0,
      commission_cents: 0,
    },
    ultimo_click_at: null,
    ultima_venda_at: null,
  },
};

function montar(path = "/creator") {
  const { hook, searchHook, history } = memoryLocation({ path, record: true });
  render(
    <Router hook={hook} searchHook={searchHook}>
      <Creator />
    </Router>,
  );
  return history;
}

beforeEach(() => {
  estado.fetch = vi.fn();
  estado.props = null;
  estado.perfil = { tipo: "carregando" };
  estado.recarregar = vi.fn();
  estado.redesForm = { montagens: 0 };
  estado.creator = { status: "ready", kind: "afiliado" };
});

afterEach(() => {
  cleanup();
});

describe("pagina /creator", () => {
  it("sucesso: busca a janela padrao e entrega o payload ao view", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    montar();
    await screen.findByTestId("view");
    expect(estado.fetch).toHaveBeenCalledTimes(1);
    expect(estado.fetch).toHaveBeenCalledWith("/creator/me?janela=30d");
    expect(estado.props?.painel).toBe(PAINEL);
    expect(estado.props?.janela).toBe("30d");
    expect(estado.props?.visao).toBe("creator");
  });

  it("trocar a janela refaz a busca com ?janela=90d", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    montar();
    fireEvent.click(await screen.findByText("trocar para 90 dias"));
    await screen.findByTestId("view");
    expect(estado.fetch).toHaveBeenCalledTimes(2);
    expect(estado.fetch).toHaveBeenLastCalledWith("/creator/me?janela=90d");
    expect(estado.props?.janela).toBe("90d");
  });

  it("403 not_creator: tela propria, com link para a home, sem redirecionar", async () => {
    estado.fetch = vi.fn(async () => {
      throw new AdminApiError(
        "Acesso de creator necessário.",
        403,
        "not_creator",
      );
    });
    const history = montar();
    const tela = await screen.findByTestId("creator-nao-creator");
    expect(tela.textContent).toContain(
      "Este painel é para creators da Bora na Tech.",
    );
    expect(within(tela).getByRole("link").getAttribute("href")).toBe("/");
    expect(history).toEqual(["/creator"]);
    expect(screen.queryByTestId("view")).toBeNull();
  });

  it("403 creator_check_failed nao e 'voce nao e creator': cai no erro generico", async () => {
    estado.fetch = vi.fn(async () => {
      throw new AdminApiError(
        "Não foi possível confirmar seu acesso de creator.",
        403,
        "creator_check_failed",
      );
    });
    montar();
    await screen.findByTestId("creator-erro");
    expect(screen.queryByTestId("creator-nao-creator")).toBeNull();
  });

  it("erro generico: 'tentar de novo' refaz a mesma busca", async () => {
    estado.fetch = vi
      .fn()
      .mockRejectedValueOnce(
        new AdminApiError("Erro ao carregar o painel.", 500, "db_error"),
      )
      .mockResolvedValueOnce({ data: PAINEL });
    montar();
    const erro = await screen.findByTestId("creator-erro");
    fireEvent.click(
      within(erro).getByRole("button", { name: "Tentar de novo" }),
    );
    await screen.findByTestId("view");
    expect(estado.fetch).toHaveBeenCalledTimes(2);
    expect(estado.fetch.mock.calls).toEqual([
      ["/creator/me?janela=30d"],
      ["/creator/me?janela=30d"],
    ]);
  });

  it("resposta sem o formato do painel vira erro, nunca painel vazio", async () => {
    estado.fetch = vi.fn(async () => ({ data: { ok: true } }));
    montar();
    await screen.findByTestId("creator-erro");
    expect(screen.queryByTestId("view")).toBeNull();
  });
});

describe("pagina /creator: estrutura do admin", () => {
  function faixa(): HTMLElement | null {
    return screen
      .getByRole("heading", { level: 1, name: "Painel de Creator" })
      .closest("section");
  }

  it("carregando: faixa hero-pattern com o h1, corpo section-alt, sem identidade", () => {
    estado.fetch = vi.fn(() => new Promise(() => {}));
    montar();
    expect(faixa()?.className).toContain("hero-pattern");
    expect(faixa()?.nextElementSibling?.className).toContain("section-alt");
    expect(screen.queryByTestId("creator-identidade")).toBeNull();
  });

  it("erro: a mesma faixa, o erro dentro do corpo e sem identidade", async () => {
    estado.fetch = vi.fn(async () => {
      throw new AdminApiError("Erro ao carregar o painel.", 500, "db_error");
    });
    montar();
    const erro = await screen.findByTestId("creator-erro");
    expect(faixa()?.className).toContain("hero-pattern");
    expect(erro.closest("section")?.className).toContain("section-alt");
    expect(screen.queryByTestId("creator-identidade")).toBeNull();
  });

  it("nao creator: a mesma faixa, o cartao dentro do corpo e sem identidade", async () => {
    estado.fetch = vi.fn(async () => {
      throw new AdminApiError(
        "Acesso de creator necessário.",
        403,
        "not_creator",
      );
    });
    montar();
    const tela = await screen.findByTestId("creator-nao-creator");
    expect(faixa()?.className).toContain("hero-pattern");
    expect(tela.parentElement?.closest("section")?.className).toContain(
      "section-alt",
    );
    expect(screen.queryByTestId("creator-identidade")).toBeNull();
  });

  it("ok: nenhuma identidade na pagina, e a view recebe identidade nenhuma", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    montar();
    const view = await screen.findByTestId("view");
    expect(faixa()?.className).toContain("hero-pattern");
    expect(screen.queryByTestId("creator-identidade")).toBeNull();
    expect(screen.queryByText("Ana Creator")).toBeNull();
    expect(view.closest("section")?.className).toContain("section-alt");
    expect(estado.props?.identidade).toBe("nenhuma");
  });

  it("o fundo decorado do /perfil nao e renderizado nem importado", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    montar();
    await screen.findByTestId("view");
    expect(screen.queryByTestId("profile-background")).toBeNull();
    const fonte = readFileSync(
      resolve(import.meta.dirname, "Creator.tsx"),
      "utf8",
    );
    expect(fonte).not.toContain("ProfileBackground");
  });
});

const PERFIL_COM_CHAVE = {
  instagram_handle: "ana.cria",
  tiktok_handle: null,
  instagram_followers: 1200,
  tiktok_followers: null,
  followers_updated_at: "2026-09-14T12:00:00Z",
  visible_to_creators: false,
  pix: {
    tipo: "cpf",
    mascarada: "***.***.247-**",
    updated_at: "2026-09-14T12:00:00Z",
  },
};

const PERFIL_SEM_CHAVE = { ...PERFIL_COM_CHAVE, pix: null };

describe("pagina /creator: aba Perfil (lote 08b)", () => {
  it("?aba=perfil abre os dois cartoes, e o painel de numeros nem e buscado", async () => {
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    montar("/creator?aba=perfil");
    expect(await screen.findByTestId("creator-card-redes")).toBeTruthy();
    expect(screen.getByTestId("creator-card-pagamento")).toBeTruthy();
    expect(screen.getByTestId("redes-form")).toBeTruthy();
    expect(screen.getByTestId("pix-form")).toBeTruthy();
    // Lote 09: os dois cartoes dividem a MESMA grade, lado a lado no desktop.
    const grade = screen.getByTestId("creator-card-redes").closest(".grid");
    expect(grade?.className).toContain("lg:grid-cols-2");
    expect(grade?.contains(screen.getByTestId("creator-card-pagamento"))).toBe(
      true,
    );
    // Lote 10: mesma altura. O `items-stretch` sozinho nao basta; cada cartao
    // precisa do `h-full`, e e o par que faz os dois terminarem juntos.
    expect(grade?.className).toContain("lg:items-stretch");
    expect(screen.getByTestId("creator-card-redes").className).toContain(
      "h-full",
    );
    expect(screen.getByTestId("creator-card-pagamento").className).toContain(
      "h-full",
    );
    expect(screen.queryByTestId("view")).toBeNull();
    expect(estado.fetch).not.toHaveBeenCalled();
  });

  it("o card Pagamento tem o lugar dos comprovantes, ainda vazio (lote 10)", async () => {
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    montar("/creator?aba=perfil");
    const pagamento = await screen.findByTestId("creator-card-pagamento");
    const comprovantes = within(pagamento).getByTestId("creator-comprovantes");
    expect(comprovantes.textContent).toContain("comissões pagas");
    expect(
      within(comprovantes).getByTestId("creator-comprovantes-vazio")
        .textContent,
    ).toContain("Nenhum pagamento ainda");
    // O bloco vem DEPOIS da chave: ele fala do que ja foi pago por ela.
    const pix = screen.getByTestId("pix-form");
    expect(
      pix.compareDocumentPosition(comprovantes) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("erro no perfil: bloco de erro com tentar de novo, e nenhum formulario", async () => {
    estado.perfil = { tipo: "erro" };
    montar("/creator?aba=perfil");
    const erro = await screen.findByTestId("creator-perfil-erro");
    fireEvent.click(
      within(erro).getByRole("button", { name: "Tentar de novo" }),
    );
    expect(estado.recarregar).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("redes-form")).toBeNull();
  });

  it("o mini ranking vive no CABECALHO, na coluna da direita, antes da faixa de abas (lote 11e)", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    montar();
    const view = await screen.findByTestId("view");
    const cabecalho = screen.getByTestId("creator-cabecalho");
    // Duas colunas no desktop, so para o afiliado, com o texto centralizado
    // na vertical contra o cartao, que e mais alto (lote 11f).
    const classes = cabecalho.getAttribute("class") ?? "";
    expect(classes).toContain("md:grid-cols-[1fr_minmax(0,28rem)]");
    expect(classes).toContain("md:items-center");
    expect(classes).not.toContain("md:items-start");
    const coluna = within(cabecalho).getByTestId("creator-cabecalho-ranking");
    expect(within(coluna).getByTestId("cartao-ranking")).toBeTruthy();
    // Titulo e subtitulo continuam na coluna da esquerda, antes do cartao.
    const titulo = within(cabecalho).getByRole("heading", { level: 1 });
    expect(
      titulo.compareDocumentPosition(coluna) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Cabecalho antes da faixa de abas, e a faixa antes do painel.
    const abas = screen.getByTestId("creator-abas");
    expect(
      cabecalho.compareDocumentPosition(abas) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      abas.compareDocumentPosition(view) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // E NAO existe mais um cartao proprio dentro da aba Numeros.
    expect(
      within(screen.getByRole("tabpanel")).queryByTestId("cartao-ranking"),
    ).toBeNull();
    expect(screen.getAllByTestId("cartao-ranking")).toHaveLength(1);
    // A PAGINA continua buscando so o painel: o cartao busca por conta propria.
    expect(estado.fetch).toHaveBeenCalledTimes(1);
  });

  it("o mini ranking aparece em qualquer aba: Calendario e Perfil (lote 11e)", async () => {
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    for (const aba of ["calendario", "perfil"]) {
      cleanup();
      montar(`/creator?aba=${aba}`);
      const cabecalho = await screen.findByTestId("creator-cabecalho");
      expect(within(cabecalho).getByTestId("cartao-ranking"), aba).toBeTruthy();
      expect(screen.getAllByTestId("cartao-ranking")).toHaveLength(1);
    }
    expect(estado.fetch).not.toHaveBeenCalled();
  });

  it("na aba Numeros a secao de perfil nao existe", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "ok", perfil: PERFIL_SEM_CHAVE };
    montar();
    await screen.findByTestId("view");
    expect(screen.queryByTestId("creator-card-redes")).toBeNull();
    expect(screen.queryByTestId("redes-form")).toBeNull();
  });

  it("quem nao e creator: o cartao proprio na aba Numeros, sem perfil junto", async () => {
    estado.fetch = vi.fn(async () => {
      throw new AdminApiError(
        "Acesso de creator necessário.",
        403,
        "not_creator",
      );
    });
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    montar();
    await screen.findByTestId("creator-nao-creator");
    expect(screen.queryByTestId("creator-card-redes")).toBeNull();
    expect(screen.queryByTestId("redes-form")).toBeNull();
  });
});

describe("pagina /creator: as abas na URL (lote 08b)", () => {
  it("sem parametro: Numeros, e a URL fica limpa", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    const history = montar();
    await screen.findByTestId("view");
    expect(
      screen.getByTestId("creator-aba-numeros").getAttribute("aria-selected"),
    ).toBe("true");
    expect(history).toEqual(["/creator"]);
  });

  it("?aba= desconhecido cai em Numeros, sem pagina em branco", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    montar("/creator?aba=xpto");
    await screen.findByTestId("view");
    expect(
      screen.getByTestId("creator-aba-numeros").getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("trocar de aba escreve a URL e monta so o painel ativo", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    const history = montar();
    await screen.findByTestId("view");
    expect(estado.fetch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("creator-aba-calendario"));
    expect(history[history.length - 1]).toBe("/creator?aba=calendario");
    expect(screen.getByTestId("creator-comunidade")).toBeTruthy();
    expect(screen.queryByTestId("view")).toBeNull();
    // A PAGINA nao busca nada na aba Calendario: quem busca sao os dois
    // cartoes, cada um por conta propria, e aqui os dois estao dublados. O que
    // esta assercao guarda e que trocar de aba nao refaz a busca do painel.
    expect(estado.fetch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("creator-aba-perfil"));
    expect(history[history.length - 1]).toBe("/creator?aba=perfil");
    expect(screen.getByTestId("creator-card-redes")).toBeTruthy();
    expect(screen.queryByTestId("creator-comunidade")).toBeNull();
  });

  it("voltar para Numeros limpa o parametro e busca de novo", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    const history = montar("/creator?aba=perfil");
    await screen.findByTestId("creator-card-redes");
    expect(estado.fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("creator-aba-numeros"));
    expect(history[history.length - 1]).toBe("/creator");
    await screen.findByTestId("view");
    // Sem cache entre abas neste lote: voltar para Numeros busca outra vez.
    expect(estado.fetch).toHaveBeenCalledTimes(1);
    expect(estado.redesForm.montagens).toBe(1);
  });

  it("a faixa aparece nos quatro estados da pagina", async () => {
    // Carregando.
    estado.fetch = vi.fn(() => new Promise(() => {}));
    montar();
    expect(screen.getByTestId("creator-abas")).toBeTruthy();
    cleanup();

    // Erro.
    estado.fetch = vi.fn(async () => {
      throw new AdminApiError("Erro ao carregar o painel.", 500, "db_error");
    });
    montar();
    await screen.findByTestId("creator-erro");
    expect(screen.getByTestId("creator-abas")).toBeTruthy();
    cleanup();

    // Nao creator.
    estado.fetch = vi.fn(async () => {
      throw new AdminApiError(
        "Acesso de creator necessário.",
        403,
        "not_creator",
      );
    });
    montar();
    await screen.findByTestId("creator-nao-creator");
    expect(screen.getByTestId("creator-abas")).toBeTruthy();
    cleanup();

    // Painel ok.
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    montar();
    await screen.findByTestId("view");
    expect(screen.getByTestId("creator-abas")).toBeTruthy();
  });

  it("as pendencias da faixa saem do perfil que a pagina leu", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "ok", perfil: PERFIL_SEM_CHAVE };
    montar();
    await screen.findByTestId("view");
    expect(screen.getByTestId("creator-pendencia-pix")).toBeTruthy();
    // O @ esta preenchido nesse perfil, entao so ha uma pendencia.
    expect(screen.queryByTestId("creator-pendencia-redes")).toBeNull();

    fireEvent.click(screen.getByTestId("creator-pendencia-pix"));
    expect(screen.getByTestId("creator-card-pagamento")).toBeTruthy();
  });

  it("enquanto o perfil nao respondeu a faixa nao acusa pendencia", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "carregando" };
    montar();
    await screen.findByTestId("view");
    expect(screen.getByTestId("creator-abas")).toBeTruthy();
    expect(screen.queryByTestId("creator-pendencias")).toBeNull();
  });

  it("aba Calendario: o calendario vem ANTES das publicacoes (lote 10d)", async () => {
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    montar("/creator?aba=calendario");
    const publicacoes = await screen.findByTestId("creator-card-publicacoes");
    const calendario = screen.getByTestId("creator-comunidade");
    expect(screen.getByTestId("publicacoes")).toBeTruthy();
    expect(screen.getByTestId("calendario")).toBeTruthy();
    expect(
      calendario.compareDocumentPosition(publicacoes) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // A PAGINA continua sem buscar o painel de Numeros nesta aba.
    expect(estado.fetch).not.toHaveBeenCalled();
  });

  it("?aba=comunidade (link antigo das notificacoes) abre a MESMA aba Calendario", async () => {
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    montar("/creator?aba=comunidade");
    expect(await screen.findByTestId("creator-comunidade")).toBeTruthy();
    expect(
      screen
        .getByTestId("creator-aba-calendario")
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.queryByTestId("view")).toBeNull();
  });

  it("afiliado: quatro abas e o cartao do ranking na aba Numeros (lote 11b)", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    montar();
    await screen.findByTestId("view");
    expect(
      screen.getAllByRole("tab").map((b) => b.getAttribute("data-testid")),
    ).toEqual([
      "creator-aba-numeros",
      "creator-aba-calendario",
      "creator-aba-ranking",
      "creator-aba-perfil",
    ]);
    expect(screen.getByTestId("cartao-ranking")).toBeTruthy();
  });

  it("influencer: sem a aba Ranking, sem o cartao, e ?aba=ranking cai em Numeros (lote 11b)", async () => {
    estado.creator = { status: "ready", kind: "influencer" };
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    const history = montar("/creator?aba=ranking");
    await screen.findByTestId("view");
    expect(
      screen.getAllByRole("tab").map((b) => b.getAttribute("data-testid")),
    ).toEqual([
      "creator-aba-numeros",
      "creator-aba-calendario",
      "creator-aba-perfil",
    ]);
    expect(screen.queryByTestId("ranking")).toBeNull();
    expect(screen.queryByTestId("cartao-ranking")).toBeNull();
    // Sem a coluna da direita, o cabecalho volta a uma coluna (lote 11e).
    expect(screen.queryByTestId("creator-cabecalho-ranking")).toBeNull();
    expect(
      screen.getByTestId("creator-cabecalho").getAttribute("class") ?? "",
    ).not.toContain("md:grid-cols");
    expect(
      screen.getByTestId("creator-aba-numeros").getAttribute("aria-selected"),
    ).toBe("true");
    // A URL NAO e reescrita: a pagina so escolhe o painel.
    expect(history[history.length - 1]).toBe("/creator?aba=ranking");
  });

  it("status ainda carregando: o conjunto menor, sem Ranking, ate saber (lote 11b)", async () => {
    estado.creator = { status: "loading" };
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    montar();
    await screen.findByTestId("view");
    expect(screen.queryByTestId("creator-aba-ranking")).toBeNull();
    expect(screen.queryByTestId("cartao-ranking")).toBeNull();
  });

  it("?aba=ranking monta o ranking (lote 11), sem buscar o painel", async () => {
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    montar("/creator?aba=ranking");
    expect(await screen.findByTestId("ranking")).toBeTruthy();
    expect(screen.queryByTestId("creator-comunidade")).toBeNull();
    expect(screen.queryByTestId("view")).toBeNull();
    expect(estado.fetch).not.toHaveBeenCalled();
  });

  it("clicar em Ranking escreve ?aba=ranking e troca o painel", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    const history = montar();
    await screen.findByTestId("view");

    fireEvent.click(screen.getByTestId("creator-aba-ranking"));
    expect(history[history.length - 1]).toBe("/creator?aba=ranking");
    expect(screen.getByTestId("ranking")).toBeTruthy();
    expect(screen.queryByTestId("view")).toBeNull();
    // A PAGINA nao chama rede na aba Ranking: quem busca e o componente,
    // dublado aqui.
    expect(estado.fetch).toHaveBeenCalledTimes(1);
  });
});

describe("esqueletos da pagina (lote 11c)", () => {
  it("aba Numeros carregando: o esqueleto do painel, no lugar da caixa tracejada", () => {
    estado.fetch = vi.fn(() => new Promise(() => {}));
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    montar();
    const esqueleto = screen.getByTestId("creator-painel-esqueleto");
    expect(esqueleto.getAttribute("aria-busy")).toBe("true");
    expect(screen.queryByText(/Carregando seu painel/)).toBeNull();
    expect(screen.queryByTestId("view")).toBeNull();
  });

  it("aba Perfil carregando: os dois cartoes de mentira, no lugar da caixa tracejada", () => {
    estado.perfil = { tipo: "carregando" };
    montar("/creator?aba=perfil");
    const esqueleto = screen.getByTestId("creator-perfil-esqueleto");
    expect(esqueleto.getAttribute("aria-busy")).toBe("true");
    expect(esqueleto.querySelectorAll("section")).toHaveLength(2);
    expect(screen.queryByText(/Carregando seu perfil/)).toBeNull();
    expect(screen.queryByTestId("creator-card-redes")).toBeNull();
  });
});

describe("superficies estaticas (lote 11g)", () => {
  it("os cartoes que nao sao botao nem link usam card-surface, sem card-brutal nem bnt-pressable", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    estado.perfil = { tipo: "ok", perfil: PERFIL_COM_CHAVE };
    for (const aba of ["numeros", "calendario", "perfil"]) {
      cleanup();
      montar(aba === "numeros" ? "/creator" : `/creator?aba=${aba}`);
      await screen.findByTestId("creator-abas");
      const superficies = Array.from(
        document.querySelectorAll(".card-surface"),
      );
      expect(superficies.length, aba).toBeGreaterThan(0);
      for (const el of superficies) {
        const classes = el.getAttribute("class") ?? "";
        expect(classes, aba).not.toContain("card-brutal");
        expect(classes, aba).not.toContain("bnt-pressable");
        expect(classes, aba).not.toMatch(/(active|hover):-?translate/);
        expect(["A", "BUTTON"], aba).not.toContain(el.tagName);
      }
    }
    // Os nomeados: faixa de abas, cartoes do perfil e das publicacoes.
    expect(
      screen.getByTestId("creator-card-redes").getAttribute("class") ?? "",
    ).toContain("card-surface");
    expect(
      screen.getByTestId("creator-card-pagamento").getAttribute("class") ?? "",
    ).toContain("card-surface");
    expect(
      screen.getByTestId("creator-abas").getAttribute("class") ?? "",
    ).toContain("card-surface");
    // Nenhum card-brutal sobrou na pagina do creator.
    expect(document.querySelectorAll(".card-brutal")).toHaveLength(0);
  });
});
