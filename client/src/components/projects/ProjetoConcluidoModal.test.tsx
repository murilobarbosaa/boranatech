import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

/**
 * A comemoracao ao concluir um projeto (lote 03c).
 *
 * O caso que o teste protege nao e o modal aparecer: e ele NAO aparecer ao
 * abrir um projeto ja concluido. Abrir por efeito sobre `done` faria a
 * celebracao voltar em toda visita, que e o oposto de comemorar.
 */

const confete = vi.hoisted(() => ({ fire: vi.fn(() => vi.fn()) }));
const movimento = vi.hoisted(() => ({ reduzido: false }));

vi.mock("@/lib/proConfetti", () => ({ fireProCelebration: confete.fire }));
vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => movimento.reduzido,
}));
vi.mock("wouter", () => ({
  Link: ({
    children,
    href,
    onClick,
  }: {
    children?: unknown;
    href?: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children as never}
    </a>
  ),
}));

import ProjetoConcluidoModal from "@/components/projects/ProjetoConcluidoModal";

const PROXIMO = {
  id: "outro-projeto",
  nome: "Outro Projeto",
  area: "Front-end",
  nivel: "Iniciante",
};

function montar(over: Record<string, unknown> = {}) {
  const onOpenChange = vi.fn();
  render(
    <ProjetoConcluidoModal
      aberto
      onOpenChange={onOpenChange}
      nome="Página Pessoal"
      totalEtapas={5}
      post="post do linkedin"
      url="https://boranatech.com.br/projetos/landing-page-pessoal"
      proximo={PROXIMO}
      {...over}
    />,
  );
  return { onOpenChange };
}

afterEach(cleanup);
beforeEach(() => {
  confete.fire.mockClear();
  movimento.reduzido = false;
});

describe("ProjetoConcluidoModal", () => {
  it("fechado nao renderiza nada e nao dispara confete", () => {
    montar({ aberto: false });
    expect(screen.queryByText("Projeto concluído!")).toBeNull();
    expect(confete.fire).not.toHaveBeenCalled();
  });

  it("aberto mostra o titulo, a contagem de etapas e dispara o confete uma vez", () => {
    montar();
    expect(screen.getByText("Projeto concluído!")).toBeTruthy();
    expect(
      screen.getByText("Você fechou Página Pessoal em 5 etapas."),
    ).toBeTruthy();
    expect(confete.fire).toHaveBeenCalledTimes(1);
  });

  it("projeto sem etapas nao inventa contagem", () => {
    montar({ totalEtapas: null });
    expect(screen.getByText("Você fechou Página Pessoal.")).toBeTruthy();
  });

  it("com prefers-reduced-motion nao dispara confete", () => {
    movimento.reduzido = true;
    montar();
    expect(screen.getByText("Projeto concluído!")).toBeTruthy();
    expect(confete.fire).not.toHaveBeenCalled();
  });

  it("sem onValidar a primeira acao e copiar o post", () => {
    montar();
    expect(screen.getByText("Copiar post para o LinkedIn")).toBeTruthy();
    expect(screen.queryByText("Agora valide seu projeto")).toBeNull();
  });

  it("com onValidar a primeira acao e validar, e ela fecha o modal", () => {
    const onValidar = vi.fn();
    const { onOpenChange } = montar({ onValidar });
    expect(screen.queryByText("Copiar post para o LinkedIn")).toBeNull();
    fireEvent.click(screen.getByText("Agora valide seu projeto"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onValidar).toHaveBeenCalledTimes(1);
  });

  it("o proximo projeto e um link para a pagina dele", () => {
    montar();
    const link = screen.getByText("Outro Projeto").closest("a");
    expect(link?.getAttribute("href")).toBe("/projetos/outro-projeto");
  });

  it("sem proximo, nenhum link de proximo aparece", () => {
    montar({ proximo: null });
    expect(screen.queryByText("Próximo projeto")).toBeNull();
  });
});

describe("variante de validacao", () => {
  it("com nota, o titulo e o texto mudam", () => {
    montar({ nota: { atendidos: 8, total: 10, perfeito: false } });
    expect(screen.getByText("Projeto validado!")).toBeTruthy();
    expect(screen.getByText("Nota: 8 de 10.")).toBeTruthy();
    expect(screen.queryByText("Projeto concluído!")).toBeNull();
  });

  it("nota perfeita mostra o selo 100%", () => {
    montar({ nota: { atendidos: 10, total: 10, perfeito: true } });
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("sem nota, continua a comemoracao de conclusao", () => {
    montar();
    expect(screen.getByText("Projeto concluído!")).toBeTruthy();
    expect(screen.queryByText("100%")).toBeNull();
  });
});
