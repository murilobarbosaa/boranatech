import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  confirmacaoDigitadaValida,
  DeleteAccountConfirmModal,
  PALAVRA_DE_CONFIRMACAO,
} from "./DeleteAccountConfirmModal";

/**
 * GATE DA EXCLUSAO DE CONTA.
 *
 * Antes desta mudanca, apagar a conta eram DOIS cliques a partir de qualquer
 * sessao aberta, sobre uma acao irreversivel que tambem cancela assinatura paga.
 * O que estes casos travam nao e a aparencia do campo: e que o botao nao chame
 * `onConfirm` sem a palavra exata, e que o campo nao carregue estado de uma
 * tentativa anterior.
 *
 * O modal foi extraido de `pages/Perfil.tsx` para poder ser montado sozinho.
 * Montar a pagina inteira exigiria AuthContext, SubscriptionContext, supabase e
 * wouter, e o teste passaria a falhar por motivos que nao tem nada a ver com o
 * gate, que e o jeito conhecido de um teste virar ruido e ser desligado.
 */

function montar(over: Partial<Parametros> = {}) {
  const props = { ...padrao(), ...over };
  const utils = render(<DeleteAccountConfirmModal {...props} />);
  return { ...utils, props };
}

type Parametros = React.ComponentProps<typeof DeleteAccountConfirmModal>;

function padrao(): Parametros {
  return {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    isLoading: false,
    hasRealSubscription: false,
    isBoletoSubscription: false,
  };
}

function botaoConfirmar(): HTMLButtonElement {
  // Por testid, nao por nome acessivel: o rotulo vira "Excluindo..." durante a
  // acao, e uma consulta por nome acharia o botao em um estado e nao no outro.
  return screen.getByTestId("excluir-conta-confirmar") as HTMLButtonElement;
}

function campo(): HTMLInputElement {
  return screen.getByLabelText(
    new RegExp(`digite ${PALAVRA_DE_CONFIRMACAO}`, "i"),
  ) as HTMLInputElement;
}

function digitar(texto: string) {
  fireEvent.change(campo(), { target: { value: texto } });
}

afterEach(() => {
  cleanup();
});

describe("gate do botao de confirmar", () => {
  it("campo vazio deixa o botao bloqueado", () => {
    montar();
    expect(botaoConfirmar().disabled).toBe(true);
    expect(botaoConfirmar().getAttribute("aria-disabled")).toBe("true");
  });

  it("texto em minusculas NAO libera", () => {
    // Sensivel a maiusculas de proposito: o atrito e o recurso.
    montar();
    digitar("excluir");
    expect(botaoConfirmar().disabled).toBe(true);
  });

  it("espaco NO MEIO nao libera", () => {
    montar();
    digitar("EXC LUIR");
    expect(botaoConfirmar().disabled).toBe(true);
  });

  it("palavra exata libera", () => {
    montar();
    digitar(PALAVRA_DE_CONFIRMACAO);
    expect(botaoConfirmar().disabled).toBe(false);
    expect(botaoConfirmar().getAttribute("aria-disabled")).toBe("false");
  });

  it("espacos NAS PONTAS liberam (o teclado do celular acrescenta sozinho)", () => {
    montar();
    digitar(`  ${PALAVRA_DE_CONFIRMACAO}  `);
    expect(botaoConfirmar().disabled).toBe(false);
  });

  it("a regra sozinha, sem render", () => {
    // A mesma regra afirmada na fonte, para o dia em que a renderizacao mudar.
    expect(confirmacaoDigitadaValida("")).toBe(false);
    expect(confirmacaoDigitadaValida("excluir")).toBe(false);
    expect(confirmacaoDigitadaValida("EXCLUIR!")).toBe(false);
    expect(confirmacaoDigitadaValida("EXCLUIR")).toBe(true);
    expect(confirmacaoDigitadaValida("\tEXCLUIR\n")).toBe(true);
  });
});

describe("acessibilidade e comportamento do campo", () => {
  it("o campo tem label de verdade, nao so placeholder", () => {
    montar();
    const input = campo();
    expect(input.tagName).toBe("INPUT");
    // `getByLabelText` acima ja falharia sem a associacao; isto trava o htmlFor.
    expect(input.id).toBeTruthy();
    expect(document.querySelector(`label[for="${input.id}"]`)).toBeTruthy();
  });

  it("o botao bloqueado DIZ o que falta, e aponta para o texto", () => {
    montar();
    const descrito = botaoConfirmar().getAttribute("aria-describedby");
    expect(descrito).toBeTruthy();
    const apoio = document.getElementById(descrito!);
    expect(apoio?.textContent ?? "").toContain(PALAVRA_DE_CONFIRMACAO);
    expect(apoio?.textContent ?? "").toMatch(/liberar o botão/i);
  });

  it("Enter no campo NAO confirma", () => {
    const { props } = montar();
    digitar(PALAVRA_DE_CONFIRMACAO);
    fireEvent.keyDown(campo(), { key: "Enter", code: "Enter" });
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("durante a exclusao o campo fica desabilitado junto com o resto", () => {
    montar({ isLoading: true });
    expect(campo().disabled).toBe(true);
    expect(botaoConfirmar().disabled).toBe(true);
    expect(screen.getByText("Excluindo...")).toBeTruthy();
  });
});

describe("estado entre aberturas", () => {
  it("fechar e reabrir ZERA o campo", () => {
    // O componente nao desmonta ao fechar (devolve null), entao sem o reset a
    // segunda abertura nasceria com o botao ja liberado.
    const props = padrao();
    const { rerender } = render(<DeleteAccountConfirmModal {...props} />);
    digitar(PALAVRA_DE_CONFIRMACAO);
    expect(botaoConfirmar().disabled).toBe(false);

    rerender(<DeleteAccountConfirmModal {...props} isOpen={false} />);
    rerender(<DeleteAccountConfirmModal {...props} isOpen />);

    expect(campo().value).toBe("");
    expect(botaoConfirmar().disabled).toBe(true);
  });
});

describe("CONTROLE NEGATIVO: com o campo correto, a exclusao acontece", () => {
  it("um clique chama onConfirm exatamente uma vez", () => {
    const { props } = montar();
    digitar(PALAVRA_DE_CONFIRMACAO);
    fireEvent.click(botaoConfirmar());
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("clicar bloqueado nao chama nada", () => {
    const { props } = montar();
    fireEvent.click(botaoConfirmar());
    expect(props.onConfirm).not.toHaveBeenCalled();
  });
});

describe("modal fechado", () => {
  it("nao renderiza nada", () => {
    montar({ isOpen: false });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
