// Resolucao do adapter fiscal a partir de NFSE_PROVIDER.
//
// Diferente do provider de pagamento (Stripe, unico e sem seletor), aqui existe
// escolha por env, entao a resolucao mora num lugar so. LANCA para provedor
// desconhecido em vez de cair no mock: qual provedor emitiu E a informacao, e
// degradar para o mock produziria linha 'issued' com numero falso,
// indistinguivel de uma nota real. O boot ja aborta nesse caso (server/lib/env.ts);
// esta guarda cobre o caminho em que alguem chame isto por outro caminho.

import { env } from "../lib/env";
import { fiscalFocusProvider } from "./fiscalFocus";
import { fiscalMockProvider } from "./fiscalMock";
import type { FiscalProvider } from "./fiscalTypes";

export function getFiscalProvider(): FiscalProvider {
  switch (env.nfseProvider) {
    case "mock":
      return fiscalMockProvider;
    case "focus_nfse":
      return fiscalFocusProvider;
    case "focus_nfsen":
      // Scaffold: a estrutura existe (server/providers/fiscalFocusNacional.ts),
      // o serializer da DPS nacional nao. Selecionar este provedor e erro de
      // configuracao explicito, nunca emissao pela metade. O boot ja recusa
      // subir assim; esta guarda cobre quem chegar por outro caminho.
      throw new Error(
        "Adapter focus_nfsen ainda nao implementado (ver TODO(nfsen) em fiscalFocusNacional.ts). Use NFSE_PROVIDER=focus_nfse.",
      );
    default: {
      // Exaustividade checada pelo compilador: um provedor novo no tipo sem
      // entrada aqui nao compila.
      const exhaustive: never = env.nfseProvider;
      throw new Error(`Provedor de NFS-e desconhecido: ${String(exhaustive)}`);
    }
  }
}
