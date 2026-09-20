import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CreatorIdentidade: quem e o creator, no cartao que o admin ve dentro do
 * painel e que a pagina /creator poe na faixa de topo.
 *
 * Os valores esperados sao LITERAIS, os mesmos do painel do teste do
 * CreatorDashboardView: Ana Creator, @anacreator, afiliado desde 01/09/2026.
 */

vi.mock("@/components/UserAvatar", () => ({
  default: ({ name }: { name: string }) => (
    <span data-testid="avatar" data-nome={name} />
  ),
}));

// Revelar da chave Pix (lote 08): o `adminFetch` e dublado, e o que se afirma
// e a rota chamada e o que aparece na tela depois.
const estado = vi.hoisted(() => ({
  fetch: vi.fn(),
  toastErro: vi.fn(),
}));
vi.mock("@/lib/adminApi", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/adminApi")>();
  return {
    ...real,
    adminFetch: (...a: unknown[]) => estado.fetch(...a),
  };
});
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: (...a: unknown[]) => estado.toastErro(...a),
  },
}));

import type { CreatorDashboard } from "@shared/creatorDashboard";
import type { CreatorPerfilDados } from "@shared/creatorProfile";
import { CreatorIdentidade } from "./CreatorIdentidade";

function perfil(
  parcial: Partial<CreatorDashboard["perfil"]> = {},
): CreatorDashboard["perfil"] {
  return {
    name: "Ana Creator",
    handle: "anacreator",
    avatar_url: null,
    email: "ana@exemplo.com",
    ...parcial,
  };
}

function creator(
  parcial: Partial<CreatorDashboard["creator"]> = {},
): CreatorDashboard["creator"] {
  return {
    kind: "afiliado",
    granted_at: "2026-09-01T12:00:00Z",
    revoked_at: "2026-09-19T12:00:00Z",
    ...parcial,
  };
}

afterEach(() => {
  cleanup();
});

describe("CreatorIdentidade", () => {
  it("nome, @handle, chip do kind e Creator desde", () => {
    render(
      <CreatorIdentidade
        perfil={perfil()}
        creator={creator()}
        visao="creator"
      />,
    );
    const cartao = screen.getByTestId("creator-identidade");
    expect(cartao.className).toContain("card-brutal");
    expect(screen.getByRole("heading", { name: "Ana Creator" })).toBeTruthy();
    expect(screen.getByText("@anacreator")).toBeTruthy();
    expect(screen.getByTestId("creator-kind").textContent).toBe("Afiliado");
    expect(screen.getByText("Creator desde 01/09/2026")).toBeTruthy();
    expect(screen.getByTestId("avatar").getAttribute("data-nome")).toBe(
      "Ana Creator",
    );
  });

  it("o chip do kind tem a forma do botao Creator do header", () => {
    render(
      <CreatorIdentidade
        perfil={perfil()}
        creator={creator()}
        visao="creator"
      />,
    );
    expect(screen.getByTestId("creator-kind").className).toBe(
      "rounded-full border-2 border-ink-on-accent bg-sky-300 px-2.5 py-0.5 text-xs font-black text-ink-on-accent",
    );
  });

  it("sem handle, nao desenha @; sem nome, cai no handle e depois em Creator", () => {
    render(
      <CreatorIdentidade
        perfil={perfil({ name: null, handle: null })}
        creator={creator()}
        visao="creator"
      />,
    );
    expect(screen.getByRole("heading", { name: "Creator" })).toBeTruthy();
    expect(screen.getByTestId("creator-identidade").textContent).not.toContain(
      "@",
    );
    cleanup();
    render(
      <CreatorIdentidade
        perfil={perfil({ name: null })}
        creator={creator()}
        visao="creator"
      />,
    );
    expect(screen.getByRole("heading", { name: "anacreator" })).toBeTruthy();
  });

  it("e-mail e revogado so na visao admin", () => {
    render(
      <CreatorIdentidade perfil={perfil()} creator={creator()} visao="admin" />,
    );
    expect(screen.getByTestId("creator-email").textContent).toBe(
      "ana@exemplo.com",
    );
    expect(screen.getByTestId("creator-revogado").textContent).toBe(
      "Revogado em 19/09/2026",
    );
    cleanup();
    render(
      <CreatorIdentidade
        perfil={perfil()}
        creator={creator()}
        visao="creator"
      />,
    );
    expect(screen.queryByTestId("creator-email")).toBeNull();
    expect(screen.queryByTestId("creator-revogado")).toBeNull();
  });

  it("admin sem revogacao nem e-mail nao desenha os dois", () => {
    render(
      <CreatorIdentidade
        perfil={perfil({ email: null })}
        creator={creator({ revoked_at: null })}
        visao="admin"
      />,
    );
    expect(screen.queryByTestId("creator-email")).toBeNull();
    expect(screen.queryByTestId("creator-revogado")).toBeNull();
  });
});

// PERFIL DE CREATOR NA VISAO ADMIN (lote 08). O CPF de teste e o mesmo de
// shared/creatorProfile.test.ts: a mascara vem do servidor, e a chave inteira
// so aparece depois do Revelar.
const UID = "11111111-1111-1111-1111-111111111111";
const CPF_DE_TESTE = "52998224725";

function perfilCreator(
  parcial: Partial<CreatorPerfilDados> = {},
): CreatorPerfilDados {
  return {
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
    ...parcial,
  };
}

