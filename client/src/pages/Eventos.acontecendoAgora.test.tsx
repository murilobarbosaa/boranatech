import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";

/**
 * REGRAS DA SECAO "Acontecendo agora", travadas na PAGINA.
 *
 * As tres regras que este arquivo existe para segurar quebram em silencio numa
 * refatoracao do `useMemo` de grupos, e nenhuma delas aparece como erro: o
 * evento simplesmente muda de lugar, ou aparece duas vezes, e a pagina continua
 * renderizando.
 *
 *   1. evento em andamento sai dos grupos de mes (nao pode ser listado duas
 *      vezes na mesma tela);
 *   2. dentro da secao, ordena por `fim` ascendente (quem termina antes vem
 *      antes, porque e o que a pessoa esta prestes a perder);
 *   3. evento que COMECA hoje nao entra na secao, e sim no grupo do mes.
 *
 * Nenhuma expectativa e derivada de helper da pagina: as datas do mock e a data
 * de "hoje" sao literais absolutas, escritas a mao, coerentes com o relogio
 * congelado no `beforeEach`.
 */

// Meio-dia UTC de proposito: a pagina calcula "hoje" no fuso do NAVEGADOR, e as
// 12h UTC caem no mesmo dia do calendario em qualquer fuso entre UTC-11 e
// UTC+11. Isso cobre a maquina local (America/Sao_Paulo, UTC-3) e o CI (UTC),
// entao a data local do teste e "2026-09-15" nos dois, sem borda.
const HOJE = "2026-09-15";
const RELOGIO = new Date("2026-09-15T12:00:00Z");

type EventoDeTeste = {
  id: string;
  nome: string;
  inicio: string | null;
  fim: string | null;
};

/** Evento completo a partir do minimo que importa para estes testes. */
function evento({ id, nome, inicio, fim }: EventoDeTeste) {
  return {
    id,
    uuid: `uuid-${id}`,
    nome,
    descricao: `Descricao de ${nome}`,
    organizador: "Organizador",
    categoria: "Conferencia",
    link: `https://exemplo.dev/${id}`,
    calendarUrl: null,
    // URL nao vazia de proposito: `logoUrl` vazio faz o React avisar sobre
    // src="" no relatorio da suite, e ruido de teste esconde falha de verdade.
    logoUrl: "https://exemplo.dev/favicon.png",
    precoTipo: "gratuito",
    valor: "Gratuito",
    inicio,
    fim,
    dataLabel: "",
    horario: "",
    recorrente: false,
    formato: "Presencial",
    cidade: "Sao Paulo",
    uf: "SP",
    estadoLabel: "Sao Paulo",
    local: "Centro de convencoes",
  };
}

const servicoState = vi.hoisted(() => ({
  eventos: [] as unknown[],
}));

vi.mock("@/services/eventosService", () => ({
  getEventos: async () => ({
    eventos: servicoState.eventos,
    total: servicoState.eventos.length,
  }),
}));

