// Fila de emissao de NFS-e. Fila PROPRIA, separada da `emails`, porque aquela e
// uma uniao fechada de tipos de e-mail (`EmailJobData`) com limiter calibrado
// para o teto do Resend: enfiar emissao fiscal la dentro amarraria a cadencia da
// prefeitura ao rate limit de e-mail, que nao tem nada a ver.
//
// TRES escolhas de desenho que valem o comentario:
//
// 1. jobId DETERMINISTICO = stripe_charge_id. Reentrega de webhook (a Stripe
//    reenvia por ate ~3 dias) vira no-op no `add`, sem duplicar job. Duplicar
//    job aqui nao seria um retry a mais: seria risco de nota em duplicidade,
//    que e problema fiscal, nao operacional.
//
// 2. attempts 12 com backoff exponencial base 60s. A escala e de HORAS, nao de
//    segundos, porque a falha tipica e prefeitura fora do ar. Com base 60s as 12
//    tentativas cobrem algo perto de um dia inteiro antes de desistir, e a
//    Fase 4 (cron de reconciliacao) e quem pega o que passar disso.
//
// 3. SEM fallback de execucao direta com o Redis ausente (ao contrario do
//    `enqueueEmail`, que envia direto os criticos). Emitir nota fora da fila
//    seria emitir sem retry e sem registro de tentativa; a linha fica 'pending' e
//    o cron da Fase 4 varre. Nota nao emitida hoje e recuperavel; nota emitida
//    duas vezes, nao.

import * as Sentry from "@sentry/node";
import { Queue, Worker, type Job } from "bullmq";

import { diaBrasilia } from "../../shared/brasiliaDay";
import { env } from "./env";
import {
  buildServiceDescription,
  isTerminalFiscalStatus,
  resolveTomador,
  type FiscalProfileRow,
} from "./fiscalInvoice";
import { uploadFiscalDocument } from "./fiscalStorage";
import { enqueueEmail } from "./queue";
import { queueConnection } from "./redis";
import { withRedisOpTimeout } from "./redisOpTimeout";
import { supabaseAdmin } from "./supabaseAdmin";
import { getFiscalProvider } from "../providers/fiscal";
import type {
  FiscalDocumentRefs,
  FiscalProvider,
} from "../providers/fiscalTypes";

const QUEUE_NAME = "fiscal-invoices";
const FISCAL_ATTEMPTS = 12;
const FISCAL_BACKOFF_MS = 60_000;
const ERROR_MESSAGE_MAX = 500;

/**
 * Colunas de profiles que a emissao le. Constante UNICA porque duas listas
 * (aqui e no destravamento) que precisam ser iguais divergem no primeiro campo
 * novo, e o sintoma seria o pior possivel: o destravamento acharia o cadastro
 * completo e o worker acharia incompleto, produzindo um ciclo de desbloqueio e
 * rebloqueio que ninguem entende olhando o log.
 */
const FISCAL_PROFILE_COLUMNS =
  "full_name, cpf, cnpj, razao_social, fiscal_documento_preferencia, " +
  "endereco_cep, endereco_logradouro, endereco_numero, endereco_complemento, " +
  "endereco_bairro, endereco_cidade, endereco_uf, endereco_codigo_municipio, " +
  "email";

/**
 * Dois trabalhos na MESMA fila: emitir e cancelar.
 *
 * `kind` OPCIONAL no ramo de emissao, e ausente significa "issue": jobs
 * enfileirados antes desta fase (pelas Fases 1 a 3) chegam sem o campo, e um
 * `kind` obrigatorio faria o worker cair no `default` e descartar emissao ja
 * paga. Compatibilidade de payload de fila e a mesma classe de problema do
 * expand/contract de campo de resposta.
 *
 * Fila unica, e nao uma segunda: os dois trabalhos falam com o mesmo provedor,
 * tem a mesma escala de retry (prefeitura fora do ar) e a mesma concorrencia.
 */
export type FiscalInvoiceJobData =
  | {
      kind?: "issue";
      /** Chave da linha em fiscal_invoices e tambem o jobId. */
      stripeChargeId: string;
    }
  | {
      kind: "cancel";
      stripeChargeId: string;
      justificativa: string;
    };

