import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useEffect } from "react";
import { Router, useLocation } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  OnboardingCoordinatorProvider,
  useOnboardingCoordinator,
} from "@/lib/onboarding/coordinator";
import { limparEncerrados } from "@/lib/onboarding/encerrados";
import { ONBOARDING_REGISTRY } from "@/lib/onboarding/registry";
import { tourAtivo } from "@/lib/onboarding/tour";
import type { Profile } from "@/services/contracts";
import OnboardingHost, {
  DELAY_ABERTURA_MS,
  DELAY_TOUR_MS,
  SAIDA_MS,
} from "./OnboardingHost";

// Maquina do TOUR GUIADO: a sequencia que comeca quando alguem escolhe
// "me mostra cada aba" no card 5 da home.

const updateMyProfile = vi.fn();
vi.mock("@/services/profileService", () => ({
  updateMyProfile: (u: Record<string, unknown>) => updateMyProfile(u),
}));

let auth = {
  user: null as { id: string } | null,
  profile: null as Profile | null,
  profileStatus: "idle" as "idle" | "loading" | "ready" | "error",
  loading: false,
};
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));

function Rota() {
  const [location] = useLocation();
  return <p data-testid="rota">{location}</p>;
}

function Sonda() {
  const { superInterstitialAllowed } = useOnboardingCoordinator();
  return (
    <p data-testid="sonda">
      {superInterstitialAllowed ? "livre" : "bloqueado"}
    </p>
  );
}

/**
 * Reproduz o RequireAuth: as rotas listadas redirecionam em vez de renderizar.
 * O host detecta a guarda comparando a location que chegou com a que ele pediu,
 * e e exatamente isso que precisa de teste.
 */
function GuardaFalsa({ bloqueadas }: { bloqueadas: string[] }) {
  const [location, navigate] = useLocation();
  useEffect(() => {
    if (bloqueadas.includes(location)) {
      navigate(`/cadastro?returnTo=${encodeURIComponent(location)}`, {
        replace: true,
      });
    }
  }, [location, navigate, bloqueadas]);
  return null;
}

function montar(path: string, bloqueadas: string[] = []) {
  const { hook, navigate } = memoryLocation({ path });
  return {
    ...render(
      <Router hook={hook}>
        <OnboardingCoordinatorProvider>
          <GuardaFalsa bloqueadas={bloqueadas} />
          <OnboardingHost />
          <Rota />
          <Sonda />
        </OnboardingCoordinatorProvider>
      </Router>,
    ),
    navigate,
    hook,
    bloqueadas,
  };
}

const rota = () => screen.getByTestId("rota").textContent;
const sonda = () => screen.getByTestId("sonda").textContent;
const overlay = () => document.querySelector(".bnt-onb");
const contador = () => document.querySelector(".bnt-onb .counter")?.textContent;
const next = () =>
  document.querySelector<HTMLButtonElement>(
    ".bnt-onb .next",
  ) as HTMLButtonElement;