// Layout puxaria Header e Footer, e com eles os contexts de auth, tema e
// notificacoes. Nada disso participa das regras que este arquivo mede.
vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/SEO", () => ({ default: () => null }));
vi.mock("@/components/FavoriteButton", () => ({ default: () => null }));
vi.mock("wouter", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import Eventos from "./Eventos";

/** A `<section>` que tem o heading dado. */
function secaoDoHeading(nome: string): HTMLElement {
  const heading = screen.getByRole("heading", { name: nome });
  const secao = heading.closest("section");
  if (!secao) throw new Error(`heading "${nome}" nao esta dentro de <section>`);
  return secao;
}

/**
 * Renderiza e espera os cards chegarem.
 *
 * A pagina busca os eventos num efeito, entao o primeiro render nao tem card
 * nenhum. A espera e pelo nome de UM evento do mock, e nao por "sumiu o
 * carregando": a pagina tem um `<h3>` fixo na dica do rodape, entao "existe
 * algum h3" ficaria verde antes de qualquer evento aparecer.
 */
async function renderizarCom(
  eventos: Array<{ nome: string }>,
  ...resto: unknown[]
) {
  void resto;
  servicoState.eventos = eventos;
  render(<Eventos />);
  // `getAllByRole` e nao `getByRole`: a espera nao pode ser quem detecta
  // duplicata. Com a versao singular, um evento listado duas vezes fazia ESTE
  // helper lancar "found multiple elements", e o teste de ORDEM falhava aqui,
  // antes de chegar na sua propria assercao. Cada caso tem que falhar pelo
  // motivo que o nome dele promete; a duplicata e afirmada no caso proprio.
  await waitFor(() => {
    expect(
      screen.getAllByRole("heading", { name: eventos[0].nome }).length,
    ).toBeGreaterThan(0);
  });
}

describe('Eventos: secao "Acontecendo agora"', () => {
  beforeEach(() => {
    // `toFake: ["Date"]` e nao fake timers completo: com setTimeout falso, o
    // `waitFor` do testing-library nunca avanca e a espera pelo card estoura.
    // So o relogio precisa ser congelado aqui.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(RELOGIO);
    servicoState.eventos = [];
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("o relogio congelado produz a data local literal esperada", () => {
    // Guarda do proprio harness: se o ambiente de teste rodar num fuso extremo,
    // as datas literais dos casos abaixo deixariam de significar o que dizem, e
    // os testes falhariam por um motivo que nao e o codigo da pagina.
    expect(new Intl.DateTimeFormat("en-CA").format(new Date())).toBe(HOJE);
  });

  it("evento em andamento aparece na secao e NAO no grupo do mes de inicio", async () => {
    await renderizarCom([
      // Comecou em 10/09, termina em 20/09: em andamento em 15/09.
      evento({
        id: "congresso",
        nome: "Congresso Em Andamento",
        inicio: "2026-09-10",
        fim: "2026-09-20",
      }),
      // Serve para o grupo "Setembro de 2026" existir de qualquer forma.
      evento({
        id: "futuro",
        nome: "Evento Futuro De Setembro",
        inicio: "2026-09-28",
        fim: "2026-09-28",
      }),
    ]);

    const secao = secaoDoHeading("Acontecendo agora");
    expect(
      within(secao).getByRole("heading", { name: "Congresso Em Andamento" }),
    ).toBeTruthy();

    const setembro = secaoDoHeading("Setembro de 2026");
    expect(
      within(setembro).queryByRole("heading", {
        name: "Congresso Em Andamento",
      }),
    ).toBeNull();

    // A outra metade da regra: uma vez na pagina inteira, nao duas.
    expect(
      screen.getAllByRole("heading", { name: "Congresso Em Andamento" }),
    ).toHaveLength(1);
  });

  it("dentro da secao, o que termina primeiro vem primeiro", async () => {
    await renderizarCom([
      // Ordem de entrada PROPOSITALMENTE invertida em relacao a esperada: se a
      // ordenacao sumir, o DOM sai na ordem do array e o teste quebra.
      evento({
        id: "hackathon-longo",
        nome: "Hackathon Ate Outubro",
        inicio: "2026-09-01",
        fim: "2026-10-31",
      }),
      evento({
        id: "congresso-curto",
        nome: "Congresso Ate Amanha",
        inicio: "2026-09-10",
        fim: "2026-09-16",
      }),
    ]);

    const secao = secaoDoHeading("Acontecendo agora");
    const titulos = within(secao)
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(titulos).toEqual(["Congresso Ate Amanha", "Hackathon Ate Outubro"]);
  });

  it("evento que COMECA hoje fica fora da secao, no grupo do mes", async () => {
    await renderizarCom([
      evento({
        id: "estreia",
        nome: "Estreia De Hoje",
        inicio: HOJE,
        fim: "2026-09-16",
      }),
      evento({
        id: "andamento",
        nome: "Ja Rolando",
        inicio: "2026-09-12",
        fim: "2026-09-18",
      }),
    ]);

    const secao = secaoDoHeading("Acontecendo agora");
    expect(
      within(secao).queryByRole("heading", { name: "Estreia De Hoje" }),
    ).toBeNull();

    const setembro = secaoDoHeading("Setembro de 2026");
    expect(
      within(setembro).getByRole("heading", { name: "Estreia De Hoje" }),
    ).toBeTruthy();
  });

  it("sem nenhum evento em andamento, o heading da secao nao existe", async () => {
    await renderizarCom([
      evento({
        id: "futuro",
        nome: "So Evento Futuro",
        inicio: "2026-09-28",
        fim: "2026-09-29",
      }),
    ]);

    expect(
      screen.queryByRole("heading", { name: "Acontecendo agora" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "So Evento Futuro" }),
    ).toBeTruthy();
  });
});
