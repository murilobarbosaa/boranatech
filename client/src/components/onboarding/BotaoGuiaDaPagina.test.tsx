import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { afterEach, describe, expect, it } from "vitest";

import {
  OnboardingCoordinatorProvider,
  useOnboardingCoordinator,
} from "@/lib/onboarding/coordinator";
import BotaoGuiaDaPagina from "./BotaoGuiaDaPagina";

// O botao "?" do Header. Ele so faz duas coisas: aparecer nas rotas que TEM
// onboarding e pedir a abertura. Quem abre e o host.

/** Sonda: mostra quantos pedidos manuais chegaram e deixa marcar o overlay. */
function Sonda() {
  const { pedidoManual, marcarOverlayAberto } = useOnboardingCoordinator();
  return (
    <>
      <p data-testid="pedidos">{pedidoManual}</p>
      <button
        type="button"
        data-testid="abrir-overlay"
        onClick={() => marcarOverlayAberto(true)}
      >
        abrir
      </button>
    </>
  );
}

function montar(path: string, variant: "desktop" | "mobile" = "desktop") {
  const { hook } = memoryLocation({ path });
  return render(
    <Router hook={hook}>
      <OnboardingCoordinatorProvider>
        <BotaoGuiaDaPagina variant={variant} />
        <Sonda />
      </OnboardingCoordinatorProvider>
    </Router>,
  );
}

const botao = () =>
  screen.queryByRole("button", { name: /Rever o guia desta página/i });
const pedidos = () => screen.getByTestId("pedidos").textContent;

afterEach(() => cleanup());

describe("BotaoGuiaDaPagina: visibilidade", () => {
  it("aparece na rota que tem onboarding", () => {
    montar("/cursos");
    expect(botao()).not.toBeNull();
  });

  it("nao aparece em rota classificada como sem-onboarding", () => {
    montar("/login");
    expect(botao()).toBeNull();
  });

  it("nao aparece em rota pendente", () => {
    montar("/perfil");
    expect(botao()).toBeNull();
  });

  it("nao aparece em rota que o registry nem conhece", () => {
    montar("/rota-que-nao-existe");
    expect(botao()).toBeNull();
  });

  it("ignora a query string ao resolver a rota", () => {
    montar("/cursos?area=dados");
    expect(botao()).not.toBeNull();
  });
});

describe("BotaoGuiaDaPagina: pedido de abertura", () => {
  it("o clique registra um pedido manual", () => {
    montar("/cursos");
    expect(pedidos()).toBe("0");

    fireEvent.click(botao() as HTMLButtonElement);
    expect(pedidos()).toBe("1");
  });

  it("fica inerte enquanto o overlay esta aberto", () => {
    montar("/cursos");
    fireEvent.click(screen.getByTestId("abrir-overlay"));

    const alvo = botao() as HTMLButtonElement;
    expect(alvo.disabled).toBe(true);
    fireEvent.click(alvo);
    expect(pedidos()).toBe("0");
  });

  it("a versao do drawer fecha o menu antes de pedir", () => {
    const { hook } = memoryLocation({ path: "/cursos" });
    let fechou = 0;
    render(
      <Router hook={hook}>
        <OnboardingCoordinatorProvider>
          <BotaoGuiaDaPagina
            variant="mobile"
            onOpen={() => {
              fechou += 1;
            }}
          />
          <Sonda />
        </OnboardingCoordinatorProvider>
      </Router>,
    );

    fireEvent.click(botao() as HTMLButtonElement);
    expect(fechou).toBe(1);
    expect(pedidos()).toBe("1");
  });
});