export const fiscalInvoiceQueue = queueConnection
  ? new Queue<FiscalInvoiceJobData>(QUEUE_NAME, {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: FISCAL_ATTEMPTS,
        backoff: { type: "exponential", delay: FISCAL_BACKOFF_MS },
        removeOnComplete: 500,
        removeOnFail: 5000,
      },
    })
  : null;

/**
 * Enfileira a emissao. NUNCA emite direto (ver a nota 3 do cabecalho).
 *
 * Erro de `add` PROPAGA para o chamador decidir. Os ganchos do webhook engolem
 * (com captura no Sentry) porque falha fiscal nao pode derrubar ativacao de
 * acesso; um chamador futuro pode querer o contrario.
 */
export async function enqueueFiscalInvoice(
  stripeChargeId: string,
): Promise<void> {
  if (!fiscalInvoiceQueue) {
    console.warn(
      `[fiscal] REDIS_URL ausente. Emissao de ${stripeChargeId} NAO enfileirada; a linha fica pending para a reconciliacao.`,
    );
    return;
  }
  await withRedisOpTimeout(
    fiscalInvoiceQueue.add(
      "issue",
      { kind: "issue", stripeChargeId },
      { jobId: stripeChargeId },
    ),
    `fiscal:${stripeChargeId}`,
  );
}

/**
 * Enfileira o CANCELAMENTO de uma nota emitida.
 *
 * jobId com prefixo proprio (`cancel:`): se compartilhasse o jobId da emissao,
 * um cancelamento seria descartado como duplicata do job que emitiu aquela
 * mesma nota, e a nota ficaria valendo depois de um reembolso integral.
 */
export async function enqueueFiscalCancel(
  stripeChargeId: string,
  justificativa: string,
): Promise<void> {
  if (!fiscalInvoiceQueue) {
    console.warn(
      `[fiscal] REDIS_URL ausente. Cancelamento de ${stripeChargeId} NAO enfileirado; a reconciliacao nao cobre este caso.`,
    );
    return;
  }
  await withRedisOpTimeout(
    fiscalInvoiceQueue.add(
      "cancel",
      { kind: "cancel", stripeChargeId, justificativa },
      { jobId: `cancel:${stripeChargeId}` },
    ),
    `fiscal-cancel:${stripeChargeId}`,
  );
}

export type RegisterFiscalInvoiceInput = {
  userId: string;
  subscriptionId: string | null;
  stripeChargeId: string;
  stripeInvoiceId: string | null;
  stripePaymentIntentId: string | null;
  amountCents: number;
  planCode: string | null;
  periodStart: string | null;
  periodEnd: string | null;
};

/**
 * Registra a intencao de emitir e enfileira. Chamado pelos ganchos do webhook.
 *
 * `ignoreDuplicates` no upsert e deliberado: numa reentrega, a linha ja existe e
 * pode estar em 'processing' ou 'issued'. Sobrescrever devolveria uma nota
 * emitida para 'pending' e o worker tentaria emitir de novo. Reentrega tem que
 * ser no-op no banco e no-op na fila, e as duas coisas sao garantidas aqui (o
 * `ignoreDuplicates` de um lado, o jobId deterministico do outro).
 */
export async function registerFiscalInvoice(
  input: RegisterFiscalInvoiceInput,
): Promise<void> {
  const { error } = await supabaseAdmin.from("fiscal_invoices").upsert(
    {
      user_id: input.userId,
      subscription_id: input.subscriptionId,
      stripe_charge_id: input.stripeChargeId,
      stripe_invoice_id: input.stripeInvoiceId,
      stripe_payment_intent_id: input.stripePaymentIntentId,
      status: "pending",
      amount_cents: input.amountCents,
      plan_code: input.planCode,
      service_description: buildServiceDescription({
        planCode: input.planCode,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
      }),
    },
    { onConflict: "stripe_charge_id", ignoreDuplicates: true },
  );
  if (error) {
    throw new Error(`Falha ao registrar nota fiscal: ${error.message}`);
  }
  await enqueueFiscalInvoice(input.stripeChargeId);
}

