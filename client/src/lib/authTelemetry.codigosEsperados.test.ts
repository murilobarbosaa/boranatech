import { describe, expect, it } from "vitest";

import { callbackMessageForCode } from "../components/auth/authCallbackMessages";
import { CODIGOS_ESPERADOS_PARA_TESTE, nivelSentry } from "./authTelemetry";

/**
 * Trava a lista de códigos esperados CONTRA a copy de callback.
 *
 * Por que existe: `CODIGOS_ESPERADOS` é mantida à mão e ficou para trás duas
 * vezes. `otp_expired` tinha copy desde sempre e chegava ao Sentry como
 * `level: error`; abriu issue nova (BORANATECH-FRONT-B, 4 eventos em 5 minutos,
 * 0 usuários identificados) e só então alguém olhou. `access_denied` tinha o
 * mesmo defeito e estava lá desde o início, sem nunca ter sido notado.
 *
 * O teste NÃO deriva uma lista da outra, e isso é deliberado: `bad_oauth_state`
 * tem copy e MESMO ASSIM é falha de verdade, então derivar classificaria errado.
 * O que ele faz é afirmar o TOTAL nos dois sentidos e obrigar quem tem copy e
 * não é esperado a estar declarado aqui, com nome. Código novo com copy quebra
 * o teste até alguém decidir de que lado ele fica.
 */

/** Códigos que a interface trata com copy própria em `authCallbackMessages`. */
const COM_COPY = ["access_denied", "otp_expired", "bad_oauth_state"] as const;

/**
 * Tem copy e continua `error` de propósito. Mexer aqui é decisão, não
 * manutenção: o comentário de `CODIGOS_ESPERADOS` nomeia `bad_oauth_state` como
 * falha real, e o Sentry precisa continuar tratando como tal.
 */
const COM_COPY_MAS_ERRO_DE_VERDADE = new Set(["bad_oauth_state"]);

describe("CODIGOS_ESPERADOS contra a copy de callback", () => {
  it("todo código com copy é esperado, salvo os declarados como falha real", () => {
    const faltando = COM_COPY.filter(
      (c) =>
        !COM_COPY_MAS_ERRO_DE_VERDADE.has(c) &&
        !CODIGOS_ESPERADOS_PARA_TESTE.includes(c),
    );
    expect(faltando).toEqual([]);
  });

  it("todo código com copy é realmente reconhecido pela copy", () => {
    for (const codigo of COM_COPY) {
      expect(callbackMessageForCode(codigo)).not.toEqual(
        callbackMessageForCode("codigo_que_nao_existe"),
      );
    }
  });

  /**
   * `flow_state_already_used` entrou SEM copy, e isso não é esquecimento.
   *
   * O código só existe depois de um flow state ter sido usado com SUCESSO: é o
   * segundo exchange do mesmo `code` (voltar, recarregar, efeito duplo). O
   * primeiro concluiu o login, então há sessão, e `AuthContext.tsx:478` só
   * monta o aviso visível quando NÃO há sessão. Não há tela para escrever.
   *
   * É por isso que o teste acima ("todo código com copy é esperado") continua
   * valendo sem mudança: a relação é copy → esperado, nunca o inverso.
   */
  it("afirma o CONJUNTO inteiro, não a pertinência", () => {
    expect(CODIGOS_ESPERADOS_PARA_TESTE.slice().sort()).toEqual([
      "access_denied",
      "flow_state_already_used",
      "invalid_credentials",
      "otp_expired",
      "user_already_exists",
    ]);
  });

  it("rebaixa para info todos os esperados", () => {
    CODIGOS_ESPERADOS_PARA_TESTE.forEach((codigo) => {
      expect(nivelSentry(codigo)).toBe("info");
    });
  });

  it("mantém error em bad_oauth_state, em profile_fetch_exhausted e no desconhecido", () => {
    expect(nivelSentry("bad_oauth_state")).toBe("error");
    expect(nivelSentry("profile_fetch_exhausted")).toBe("error");
    expect(nivelSentry("qualquer_coisa_nova")).toBe("error");
    expect(nivelSentry(null)).toBe("error");
  });
});
