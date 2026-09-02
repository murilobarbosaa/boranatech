/**
 * ROTULO DO PROVEDOR DE PAGAMENTO, por resolver com fallback neutro.
 *
 * `provider` e um valor que vem do SERVIDOR (coluna `finance_transactions.
 * provider`, hoje com CHECK em `stripe` e `asaas`). Acesso direto a um mapa
 * indexado por valor do servidor e o defeito que ja derrubou o admin em
 * producao com `Cannot read properties of undefined (reading 'label')`: basta o
 * banco ganhar um valor que o bundle em execucao ainda nao conhece. Referencia
 * do padrao: `notificationTypeMetaOf` em client/src/lib/notificationTypeMeta.ts.
 *
 * O FALLBACK E DE APRESENTACAO, e por isso degradar e correto aqui: o valor
 * lido do mapa e o RoTULO, nao a informacao. Um provedor novo aparece com o
 * proprio codigo na tela ("mercadopago"), que e feio e verdadeiro, enquanto a
 * receita, o valor e a data continuam certos. Se o valor lido FOSSE a
 * informacao (um peso, uma taxa), a regra seria a oposta e isto deveria lancar.
 */

export type ProviderMeta = {
  /** Nome para a tela. */
  label: string;
  /** `true` quando temos rotulo proprio; `false` quando e o codigo cru. */
  conhecido: boolean;
};

const PROVIDER_META: Record<string, ProviderMeta> = {
  stripe: { label: "Stripe", conhecido: true },
  asaas: { label: "Pix", conhecido: true },
};

/**
 * Meta do provedor, nunca `undefined`.
 *
 * Ausencia (campo nao enviado pelo backend antigo na janela de deploy) cai em
 * `stripe`, que e o default da coluna: era o unico provedor ate 2026-09-01, e
 * uma linha sem o campo e de la por construcao.
 */
export function providerMetaOf(
  provider: string | null | undefined,
): ProviderMeta {
  const chave = provider ?? "stripe";
  return PROVIDER_META[chave] ?? { label: chave, conhecido: false };
}

export function providerLabelOf(provider: string | null | undefined): string {
  return providerMetaOf(provider).label;
}

/** O que a tela chama o Asaas. O provedor cobra por Pix, e e o Pix que a pessoa ve. */
export const PROVIDER_ASAAS = "asaas";