/**
 * Destrava as notas que pararam por falta de cadastro e as devolve para a fila.
 *
 * CHAMADO DE DOIS LUGARES, e e por isso que e uma funcao e nao um trecho dentro
 * da rota: PATCH /api/me chama quando o titular completa os dados (caminho
 * rapido), e a reconciliacao da Fase 4 vai chamar varrendo quem ficou para tras
 * (rede de seguranca). Os dois precisam da MESMA decisao; duas copias
 * divergiriam na primeira mudanca de regra.
 *
 * NAO decide sozinho se o cadastro esta completo: pergunta ao mesmo
 * `resolveTomador` que o worker usa. Se o destravamento usasse um criterio
 * proprio, ele devolveria para a fila notas que o worker rebloquearia em
 * seguida, num ciclo silencioso.
 *
 * Volta para 'pending' de forma CONDICIONAL (`.eq("status", ...)`): uma linha
 * que saiu de blocked_missing_data entre a leitura e a escrita nao e puxada de
 * volta.
 *
 * @returns quantas notas foram devolvidas para a fila.
 */
export async function unblockFiscalInvoices(userId: string): Promise<number> {
  const { data: bloqueadas, error: readError } = await supabaseAdmin
    .from("fiscal_invoices")
    .select("id, stripe_charge_id")
    .eq("user_id", userId)
    .eq("status", "blocked_missing_data");
  if (readError) {
    throw new Error(`Falha ao buscar notas bloqueadas: ${readError.message}`);
  }
  if (!bloqueadas || bloqueadas.length === 0) return 0;

  const { profile, authEmail } = await loadTomadorSources(userId);
  const tomador = resolveTomador(profile, authEmail);
  // Cadastro ainda incompleto: nao mexe em nada. Devolver para 'pending' aqui
  // faria o worker rebloquear na hora, queimando um job por nota e apagando o
  // motivo do bloqueio que ja estava gravado.
  if (!tomador.ok) return 0;

  let devolvidas = 0;
  for (const linha of bloqueadas as Array<{
    id: string;
    stripe_charge_id: string;
  }>) {
    const { data: atualizada, error: updateError } = await supabaseAdmin
      .from("fiscal_invoices")
      .update({ status: "pending", error_code: null, error_message: null })
      .eq("id", linha.id)
      .eq("status", "blocked_missing_data")
      .select("id");
    if (updateError) {
      throw new Error(
        `Falha ao destravar a nota ${linha.id}: ${updateError.message}`,
      );
    }
    if (!atualizada || atualizada.length === 0) continue; // corrida: outro ja pegou.

    // jobId deterministico por stripe_charge_id: se um job daquela cobranca
    // ainda estiver vivo no Redis, este add e no-op, e nao ha duplicata.
    await enqueueFiscalInvoice(linha.stripe_charge_id);
    devolvidas += 1;
  }

  if (devolvidas > 0) {
    console.log(
      `[fiscal] ${devolvidas} nota(s) destravada(s) para o usuario ${userId}.`,
    );
  }
  return devolvidas;
}

type FiscalInvoiceRow = {
  id: string;
  user_id: string;
  status: string;
  amount_cents: number;
  service_description: string | null;
  provider_invoice_id: string | null;
  attempts: number;
  tomador_email: string | null;
};

/**
 * PONTO UNICO da transicao para 'issued'.
 *
 * Os dois caminhos que emitem (o retorno sincrono do issue e o ramo de
 * reconsulta) passam POR AQUI, e so aqui a nota vira emitida, o documento vai
 * para o storage e o e-mail e enfileirado. Ter dois lugares fazendo isso seria
 * ter dois lugares decidindo se o e-mail ja saiu, e a resposta erraria em algum
 * deles no primeiro reprocessamento.
 *
 * A GARANTIA DE ENVIO UNICO nao e uma flag nova: e o proprio UPDATE
 * condicional. Ele so casa quando a linha AINDA NAO esta 'issued', entao quem
 * de fato mudou o estado recebe a linha de volta e enfileira o e-mail; qualquer
 * reprocessamento casa zero linhas e sai calado. Mesmo padrao do flip de boleto
 * em providers/stripe.ts, e pelo mesmo motivo.
 */
