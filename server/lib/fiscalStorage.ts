// PDF e XML da nota no Supabase Storage.
//
// BUCKET PRIVADO. Nao e detalhe: o arquivo carrega CPF, endereco e valor pago.
// Um bucket publico (como `avatars` e `email-assets`) tornaria cada nota
// legivel por quem adivinhasse o caminho, e o caminho contem o user_id, que nao
// e segredo. Por isso o acesso e sempre por URL ASSINADA de curta duracao,
// gerada sob demanda, e nunca persistida (URL assinada guardada no banco vira
// um link que expira e ninguem sabe por que parou de funcionar).
//
// CRIACAO DO BUCKET: este projeto NAO tem precedente de criar bucket por
// migration (o `avatars` foi criado pelo painel do Supabase; nenhuma migration
// declara storage.buckets). Entao a criacao segue sendo um passo de operacao, e
// o que existe aqui e a VERIFICACAO: com a emissao ligada, o boot confere que o
// bucket existe e e privado, e aborta com a instrucao exata se nao estiver.
// Verificar e melhor que criar em silencio: criar daria ao processo de runtime
// um poder de infraestrutura que ele nao precisa ter, e esconderia uma
// configuracao que alguem deveria ter feito conscientemente.

import * as Sentry from "@sentry/node";

import { supabaseAdmin } from "./supabaseAdmin";

export const FISCAL_BUCKET = "fiscal";

/** Segundos de validade da URL assinada. Curta de proposito. */
const SIGNED_URL_TTL_SECONDS = 300;

/**
 * Confere que o bucket existe e e privado. Chamado no boot com a emissao
 * ligada.
 *
 * Devolve a mensagem do problema, ou null quando esta tudo certo. Nao aborta o
 * processo aqui: quem decide isso e o chamador (server/index.ts), que tem o
 * contexto de o que fazer com a falha.
 */
export async function checkFiscalBucket(): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage.getBucket(FISCAL_BUCKET);

  if (error || !data) {
    return (
      `Bucket "${FISCAL_BUCKET}" nao encontrado no Supabase Storage ` +
      `(${error?.message ?? "sem detalhe"}). Crie-o no painel do Supabase ` +
      `(Storage > New bucket), com "Public bucket" DESMARCADO, e reinicie.`
    );
  }

  if (data.public) {
    return (
      `Bucket "${FISCAL_BUCKET}" existe mas esta PUBLICO. Ele guarda notas ` +
      `fiscais com CPF e endereco; torne-o privado no painel do Supabase ` +
      `(Storage > ${FISCAL_BUCKET} > Settings > Public bucket = off).`
    );
  }

  return null;
}

/**
 * Caminho canonico de um documento.
 *
 * Particiona por usuario e ano porque e assim que a busca acontece na pratica
 * ("as notas de fulano em 2026"), e porque um diretorio unico com todas as
 * notas de todos os anos fica impraticavel de listar no painel.
 */
export function fiscalObjectPath(params: {
  userId: string;
  invoiceId: string;
  ano: number;
  extensao: "pdf" | "xml";
}): string {
  return `${params.userId}/${params.ano}/${params.invoiceId}.${params.extensao}`;
}

const CONTENT_TYPE: Record<"pdf" | "xml", string> = {
  pdf: "application/pdf",
  xml: "application/xml",
};

/**
 * Sobe um documento e devolve o caminho gravado.
 *
 * `upsert: true` porque o reprocessamento de uma nota ja emitida pode passar
 * por aqui de novo: o documento e o mesmo, e falhar por "objeto ja existe"
 * transformaria uma repeticao inofensiva em erro.
 */
export async function uploadFiscalDocument(params: {
  userId: string;
  invoiceId: string;
  ano: number;
  extensao: "pdf" | "xml";
  conteudo: Buffer;
}): Promise<string> {
  const path = fiscalObjectPath(params);
  const { error } = await supabaseAdmin.storage
    .from(FISCAL_BUCKET)
    .upload(path, params.conteudo, {
      contentType: CONTENT_TYPE[params.extensao],
      upsert: true,
    });
  if (error) {
    throw new Error(
      `Falha ao subir ${params.extensao} da nota ${params.invoiceId}: ${error.message}`,
    );
  }
  return path;
}

/**
 * URL assinada de curta duracao, gerada SOB DEMANDA.
 *
 * Devolve null em vez de lancar: a listagem de notas do usuario nao pode cair
 * inteira porque um documento nao pode ser assinado. A linha aparece sem o
 * botao de download, que e degradacao honesta.
 */
export async function signedFiscalUrl(
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabaseAdmin.storage
    .from(FISCAL_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    console.error(
      `[fiscal] falha ao assinar URL de ${path}:`,
      error?.message ?? "sem detalhe",
    );
    Sentry.captureException(
      new Error(`Falha ao assinar URL fiscal: ${error?.message ?? path}`),
    );
    return null;
  }
  return data.signedUrl;
}
