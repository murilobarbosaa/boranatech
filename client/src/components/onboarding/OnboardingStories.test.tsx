import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import homeOnboarding from "@/lib/onboarding/steps/home";
import type { OnboardingEventDetail } from "@/lib/onboarding/types";
import OnboardingStories, { rotaInternaDe } from "./OnboardingStories";

// Smoke do motor: renderiza os passos da home, navega, escolhe o perfil e
// conclui. O que importa e o contrato de saida (evento 'bnt:onboarding' e o
// callback que o host usa para persistir), nao o pixel.
//
// Usa fireEvent, e nao @testing-library/user-event: user-event nao esta
// instalado nesta base e a tarefa fecha o escopo em nao acrescentar
// dependencia.

const eventos: OnboardingEventDetail[] = [];
const capturar = (event: Event) => {
  eventos.push((event as CustomEvent<OnboardingEventDetail>).detail);
};

const contador = () => document.querySelector(".counter")?.textContent;

const proximo = () =>
  document.querySelector<HTMLButtonElement>(".next") as HTMLButtonElement;

beforeEach(() => {
  eventos.length = 0;
  window.addEventListener("bnt:onboarding", capturar);
});

afterEach(() => {
  window.removeEventListener("bnt:onboarding", capturar);
  // `globals` esta desligado no vitest.config.ts, entao o auto-cleanup do
  // testing-library nao se registra sozinho. Sem isto o render anterior fica
  // no document e as consultas por classe pegam dois onboardings.
  cleanup();
});

