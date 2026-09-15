import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

import type { CreatorDashboard } from "@shared/creatorDashboard";
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