async function finalizarEmissao(
  row: FiscalInvoiceRow,
  provider: FiscalProvider,
  refs: FiscalDocumentRefs,
): Promise<void> {
  const agora = new Date();

  // Documentos ANTES do flip: com os caminhos ja no patch, uma linha 'issued'
  // sem documento passa a significar "o download falhou", e nao "ainda nao
  // tentei". Falha aqui nao regride nada (ver arquivarDocumentos).
  const documentos = await arquivarDocumentos(row, provider, refs, agora);

  const { data: transicionadas, error } = await supabaseAdmin
    .from("fiscal_invoices")
    .update({
      status: "issued",
      issued_at: agora.toISOString(),
      numero: refs.numero ?? null,
      serie: refs.serie ?? null,
      codigo_verificacao: refs.codigoVerificacao ?? null,
      pdf_path: documentos.pdfPath,
      xml_path: documentos.xmlPath,
      error_code: null,
      error_message: null,
    })
    .eq("id", row.id)
    .neq("status", "issued")
    .select("id");

  if (error) {
    throw new Error(`Falha ao concluir a nota ${row.id}: ${error.message}`);
  }

  // Ja estava emitida: outro processamento chegou primeiro e ja mandou o
  // e-mail. Sair aqui e o que impede o reenvio.
  if (!transicionadas || transicionadas.length === 0) return;

  await enfileirarEmailDaNota(row, refs, documentos.pdfBase64);
}

/**
 * Baixa PDF e XML e sobe para o bucket privado. NUNCA lanca.
 *
 * A nota JA EXISTE na prefeitura quando este passo roda. Deixar uma falha de
 * download derrubar o job faria a linha voltar para o retry e, na pior
 * hipotese, permanecer eternamente fora de 'issued' por causa de um arquivo,
 * enquanto o documento fiscal existe la fora. Por isso: loga, avisa o Sentry,
 * devolve caminhos nulos, e a reconciliacao da Fase 4 completa depois.
 */
async function arquivarDocumentos(
  row: FiscalInvoiceRow,
  provider: FiscalProvider,
  refs: FiscalDocumentRefs,
  agora: Date,
): Promise<{
  pdfPath: string | null;
  xmlPath: string | null;
  pdfBase64: string | null;
}> {
  const vazio = { pdfPath: null, xmlPath: null, pdfBase64: null };
  if (!refs.pdfUrl && !refs.xmlUrl) return vazio;

  const ano =
    Number(diaBrasilia(agora.toISOString())?.slice(0, 4) ?? "0") ||
    agora.getUTCFullYear();

  const baixarESubir = async (
    url: string | undefined,
    extensao: "pdf" | "xml",
  ): Promise<{ path: string | null; conteudo: Buffer | null }> => {
    if (!url) return { path: null, conteudo: null };
    try {
      const conteudo = await provider.downloadDocument(url);
      const path = await uploadFiscalDocument({
        userId: row.user_id,
        invoiceId: row.id,
        ano,
        extensao,
        conteudo,
      });
      return { path, conteudo };
    } catch (err) {
      console.error(
        `[fiscal] falha ao arquivar ${extensao} da nota ${row.id}; a nota SEGUE emitida:`,
        err,
      );
      Sentry.captureException(err);
      return { path: null, conteudo: null };
    }
  };

  const pdf = await baixarESubir(refs.pdfUrl, "pdf");
  const xml = await baixarESubir(refs.xmlUrl, "xml");

  return {
    pdfPath: pdf.path,
    xmlPath: xml.path,
    pdfBase64: pdf.conteudo ? pdf.conteudo.toString("base64") : null,
  };
}

/**
 * Enfileira o e-mail com a nota. Best-effort, no mesmo contrato dos ganchos do
 * webhook: a nota ja esta emitida e arquivada, e falhar aqui nao pode desfazer
 * isso nem provocar retry (o retry re-tentaria a transicao, que agora casa zero
 * linhas, e o e-mail nunca sairia mesmo).
 */
