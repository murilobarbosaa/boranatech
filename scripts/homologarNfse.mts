// Emissao de uma nota de teste PONTA A PONTA contra a homologacao da Focus,
// sem depender de um pagamento Stripe.
//
// POR QUE ELE EXISTE. Os TODO(homologacao) espalhados pelo adapter sao
// perguntas que a documentacao nao responde e que so o ambiente responde:
// formato aceito da aliquota, formato do valor, nomes dos campos de documento,
// codigo do 422 de ref repetida, contrato do cancelamento. Fecha-las por
// tentativa e erro em producao significaria emitir documento fiscal errado para
// um cliente real. Aqui a nota e de teste, o ambiente e o sandbox, e cada passo
// e impresso para virar dado observado em vez de suposicao.
//
// O QUE ELE MUTA, e isto precisa estar claro antes de rodar:
//   1. cria UMA linha em fiscal_invoices com stripe_charge_id sintetico
//      (prefixo `homolog_`), que nunca colide com uma cobranca real;
//   2. escreve nome/CPF (e endereco, se passado) no perfil do --user-id, porque
//      a emissao le o tomador de `profiles`. Ha uma trava: se o perfil ja tiver
//      um CPF DIFERENTE do informado, o script ABORTA, para um --user-id
//      digitado errado nao sobrescrever o cadastro de um cliente real. Use
//      --forcar-perfil para passar por cima, conscientemente;
//   3. envia de verdade o e-mail da nota para o --email (sem REDIS_URL o envio
//      critico sai direto).
//
// USO (sempre por `pnpm homologar:nfse`, nunca por `tsx` direto):
//   pnpm homologar:nfse -- \
//     --user-id <uuid> --email voce@exemplo.com \
//     --nome "Fulano de Tal" --cpf 000.000.000-00
//
//   ...com endereco (recomendado, o ISSnet DF costuma exigir):
//     --cep 70000-000 --logradouro "SQN 000" --numero 1 --bairro "Asa Norte" \
//     --cidade "Brasilia" --uf DF --codigo-municipio 5300108
//
//   ...para provocar o 422 de ref repetida (fecha um TODO):
//     --ref <uuid-de-uma-nota-ja-emitida>
//
//   ...para exercitar o cancelamento (fecha dois TODO):
//     --cancelar <uuid-da-nota>
//
// POR QUE O SCRIPT DO package.json E NAO `tsx` DIRETO. O comando carrega
// `--tsconfig tsconfig.node.json`, e sem ele o processo morre com
// `SyntaxError: ... does not provide an export named 'createClient'` antes de
// executar UMA linha. Causa: `@supabase/supabase-js` e CommonJS, e so o
// `moduleResolution: "bundler"` daquele tsconfig faz o tsx gerar a interop que
// o loader ESM do Node precisa (e por isso que `pnpm dev:server` tambem o usa).
// A falha e de LINK, anterior a qualquer avaliacao de modulo, entao nem a
// guarda de ambiente chega a rodar: o erro nao se parece nem um pouco com a
// causa. Este mesmo defeito atinge os scripts .mts pre-existentes que importam
// supabaseAdmin (`cleanNonTechVagas`, `ingestFaculdadesCenso`), que hoje nao
// rodam por este motivo.

// ---------------------------------------------------------------------------
// GUARDA DURA, primeira linha de import de proposito.
//
// O ESM avalia os modulos importados em ordem de origem, antes do corpo deste
// arquivo. Entao este import roda as tres checagens de ambiente ANTES de
// qualquer modulo de servidor ser avaliado. Uma checagem escrita no topo do
// corpo do script rodaria depois de todo o grafo, porque `import` e hoisted.
// ---------------------------------------------------------------------------

import "./lib/homologacaoGuard.mts";

import { env } from "../server/lib/env";
import { supabaseAdmin } from "../server/lib/supabaseAdmin";
import { processFiscalInvoiceJob } from "../server/lib/fiscalQueue";
import { getFiscalProvider } from "../server/providers/fiscal";
import { setFocusObserver } from "../server/providers/focusClient";
import { isValidCpf, onlyDigits } from "../shared/fiscalIdentity";

const argv = process.argv.slice(2);

