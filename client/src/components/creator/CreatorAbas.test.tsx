import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * CreatorAbas: a faixa do topo do /creator (lote 08b), que troca de aba e diz o
 * que falta preencher.
 *
 * A asserção que se repete e sobre o `null`: enquanto o perfil nao respondeu,
 * a faixa NAO acusa pendencia nenhuma. Ela ocupa o lugar do antigo aviso
 * tracejado de chave Pix, e acusar "falta" sobre um perfil que ainda nao
 * chegou manda a pessoa conferir um cadastro que talvez ja esteja feito.
 */

import { CreatorAbas } from "./CreatorAbas";
import {
  ABAS_POR_KIND,
  idDaAba,
  idDoPainel,
  type CreatorAba,
} from "./creatorAbas";

function desenhar(
  aba: CreatorAba,
  temRedes: boolean | null,
  temPix: boolean | null,
) {
  const onAba = vi.fn();
  render(
    <CreatorAbas aba={aba} onAba={onAba} temRedes={temRedes} temPix={temPix} />,
  );
  return onAba;
}

afterEach(() => {
  cleanup();
});

describe("CreatorAbas: as quatro abas", () => {
  it("a ativa e a unica com aria-selected, e cada uma aponta o seu painel", () => {
    desenhar("calendario", true, true);
    const numeros = screen.getByTestId(idDaAba("numeros"));
    const calendario = screen.getByTestId(idDaAba("calendario"));
    const ranking = screen.getByTestId(idDaAba("ranking"));
    const perfil = screen.getByTestId(idDaAba("perfil"));
    expect(calendario.getAttribute("aria-selected")).toBe("true");
    expect(numeros.getAttribute("aria-selected")).toBe("false");
    expect(ranking.getAttribute("aria-selected")).toBe("false");
    expect(perfil.getAttribute("aria-selected")).toBe("false");
    expect(calendario.getAttribute("aria-controls")).toBe(
      idDoPainel("calendario"),
    );
    // Lote 10d: a aba chama Calendário.
    expect(calendario.textContent).toContain("Calendário");
    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(4);
  });

  it("no celular (lote 11m) a faixa rola com snap e sem barra; o sm: quebra linha", () => {
    desenhar("perfil", true, true);
    const lista = screen.getByTestId("creator-abas-lista");
    const c = (lista.getAttribute("class") ?? "").split(" ");
    for (const k of [
      "overflow-x-auto",
      "snap-x",
      "snap-mandatory",
      "[scrollbar-width:none]",
      "[&::-webkit-scrollbar]:hidden",
      "sm:snap-none",
      "sm:flex-wrap",
      "sm:overflow-visible",
    ]) {
      expect(c, k).toContain(k);
    }
    for (const aba of screen.getAllByRole("tab")) {
      expect((aba.getAttribute("class") ?? "").split(" ")).toContain(
        "snap-start",
      );
    }
  });

  it("trocar de aba rola a faixa ate a ativa, so na horizontal (lote 11m)", () => {
    const onAba = vi.fn();
    const { rerender } = render(
      <CreatorAbas aba="numeros" onAba={onAba} temRedes temPix />,
    );
    const lista = screen.getByTestId("creator-abas-lista");
    // O jsdom nao faz layout: a faixa finge transbordar e a aba ativa finge
    // estar fora da vista, a direita.
    Object.defineProperty(lista, "scrollWidth", { value: 500 });
    Object.defineProperty(lista, "clientWidth", { value: 300 });
    lista.getBoundingClientRect = () => ({ left: 0, width: 300 }) as DOMRect;
    const perfil = screen.getByTestId(idDaAba("perfil"));
    perfil.getBoundingClientRect = () => ({ left: 400, width: 80 }) as DOMRect;
    const rolar = vi.fn();
    lista.scrollTo = rolar as unknown as typeof lista.scrollTo;
    rerender(<CreatorAbas aba="perfil" onAba={onAba} temRedes temPix />);
    // 0 + (400 - 0) - (300 - 80) / 2 = 290: a aba no meio da faixa.
    expect(rolar).toHaveBeenCalledWith({ left: 290, behavior: "smooth" });
  });

  it("a ordem na faixa e Numeros, Calendario, Ranking e Perfil", () => {
    // O Ranking entra ENTRE Calendario e Perfil (lote 09): a ordem e a da
    // lista em creatorAbas.ts, e este teste e o que trava isso.
    desenhar("numeros", true, true);
    expect(
      screen.getAllByRole("tab").map((b) => b.getAttribute("data-testid")),
    ).toEqual([
      idDaAba("numeros"),
      idDaAba("calendario"),
      idDaAba("ranking"),
      idDaAba("perfil"),
    ]);
  });

  it("com a lista do influencer (lote 11b), o Ranking nao e desenhado", () => {
    render(
      <CreatorAbas
        aba="numeros"
        abas={ABAS_POR_KIND.influencer}
        onAba={vi.fn()}
        temRedes={true}
        temPix={true}
      />,
    );
    expect(
      screen.getAllByRole("tab").map((b) => b.getAttribute("data-testid")),
    ).toEqual([idDaAba("numeros"), idDaAba("calendario"), idDaAba("perfil")]);
  });

  it("clicar numa aba avisa qual foi, sem decidir nada sozinha", () => {
    const onAba = desenhar("numeros", true, true);
    fireEvent.click(screen.getByTestId(idDaAba("perfil")));
    expect(onAba).toHaveBeenCalledWith("perfil");
  });
});