async function enfileirarEmailDaNota(
  row: FiscalInvoiceRow,
  refs: FiscalDocumentRefs,
  pdfBase64: string | null,
): Promise<void> {
  try {
    if (!row.tomador_email) {
      console.error(
        `[fiscal] nota ${row.id} emitida sem e-mail do tomador; nada enviado.`,
      );
      return;
    }
    await enqueueEmail({
      type: "fiscal_invoice_issued",
      to: row.tomador_email,
      numero: refs.numero ?? null,
      codigoVerificacao: refs.codigoVerificacao ?? null,
      descricao: row.service_description,
      valorLabel: formatBrl(row.amount_cents),
      pdfBase64,
      pdfFilename: pdfBase64
        ? `nota-fiscal-${refs.numero ?? row.id}.pdf`
        : null,
    });
  } catch (err) {
    console.error(
      `[fiscal] falha ao enfileirar o e-mail da nota ${row.id}; a nota segue emitida:`,
      err,
    );
    Sentry.captureException(err);
  }
}

function formatBrl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

async function loadRow(
  stripeChargeId: string,
): Promise<FiscalInvoiceRow | null> {
  const { data, error } = await supabaseAdmin
    .from("fiscal_invoices")
    .select(
      "id, user_id, status, amount_cents, service_description, provider_invoice_id, attempts, tomador_email",
    )
    .eq("stripe_charge_id", stripeChargeId)
    .maybeSingle();
  if (error) {
    throw new Error(`Falha ao ler a nota fiscal: ${error.message}`);
  }
  return (data as FiscalInvoiceRow | null) ?? null;
}

async function patchRow(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("fiscal_invoices")
    .update(patch)
    .eq("id", id);
  if (error) {
    throw new Error(`Falha ao atualizar a nota fiscal: ${error.message}`);
  }
}

/** Perfil + e-mail de auth do tomador. */
async function loadTomadorSources(
  userId: string,
): Promise<{ profile: FiscalProfileRow | null; authEmail: string | null }> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select(FISCAL_PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(`Falha ao ler o perfil do tomador: ${error.message}`);
  }
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
  return {
    profile: (profile as FiscalProfileRow | null) ?? null,
    authEmail: authData?.user?.email ?? null,
  };
}

/**
 * Uma tentativa de emissao.
 *
 * Lanca quando (e SOMENTE quando) a tentativa merece retry. Sair sem lancar
 * significa "este job acabou", seja com sucesso, seja com um estado que repetir
 * nao conserta.
 */