async function avancar(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
const abrirAvulso = () => avancar(DELAY_ABERTURA_MS + 50);
const abrirNoTour = () => avancar(DELAY_TOUR_MS + 50);
const fechar = () => avancar(SAIDA_MS + 50);

/** Marca rotas como ja vistas por fora, no localStorage do fluxo anonimo. */
function marcarVistas(...rotas: string[]) {
  for (const r of rotas) {
    window.localStorage.setItem(
      `bnt_onb:${r}`,
      JSON.stringify({
        seen: true,
        how: "concluido",
        at: "2026-08-01T00:00:00Z",
      }),
    );
  }
}

/** Abre a home, escolhe no card 5 e conclui. E o gatilho do tour. */
async function concluirHomeComTour(escolha: "guiado" | "livre") {
  await abrirAvulso();
  expect(contador()).toBe("1/6");
  for (let i = 0; i < 4; i += 1) fireEvent.click(next());
  expect(contador()).toBe("5/6");

  fireEvent.click(
    screen.getByRole("radio", {
      name: escolha === "guiado" ? /Me mostra cada aba/ : /Prefiro explorar/,
    }),
  );
  await avancar(400); // auto-avanco de ~300ms
  expect(contador()).toBe("6/6");

  fireEvent.click(next()); // "Explorar a plataforma"
  await fechar();
}

beforeEach(async () => {
  // Aquece TODOS os modulos de conteudo antes do relogio falso: o tour navega
  // por varias rotas e cada `load()` e I/O real, que relogio falso nao adianta.
  // Derivado do registry para nao virar lista escrita a mao que fica para tras.
  await import("./OnboardingStories");
  await Promise.all(
    Object.values(ONBOARDING_REGISTRY)
      .filter((e) => e.type === "onboarding")
      .map((e) => (e.type === "onboarding" ? e.load() : null)),
  );

  vi.useFakeTimers();
  window.localStorage.clear();
  // Escopo de CARGA DE PAGINA: no navegador some no reload, aqui nao, entao os
  // casos herdariam o que o anterior encerrou.
  limparEncerrados();
  updateMyProfile.mockReset();
  updateMyProfile.mockResolvedValue({});
  auth = { user: null, profile: null, profileStatus: "idle", loading: false };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("tour guiado: inicio", () => {
  it("'guiado' navega para a proxima rota da ordem e abre na cadencia do tour", async () => {
    montar("/");
    await concluirHomeComTour("guiado");

    expect(tourAtivo()).toBe(true);
    expect(rota()).toBe("/areas");

    // Cadencia do tour, nao a avulsa: em DELAY_TOUR_MS ja apareceu.
    expect(overlay()).toBeNull();
    await abrirNoTour();
    expect(overlay()).not.toBeNull();
    expect(screen.getByText("Tudo sobre cada área da TI")).toBeInstanceOf(
      HTMLElement,
    );
  });

  it("'livre' NAO inicia tour: fica no comportamento avulso", async () => {
    montar("/");
    await concluirHomeComTour("livre");

    expect(tourAtivo()).toBe(false);
    expect(rota()).toBe("/");
    await avancar(DELAY_ABERTURA_MS * 2);
    expect(rota()).toBe("/");
    expect(overlay()).toBeNull();
  });

  it("nao escolher nada tambem nao inicia tour", async () => {
    montar("/");
    await abrirAvulso();
    for (let i = 0; i < 5; i += 1) fireEvent.click(next());
    fireEvent.click(next());
    await fechar();

    expect(tourAtivo()).toBe(false);
    expect(rota()).toBe("/");
  });
});

describe("tour guiado: sequencia", () => {
  it("encadeia na ordem dos arquivos de design", async () => {
    montar("/");
    await concluirHomeComTour("guiado");
    expect(rota()).toBe("/areas");

    // /areas -> /quiz-carreira -> /faculdades
    for (const proxima of ["/quiz-carreira", "/faculdades"]) {
      await abrirNoTour();
      expect(overlay()).not.toBeNull();
      while (next().textContent?.startsWith("Próximo")) fireEvent.click(next());
      fireEvent.click(next());
      await fechar();
      expect(rota()).toBe(proxima);
    }
    expect(tourAtivo()).toBe(true);
  });

  it("pula as rotas ja vistas", async () => {
    marcarVistas("/areas", "/quiz-carreira", "/faculdades");
    montar("/");
    await concluirHomeComTour("guiado");

    // Saltou as tres e caiu na quinta da ordem.
    expect(rota()).toBe("/tecnologias");
  });

  it("pula rota que a guarda redireciona, sem abrir nada em /cadastro", async () => {
    // Tudo entre /areas e /roadmaps ja visto: o proximo alvo e /roadmaps/ia,
    // que a guarda bloqueia.
    marcarVistas(
      "/areas",
      "/quiz-carreira",
      "/faculdades",
      "/tecnologias",
      "/tecnologias/por-area",
      "/tecnologias/ranking",
      "/dicionario",
      "/roadmaps",
    );
    montar("/", ["/roadmaps/ia"]);
    await concluirHomeComTour("guiado");
    await avancar(50);

    // Nao ficou parado no cadastro: pulou para o item seguinte da ordem.
    expect(rota()).toBe("/plano-carreira");
    expect(window.localStorage.getItem("bnt_onb:/roadmaps/ia")).toBeNull();

    await abrirNoTour();
    expect(overlay()).not.toBeNull();
  });
});

describe("tour guiado: abortar", () => {
  it("'Pular' aborta o tour e nao marca as rotas seguintes", async () => {
    montar("/");
    await concluirHomeComTour("guiado");
    await abrirNoTour();
    expect(rota()).toBe("/areas");

    // Botao "Pular" do overlay de /areas.
    fireEvent.click(
      document.querySelectorAll<HTMLButtonElement>(".bnt-onb .side .ghost")[1],
    );
    await fechar();

    expect(tourAtivo()).toBe(false);
    // A pagina atual fica marcada como pulada...
    expect(
      JSON.parse(window.localStorage.getItem("bnt_onb:/areas") as string),
    ).toMatchObject({ seen: true, how: "pulado" });
    // ...e as seguintes continuam NAO vistas, para aparecerem individualmente.
    expect(window.localStorage.getItem("bnt_onb:/quiz-carreira")).toBeNull();
    expect(window.localStorage.getItem("bnt_onb:/faculdades")).toBeNull();
    // E o tour nao navegou para lugar nenhum.
    expect(rota()).toBe("/areas");
  });

  it("Esc tambem aborta o tour", async () => {
    montar("/");
    await concluirHomeComTour("guiado");
    await abrirNoTour();

    fireEvent.keyDown(document, { key: "Escape" });
    await fechar();

    expect(tourAtivo()).toBe(false);
    expect(rota()).toBe("/areas");
  });

  it("proCta durante o tour aborta e vai para /planos", async () => {
    marcarVistas(
      "/areas",
      "/quiz-carreira",
      "/faculdades",
      "/tecnologias",
      "/tecnologias/por-area",
      "/tecnologias/ranking",
      "/dicionario",
      "/roadmaps",
      "/roadmaps/ia",
      "/plano-carreira",
    );
    montar("/");
    await concluirHomeComTour("guiado");
    expect(rota()).toBe("/cursos");
    await abrirNoTour();

    while (!document.querySelector(".bnt-onb .procta")) fireEvent.click(next());
    fireEvent.click(
      document.querySelector<HTMLAnchorElement>(".bnt-onb .procta")!,
      { button: 0 },
    );
    await fechar();

    expect(rota()).toBe("/planos");
    expect(tourAtivo()).toBe(false);
    expect(
      JSON.parse(window.localStorage.getItem("bnt_onb:/cursos") as string),
    ).toMatchObject({ how: "concluido" });
  });
});

describe("tour guiado: fim e retomada", () => {
  it("concluir a ultima rota da ordem encerra o tour", async () => {
    // Tudo visto menos a ultima: o primeiro salto do tour ja cai nela.
    const todasMenosUltima = [
      "/areas",
      "/quiz-carreira",
      "/faculdades",
      "/tecnologias",
      "/tecnologias/por-area",
      "/tecnologias/ranking",
      "/dicionario",
      "/roadmaps",
      "/roadmaps/ia",
      "/plano-carreira",
      "/cursos",
      "/plataformas",
      "/projetos",
      "/ingles",
      "/ferramentas",
      "/ia",
      "/vagas",
      "/empresas",
      "/entrevistas",
      "/curriculo/gerar",
      "/curriculo/analisar",
      "/linkedin/analisar",
      "/portfolio/analisar",
      "/evolucao",
      "/salarios",
      "/noticias",
      "/eventos",
      "/dicas",
      "/comunidades",
      "/sobre",
      "/mentorias",
    ];
    marcarVistas(...todasMenosUltima);
    montar("/");
    await concluirHomeComTour("guiado");
    expect(rota()).toBe("/mulheres");
    expect(tourAtivo()).toBe(true);

    await abrirNoTour();
    while (next().textContent?.startsWith("Próximo")) fireEvent.click(next());
    fireEvent.click(next());
    await fechar();

    expect(tourAtivo()).toBe(false);
    expect(rota()).toBe("/mulheres");
  });

  it("reload no meio do tour retoma na cadencia do tour", async () => {
    montar("/");
    await concluirHomeComTour("guiado");
    expect(rota()).toBe("/areas");

    // Simula o reload: desmonta tudo e monta de novo na rota atual. O
    // localStorage sobrevive, que e o ponto do estado persistido.
    cleanup();
    expect(tourAtivo()).toBe(true);

    montar("/areas");
    expect(overlay()).toBeNull();
    await abrirNoTour();
    expect(overlay()).not.toBeNull();
    expect(screen.getByText("Tudo sobre cada área da TI")).toBeInstanceOf(
      HTMLElement,
    );

    // E o fluxo segue: concluir aqui leva para a proxima da ordem.
    while (next().textContent?.startsWith("Próximo")) fireEvent.click(next());
    fireEvent.click(next());
    await fechar();
    expect(rota()).toBe("/quiz-carreira");
  });

  it("com tour ativo, o SuperInterstitial fica bloqueado ate em rota sem onboarding", async () => {
    montar("/");
    await concluirHomeComTour("guiado");
    cleanup();

    // Reload numa rota que nao participa do tour e nao tem onboarding: mesmo
    // sem overlay para abrir, a vez continua reservada enquanto o tour roda.
    montar("/perfil");
    await avancar(DELAY_ABERTURA_MS + 50);
    expect(overlay()).toBeNull();
    expect(sonda()).toBe("bloqueado");
  });

  it("sem tour ativo, rota sem onboarding libera o SuperInterstitial", async () => {
    montar("/perfil");
    await avancar(DELAY_ABERTURA_MS + 50);
    expect(sonda()).toBe("livre");
  });
});