describe("CreatorAbas: pendencias", () => {
  it("perfil ainda sem resposta: nenhum chip e nenhum contador", () => {
    desenhar("numeros", null, null);
    expect(screen.queryByTestId("creator-pendencias")).toBeNull();
    expect(screen.queryByTestId("creator-aba-perfil-pendencias")).toBeNull();
  });

  it("tudo preenchido: tambem nao ha chip", () => {
    desenhar("numeros", true, true);
    expect(screen.queryByTestId("creator-pendencias")).toBeNull();
    expect(screen.queryByTestId("creator-aba-perfil-pendencias")).toBeNull();
  });

  it("sem chave Pix: um chip, e o contador 1 na aba Perfil", () => {
    desenhar("numeros", true, false);
    expect(screen.getByTestId("creator-pendencia-pix").textContent).toBe(
      "Falta a chave Pix",
    );
    expect(screen.queryByTestId("creator-pendencia-redes")).toBeNull();
    expect(
      screen.getByTestId("creator-aba-perfil-pendencias").textContent,
    ).toBe("1");
  });

  it("sem redes: o chip das redes", () => {
    desenhar("numeros", false, true);
    expect(screen.getByTestId("creator-pendencia-redes").textContent).toBe(
      "Cadastre suas redes",
    );
    expect(screen.queryByTestId("creator-pendencia-pix")).toBeNull();
  });

  it("faltando as duas: contador 2, e as redes vem antes do Pix", () => {
    desenhar("numeros", false, false);
    expect(
      screen.getByTestId("creator-aba-perfil-pendencias").textContent,
    ).toBe("2");
    const chips = screen.getByTestId("creator-pendencias");
    const redes = screen.getByTestId("creator-pendencia-redes");
    const pix = screen.getByTestId("creator-pendencia-pix");
    expect(chips.contains(redes) && chips.contains(pix)).toBe(true);
    expect(
      redes.compareDocumentPosition(pix) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("clicar no chip leva para a aba Perfil", () => {
    const onAba = desenhar("numeros", false, false);
    fireEvent.click(screen.getByTestId("creator-pendencia-pix"));
    expect(onAba).toHaveBeenCalledWith("perfil");
    fireEvent.click(screen.getByTestId("creator-pendencia-redes"));
    expect(onAba).toHaveBeenLastCalledWith("perfil");
  });
});
