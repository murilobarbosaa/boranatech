import type { RequisitoAvaliacao } from "../../shared/github/schema";
import type { ProjetoRequisito } from "../../shared/projects/catalog";
import {
  calcularNota,
  type NotaValidacao,
} from "../../shared/projects/validationScore";

export interface ValidationOutcome {
  status: "aprovado" | "reprovado";
  nota: NotaValidacao;
}

// Veredito da validacao: CODIGO, nao IA. A IA da o veredito requisito a
// requisito; quem decide se isso vale como validado e a nota, com corte em
// 80% (lote 06). Antes era 100%, e um "parcial" num projeto de dez reprovava
// tudo.
//
// `pendentes` mora em `nota.pendentes`; a funcao delega inteira a
// `calcularNota`, que e compartilhada com o client.
export function computeValidationOutcome(
  requisitos: ProjetoRequisito[],
  avaliacao: RequisitoAvaliacao[],
): ValidationOutcome {
  const nota = calcularNota(
    requisitos.map((r) => r.id),
    avaliacao,
  );
  return { status: nota.validado ? "aprovado" : "reprovado", nota };
}
