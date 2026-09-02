// A LINHA SECUNDÁRIA DO CARD "RECEITA NO PERÍODO": quanto veio de cada provedor.
//
// Mora fora do `Admin.tsx` pelo mesmo motivo de `riskCopy.ts`: ela tem quatro
// caminhos (backend antigo sem o campo, um provedor só, dois provedores, e
// provedor que o bundle não conhece), e caminho que só existe na janela de
// deploy é exatamente o que ninguém exercita à mão. Aqui ele tem teste.

import { providerLabelOf } from "@/lib/providerMeta";

export type ReceitaDeProvider = {
  provider: string;
  brutaCents: number;
};

/**
 * "Stripe R$ 29,90 · Pix R$ 12,90", ou `null` quando não há o que dizer.
 *
 * `null` E NÃO STRING VAZIA: quem chama passa o valor direto para `secundaria`,
 * e o card já sabe não desenhar rodapé quando ela é nula. Uma string vazia
 * produziria um espaço em branco com borda.
 *
 * TRÊS CASOS EM QUE ELA NÃO APARECE, e os três são deliberados:
 *
 *   1. BACKEND ANTIGO (campo ausente): a Vercel sobe antes do Railway, então por
 *      1 a 3 minutos o bundle novo recebe a resposta velha. Sem linha é melhor
 *      que "undefined", e o card principal continua correto.
 *   2. UM PROVEDOR SÓ: "Stripe R$ 4.213,15" ao lado de um total idêntico é
 *      ruído, não informação. A quebra só diz algo quando há o que quebrar.
 *   3. TUDO ZERO: período sem receita não precisa de duas maneiras de dizer
 *      zero.
 *
 * PROVEDOR COM RECEITA ZERO SOME da frase, pela mesma razão da família vazia em
 * `detalheDeRisco`: "Pix R$ 0,00" faz alguém procurar um pagamento que não
 * existe. Um estorno que zera o bruto de um provedor o remove da linha; o total
 * do card continua contando o estorno, porque ele é a soma de tudo.
 */
export function detalheDeReceitaPorProvider(
  itens: ReceitaDeProvider[] | null | undefined,
  formatCents: (cents: number) => string,
): string | null {
  if (!Array.isArray(itens)) return null;

  const comReceita = itens.filter(
    (i) => typeof i.brutaCents === "number" && i.brutaCents > 0,
  );
  if (comReceita.length < 2) return null;

  return comReceita
    .map((i) => `${providerLabelOf(i.provider)} ${formatCents(i.brutaCents)}`)
    .join(" · ");
}
