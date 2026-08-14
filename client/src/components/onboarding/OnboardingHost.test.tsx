import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { Router, useLocation } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  OnboardingCoordinatorProvider,
  useOnboardingCoordinator,
} from "@/lib/onboarding/coordinator";
import { limparEncerrados } from "@/lib/onboarding/encerrados";
import { encerrarTour, tourAtivo } from "@/lib/onboarding/tour";
import type { Profile } from "@/services/contracts";
import OnboardingHost, { DELAY_ABERTURA_MS, SAIDA_MS } from "./OnboardingHost";

// Host + coordenacao. O ponto do arquivo e o invariante que a tarefa pediu para
// ser EXPLICITO e testavel: se o onboarding da rota abrir nesta carga, o
// SuperInterstitial nao abre, e enquanto o host nao decidiu, ninguem abre.
//
// TIMERS FALSOS. O overlay so aparece DELAY_ABERTURA_MS depois de decidir, e
// esperar isso em tempo real multiplicaria a suite por segundos a cada caso.
// `avancar()` empurra o relogio e drena as microtasks, entao o import dinamico
// dos steps e o lazy() do motor resolvem no mesmo passo. Nada de `waitFor` aqui:
// com relogio falso ele nao avanca sozinho, e a espera vira impasse.

const updateMyProfile = vi.fn();
vi.mock("@/services/profileService", () => ({
  updateMyProfile: (updates: Record<string, unknown>) =>
    updateMyProfile(updates),
}));

type AuthState = {
  user: { id: string } | null;
  profile: Profile | null;
  profileStatus: "idle" | "loading" | "ready" | "error";
  loading: boolean;
};

let auth: AuthState;
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));

/** Sonda de rota: expoe a location atual do wouter como texto. */
function Rota() {
  const [location] = useLocation();
  return <p data-testid="rota">{location}</p>;
}

/** Sonda: expoe a decisao do coordenador como texto. */
function Sonda() {
  const { decision, superInterstitialAllowed } = useOnboardingCoordinator();
  return (
    <p data-testid="sonda">
      {decision}:{superInterstitialAllowed ? "super-ok" : "super-bloqueado"}
    </p>
  );
}

/** Sonda do botao "?": pede a abertura manual e mostra se o overlay esta aberto. */
function Manual() {
  const { pedirOnboardingManual, overlayAberto } = useOnboardingCoordinator();
  return (
    <button
      type="button"
      data-testid="pedir-guia"
      onClick={pedirOnboardingManual}
    >
      {overlayAberto ? "aberto" : "fechado"}
    </button>
  );
}

/** Host que some e volta SEM levar o provider junto, para testar remontagem. */
function HostRemontavel() {
  const [montado, setMontado] = useState(true);
  return (
    <>
      {montado ? <OnboardingHost /> : null}
      <button
        type="button"
        data-testid="alternar-host"
        onClick={() => setMontado((m) => !m)}
      >
        alternar
      </button>
    </>
  );
}

function arvore(hook: ReturnType<typeof memoryLocation>["hook"]) {
  return (
    <Router hook={hook}>
      <OnboardingCoordinatorProvider>
        <OnboardingHost />
        <Sonda />
        <Rota />
        <Manual />
      </OnboardingCoordinatorProvider>
    </Router>
  );
}

function montar(path: string) {
  const { hook, navigate } = memoryLocation({ path });
  return { ...render(arvore(hook)), navigate, hook };
}

const sonda = () => screen.getByTestId("sonda").textContent;
const rota = () => screen.getByTestId("rota").textContent;
const overlay = () => document.querySelector(".bnt-onb");

