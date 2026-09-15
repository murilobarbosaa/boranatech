import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

/**
 * PELE DO /creator POR VARIAVEIS, e o admin intocado.
 *
 * O painel e o mesmo componente nas duas telas. A pele escura mora nas
 * variaveis `--creator-*` que so o wrapper do /creator define
 * (`.bnt-creator-pele`, no index.css); o view e o tile as leem com fallback
 * para o valor de antes. O que se prova aqui:
 *
 *   1. fora do wrapper nenhuma variavel da pele existe (o admin cai no
 *      fallback), e dentro todas existem;
 *   2. o conjunto de variaveis LIDAS e o conjunto DEFINIDO sao o mesmo, nos
 *      dois sentidos: uma lida sem definicao renderizaria o fallback claro no
 *      /creator sem erro nenhum, e uma definida sem leitura e pele morta;
 *   3. cada fallback e o valor que o elemento tinha antes (o card-brutal, o
 *      bg-white, as bordas e sombras dos tiles e do botao);
 *   4. os tokens do fundo e da pele NAO invertem entre os temas: a pagina e
 *      escura nos dois, e um token que inverte mudaria a pele junto com o site.
 *
 * O jsdom nao resolve var() em valor computado (conformidadeDeTema.test.ts
 * mediu isso), entao a prova e sobre as custom properties e o texto das
 * regras, nao sobre a cor pintada.
 */

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);

vi.mock("@/components/UserAvatar", () => ({
  default: () => <span data-testid="avatar" />,
}));

import type { CreatorDashboard } from "@shared/creatorDashboard";
import { CreatorDashboardView } from "./CreatorDashboardView";

const RAIZ = process.cwd();

function fonte(caminho: string): string {
  return readFileSync(resolve(RAIZ, caminho), "utf8");
}

const CSS = fonte("client/src/index.css");

/** As variaveis da pele, afirmadas como TOTAL. */
const VARIAVEIS_DA_PELE = [
  "--creator-bar-base",
  "--creator-button-bg",
  "--creator-button-border",
  "--creator-button-shadow",
  "--creator-button-text",
  "--creator-card-bg",
  "--creator-card-blur",
  "--creator-card-border",
  "--creator-card-border-width",
  "--creator-card-lift",
  "--creator-card-press",
  "--creator-card-ring",
  "--creator-card-shadow",
  "--creator-chart-grid",
  "--creator-inset-bg",
  "--creator-inset-border",
];

/** Blocos `.bnt-creator-pele { ... }` do index.css (o base e o do md). */
function blocosDaPele(): string {
  const blocos = CSS.match(/\.bnt-creator-pele \{[^}]*\}/g) ?? [];
  expect(blocos.length, "blocos .bnt-creator-pele no index.css").toBe(2);
  return blocos.join("\n");
}

function nomes(texto: string, padrao: RegExp): string[] {
  const achados = new Set<string>();
  padrao.lastIndex = 0;
  let hit = padrao.exec(texto);
  while (hit !== null) {
    achados.add(hit[1]);
    hit = padrao.exec(texto);
  }
  return Array.from(achados).sort();
}

const ZERO = {
  clicks: 0,
  checkouts: 0,
  sales: 0,
  revenue_cents: 0,
  commission_cents: 0,
};

function painel(): CreatorDashboard {
  return {
    creator: {
      kind: "afiliado",
      granted_at: "2026-09-01T12:00:00Z",
      revoked_at: null,
    },
    perfil: { name: "Ana Creator", handle: "anacreator", avatar_url: null },
    janela: "7d",
    totais: {
      clicks: 10,
      sales: 1,
      revenue_cents: 2093,
      commission_due_cents: 628,
      commission_paid_cents: 0,
      conversao_pct: 10,
    },
    codigos: [
      {
        id: "a1",
        code: "ANA30",
        status: "active",
        discount_percent: 10,
        commission_percent: 30,
        link: "https://boranatech.com.br/planos?ref=ANA30",
        clicks: 10,
        sales: 1,
        revenue_cents: 2093,
        commission_due_cents: 628,
        commission_paid_cents: 0,
        created_at: "2026-09-01T12:00:00Z",
      },
    ],
    eventos: {
      clicks_since: "2026-09-14T05:10:00Z",
      sales_since: "2026-09-15T18:00:00Z",
      events_since: "2026-09-14T05:10:00Z",
      serie: [
        { dia: "2026-09-18", ...ZERO, clicks: 4 },
        { dia: "2026-09-19", ...ZERO, clicks: 6, sales: 1 },
        { dia: "2026-09-20", ...ZERO },
      ],
      periodo: { ...ZERO, clicks: 10, sales: 1, revenue_cents: 2093 },
      periodo_anterior: null,
      ultimo_click_at: "2026-09-19T12:00:00Z",
      ultima_venda_at: "2026-09-19T12:00:00Z",
    },
  };
}

