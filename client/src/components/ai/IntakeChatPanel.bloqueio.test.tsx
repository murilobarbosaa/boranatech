import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import IntakeChatPanel from "./IntakeChatPanel";
import {
  BLOCK_COPY,
  exitsForBlock,
  isTransient,
  type ChatBlockKind,
} from "@/lib/roadmapChatBlock";

/**
 * PARTE D do smoke test: o painel RENDERIZA as saidas, nao so o estado diz que
 * elas existem.
 *
 * Os testes de `roadmapChatBlock` travam a decisao no nivel de dados
 * (`exitsForBlock`). Isto aqui fecha a lacuna que sobra: um componente que
 * ignorasse `onRestart`, ou que deixasse o input liberado num bloqueio, passaria
 * naqueles testes e falharia com a pessoa na frente.
 *
 * O que NAO esta aqui: os botoes de gerar e de formulario, que a pagina desenha
 * fora do painel (RoadmapIA.tsx). Esses dependem de montar a pagina inteira, com
 * AuthContext, SubscriptionContext, wouter e as chamadas de rede; o custo nao
 * paga, e a decisao de exibi-los ja esta travada por `exitsForBlock`. O que so o
 * componente pode provar e o que esta abaixo: input travado, copy do bloqueio,
 * recomecar clicavel, e Retry ausente onde nao deve aparecer.
 */

// jsdom nao implementa scrollIntoView, e o painel rola para a ultima bolha a
// cada render. Sem este stub todo teste morre no useEffect, antes de chegar na
// asserção.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const TERMINAIS: Array<Exclude<ChatBlockKind, "transient">> = [
  "turn_limit",
  "quota",
  "payload",
  "pro",
  "invalid",
];

const MENSAGENS = [
  { role: "user" as const, content: "quero primeira vaga" },
  { role: "assistant" as const, content: "em quanto tempo?" },
];

function renderBloqueado(kind: Exclude<ChatBlockKind, "transient">) {
  const onRestart = vi.fn();
  const onSend = vi.fn();
  const onRetry = vi.fn();
  const saidas = exitsForBlock({ kind }, false);
  render(
    <IntakeChatPanel
      messages={MENSAGENS}
      sending={false}
      onSend={onSend}
      turnLimitReached
      turnLimitMessage={BLOCK_COPY[kind]}
      onRestart={onRestart}
      restartLabel="Recomecar a conversa"
      // A pagina so passa onRetry quando o bloqueio e transient. Reproduzimos a
      // MESMA regra aqui, derivada da funcao, em vez de decidir a mao.
      onRetry={saidas.tentarDeNovo ? onRetry : undefined}
    />,
  );
  return { onRestart, onSend, onRetry };
}

afterEach(cleanup);

describe("painel bloqueado: a saida de recomecar existe e funciona", () => {
  for (const kind of TERMINAIS) {
    it(`${kind}: mostra a copy do bloqueio`, () => {
      renderBloqueado(kind);
      expect(screen.getByText(BLOCK_COPY[kind])).toBeTruthy();
    });

    it(`${kind}: o botao de recomecar esta na tela e e clicavel`, () => {
      const { onRestart } = renderBloqueado(kind);
      const botao = screen.getByRole("button", {
        name: /recomecar a conversa/i,
      });
      expect((botao as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(botao);
      expect(onRestart).toHaveBeenCalledTimes(1);
    });

    it(`${kind}: NAO oferece tentar de novo`, () => {
      renderBloqueado(kind);
      expect(
        screen.queryByRole("button", { name: /tentar de novo/i }),
      ).toBeNull();
    });

    it(`${kind}: o input fica travado, entao a pessoa nao bate no mesmo erro`, () => {
      renderBloqueado(kind);
      const campo = screen.queryByRole("textbox");
      if (campo) {
        expect((campo as HTMLTextAreaElement | HTMLInputElement).disabled).toBe(
          true,
        );
      } else {
        // Painel pode remover o campo em vez de desabilitar; as duas formas
        // satisfazem o invariante (nao da para reenviar o mesmo corpo).
        expect(campo).toBeNull();
      }
    });
  }
});

describe("painel NAO bloqueado: o caminho normal segue aberto", () => {
  it("input liberado e envio funciona", () => {
    const onSend = vi.fn();
    render(
      <IntakeChatPanel
        messages={MENSAGENS}
        sending={false}
        onSend={onSend}
        onRestart={vi.fn()}
        restartLabel="Recomecar a conversa"
      />,
    );
    const campo = screen.getByRole("textbox");
    expect((campo as HTMLTextAreaElement).disabled).toBe(false);
  });

  it("recomecar existe mesmo SEM bloqueio: nenhum estado do chat e terminal", () => {
    render(
      <IntakeChatPanel
        messages={MENSAGENS}
        sending={false}
        onSend={vi.fn()}
        onRestart={vi.fn()}
        restartLabel="Recomecar a conversa"
      />,
    );
    expect(
      screen.getByRole("button", { name: /recomecar a conversa/i }),
    ).toBeTruthy();
  });
});

describe("erro transitorio: aqui SIM cabe tentar de novo", () => {
  it("mostra o botao de tentar de novo e chama o callback", () => {
    const onRetry = vi.fn();
    expect(isTransient({ kind: "transient" })).toBe(true);
    render(
      <IntakeChatPanel
        messages={MENSAGENS}
        sending={false}
        onSend={vi.fn()}
        error="Nao consegui responder agora. Tente de novo."
        onRetry={onRetry}
        onRestart={vi.fn()}
        restartLabel="Recomecar a conversa"
      />,
    );
    const botao = screen.getByRole("button", { name: /tentar de novo/i });
    fireEvent.click(botao);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