/** Avanca o relogio falso drenando as promises pendentes a cada passo. */
async function avancar(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/** So resolve as promises pendentes, sem deixar o atraso vencer. */
const assentar = () => avancar(0);

/** Deixa o atraso de abertura vencer e o overlay montar. */
const abrir = () => avancar(DELAY_ABERTURA_MS + 50);

/** Deixa a animacao de saida terminar e o host desmontar o overlay. */
const fechar = () => avancar(SAIDA_MS + 50);

beforeEach(async () => {
  // Aquece o cache de modulos ANTES do relogio falso. O `lazy()` do motor e o
  // import dinamico dos steps sao carregamento de modulo, ou seja, I/O real:
  // relogio falso nao o adianta, e `advanceTimersByTimeAsync` so drena
  // microtask. Com os dois ja carregados, os `import()` do host resolvem de
  // cache e cabem numa microtask.
  await import("./OnboardingStories");
  await import("@/lib/onboarding/steps/home");
  await import("@/lib/onboarding/steps/cursos");

  vi.useFakeTimers();
  window.localStorage.clear();
  // Escopo de CARGA DE PAGINA: no navegador some no reload, aqui nao, entao os
  // casos herdariam o que o anterior encerrou.
  limparEncerrados();
  encerrarTour();
  updateMyProfile.mockReset();
  updateMyProfile.mockResolvedValue({});
  auth = { user: null, profile: null, profileStatus: "idle", loading: false };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("OnboardingHost: abertura", () => {
  it("abre na home para anonimo que nunca viu", async () => {
    montar("/");
    await abrir();
    expect(overlay()).not.toBeNull();
    expect(screen.getByText("Essa é a sua bússola pra tech")).toBeInstanceOf(
      HTMLElement,
    );
    expect(sonda()).toBe("onboarding:super-bloqueado");
  });

  it("nao abre em rota classificada como sem-onboarding", async () => {
    montar("/login");
    await abrir();
    expect(sonda()).toBe("free:super-ok");
    expect(overlay()).toBeNull();
  });

  it("nao abre em rota pendente", async () => {
    // /creators, e nao /cursos: cursos ganhou onboarding no Lote B. Rota usada
    // como "sem onboarding" precisa continuar sem ele, senao o teste passa a
    // medir outra coisa em silencio.
    montar("/creators");
    await abrir();
    expect(sonda()).toBe("free:super-ok");
    expect(overlay()).toBeNull();
  });

  it("nao abre para quem ja viu (localStorage)", async () => {
    window.localStorage.setItem(
      "bnt_onb:/",
      JSON.stringify({ seen: true, how: "pulado", at: "2026-08-01T00:00:00Z" }),
    );
    montar("/");
    await abrir();
    expect(sonda()).toBe("free:super-ok");
    expect(overlay()).toBeNull();
  });

  it("nao abre para quem ja viu (preferences do perfil)", async () => {
    auth = {
      user: { id: "u1" },
      profile: {
        id: "u1",
        preferences: {
          onboardings: {
            "/": { seen: true, how: "concluido", at: "2026-08-01T00:00:00Z" },
          },
        },
      } as unknown as Profile,
      profileStatus: "ready",
      loading: false,
    };
    montar("/");
    await abrir();
    expect(sonda()).toBe("free:super-ok");
    expect(overlay()).toBeNull();
  });

  it("nunca abre sob automacao (navigator.webdriver)", async () => {
    const original = Object.getOwnPropertyDescriptor(
      Navigator.prototype,
      "webdriver",
    );
    Object.defineProperty(navigator, "webdriver", {
      value: true,
      configurable: true,
    });
    try {
      montar("/");
      // A guarda decide ANTES de qualquer timer: o prerender nao pode depender
      // de o atraso vencer ou nao dentro da janela do puppeteer.
      await assentar();
      expect(sonda()).toBe("free:super-ok");
      await abrir();
      expect(overlay()).toBeNull();
    } finally {
      if (original)
        Object.defineProperty(Navigator.prototype, "webdriver", original);
      else
        Object.defineProperty(navigator, "webdriver", {
          value: false,
          configurable: true,
        });
    }
  });
});

describe("OnboardingHost: atraso de abertura", () => {
  it("nao aparece antes de DELAY_ABERTURA_MS, e a vez ja esta reservada", async () => {
    montar("/");
    await avancar(DELAY_ABERTURA_MS - 100);

    expect(overlay()).toBeNull();
    // A precedencia vale desde a DECISAO, nao desde o aparecimento: dentro
    // desta janela o SuperInterstitial ja esta bloqueado.
    expect(sonda()).toBe("onboarding:super-bloqueado");

    await avancar(200);
    expect(overlay()).not.toBeNull();
  });

  it("navegar DURANTE o atraso cancela a abertura", async () => {
    const { navigate } = montar("/");
    await avancar(DELAY_ABERTURA_MS - 100);
    expect(overlay()).toBeNull();

    act(() => navigate("/creators"));
    await avancar(DELAY_ABERTURA_MS * 2);

    // O timer foi limpo: o overlay nao aparece na rota nova nem depois.
    expect(overlay()).toBeNull();
    // Nada persistido: nao chegou a ser visto.
    expect(window.localStorage.getItem("bnt_onb:/")).toBeNull();
    // A reivindicacao continua STICKY pela carga, de proposito: cancelar a
    // abertura nao devolve a vez ao SuperInterstitial.
    expect(sonda()).toBe("onboarding:super-bloqueado");
  });

  it("cancelado no atraso, o onboarding volta a aparecer ao voltar para a rota", async () => {
    const { navigate } = montar("/");
    await avancar(DELAY_ABERTURA_MS - 100);
    act(() => navigate("/creators"));
    await assentar();

    act(() => navigate("/"));
    await abrir();
    expect(overlay()).not.toBeNull();
  });

  it("timer da visita anterior nao antecipa a abertura da visita nova", async () => {
    // Este e o caso que prova que o timer foi mesmo LIMPO, e nao apenas que o
    // overlay ficou fechado. Sem `limparTimers()` na troca de rota, o timer da
    // primeira visita sobrevive e dispara `setOpen(true)` no meio do ciclo
    // novo, que ja tem `def` carregado: o overlay abriria 150ms depois de
    // voltar, e nao 2500ms. A versao anterior deste teste so conferia que
    // "nao abriu" apos navegar para fora, o que passa mesmo com o timer vivo,
    // porque `def` esta nulo naquele instante.
    const { navigate } = montar("/");
    await avancar(DELAY_ABERTURA_MS - 100); // timer antigo a 100ms de vencer

    act(() => navigate("/creators"));
    await assentar();
    act(() => navigate("/")); // ciclo novo, atraso reiniciado do zero

    await avancar(150); // o timer ANTIGO venceria dentro desta janela
    expect(overlay()).toBeNull();

    await avancar(DELAY_ABERTURA_MS); // agora sim, o atraso do ciclo novo
    expect(overlay()).not.toBeNull();
  });
});

describe("OnboardingHost: scroll da pagina de baixo", () => {
  it("trava enquanto aberto e restaura o valor ANTERIOR ao fechar", async () => {
    // Valor previo nao vazio de proposito: restaurar para "" seria destruir um
    // lock de outro componente em vez de devolver o que estava.
    document.body.style.overflow = "clip";

    montar("/");
    await avancar(DELAY_ABERTURA_MS - 100);
    // Durante o atraso a pagina ainda rola: e justamente o tempo de ve-la.
    expect(document.body.style.overflow).toBe("clip");

    await avancar(200);
    expect(overlay()).not.toBeNull();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    await fechar();

    expect(overlay()).toBeNull();
    expect(document.body.style.overflow).toBe("clip");
    document.body.style.overflow = "";
  });

  it("restaura tambem quando a saida e por navegacao", async () => {
    const { navigate } = montar("/");
    await abrir();
    expect(document.body.style.overflow).toBe("hidden");

    act(() => navigate("/creators"));
    await assentar();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("OnboardingHost: navegacao com o overlay aberto", () => {
  it("sair no meio fecha SEM marcar como visto, e voltar reabre", async () => {
    const { navigate } = montar("/");
    await abrir();
    expect(overlay()).not.toBeNull();

    act(() => navigate("/creators"));
    await assentar();

    expect(overlay()).toBeNull();
    // Nada foi persistido: sair da pagina nao e uma decisao.
    expect(window.localStorage.getItem("bnt_onb:/")).toBeNull();
    expect(updateMyProfile).not.toHaveBeenCalled();

    act(() => navigate("/"));
    await abrir();
    expect(overlay()).not.toBeNull();
  });

  it("depois de ENCERRAR, voltar para a rota nao reabre", async () => {
    const { navigate } = montar("/");
    await abrir();

    fireEvent.keyDown(document, { key: "Escape" });
    await fechar();
    expect(overlay()).toBeNull();
    expect(window.localStorage.getItem("bnt_onb:/")).not.toBeNull();

    act(() => navigate("/creators"));
    act(() => navigate("/"));
    await abrir();
    expect(sonda()).toBe("onboarding:super-bloqueado");
    expect(overlay()).toBeNull();
  });
});

describe("OnboardingHost: espera o AuthContext resolver", () => {
  it("fica em 'deciding' enquanto o perfil do logado nao chegou", async () => {
    auth = {
      user: { id: "u1" },
      profile: null,
      profileStatus: "loading",
      loading: false,
    };
    const { rerender } = montar("/");

    // Ninguem abre nesta janela: nem o onboarding (nao sabe se a pessoa ja
    // viu), nem o SuperInterstitial (o coordenador ainda nao liberou).
    await abrir();
    expect(sonda()).toBe("deciding:super-bloqueado");
    expect(overlay()).toBeNull();

    auth = {
      user: { id: "u1" },
      profile: { id: "u1", preferences: {} } as unknown as Profile,
      profileStatus: "ready",
      loading: false,
    };
    const { hook } = memoryLocation({ path: "/" });
    rerender(arvore(hook));

    await abrir();
    expect(overlay()).not.toBeNull();
    expect(sonda()).toBe("onboarding:super-bloqueado");
  });

  it("perfil em erro tambem resolve: o overlay nao fica preso", async () => {
    auth = {
      user: { id: "u1" },
      profile: null,
      profileStatus: "error",
      loading: false,
    };
    montar("/");
    await abrir();
    expect(overlay()).not.toBeNull();
  });
});

describe("OnboardingHost: persistencia", () => {
  it("concluir grava o registro (anonimo -> localStorage) e fecha", async () => {
    montar("/");
    await abrir();

    const next = () =>
      document.querySelector<HTMLButtonElement>(".next") as HTMLButtonElement;
    for (let i = 0; i < 5; i += 1) fireEvent.click(next());
    fireEvent.click(next());
    await fechar();

    expect(overlay()).toBeNull();
    const raw = window.localStorage.getItem("bnt_onb:/");
    expect(raw).not.toBeNull();
    const record = JSON.parse(raw as string) as Record<string, unknown>;
    expect(record.seen).toBe(true);
    expect(record.how).toBe("concluido");
    expect(typeof record.at).toBe("string");
    expect(updateMyProfile).not.toHaveBeenCalled();
  });

  it("pular no logado grava em preferences via read-modify-write", async () => {
    auth = {
      user: { id: "u1" },
      profile: {
        id: "u1",
        preferences: { tema: "escuro" },
      } as unknown as Profile,
      profileStatus: "ready",
      loading: false,
    };
    montar("/");
    await abrir();

    fireEvent.click(
      document.querySelectorAll<HTMLButtonElement>(".side .ghost")[1],
    );
    await fechar();

    expect(updateMyProfile).toHaveBeenCalledTimes(1);
    const payload = updateMyProfile.mock.calls[0][0] as {
      preferences: Record<string, unknown>;
    };
    // O `tema` sobrevive: o PATCH sobrescreve `preferences` inteiro.
    expect(payload.preferences.tema).toBe("escuro");
    expect(payload.preferences.onboardings).toMatchObject({
      "/": { seen: true, how: "pulado" },
    });
  });
});

describe("OnboardingHost: botao do Pro (proCta)", () => {
  it("fecha, persiste como concluido e navega para /planos SEM sair da SPA", async () => {
    montar("/cursos");
    await abrir();
    expect(overlay()).not.toBeNull();

    // O passo com proCta e o ultimo do onboarding de cursos.
    const next = () =>
      document.querySelector<HTMLButtonElement>(".next") as HTMLButtonElement;
    while (!document.querySelector(".bnt-onb .procta")) fireEvent.click(next());

    const botao =
      document.querySelector<HTMLAnchorElement>(".bnt-onb .procta")!;
    // O href renderizado ja e a rota interna, e nao a URL absoluta do conteudo:
    // a normalizacao e do renderizador. Sem target=_blank, senao a SPA seria
    // recarregada numa aba nova.
    expect(botao.getAttribute("href")).toBe("/planos");
    expect(botao.hasAttribute("target")).toBe(false);

    fireEvent.click(botao, { button: 0 });
    await fechar();

    expect(rota()).toBe("/planos");
    expect(overlay()).toBeNull();
    const raw = window.localStorage.getItem("bnt_onb:/cursos");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toMatchObject({
      seen: true,
      how: "concluido",
    });
  });

  it("o conteudo continua guardando a URL absoluta do HTML de referencia", async () => {
    const cursos = (await import("@/lib/onboarding/steps/cursos")).default;
    const comProCta = cursos.steps.find((passo) => passo.proCta);
    expect(comProCta?.proCta?.[1]).toBe("https://www.boranatech.com.br/planos");
  });
});

describe("OnboardingHost: decidido continua decidido nesta carga", () => {
  // Bug de producao: a pessoa clica em Pular, continua na pagina, e o
  // onboarding aparece de novo.
  //
  // Causa: no logado a decisao vai para `profiles.preferences` por PATCH, e o
  // AuthContext NAO atualiza o perfil em memoria depois disso. Quem sabe que a
  // rota ja foi encerrada, no resto da carga, e so o registro em memoria do
  // host. Ele nascia por MONTAGEM, e o host remonta dentro da mesma carga
  // (medido com o ConsentGate real: voltar de /privacidade desmonta e remonta
  // os children do gate). Remontou, o registro nasce vazio, o perfil em maos
  // continua sem a chave, e o overlay reabre.
  it("pular no logado e remontar o host na mesma carga NAO reabre", async () => {
    auth = {
      user: { id: "u1" },
      profile: { id: "u1", preferences: {} } as unknown as Profile,
      profileStatus: "ready",
      loading: false,
    };
    const { unmount, hook } = montar("/");
    await abrir();
    expect(overlay()).not.toBeNull();

    fireEvent.click(
      document.querySelectorAll<HTMLButtonElement>(".side .ghost")[1],
    );
    await fechar();
    expect(overlay()).toBeNull();
    expect(updateMyProfile).toHaveBeenCalledTimes(1);

    // O PATCH foi aceito, mas o perfil em memoria continua o de antes: e essa
    // a janela que o registro da carga cobre.
    unmount();
    render(arvore(hook));
    await abrir();

    expect(overlay()).toBeNull();
  });

  it("outra sessao na mesma carga volta a receber o onboarding", async () => {
    auth = {
      user: { id: "u1" },
      profile: { id: "u1", preferences: {} } as unknown as Profile,
      profileStatus: "ready",
      loading: false,
    };
    const { unmount, hook } = montar("/");
    await abrir();
    fireEvent.click(
      document.querySelectorAll<HTMLButtonElement>(".side .ghost")[1],
    );
    await fechar();

    // Sair e entrar com outra conta sem recarregar a pagina: o que a primeira
    // pessoa decidiu nao vale para a segunda.
    unmount();
    auth = {
      user: { id: "u2" },
      profile: { id: "u2", preferences: {} } as unknown as Profile,
      profileStatus: "ready",
      loading: false,
    };
    render(arvore(hook));
    await abrir();

    expect(overlay()).not.toBeNull();
  });

  it("refresh do perfil NAO fecha nem reinicia o overlay aberto", async () => {
    auth = {
      user: { id: "u1" },
      profile: { id: "u1", preferences: {} } as unknown as Profile,
      profileStatus: "ready",
      loading: false,
    };
    const { rerender, hook } = montar("/");
    await abrir();
    expect(overlay()).not.toBeNull();

    const next = () =>
      document.querySelector<HTMLButtonElement>(".next") as HTMLButtonElement;
    fireEvent.click(next());
    fireEvent.click(next());
    expect(document.querySelector(".counter")?.textContent).toBe("3/6");

    // TOKEN_REFRESHED: o AuthContext refaz o fetch e troca o objeto do perfil.
    // A decisao por rota nao pode reagir a isso, senao o overlay aberto some e
    // volta do primeiro card no meio da leitura.
    auth = {
      ...auth,
      profile: { id: "u1", preferences: {} } as unknown as Profile,
    };
    rerender(arvore(hook));
    await assentar();

    expect(overlay()).not.toBeNull();
    expect(document.querySelector(".counter")?.textContent).toBe("3/6");
  });
});

describe("OnboardingHost: abertura manual pelo botao do Header", () => {
  const pedirGuia = () => fireEvent.click(screen.getByTestId("pedir-guia"));
  const estadoDoBotao = () =>
    screen.getByTestId("pedir-guia").textContent as string;

  it("abre na hora, ignorando o 'ja visto' e sem esperar o atraso", async () => {
    window.localStorage.setItem(
      "bnt_onb:/",
      JSON.stringify({ seen: true, how: "pulado", at: "2026-08-01T00:00:00Z" }),
    );
    montar("/");
    await abrir();
    // Nada abriu sozinho, e a vez ja foi devolvida ao SuperInterstitial.
    expect(overlay()).toBeNull();
    expect(sonda()).toBe("free:super-ok");

    pedirGuia();
    // Sem DELAY_ABERTURA_MS: o unico tempo aqui e o do import dos passos.
    await assentar();
    expect(overlay()).not.toBeNull();
    expect(estadoDoBotao()).toBe("aberto");
    // Ocupando a tela, o SuperInterstitial nao entra por cima.
    expect(sonda()).toBe("onboarding:super-bloqueado");
  });

  it("nao inicia tour nem navega, mesmo escolhendo 'me mostra cada aba'", async () => {
    montar("/");
    pedirGuia();
    await assentar();
    expect(overlay()).not.toBeNull();

    const next = () =>
      document.querySelector<HTMLButtonElement>(".next") as HTMLButtonElement;
    for (let i = 0; i < 4; i += 1) fireEvent.click(next());
    fireEvent.click(screen.getByRole("radio", { name: /Me mostra cada aba/ }));
    await avancar(400);

    // O botao final e o cta do conteudo, nao a proxima parada de um tour.
    expect(next().textContent).toBe("Explorar a plataforma →");
    fireEvent.click(next());
    await fechar();

    expect(tourAtivo()).toBe(false);
    expect(rota()).toBe("/");
    expect(overlay()).toBeNull();
    expect(estadoDoBotao()).toBe("fechado");
    // Fechar pela reabertura manual regrava o registro, o que e inofensivo.
    expect(window.localStorage.getItem("bnt_onb:/")).not.toBeNull();
  });

  it("navegar com o overlay manual aberto fecha sem marcar", async () => {
    const { navigate } = montar("/cursos");
    pedirGuia();
    await assentar();
    expect(overlay()).not.toBeNull();

    act(() => navigate("/creators"));
    await assentar();
    expect(overlay()).toBeNull();
    expect(estadoDoBotao()).toBe("fechado");
    expect(window.localStorage.getItem("bnt_onb:/cursos")).toBeNull();
  });

  it("remontar SO o host com um pedido ja atendido nao reabre", async () => {
    // O contador vive no provider, que e PAI do host. Hoje o remount conhecido
    // (o ConsentGate) derruba os dois juntos e zera o contador, mas o host nao
    // pode depender disso: se ele sozinho remontar, o pedido velho continua la
    // e seria republicado como se fosse novo.
    //
    // Ja visto, para o unico caminho capaz de abrir aqui ser o do pedido.
    window.localStorage.setItem(
      "bnt_onb:/cursos",
      JSON.stringify({ seen: true, how: "pulado", at: "2026-08-01T00:00:00Z" }),
    );
    const { hook } = memoryLocation({ path: "/cursos" });
    render(
      <Router hook={hook}>
        <OnboardingCoordinatorProvider>
          <HostRemontavel />
          <Sonda />
          <Rota />
          <Manual />
        </OnboardingCoordinatorProvider>
      </Router>,
    );

    pedirGuia();
    await assentar();
    expect(overlay()).not.toBeNull();

    const alternar = () => fireEvent.click(screen.getByTestId("alternar-host"));
    alternar();
    await assentar();
    expect(overlay()).toBeNull();
    alternar();
    await abrir();

    expect(overlay()).toBeNull();
  });

  it("pedido em rota sem onboarding nao abre nada", async () => {
    montar("/login");
    pedirGuia();
    await abrir();
    expect(overlay()).toBeNull();
  });
});

describe("coordenacao com o SuperInterstitial", () => {
  it("o default sem provider e permissivo", () => {
    render(<Sonda />);
    expect(sonda()).toBe("free:super-ok");
  });

  it("reivindicado na home, o super continua bloqueado depois de fechar", async () => {
    montar("/");
    await abrir();

    fireEvent.keyDown(document, { key: "Escape" });
    await fechar();
    expect(overlay()).toBeNull();

    // A reivindicacao vale para a CARGA inteira: fechar o onboarding nao
    // devolve a vez ao SuperInterstitial nesta mesma sessao de pagina.
    expect(sonda()).toBe("onboarding:super-bloqueado");
  });
});
