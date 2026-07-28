import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

/**
 * Itens 4.1 e 4.3.
 *
 * O 4.3 e o conserto da LACUNA DETERMINISTICA que explica os 23 usuarios de
 * Google do Grupo B: a flag `bnt_pending_consent` so era gravada dentro de
 * `if (mode === "cadastro")`, entao quem criava conta clicando em "Entrar com
 * Google" na tela de LOGIN nascia sem consentimento registrado. O Supabase cria a
 * conta igual nos dois caminhos; so o nosso registro dependia da tela.
 *
 * Nao e uma corrida nem uma falha de rede: era determinístico, acontecia sempre, e
 * por isso e o unico dos quatro mecanismos que da para provar com um teste de
 * unidade em vez de medir em producao.
 */

const authSpy = vi.hoisted(() => ({ signInWithOAuth: vi.fn() }));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ signInWithOAuth: authSpy.signInWithOAuth }),
}));

vi.mock("@/lib/analytics", () => ({
  rememberSignupSource: vi.fn(),
  signupSourceFromUrl: () => "direct",
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import SocialAuthButtons from "./SocialAuthButtons";

const PENDING_CONSENT_KEY = "bnt_pending_consent";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  authSpy.signInWithOAuth.mockResolvedValue(undefined);
  vi.stubEnv("VITE_AUTH_GOOGLE_ENABLED", "true");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

function botaoGoogle() {
  return screen.getByRole("button", { name: /Google/i });
}

describe("nenhum botao de auth fica disabled por termos (item 4.1)", () => {
  it.each(["cadastro", "login"] as const)(
    "botao do Google esta habilitado em %s, sem checkbox nenhum",
    (mode) => {
      render(<SocialAuthButtons mode={mode} />);

      // Propriedade do DOM direto: este projeto nao instala jest-dom.
      expect((botaoGoogle() as HTMLButtonElement).disabled).toBe(false);
      // A tela nao tem mais caixa de aceite: se aparecer uma aqui, o sign-in wrap
      // foi desfeito sem que ninguem percebesse.
      expect(screen.queryByRole("checkbox")).toBeNull();
    },
  );
});

describe("flag de consentimento em TODA iniciacao de auth (item 4.3)", () => {
  it.each(["cadastro", "login"] as const)(
    "grava bnt_pending_consent no clique em modo %s",
    (mode) => {
      render(<SocialAuthButtons mode={mode} />);

      expect(sessionStorage.getItem(PENDING_CONSENT_KEY)).toBeNull();
      fireEvent.click(botaoGoogle());

      expect(sessionStorage.getItem(PENDING_CONSENT_KEY)).toBe("1");
      expect(authSpy.signInWithOAuth).toHaveBeenCalledWith("google", undefined);
    },
  );

  it("a flag e gravada ANTES do redirect, nao depois", () => {
    // Ordem importa e nao e detalhe: `signInWithOAuth` navega para fora da
    // pagina. O que for gravado depois dele pode simplesmente nunca acontecer.
    let flagNoMomentoDoRedirect: string | null = null;
    authSpy.signInWithOAuth.mockImplementation(async () => {
      flagNoMomentoDoRedirect = sessionStorage.getItem(PENDING_CONSENT_KEY);
    });

    render(<SocialAuthButtons mode="login" />);
    fireEvent.click(botaoGoogle());

    expect(flagNoMomentoDoRedirect).toBe("1");
  });

  it("so o cadastro marca a origem de signup; o login nao", () => {
    render(<SocialAuthButtons mode="login" />);
    fireEvent.click(botaoGoogle());

    // O consentimento vale para os dois caminhos, mas "isto foi um cadastro" nao:
    // o /bem-vindo e o evento user_signed_up continuam sendo coisa de /cadastro.
    expect(localStorage.getItem("bnt_social_signup_pending")).toBeNull();
    expect(sessionStorage.getItem(PENDING_CONSENT_KEY)).toBe("1");
  });

  it("cadastro continua marcando a origem de signup", () => {
    render(<SocialAuthButtons mode="cadastro" />);
    fireEvent.click(botaoGoogle());

    expect(localStorage.getItem("bnt_social_signup_pending")).toBe("true");
    expect(sessionStorage.getItem(PENDING_CONSENT_KEY)).toBe("1");
  });
});