let estilo: HTMLStyleElement;

beforeAll(() => {
  estilo = document.createElement("style");
  estilo.textContent = CSS;
  document.head.appendChild(estilo);
});

afterAll(() => {
  estilo.remove();
});

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
});

function desenharForaDoWrapper() {
  render(
    <div data-testid="fora">
      <CreatorDashboardView
        painel={painel()}
        janela="7d"
        onJanelaChange={() => {}}
        visao="admin"
      />
    </div>,
  );
}

describe("pele do /creator: as variaveis", () => {
  it("fora do wrapper nenhuma variavel da pele existe; dentro, todas", () => {
    desenharForaDoWrapper();
    render(<div data-testid="dentro" className="dark bnt-creator-pele" />);
    const fora = getComputedStyle(screen.getByTestId("fora"));
    const dentro = getComputedStyle(screen.getByTestId("dentro"));
    for (const nome of VARIAVEIS_DA_PELE.filter(
      (n) => n !== "--creator-card-blur",
    )) {
      expect(fora.getPropertyValue(nome), `${nome} fora`).toBe("");
      expect(dentro.getPropertyValue(nome).trim(), `${nome} dentro`).not.toBe(
        "",
      );
    }
  });

  it("o desfoque de fundo so e definido do md para cima", () => {
    const blocos = CSS.match(/\.bnt-creator-pele \{[^}]*\}/g) ?? [];
    expect(blocos).toHaveLength(2);
    expect(blocos[0]).not.toContain("--creator-card-blur");
    expect(blocos[1]).toContain("--creator-card-blur: blur(16px);");
    expect(CSS).toMatch(
      /@media \(min-width: 48rem\) \{\s*\.bnt-creator-pele \{[^}]*--creator-card-blur/,
    );
  });

  it("lidas e definidas sao o mesmo conjunto, nos dois sentidos", () => {
    const definidas = nomes(blocosDaPele(), /(--creator-[a-z-]+):/g);
    const lidas = nomes(
      [
        fonte("client/src/components/creator/CreatorDashboardView.tsx"),
        fonte("client/src/components/creator/CreatorMetricTile.tsx"),
        CSS.replace(/\.bnt-creator-pele \{[^}]*\}/g, ""),
      ].join("\n"),
      /var\((--creator-[a-z-]+)/g,
    );
    expect(definidas).toEqual(VARIAVEIS_DA_PELE);
    expect(lidas).toEqual(VARIAVEIS_DA_PELE);
  });
});