function arg(nome: string): string | undefined {
  const i = argv.indexOf(`--${nome}`);
  if (i === -1) return undefined;
  const valor = argv[i + 1];
  return valor && !valor.startsWith("--") ? valor : undefined;
}

function temFlag(nome: string): boolean {
  return argv.includes(`--${nome}`);
}

function abortar(mensagem: string): never {
  console.error(`\n[homologarNfse] ABORTADO: ${mensagem}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Impressao.
// ---------------------------------------------------------------------------

function titulo(texto: string): void {
  console.log(`\n${"=".repeat(72)}\n${texto}\n${"=".repeat(72)}`);
}

function passo(texto: string): void {
  console.log(`\n--- ${texto} ---`);
}

/** Mostra so as pontas do token: confirma QUAL credencial rodou sem vaza-la. */
function mascararToken(token: string): string {
  if (token.length <= 8) return "****";
  return `${token.slice(0, 4)}...${token.slice(-4)} (${token.length} chars)`;
}

/** Respostas observadas, para o checklist final falar de dado e nao de memoria. */
const observadas: Array<{
  method: string;
  path: string;
  status: number;
  responseBody: unknown;
}> = [];

setFocusObserver((evento) => {
  observadas.push({
    method: evento.method,
    path: evento.path,
    status: evento.status,
    responseBody: evento.responseBody,
  });
  passo(`HTTP ${evento.method} ${evento.path}`);
  if (evento.requestBody !== undefined) {
    console.log("payload enviado:");
    console.log(JSON.stringify(evento.requestBody, null, 2));
  }
  console.log(`status: ${evento.status}`);
  console.log("resposta:");
  console.log(
    evento.responseBody
      ? JSON.stringify(evento.responseBody, null, 2)
      : evento.raw.slice(0, 2000) || "(vazia)",
  );
});

// ---------------------------------------------------------------------------
// Leitura da linha, para imprimir transicoes.
// ---------------------------------------------------------------------------

type LinhaFiscal = Record<string, unknown> & { id: string; status: string };

async function lerLinha(chargeId: string): Promise<LinhaFiscal | null> {
  const { data, error } = await supabaseAdmin
    .from("fiscal_invoices")
    .select("*")
    .eq("stripe_charge_id", chargeId)
    .maybeSingle();
  if (error) abortar(`falha ao ler a linha: ${error.message}`);
  return (data as LinhaFiscal | null) ?? null;
}

function imprimirLinha(rotulo: string, linha: LinhaFiscal | null): void {
  if (!linha) {
    console.log(`${rotulo}: (linha inexistente)`);
    return;
  }
  console.log(`${rotulo}:`);
  for (const campo of [
    "id",
    "status",
    "provider",
    "provider_invoice_id",
    "numero",
    "serie",
    "codigo_verificacao",
    "pdf_path",
    "xml_path",
    "attempts",
    "error_code",
    "error_message",
    "issued_at",
    "precisa_revisao",
  ]) {
    const valor = linha[campo];
    if (valor !== null && valor !== undefined) {
      console.log(`  ${campo}: ${String(valor)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// MODO CANCELAMENTO.
// ---------------------------------------------------------------------------

const refParaCancelar = arg("cancelar");
if (refParaCancelar) {
  titulo(`CANCELAMENTO da nota ${refParaCancelar}`);
  console.log(`ambiente: ${env.nfseFocusEnv}`);
  console.log(`token: ${mascararToken(env.nfseFocusToken)}`);

  const provider = getFiscalProvider();
  passo("estado ANTES do cancelamento");
  const antes = await provider.fetchStatus(refParaCancelar);
  console.log(JSON.stringify(antes, null, 2));

  passo("chamando provider.cancel");
  try {
    await provider.cancel(
      refParaCancelar,
      "Teste de homologacao: cancelamento",
    );
    console.log("cancelamento ACEITO pelo provedor.");
  } catch (err) {
    console.log(
      `cancelamento RECUSADO: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  passo("estado DEPOIS do cancelamento");
  const depois = await provider.fetchStatus(refParaCancelar);
  console.log(JSON.stringify(depois, null, 2));

  titulo("TODO(homologacao) que esta rodada responde");
  console.log(
    "- contrato do DELETE /v2/nfse/{ref}: ver o payload e a resposta impressos acima.",
  );
  console.log(
    "  Confira se o campo de justificativa se chama `justificativa` e se o status virou `cancelado`.",
  );
  console.log(
    "- prazo municipal: se a recusa citar prazo, anote o limite em dias no comentario do adapter.",
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// MODO EMISSAO.
// ---------------------------------------------------------------------------

const userId = arg("user-id");
const email = arg("email");
const nome = arg("nome");
const cpfBruto = arg("cpf");
const refExistente = arg("ref");

if (!userId) abortar("--user-id e obrigatorio (uuid do usuario dono da nota).");
if (!email) abortar("--email e obrigatorio (para onde vai o e-mail da nota).");
if (!nome) abortar("--nome e obrigatorio (nome civil do tomador).");
if (!cpfBruto) {
  abortar(
    "--cpf e obrigatorio. NAO ha default: emitir com documento inventado geraria uma nota de teste no CPF de outra pessoa.",
  );
}

const cpf = onlyDigits(cpfBruto);
if (!isValidCpf(cpf)) {
  abortar(
    `--cpf "${cpfBruto}" nao passa na validacao de digitos verificadores.`,
  );
}

titulo("HOMOLOGACAO DE NFS-e");
console.log(`ambiente Focus:      ${env.nfseFocusEnv}`);
console.log(`token:               ${mascararToken(env.nfseFocusToken)}`);
console.log(`prestador CNPJ:      ${env.nfsePrestadorCnpj}`);
console.log(`inscricao municipal: ${env.nfsePrestadorInscricaoMunicipal}`);
console.log(`codigo municipio:    ${env.nfsePrestadorCodigoMunicipio}`);
console.log(`item lista servico:  ${env.nfseServicoItemLista}`);
console.log(`aliquota:            ${env.nfseServicoAliquota}`);
console.log(`optante simples:     ${String(env.nfseOptanteSimples)}`);
console.log(
  `natureza operacao:   ${env.nfseNaturezaOperacao || "(nao enviada)"}`,
);
console.log(
  `regime especial:     ${env.nfseRegimeEspecialTributacao || "(nao enviado)"}`,
);

// --- Perfil do tomador -----------------------------------------------------

passo("perfil do tomador");

const { data: perfilAtual, error: perfilError } = await supabaseAdmin
  .from("profiles")
  .select("user_id, full_name, cpf, email")
  .eq("user_id", userId)
  .maybeSingle();
if (perfilError) abortar(`falha ao ler o perfil: ${perfilError.message}`);
if (!perfilAtual) abortar(`nenhum perfil para o user_id ${userId}.`);

const cpfAtual = onlyDigits((perfilAtual as { cpf: string | null }).cpf);
if (cpfAtual && cpfAtual !== cpf && !temFlag("forcar-perfil")) {
  // TRAVA CONTRA --user-id DIGITADO ERRADO. Sobrescrever o CPF de um cliente
  // real com o CPF de teste seria corromper cadastro fiscal de terceiro, e o
  // erro so apareceria na proxima nota DELE.
  abortar(
    `o perfil ${userId} ja tem um CPF DIFERENTE do informado (${cpfAtual.slice(-4)} vs ${cpf.slice(-4)}). ` +
      "Confira o --user-id. Se for mesmo esta conta, repita com --forcar-perfil.",
  );
}

const patchPerfil: Record<string, string | null> = {
  full_name: nome,
  cpf,
};
for (const [flag, coluna] of [
  ["cep", "endereco_cep"],
  ["logradouro", "endereco_logradouro"],
  ["numero", "endereco_numero"],
  ["complemento", "endereco_complemento"],
  ["bairro", "endereco_bairro"],
  ["cidade", "endereco_cidade"],
  ["uf", "endereco_uf"],
  ["codigo-municipio", "endereco_codigo_municipio"],
] as const) {
  const valor = arg(flag);
  if (valor) {
    patchPerfil[coluna] =
      coluna === "endereco_cep" || coluna === "endereco_codigo_municipio"
        ? onlyDigits(valor)
        : coluna === "endereco_uf"
          ? valor.toUpperCase()
          : valor;
  }
}

console.log(`gravando no perfil ${userId}:`);
console.log(
  JSON.stringify({ ...patchPerfil, cpf: `***${cpf.slice(-4)}` }, null, 2),
);

const { error: updatePerfilError } = await supabaseAdmin
  .from("profiles")
  .update(patchPerfil)
  .eq("user_id", userId);
if (updatePerfilError) {
  abortar(`falha ao gravar o perfil: ${updatePerfilError.message}`);
}

// --- Linha da nota ---------------------------------------------------------

passo("linha de fiscal_invoices");

// stripe_charge_id SINTETICO e identificavel: o prefixo `homolog_` nunca colide
// com um id real da Stripe (`ch_...`) e permite achar e apagar as notas de
// teste depois com um filtro trivial.
const chargeId = `homolog_${Date.now()}`;

// `--ref` reaproveita uma nota JA emitida para provocar o 422 de ref repetida.
// A `ref` que o adapter manda a Focus e o fiscal_invoices.id, entao o id da
// linha nova precisa ser o id antigo.
const idDaLinha = refExistente;

const novaLinha: Record<string, unknown> = {
  ...(idDaLinha ? { id: idDaLinha } : {}),
  user_id: userId,
  stripe_charge_id: chargeId,
  status: "pending",
  amount_cents: 100,
  plan_code: null,
  service_description:
    "TESTE DE HOMOLOGACAO - Assinatura Bora na Tech Pro (nota de teste, sem valor fiscal)",
};

const { data: inserida, error: insertError } = await supabaseAdmin
  .from("fiscal_invoices")
  .insert(novaLinha)
  .select("id")
  .single();
if (insertError) {
  abortar(
    `falha ao criar a linha: ${insertError.message}` +
      (refExistente
        ? " (com --ref, o id precisa ser de uma nota que ainda NAO existe na nossa tabela; apague a linha antiga antes)"
        : ""),
  );
}

console.log(`linha criada: id=${(inserida as { id: string }).id}`);
console.log(`stripe_charge_id: ${chargeId}`);
if (refExistente) {
  console.log(
    `ref reaproveitada: ${refExistente} (esperado: 422 de ref ja utilizada na Focus)`,
  );
}

const antesDoJob = await lerLinha(chargeId);
imprimirLinha("estado inicial", antesDoJob);

// --- Emissao ---------------------------------------------------------------

passo("processFiscalInvoiceJob (chamado direto, sem Redis)");

try {
  await processFiscalInvoiceJob(chargeId);
  console.log("job concluiu sem relancar.");
} catch (err) {
  // Relancar e o sinal de "merece retry". Aqui nao ha fila, entao so imprime.
  console.log(
    `job RELANCOU (na fila isto viraria retry com backoff): ${err instanceof Error ? err.message : String(err)}`,
  );
}

let linha = await lerLinha(chargeId);
imprimirLinha("estado apos a emissao", linha);

// --- Polling ---------------------------------------------------------------

const POLL_INTERVALO_MS = 15_000;
const POLL_TETO_MS = 10 * 60_000;

if (linha && linha.status === "processing" && linha.provider_invoice_id) {
  passo(
    `polling do fetchStatus a cada ${POLL_INTERVALO_MS / 1000}s por ate ${POLL_TETO_MS / 60000} minutos`,
  );
  const provider = getFiscalProvider();
  const inicio = Date.now();
  let rodada = 0;

  while (Date.now() - inicio < POLL_TETO_MS) {
    rodada += 1;
    await new Promise((r) => setTimeout(r, POLL_INTERVALO_MS));
    const remoto = await provider.fetchStatus(
      String(linha!.provider_invoice_id),
    );
    console.log(
      `[poll ${rodada}] ${Math.round((Date.now() - inicio) / 1000)}s: ${JSON.stringify(remoto)}`,
    );
    if (remoto.status !== "processing") {
      // Reprocessa pelo caminho normal, para exercitar storage e e-mail em vez
      // de gravar o desfecho a mao aqui.
      passo("desfecho chegou; reprocessando pelo caminho normal");
      try {
        await processFiscalInvoiceJob(chargeId);
      } catch (err) {
        console.log(
          `reprocessamento relancou: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      linha = await lerLinha(chargeId);
      imprimirLinha("estado final", linha);
      break;
    }
  }

  if (linha && linha.status === "processing") {
    console.log(
      `\nAINDA em processing depois de ${POLL_TETO_MS / 60000} minutos. Isso NAO e falha do script: ` +
        "a prefeitura pode demorar. Rode de novo com --ref para reconsultar esta mesma nota.",
    );
  }
}

// --- Documentos e e-mail ---------------------------------------------------

passo("documentos e e-mail");

if (linha?.pdf_path || linha?.xml_path) {
  console.log(`pdf_path: ${String(linha.pdf_path ?? "(ausente)")}`);
  console.log(`xml_path: ${String(linha.xml_path ?? "(ausente)")}`);
  console.log(
    "Confira no Supabase Storage (bucket `fiscal`) se os arquivos abrem: um HTML de login salvo com nome .pdf indica autenticacao errada no download.",
  );
} else if (linha?.status === "issued") {
  console.log(
    "Nota EMITIDA e nenhum caminho gravado: o download/upload falhou (ver Sentry e o log acima). Por desenho isso NAO regride o status.",
  );
} else {
  console.log("(sem documentos: a nota ainda nao foi autorizada)");
}

console.log(
  linha?.status === "issued"
    ? `E-mail: enviado para ${email} no momento da transicao para issued (sem REDIS_URL o envio critico sai direto). Confira a caixa.`
    : "E-mail: NAO enviado (so sai na transicao para issued).",
);

// --- Checklist -------------------------------------------------------------

titulo("TODO(homologacao): o que esta rodada respondeu");

const emissao = observadas.find(
  (o) => o.method === "POST" && o.path.startsWith("/v2/nfse"),
);
const consultas = observadas.filter((o) => o.method === "GET");
const ultimaConsulta = consultas[consultas.length - 1];
const corpoFinal = (ultimaConsulta?.responseBody ?? null) as Record<
  string,
  unknown
> | null;

console.log(`
1. ALIQUOTA (fracao 0.02 vs percentual 2)
   Enviado: ${env.nfseServicoAliquota}
   Veredito: ${
     linha?.status === "issued"
       ? "ACEITO neste formato. Confira o VALOR do ISS na nota autorizada antes de concluir: formato aceito nao e o mesmo que imposto certo."
       : "INCONCLUSIVO (a nota nao chegou a ser autorizada)."
   }

2. VALOR (numero com 2 casas)
   Enviado: 1 (centavos: 100)
   Veredito: ${emissao ? `POST devolveu ${emissao.status}.` : "nao houve POST nesta rodada."}

3. CAMPOS DE DOCUMENTO na resposta da consulta
   Chaves observadas no ultimo GET: ${
     corpoFinal
       ? Object.keys(corpoFinal)
           .filter((k) => /url|caminho|link/i.test(k))
           .join(", ") || "(nenhuma chave de documento na resposta)"
       : "(nenhuma consulta nesta rodada)"
   }
   Ajuste a ordem de preferencia em mapFocusStatus se divergir de
   caminho_danfse > url_danfse > url para o PDF e caminho_xml_nota_fiscal para o XML.

4. CODIGO DO 422 de ref repetida
   ${
     refExistente
       ? emissao && emissao.status === 422
         ? `Observado: ${JSON.stringify(emissao.responseBody)}\n   Ajuste REF_JA_UTILIZADA em fiscalFocus.ts com o \`codigo\` exato.`
         : `Esperava 422 e veio ${emissao?.status ?? "(sem POST)"}. Confira se a --ref usada ja existe na Focus.`
       : "NAO testado nesta rodada. Repita com --ref <id-de-nota-ja-emitida>."
   }

5. NATUREZA_OPERACAO e REGIME_ESPECIAL_TRIBUTACAO
   Enviados: ${env.nfseNaturezaOperacao || "(omitido)"} / ${env.nfseRegimeEspecialTributacao || "(omitido)"}
   Veredito: ${
     emissao && emissao.status >= 400
       ? "o POST falhou; procure E166 ou mensagem sobre regime na resposta acima."
       : emissao
         ? "aceito pelo provedor."
         : "sem POST nesta rodada."
   }

6. CANCELAMENTO
   NAO testado nesta rodada. Rode: pnpm exec tsx scripts/homologarNfse.mts --cancelar ${linha?.id ?? "<id-da-nota>"}
`);

console.log(
  `Linha de teste: id=${linha?.id ?? "?"}, stripe_charge_id=${chargeId}.\n` +
    "Para limpar depois: delete from fiscal_invoices where stripe_charge_id like 'homolog_%';\n",
);
