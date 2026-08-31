import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";

/**
 * O CANTO DIREITO DO HEADER DO ADMIN.
 *
 * Duas propriedades, e as duas falham em silencio:
 *
 *   1. O avatar e o DO SITE. Ate 2026-08-30 o admin desenhava as duas primeiras
 *      letras do nome por conta propria e ignorava a escolha da pessoa: quem
 *      tinha foto via a foto no site e um circulo roxo com iniciais no painel.
 *      Nada quebrava, e as duas telas simplesmente discordavam. A trava e o
 *      MODO FOTO: o desenho antigo nao tinha como renderizar uma imagem, entao
 *      um `<img>` no header so existe se a logica compartilhada estiver em uso.
 *
 *   2. O header nao fica MUDO. Os textos "Admin" e o e-mail sairam, e
 *      `UserAvatar` e `aria-hidden` por construcao (decoracao, `alt=""`). Sem um
 *      nome acessivel no wrapper, o canto inteiro deixa de existir para leitor
 *      de tela, e essa e a regressao que a remocao de texto costuma trazer de
 *      brinde.
 */

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));

const perfil = vi.hoisted(() => ({
  atual: null as Record<string, unknown> | null,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    loading: false,
    signOut: vi.fn(),
    user: { id: "admin-1", email: "admin@exemplo.com" },
    get profile() {
      return perfil.atual;
    },
  }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: {
          session: {
            access_token: `x.${btoa('{"admin_role":"owner"}')}.y`,
          },
        },
      }),
    },
  },
}));

vi.mock("@/lib/api", () => ({ apiUrl: (p: string) => p }));

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver =
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver ??
  ResizeObserverStub;

import Admin from "./Admin";

beforeEach(() => {
  window.history.replaceState({}, "", "/admin");
  perfil.atual = null;
  fetchMock.mockReset();
  // Toda rota rejeita: este arquivo mede o HEADER, e o corpo da pagina cai nos
  // estados de erro dele, que e irrelevante aqui. O header e desenhado antes de
  // qualquer resposta.
  fetchMock.mockRejectedValue(new Error("sem dados no teste"));
});

afterEach(cleanup);

async function abrir() {
  render(<Admin />);
  await waitFor(() =>
    expect(screen.getByTestId("admin-header-avatar")).toBeTruthy(),
  );
}

describe("header do admin: avatar e nada mais", () => {
  it("os textos do pill sairam: nem 'Admin' nem o e-mail", async () => {
    await abrir();
    const avatar = screen.getByTestId("admin-header-avatar");

    // Escopado ao canto do header: "Admin" aparece em outros lugares da pagina
    // (titulo, nav), e um queryByText solto acusaria falso.
    expect(avatar.textContent).not.toContain("admin@exemplo.com");
    expect(avatar.textContent?.toLowerCase()).not.toContain("admin@");
  });

  it("tem nome acessivel, senao o canto some para leitor de tela", async () => {
    await abrir();
    const avatar = screen.getByTestId("admin-header-avatar");

    expect(avatar.getAttribute("aria-label")).toContain("admin@exemplo.com");
    expect(avatar.getAttribute("title")).toBe("admin@exemplo.com");
    expect(avatar.getAttribute("role")).toBe("img");
  });

  it("MODO FOTO: renderiza a imagem escolhida no site", async () => {
    // A TRAVA PRINCIPAL. O desenho antigo era um <span> com duas letras e nao
    // tinha como produzir um <img>; se alguem voltar a desenhar iniciais aqui,
    // este teste cai.
    perfil.atual = {
      avatar_mode: "photo",
      avatar_url: "https://exemplo.com/foto.jpg",
      avatar_moderation_status: "clean",
    };
    await abrir();

    const img = screen.getByTestId("admin-header-avatar").querySelector("img");
    expect(img, "o header nao renderizou a foto do perfil").toBeTruthy();
    expect(img?.getAttribute("src")).toBe("https://exemplo.com/foto.jpg");
  });

  it("MODO ICONE: sem foto, cai no fallback do proprio componente do site", async () => {
    // CONTROLE do controle: sem ele, "renderiza img" seria compativel com
    // "renderiza img sempre", e o modo icone passaria a mostrar uma imagem
    // quebrada. O fallback e o do UserAvatar, nao um inventado aqui.
    perfil.atual = { avatar_mode: "icon", avatar_url: null };
    await abrir();

    const avatar = screen.getByTestId("admin-header-avatar");
    expect(avatar.querySelector("img")).toBeNull();
    // Tamanho `header` do UserAvatar (40px). O circulo antigo era h-8 w-8, e
    // esta asercao separa os dois desenhos mesmo no modo sem foto.
    expect(avatar.querySelector(".h-10.w-10")).toBeTruthy();
  });

  it("perfil AUSENTE nao quebra o header", async () => {
    // Janela em que o contexto ainda nao trouxe o perfil. O canto continua
    // renderizando, com o fallback, em vez de derrubar a pagina inteira.
    perfil.atual = null;
    await abrir();
    expect(screen.getByTestId("admin-header-avatar")).toBeTruthy();
  });
});
