import type { RequisitoAvaliacao } from "../../shared/github/schema";
import type { ProjetoRequisito } from "../../shared/projects/catalog";

export interface ValidationOutcome {
  status: "aprovado" | "reprovado";
  pendentes: string[];
}

// Veredito final da validacao de projeto e CODIGO, nao IA: aprovado somente
// quando TODO requisito do catalogo tem avaliacao "atende". Requisito sem
// avaliacao correspondente (IA omitiu ou repetiu id) conta como pendente,
// fail-closed. Funcao pura pra ser testavel isolada.
export function computeValidationOutcome(
  requisitos: ProjetoRequisito[],
  avaliacao: RequisitoAvaliacao[],
): ValidationOutcome {
  const byId = new Map(avaliacao.map((item) => [item.id, item]));
  const pendentes = requisitos
    .filter((req) => byId.get(req.id)?.veredito !== "atende")
    .map((req) => req.id);
  return {
    status: pendentes.length === 0 ? "aprovado" : "reprovado",
    pendentes,
  };
}
