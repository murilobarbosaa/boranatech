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
  semChavePix?: boolean;
};

const estado = vi.hoisted(() => ({
  fetch: vi.fn(),
  props: null as null | {
    painel: unknown;
    janela: string;
    visao: string;
    identidade: string | undefined;
    semChavePix: boolean | undefined;
  },
  // O formulario de perfil (lote 08) e mockado: ele busca sozinho, e aqui o que
  // se afirma e onde a pagina o poe e o que ela faz com o `onPixChange`.
  perfilForm: { montagens: 0 },
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
      semChavePix: props.semChavePix,
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
vi.mock("@/components/creator/CreatorPerfilForm", async () => {
  const { useEffect } = await import("react");
  return {
    CreatorPerfilForm: ({
      onPixChange,
    }: {
      onPixChange?: (temPix: boolean) => void;
    }) => {
      useEffect(() => {
        estado.perfilForm.montagens += 1;
      }, []);
      return (
        <div data-testid="perfil-form">
          <button type="button" onClick={() => onPixChange?.(false)}>
            perfil sem pix
          </button>
          <button type="button" onClick={() => onPixChange?.(true)}>
            perfil com pix
          </button>
        </div>
      );
    },
  };
});

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

function montar() {
  const { hook, history } = memoryLocation({ path: "/creator", record: true });
  render(
    <Router hook={hook}>
      <Creator />
    </Router>,
  );
  return history;
}

beforeEach(() => {
  estado.fetch = vi.fn();
  estado.props = null;
  estado.perfilForm = { montagens: 0 };
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
      throw new AdminApiError("Acesso de creator necessário.", 403, "not_creator");
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
    fireEvent.click(within(erro).getByRole("button", { name: "Tentar de novo" }));
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

describe("pagina /creator: perfil de creator (lote 08)", () => {
  it("o formulario de perfil aparece, e o aviso so liga quando o perfil diz que nao ha chave", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    montar();
    await screen.findByTestId("view");
    expect(screen.getByTestId("perfil-form")).toBeTruthy();
    // Enquanto o perfil nao respondeu, "nao sei" nao e "sem chave".
    expect(estado.props?.semChavePix).toBe(false);
    fireEvent.click(screen.getByText("perfil sem pix"));
    expect(estado.props?.semChavePix).toBe(true);
    fireEvent.click(screen.getByText("perfil com pix"));
    expect(estado.props?.semChavePix).toBe(false);
  });

  it("trocar a janela do grafico NAO remonta o formulario de perfil", async () => {
    estado.fetch = vi.fn(async () => ({ data: PAINEL }));
    montar();
    fireEvent.click(await screen.findByText("trocar para 90 dias"));
    await screen.findByTestId("view");
    expect(estado.fetch).toHaveBeenLastCalledWith("/creator/me?janela=90d");
    expect(estado.perfilForm.montagens).toBe(1);
  });

  it("quem nao e creator nao ve o formulario de perfil", async () => {
    estado.fetch = vi.fn(async () => {
      throw new AdminApiError(
        "Acesso de creator necessário.",
        403,
        "not_creator",
      );
    });
    montar();
    await screen.findByTestId("creator-nao-creator");
    expect(screen.queryByTestId("perfil-form")).toBeNull();
  });
});