describe("pele do /creator: o fallback e o valor de antes", () => {
  it("o index.css le cada variavel com o valor do card-brutal e do bg-white", () => {
    const pares: Array<[string, string]> = [
      [
        "border: 2px solid var(--bnt-ink);",
        "border-width: var(--creator-card-border-width, 2px);",
      ],
      [
        "border: 2px solid var(--bnt-ink);",
        "border-color: var(--creator-card-border, var(--bnt-ink));",
      ],
      [
        "box-shadow: 4px 4px 0 var(--bnt-shadow);",
        "box-shadow: var(--creator-card-shadow, 4px 4px 0 var(--bnt-shadow));",
      ],
      [
        "transform: translate(-2px, -2px);",
        "transform: var(--creator-card-lift, translate(-2px, -2px));",
      ],
      [
        "box-shadow: 6px 6px 0 var(--bnt-shadow);",
        "box-shadow: var(--creator-card-shadow, 6px 6px 0 var(--bnt-shadow));",
      ],
      [
        "transform: translate(1px, 1px) scale(0.99);",
        "transform: var(--creator-card-press, translate(1px, 1px) scale(0.99));",
      ],
      [
        "box-shadow: 2px 2px 0 var(--bnt-shadow);",
        "box-shadow: var(--creator-card-shadow, 2px 2px 0 var(--bnt-shadow));",
      ],
    ];
    const cardBrutal = CSS.slice(
      CSS.indexOf("  .card-brutal {"),
      CSS.indexOf("  .bnt-creator-cartao {"),
    );
    for (const [original, pele] of pares) {
      expect(cardBrutal, "card-brutal").toContain(original);
      expect(CSS, "regra da pele").toContain(pele);
    }
    expect(CSS).toContain(
      "background-color: var(--creator-card-bg, var(--color-white));",
    );
    expect(CSS).toContain("backdrop-filter: var(--creator-card-blur, none);");
    expect(CSS).toContain("background: var(--creator-card-ring, none);");
  });

  it("fora do wrapper, cartoes, tiles, blocos e botao usam a pele com o fallback de antes", () => {
    desenharForaDoWrapper();

    const cartoes = [
      screen.getByText("Ana Creator").closest("section"),
      screen.getByTestId("creator-codigo-ANA30"),
      screen.getByTestId("creator-serie").closest("section"),
    ];
    for (const cartao of cartoes) {
      expect(cartao).not.toBeNull();
      const classes = cartao?.className ?? "";
      expect(classes).toContain("card-brutal");
      expect(classes).toContain("bnt-creator-cartao");
      expect(classes).toContain("bnt-creator-anel");
      expect(classes).not.toContain("bg-white");
    }

    const tile = screen.getByTestId("creator-tile-cliques").className;
    expect(tile).toContain("bnt-creator-cartao");
    expect(tile).toContain(
      "border-[length:var(--creator-card-border-width,2px)]",
    );
    expect(tile).toContain(
      "border-[color:var(--creator-card-border,var(--color-slate-900))]",
    );
    expect(tile).toContain(
      "[box-shadow:var(--creator-card-shadow,3px_3px_0_var(--bnt-shadow))]",
    );

    const botao = screen.getByRole("button", { name: "Copiar" }).className;
    expect(botao).toContain(
      "border-[color:var(--creator-button-border,var(--color-slate-900))]",
    );
    expect(botao).toContain("bg-[var(--creator-button-bg,var(--color-white))]");
    expect(botao).toContain(
      "text-[color:var(--creator-button-text,var(--color-slate-900))]",
    );
    expect(botao).toContain(
      "[box-shadow:var(--creator-button-shadow,2px_2px_0_var(--bnt-shadow))]",
    );

    const periodo = screen.getByTestId("creator-periodo").firstElementChild;
    expect(periodo?.className).toContain(
      "bg-[var(--creator-inset-bg,var(--color-slate-50))]",
    );
    expect(periodo?.className).toContain(
      "border-[color:var(--creator-inset-border,var(--color-slate-200))]",
    );
  });
});

describe("pele e fundo do /creator: tokens que nao invertem", () => {
  /** oklch(L C H) com L em fracao ou em %, normalizado para fracao. */
  function oklch(valor: string): [number, number, number] | null {
    const m = /oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)/.exec(valor);
    if (!m) return null;
    const l = Number(m[1]) / (m[2] === "%" ? 100 : 1);
    return [l, Number(m[3]), Number(m[4])];
  }

  const DO_INDEX = [
    "--bnt-ink-on-accent",
    "--brand-yellow",
    "--brand-yellow-soft",
  ];
  const DA_PALETA = ["--color-teal-400", "--color-violet-500"];

  it("os tokens usados pelo fundo e pela pele sao exatamente estes", () => {
    const usados = nomes(
      [
        fonte("client/src/components/creator/CreatorBackground.tsx"),
        blocosDaPele(),
      ].join("\n"),
      /var\((--(?!creator-)[a-z0-9-]+)/g,
    );
    expect(usados).toEqual([...DO_INDEX, ...DA_PALETA].sort());
  });

  it("os tokens do index.css tem o mesmo valor no claro e no escuro", () => {
    for (const token of DO_INDEX) {
      const claro = getComputedStyle(document.documentElement)
        .getPropertyValue(token)
        .trim();
      expect(claro, `${token} no :root`).not.toBe("");
      document.documentElement.classList.add("dark");
      const escuro = getComputedStyle(document.documentElement)
        .getPropertyValue(token)
        .trim();
      document.documentElement.classList.remove("dark");
      expect(escuro, token).toBe(claro);
    }
  });

  it("as cores da paleta tem o mesmo valor no tema do Tailwind e no .dark gerado", () => {
    const tema = fonte("node_modules/tailwindcss/theme.css");
    const inicioDoGerado = CSS.indexOf(
      "GERADO por scripts/gen-dark-palette.py",
    );
    expect(inicioDoGerado).toBeGreaterThan(-1);
    const gerado = CSS.slice(inicioDoGerado);
    for (const token of DA_PALETA) {
      const padrao = new RegExp(`${token}:\\s*(oklch\\([^)]*\\))`);
      const claro = oklch(padrao.exec(tema)?.[1] ?? "");
      const escuro = oklch(padrao.exec(gerado)?.[1] ?? "");
      expect(claro, `${token} no theme.css`).not.toBeNull();
      expect(escuro, `${token} no .dark`).not.toBeNull();
      claro?.forEach((parte, i) => {
        expect(
          Math.abs(parte - (escuro?.[i] ?? Number.NaN)),
          token,
        ).toBeLessThan(0.001);
      });
    }
  });
});