describe("OnboardingStories", () => {
  it("renderiza os 6 passos da home com o primeiro na frente", () => {
    render(<OnboardingStories def={homeOnboarding} onFinish={vi.fn()} />);

    const cards = document.querySelectorAll(".card");
    expect(cards).toHaveLength(homeOnboarding.steps.length);
    expect(cards[0].className).toContain("front");
    expect(cards[1].className).toContain("b1");
    expect(cards[2].className).toContain("b2");

    expect(screen.getByText("Essa é a sua bússola pra tech")).toBeInstanceOf(
      HTMLElement,
    );
    expect(contador()).toBe("1/6");
  });

  it("esconde Voltar no primeiro card e Pular no ultimo", () => {
    render(<OnboardingStories def={homeOnboarding} onFinish={vi.fn()} />);

    // Por seletor, e nao por role: `hidden` tira o botao da arvore acessivel,
    // entao getByRole nao acharia justamente o estado que este teste verifica.
    const [voltar, pular] = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".side .ghost"),
    );
    expect(voltar.textContent).toContain("Voltar");
    expect(pular.textContent).toBe("Pular");
    expect(voltar).toHaveProperty("hidden", true);
    expect(pular).toHaveProperty("hidden", false);

    for (let i = 0; i < 5; i += 1) fireEvent.click(proximo());

    expect(contador()).toBe("6/6");
    expect(voltar).toHaveProperty("hidden", false);
    expect(pular).toHaveProperty("hidden", true);
    // No ultimo card o botao principal vira o cta do passo.
    expect(proximo().textContent).toBe("Explorar a plataforma →");
  });

  it("navega com as setas do teclado e emite 'step'", () => {
    render(<OnboardingStories def={homeOnboarding} onFinish={vi.fn()} />);

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(contador()).toBe("2/6");
    expect(eventos.at(-1)).toMatchObject({
      type: "step",
      screen: "home",
      index: 1,
      key: "profile",
    });

    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(contador()).toBe("1/6");
    expect(eventos.at(-1)).toMatchObject({ type: "step", key: "welcome" });
  });

  it("escolher o perfil marca a opcao, emite 'choice' e auto-avanca", async () => {
    render(<OnboardingStories def={homeOnboarding} onFinish={vi.fn()} />);

    fireEvent.click(proximo());
    expect(contador()).toBe("2/6");

    const opcao = screen.getByRole("radio", { name: /Já estou na área!/ });
    fireEvent.click(opcao);

    expect(opcao.getAttribute("aria-checked")).toBe("true");
    expect(eventos.at(-1)).toMatchObject({
      type: "choice",
      step: "profile",
      index: 2,
      label: "Já estou na área!",
    });

    // Auto-avanco de ~300ms depois da escolha.
    await waitFor(() => expect(contador()).toBe("3/6"), { timeout: 2000 });
  });

  it("o perfil escolhido marca 'PRA VOCÊ' no card de trilhas", async () => {
    render(<OnboardingStories def={homeOnboarding} onFinish={vi.fn()} />);

    fireEvent.keyDown(document, { key: "ArrowRight" });
    fireEvent.click(screen.getByRole("radio", { name: /Não sei nada/ }));
    await waitFor(() => expect(contador()).toBe("3/6"), { timeout: 2000 });

    const tags = Array.from(document.querySelectorAll(".points .tag"));
    expect(tags).toHaveLength(4);
    const visiveis = tags.filter((tag) => !tag.hasAttribute("hidden"));
    expect(visiveis).toHaveLength(1);
    expect(visiveis[0].closest("li")?.textContent).toContain("Não sei nada");
  });

  it("concluir emite 'finish' e chama onFinish com o perfil escolhido", async () => {
    const onFinish = vi.fn();
    render(<OnboardingStories def={homeOnboarding} onFinish={onFinish} />);

    fireEvent.keyDown(document, { key: "ArrowRight" });
    fireEvent.click(screen.getByRole("radio", { name: /Sei, mas e agora\?/ }));
    await waitFor(() => expect(contador()).toBe("3/6"), { timeout: 2000 });

    while (contador() !== "6/6") fireEvent.click(proximo());
    fireEvent.click(proximo());

    expect(onFinish).toHaveBeenCalledTimes(1);
    // 3o argumento = destino de navegacao. `undefined` porque este fim veio do
    // botao "Explorar a plataforma", nao do proCta.
    expect(onFinish).toHaveBeenCalledWith(
      "concluido",
      { perfil: "sei-mas-e-agora" },
      undefined,
    );
    expect(eventos.at(-1)).toMatchObject({
      type: "finish",
      how: "concluido",
      result: { completed: true, perfil: "sei-mas-e-agora", tour: null },
    });
  });

  it("registra a escolha de tour no resultado", async () => {
    const onFinish = vi.fn();
    render(<OnboardingStories def={homeOnboarding} onFinish={onFinish} />);

    while (contador() !== "5/6") fireEvent.click(proximo());
    fireEvent.click(screen.getByRole("radio", { name: /Me mostra cada aba/ }));
    await waitFor(() => expect(contador()).toBe("6/6"), { timeout: 2000 });

    fireEvent.click(proximo());
    expect(onFinish).toHaveBeenCalledWith(
      "concluido",
      { tour: "guiado" },
      undefined,
    );
  });

  it("Esc e o botao Pular terminam como 'pulado', uma vez so", () => {
    const onFinish = vi.fn();
    render(<OnboardingStories def={homeOnboarding} onFinish={onFinish} />);

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Pular" }));

    // `finish` e idempotente: Esc segurado nao dispara tres persistencias.
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith("pulado", {}, undefined);
  });

  it("cards inativos ficam fora da arvore acessivel", () => {
    render(<OnboardingStories def={homeOnboarding} onFinish={vi.fn()} />);
    const cards = Array.from(document.querySelectorAll(".card"));

    expect(cards[0].getAttribute("aria-hidden")).toBe("false");
    for (const card of cards.slice(1)) {
      expect(card.getAttribute("aria-hidden")).toBe("true");
      expect(card.hasAttribute("inert")).toBe(true);
    }
  });

  it("as setas dentro do radiogroup movem o foco, nao o card", () => {
    render(<OnboardingStories def={homeOnboarding} onFinish={vi.fn()} />);
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(contador()).toBe("2/6");

    const opcoes = screen.getAllByRole("radio");
    opcoes[0].focus();
    fireEvent.keyDown(opcoes[0], { key: "ArrowDown" });

    expect(document.activeElement).toBe(opcoes[1]);
    expect(contador()).toBe("2/6");
  });
});

describe("rotaInternaDe", () => {
  // O conteudo guarda a URL absoluta do HTML de referencia; quem decide que ela
  // e rota interna e este helper, no renderizador.
  it("reconhece o proprio site, com e sem www", () => {
    expect(rotaInternaDe("https://www.boranatech.com.br/planos")).toBe(
      "/planos",
    );
    expect(rotaInternaDe("https://boranatech.com.br/planos")).toBe("/planos");
  });

  it("preserva query e hash", () => {
    expect(rotaInternaDe("https://boranatech.com.br/planos?p=anual#faq")).toBe(
      "/planos?p=anual#faq",
    );
  });

  it("aceita caminho relativo direto", () => {
    expect(rotaInternaDe("/planos")).toBe("/planos");
  });

  it("devolve null para link externo de verdade", () => {
    // null = mantem o comportamento do HTML (abre em nova aba). Um host
    // parecido NAO conta como o site: `boranatech.com.br.exemplo.com` e outro
    // dominio.
    expect(rotaInternaDe("https://exemplo.com/planos")).toBeNull();
    expect(rotaInternaDe("https://boranatech.com.br.exemplo.com/x")).toBeNull();
  });

  it("nao lanca em href invalido", () => {
    expect(rotaInternaDe("isto nao e url")).toBeNull();
  });
});
