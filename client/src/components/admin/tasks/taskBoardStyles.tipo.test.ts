import { describe, expect, it } from "vitest";

import { TYPE_OPTIONS, typeMetaOf } from "./taskBoardStyles";

/**
 * 'bug' voltou ao conjunto de tipos aceitos (migration 20260731040000).
 *
 * O que este teste protege nao e o rotulo, e a DIFERENCA entre os dois estados
 * possiveis de um valor conhecido:
 *
 *   - no menu    -> aparece em TYPE_OPTIONS e typeMetaOf devolve o rotulo;
 *   - aposentado -> some de TYPE_OPTIONS e typeMetaOf CONTINUA devolvendo o
 *                   rotulo, pelo mapa TYPE_META_HISTORICO.
 *
 * Os dois estados dao o mesmo resultado em typeMetaOf, de proposito: registro
 * historico nao pode virar "Outro" porque o menu mudou. Foi assim que 'bug'
 * atravessou os tres dias em que esteve fora. Por isso a asserção sobre o rotulo
 * NAO distingue os estados sozinha, e a asserção que distingue e a do menu.
 */

describe("tipo de tarefa: bug de volta ao menu", () => {
  it("typeMetaOf('bug') devolve o rotulo, nao o neutro", () => {
    expect(typeMetaOf("bug").label).toBe("Bug");
  });

  it("'bug' aparece nas opcoes do menu de tipo", () => {
    // Esta e a asserção que separa "aceito" de "so renderizavel": ela era FALSA
    // enquanto bug morava em TYPE_META_HISTORICO, e passou a ser verdadeira ao
    // subir para TYPE_META.
    expect(TYPE_OPTIONS.map((o) => o.value)).toContain("bug");
  });

  it("o menu tem os 5 tipos, sem sobra nem falta", () => {
    // Afirma o TOTAL. "bug esta la" passaria com um menu de doze tipos
    // duplicados; o tamanho e o que quebra quando o conjunto muda sem querer.
    expect(TYPE_OPTIONS).toHaveLength(5);
    expect(TYPE_OPTIONS.map((o) => o.value).sort()).toEqual(
      ["bug", "debito_tecnico", "feature", "melhoria", "tarefa"].sort(),
    );
  });

  it("valor desconhecido continua caindo no neutro, sem lancar", () => {
    // Controle da regra de lookup do CLAUDE.md: o bundle no navegador pode ser
    // mais antigo que o backend, e um tipo que ele nao conhece precisa degradar
    // em vez de derrubar a aba inteira em MAPA[valor].label.
    expect(typeMetaOf("tipo_que_nao_existe").label).toBe("Outro");
    expect(typeMetaOf("").label).toBe("Outro");
  });
});
