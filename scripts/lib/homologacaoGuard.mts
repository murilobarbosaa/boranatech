// Guarda de ambiente do script de homologacao de NFS-e.
//
// MODULO SEPARADO, e importado ANTES dos modulos de servidor, porque a ordem de
// avaliacao do ESM e o unico jeito de garantir que a checagem rode primeiro:
// `import` e hoisted, entao uma checagem escrita no topo do corpo do script
// rodaria DEPOIS de todo o grafo de imports ter sido avaliado.
//
// (A tentativa anterior foi `await import()` dinamico no script. Ela falhou por
// um motivo que vale registrar: `@supabase/supabase-js` e CommonJS, e o loader
// ESM do Node nao resolve o named export `createClient` quando o modulo chega
// por import dinamico. Import estatico + este modulo resolve os dois problemas.)
//
// O que a guarda protege: este script EMITE NOTA DE VERDADE no ambiente que
// estiver configurado. Apontado para producao, ele geraria documento fiscal
// real com dados de teste, o que nao se desfaz com um delete.

import { config } from "dotenv";

config({ quiet: true });

function abortar(mensagem: string): never {
  console.error(`\n[homologarNfse] ABORTADO: ${mensagem}\n`);
  process.exit(1);
}

if (process.env.NFSE_FOCUS_ENV !== "homologacao") {
  abortar(
    `NFSE_FOCUS_ENV="${process.env.NFSE_FOCUS_ENV ?? "(ausente)"}". Este script SO roda em homologacao. ` +
      "Nunca aponte para producao: ele emite nota de verdade no ambiente que estiver configurado.",
  );
}

if (process.env.NFSE_ENABLED !== "true") {
  abortar(
    `NFSE_ENABLED="${process.env.NFSE_ENABLED ?? "(ausente)"}". Ligue a emissao (NFSE_ENABLED=true) para rodar a homologacao.`,
  );
}

if (process.env.NFSE_PROVIDER !== "focus_nfse") {
  abortar(
    `NFSE_PROVIDER="${process.env.NFSE_PROVIDER ?? "(ausente)"}". A homologacao exige o adapter real (focus_nfse); o mock nao fala com prefeitura nenhuma.`,
  );
}