export async function processFiscalInvoiceJob(
  stripeChargeId: string,
): Promise<void> {
  const row = await loadRow(stripeChargeId);

  // Sem linha: nada a emitir. Job de uma linha que foi removida a mao, ou
  // reentrega depois de um rollback. No-op, nao erro.
  if (!row) {
    console.warn(
      `[fiscal] nenhuma linha para a cobranca ${stripeChargeId}; job ignorado.`,
    );
    return;
  }

  // Idempotencia: ja emitida ou cancelada nao volta atras.
  if (isTerminalFiscalStatus(row.status)) return;

  const provider = getFiscalProvider();

  // JA ENTREGUE AO PROVEDOR: consulta, nunca reemite. Chamar issue() de novo
  // com uma nota ja aberta la produziria uma segunda nota para a mesma
  // cobranca, que e exatamente o dano que a fila inteira existe para evitar.
  if (row.provider_invoice_id && row.status === "processing") {
    const remoto = await provider.fetchStatus(row.provider_invoice_id);

    if (remoto.status === "issued") {
      // Caminho NORMAL da emissao real, que e assincrona: e aqui que numero,
      // codigo de verificacao e documentos chegam.
      await finalizarEmissao(row, provider, remoto);
      return;
    }

    if (remoto.status === "canceled") {
      await patchRow(row.id, { status: "canceled" });
      return;
    }

    if (remoto.status === "failed") {
      await patchRow(row.id, {
        // Retentavel continua 'processing': ainda ha alguem trabalhando nisto.
        status: remoto.retryable ? "processing" : "failed",
        error_code: remoto.errorCode,
        error_message: remoto.errorMessage.slice(0, ERROR_MESSAGE_MAX),
      });
      if (remoto.retryable) {
        throw new Error(
          `Consulta da nota ${row.provider_invoice_id} falhou de forma retentavel (${remoto.errorCode}): ${remoto.errorMessage}`,
        );
      }
      console.error(
        `[fiscal] nota ${row.id} rejeitada no provedor (${remoto.errorCode}): ${remoto.errorMessage}`,
      );
      return;
    }

    // Ainda processando la: relanca para o BullMQ tentar de novo com backoff.
    throw new Error(
      `Nota ${row.provider_invoice_id} ainda em processamento no provedor.`,
    );
  }

  const { profile, authEmail } = await loadTomadorSources(row.user_id);
  const tomador = resolveTomador(profile, authEmail);

  // Dado de cadastro faltando NAO e falha retentavel: o tempo nao preenche CPF.
  // Estado proprio, sem relancar, para o job encerrar limpo em vez de queimar
  // 12 tentativas contra uma coluna vazia.
  if (!tomador.ok) {
    await patchRow(row.id, {
      status: "blocked_missing_data",
      error_code: "missing_tomador_data",
      error_message: `Cadastro incompleto para emissao: ${tomador.missing.join(", ")}.`,
    });
    console.warn(
      `[fiscal] nota ${row.id} bloqueada por cadastro incompleto (${tomador.missing.join(", ")}).`,
    );
    return;
  }

  // Snapshot do tomador CONGELADO agora, junto com a transicao para
  // 'processing': depois disto a nota nao le mais `profiles`, e uma correcao de
  // perfil nao muda o que foi enviado ao provedor.
  await patchRow(row.id, {
    status: "processing",
    attempts: row.attempts + 1,
    provider: provider.name,
    tomador_nome: tomador.tomador.nome,
    tomador_documento: tomador.tomador.documento,
    tomador_tipo_documento: tomador.tomador.tipoDocumento,
    tomador_email: tomador.tomador.email,
    tomador_endereco: tomador.tomador.endereco ?? null,
  });

  // O BURACO DE DUPLICIDADE DA FASE 1 ESTA FECHADO, e nao por confianca: o
  // adapter da Focus CONSULTA a `ref` antes de postar e trata o 422 de "ref ja
  // utilizada" como sinal de consulta (server/providers/fiscalFocus.ts). Se a
  // resposta de um POST anterior se perdeu no timeout, a proxima tentativa
  // encontra a nota que ja existe la em vez de criar uma segunda.
  //
  // A `ref` continua sendo o nosso fiscal_invoices.id, como desde a Fase 1.
  const resultado = await provider.issue({
    referenceId: row.id,
    tomador: tomador.tomador,
    servico: {
      descricao: row.service_description ?? "Assinatura Bora na Tech Pro",
      valorCents: row.amount_cents,
    },
  });

  if (resultado.status === "issued") {
    // Caminho raro com emissao real (a Focus responde 'processando_autorizacao'
    // no 201), mas possivel numa reemissao de nota ja autorizada. Passa pelo
    // MESMO ponto unico do ramo de reconsulta: um segundo trecho gravando
    // 'issued' aqui seria um segundo lugar decidindo se o e-mail ja saiu.
    await patchRow(row.id, {
      provider_invoice_id: resultado.providerInvoiceId,
    });
    await finalizarEmissao(row, provider, resultado);
    return;
  }

  if (resultado.status === "processing") {
    // Grava a referencia ANTES de relancar: sem ela, a proxima tentativa nao
    // saberia que ja existe nota aberta no provedor e emitiria outra.
    await patchRow(row.id, {
      provider_invoice_id: resultado.providerInvoiceId,
    });
    throw new Error(
      `Nota ${resultado.providerInvoiceId} aceita e em processamento no provedor.`,
    );
  }

  await patchRow(row.id, {
    // Retentavel continua 'processing' (o job vai voltar); nao retentavel encerra
    // em 'failed'. O status precisa dizer se ainda ha alguem trabalhando nisto.
    status: resultado.retryable ? "processing" : "failed",
    error_code: resultado.errorCode,
    error_message: resultado.errorMessage.slice(0, ERROR_MESSAGE_MAX),
  });

  if (resultado.retryable) {
    throw new Error(
      `Emissao falhou de forma retentavel (${resultado.errorCode}): ${resultado.errorMessage}`,
    );
  }

  console.error(
    `[fiscal] nota ${row.id} falhou definitivamente (${resultado.errorCode}): ${resultado.errorMessage}`,
  );
}