function desenharAdmin(
  perfilDoCreator: CreatorPerfilDados | undefined,
  userId: string | undefined = UID,
) {
  render(
    <CreatorIdentidade
      perfil={perfil()}
      creator={creator()}
      visao="admin"
      perfilCreator={perfilDoCreator}
      userId={userId}
    />,
  );
}

describe("CreatorIdentidade: perfil de creator na visao admin", () => {
  beforeEach(() => {
    estado.fetch = vi.fn();
    estado.toastErro = vi.fn();
  });

  it("redes com link, seguidores com a data e o consentimento", () => {
    desenharAdmin(perfilCreator());
    const instagram = screen.getByTestId("creator-instagram");
    expect(instagram.textContent).toBe("@ana.cria");
    expect(instagram.getAttribute("href")).toBe(
      "https://www.instagram.com/ana.cria/",
    );
    expect(instagram.getAttribute("target")).toBe("_blank");
    expect(instagram.getAttribute("rel")).toBe("noreferrer");
    expect(screen.getByTestId("creator-tiktok").getAttribute("href")).toBe(
      "https://www.tiktok.com/@ana.cria",
    );
    expect(screen.getByTestId("creator-seguidores").textContent).toBe(
      "12.500 no Instagram, 800 no TikTok, informados em 14/09/2026",
    );
    expect(screen.getByTestId("creator-visivel").textContent).toBe(
      "visível aos creators",
    );
  });

  it("consentimento desligado nao desenha o chip", () => {
    desenharAdmin(perfilCreator({ visible_to_creators: false }));
    expect(screen.queryByTestId("creator-visivel")).toBeNull();
  });

  it("cor no calendario (lote 10c): chip com o marcador e o nome; sem o campo, nada", () => {
    desenharAdmin(perfilCreator({ calendar_color: "cyan" }));
    const chip = screen.getByTestId("creator-cor");
    expect(chip.textContent).toBe("Ciano no calendário");
    expect(chip.querySelector("[data-cor='cyan']")?.className).toContain(
      "bg-cyan-500",
    );
    cleanup();
    desenharAdmin(perfilCreator());
    expect(screen.queryByTestId("creator-cor")).toBeNull();
  });

  it("chave mascarada com o tipo, e a inteira nao esta na tela", () => {
    desenharAdmin(perfilCreator());
    const pix = screen.getByTestId("creator-pix-admin");
    expect(pix.textContent).toContain("Pix (CPF)");
    expect(screen.getByTestId("creator-pix-valor").textContent).toBe(
      "***.***.247-**",
    );
    expect(document.body.textContent).not.toContain(CPF_DE_TESTE);
  });

  it("Revelar chama a rota auditada e mostra a chave inteira no lugar da mascara", async () => {
    estado.fetch = vi.fn(async () => ({
      data: { tipo: "cpf", valor: CPF_DE_TESTE },
    }));
    desenharAdmin(perfilCreator());
    fireEvent.click(screen.getByTestId("creator-pix-revelar"));
    await screen.findByText(CPF_DE_TESTE);
    expect(estado.fetch).toHaveBeenCalledTimes(1);
    expect(estado.fetch).toHaveBeenCalledWith(`/creators/${UID}/reveal-pix`, {
      method: "POST",
    });
    expect(screen.queryByTestId("creator-pix-revelar")).toBeNull();
  });

  it("Revelar com erro avisa e a mascara continua", async () => {
    estado.fetch = vi.fn(async () => {
      throw new Error("Não foi possível registrar a auditoria da revelação.");
    });
    desenharAdmin(perfilCreator());
    fireEvent.click(screen.getByTestId("creator-pix-revelar"));
    await vi.waitFor(() => expect(estado.toastErro).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("creator-pix-valor").textContent).toBe(
      "***.***.247-**",
    );
    expect(document.body.textContent).not.toContain(CPF_DE_TESTE);
  });

  it("sem chave: o aviso sem chave Pix, e nenhum Revelar", () => {
    desenharAdmin(perfilCreator({ pix: null }));
    expect(screen.getByTestId("creator-sem-pix-admin").textContent).toBe(
      "sem chave Pix",
    );
    expect(screen.queryByTestId("creator-pix-revelar")).toBeNull();
  });

  it("sem userId nao ha como revelar: o botao nao aparece", () => {
    // Render direto, sem a prop: passar `undefined` ao helper cairia no valor
    // padrao dele (UID) e o teste mediria o caso oposto ao do nome.
    render(
      <CreatorIdentidade
        perfil={perfil()}
        creator={creator()}
        visao="admin"
        perfilCreator={perfilCreator()}
      />,
    );
    expect(screen.getByTestId("creator-pix-valor").textContent).toBe(
      "***.***.247-**",
    );
    expect(screen.queryByTestId("creator-pix-revelar")).toBeNull();
  });

  it("sem perfilCreator (backend anterior ao lote 08): nenhuma das duas linhas", () => {
    desenharAdmin(undefined);
    expect(screen.queryByTestId("creator-redes")).toBeNull();
    expect(screen.queryByTestId("creator-pix-admin")).toBeNull();
    expect(screen.queryByTestId("creator-sem-pix-admin")).toBeNull();
  });

  it("a visao creator nunca mostra redes nem Pix, mesmo se vierem", () => {
    render(
      <CreatorIdentidade
        perfil={perfil()}
        creator={creator()}
        visao="creator"
        perfilCreator={perfilCreator()}
        userId={UID}
      />,
    );
    expect(screen.queryByTestId("creator-redes")).toBeNull();
    expect(screen.queryByTestId("creator-pix-admin")).toBeNull();
  });
});
