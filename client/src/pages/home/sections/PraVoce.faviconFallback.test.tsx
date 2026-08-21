import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { EventoLogo } from "./PraVoce";

/**
 * Regressão de BUG-55 e BUG-62.
 *
 * O fallback do favicon fazia `target.parentElement.innerHTML = "<span>..."`
 * dentro do `onError`, mutando por fora um nó que o React controla. O sintoma
 * aparecia depois, no descarte do `<img>`: `Failed to execute 'removeChild' on
 * 'Node'` no Chrome e `NotFoundError: The object can not be found here` no
 * Safari e no Firefox.
 *
 * QUAIS CASOS AQUI DE FATO DISCRIMINAM, medido rodando estes mesmos asserts
 * contra a implementação antiga:
 *
 *   - "não lança ao trocar para o estado sem logo": FALHA na antiga, com
 *     `NotFoundError`. É a reprodução literal de BUG-62.
 *   - "tenta de novo quando o card passa a exibir outro evento": FALHA na
 *     antiga, porque a imagem nova nunca chega ao DOM (o React atualiza o `src`
 *     de um nó já destacado pelo `innerHTML`, e a tela segue nas iniciais).
 *   - os outros três PASSAM nas duas versões. Ficam por descreverem o
 *     comportamento visível, mas não são o que trava a decisão, e dizer isso
 *     aqui é mais barato do que alguém redescobrir depois que estava confiando
 *     num assert que nunca poderia falhar.
 *
 * O caso de `unmount()` puro foi tentado primeiro e DESCARTADO por esse motivo:
 * ele passa nas duas. O React remove a subárvore pelo nó de cima (a moldura),
 * então nunca chega a pedir a remoção do `<img>` que o `innerHTML` levou junto.
 * O erro só aparece quando o próprio `<img>` é o nó a remover.
 */

const LOGO = "https://exemplo.test/logo.png";
const NOME = "Semana Dev Brasil";
const INICIAIS = "SD";
const CLASSES_INICIAIS = "font-display text-sm font-black text-fuchsia-700";

afterEach(cleanup);

describe("EventoLogo", () => {
  it("renderiza a imagem enquanto ela carrega", () => {
    render(<EventoLogo logoUrl={LOGO} nome={NOME} />);

    expect(screen.getByRole("img")).toHaveProperty("src", LOGO);
    expect(screen.queryByText(INICIAIS)).toBeNull();
  });

  it("troca a imagem pelas iniciais quando o favicon falha", () => {
    render(<EventoLogo logoUrl={LOGO} nome={NOME} />);

    fireEvent.error(screen.getByRole("img"));

    expect(screen.queryByRole("img")).toBeNull();
    // Mesmas classes que o `innerHTML` montava, para o visual não mudar.
    expect(screen.getByText(INICIAIS).className).toBe(CLASSES_INICIAIS);
  });

  it("mostra as iniciais quando não há logoUrl", () => {
    render(<EventoLogo nome={NOME} />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText(INICIAIS).className).toBe(CLASSES_INICIAIS);
  });

  it("não lança ao trocar para o estado sem logo depois da falha", () => {
    const { rerender } = render(<EventoLogo logoUrl={LOGO} nome={NOME} />);

    fireEvent.error(screen.getByRole("img"));

    // Na versão antiga isto lançava `NotFoundError`: o `<img>` que o React
    // precisa remover já tinha sido destruído pelo `innerHTML`.
    expect(() => rerender(<EventoLogo nome={NOME} />)).not.toThrow();
    expect(screen.getByText(INICIAIS).className).toBe(CLASSES_INICIAIS);
  });

  it("tenta de novo quando o card passa a exibir outro evento", () => {
    const { rerender } = render(
      <EventoLogo logoUrl="https://exemplo.test/a.png" nome={NOME} />,
    );

    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).toBeNull();

    // O estado guarda a URL que falhou, não um booleano, então o fallback não
    // fica preso ao primeiro erro quando a prop muda.
    rerender(<EventoLogo logoUrl="https://exemplo.test/b.png" nome={NOME} />);

    expect(screen.getByRole("img")).toHaveProperty(
      "src",
      "https://exemplo.test/b.png",
    );
  });
});