/**
 * Cancela uma nota emitida junto ao provedor.
 *
 * NUNCA finge cancelado. Se a prefeitura recusar (o caso comum e prazo
 * municipal vencido), a nota CONTINUA 'issued', o motivo fica gravado e
 * `precisa_revisao` sobe. Marcar 'canceled' sem o provedor ter cancelado seria
 * a pior mentira possivel nesta tabela: o documento continua valendo no
 * municipio, e o nosso banco diria que nao.
 *
 * Nao relanca em recusa: repetir uma recusa por prazo nao muda o prazo. Relanca
 * apenas quando nem chegou a falar com o provedor (erro de transporte), que e o
 * que o backoff resolve.
 */
export async function processFiscalCancelJob(
  stripeChargeId: string,
  justificativa: string,
): Promise<void> {
  const row = await loadRow(stripeChargeId);
  if (!row) {
    console.warn(
      `[fiscal] cancelamento sem linha para ${stripeChargeId}; job ignorado.`,
    );
    return;
  }
  if (row.status === "canceled") return; // idempotente
  if (row.status !== "issued" || !row.provider_invoice_id) {
    // So nota emitida pode ser cancelada. Qualquer outro estado e ruido de
    // corrida (a emissao falhou antes do cancelamento chegar).
    console.warn(
      `[fiscal] cancelamento ignorado para ${row.id}: status ${row.status}.`,
    );
    return;
  }

  const provider = getFiscalProvider();
  try {
    await provider.cancel(row.provider_invoice_id, justificativa);
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : String(err);
    console.error(
      `[fiscal] cancelamento RECUSADO para a nota ${row.id}; ela SEGUE emitida:`,
      mensagem,
    );
    await patchRow(row.id, {
      precisa_revisao: true,
      error_code: "cancelamento_recusado",
      error_message: mensagem.slice(0, ERROR_MESSAGE_MAX),
    });
    Sentry.captureException(err);
    return;
  }

  await patchRow(row.id, {
    status: "canceled",
    error_code: null,
    error_message: null,
    precisa_revisao: false,
  });
  console.log(`[fiscal] nota ${row.id} cancelada no provedor.`);
}

export function createFiscalInvoiceWorker() {
  if (!queueConnection) {
    console.warn("[fiscal] REDIS_URL ausente. Worker fiscal não iniciado.");
    return null;
  }

  const worker = new Worker<FiscalInvoiceJobData>(
    QUEUE_NAME,
    async (job: Job<FiscalInvoiceJobData>) => {
      // `kind` ausente = 'issue', para nao descartar job enfileirado antes da
      // Fase 4 (ver o comentario do tipo).
      if (job.data.kind === "cancel") {
        await processFiscalCancelJob(
          job.data.stripeChargeId,
          job.data.justificativa,
        );
        return;
      }
      await processFiscalInvoiceJob(job.data.stripeChargeId);
    },
    {
      connection: queueConnection,
      // Baixa de proposito: emissao fiscal nao tem pressa e o gargalo e a
      // prefeitura, nao nos.
      concurrency: 2,
    },
  );

  worker.on("completed", (job) => {
    console.log(`[fiscal] Job ${job.id} concluído`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[fiscal] Job ${job?.id} falhou:`, err.message);
    Sentry.withScope((scope) => {
      scope.setTag("jobName", QUEUE_NAME);
      scope.setTag("jobId", String(job?.id ?? "unknown"));
      Sentry.captureException(err);
    });
  });

  worker.on("error", (err) => {
    console.error("[fiscal] Erro no worker fiscal:", err.message);
  });

  return worker;
}
