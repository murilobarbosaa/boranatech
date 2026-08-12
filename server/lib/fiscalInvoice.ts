// Decisoes PURAS do pipeline fiscal: descricao do servico, status terminal e
// montagem do tomador a partir do perfil.
//
// Este arquivo NAO importa `./env`, `./supabaseAdmin` nem a fila, de proposito:
// e o que permite exercitar as decisoes que mais doem se sairem erradas
// (bloquear a emissao, dar a nota como concluida) sem Redis, sem Postgres e sem
// mock de ambiente.

import { diaBrasilia, formatarDiaCivil } from "../../shared/brasiliaDay";
import {
  buildFiscalEndereco,
  missingFiscalIdentity,
  onlyDigits,
  resolveFiscalDocumentType,
  type FiscalIdentityFields,
} from "../../shared/fiscalIdentity";
import { PLAN_PRICING, isPlanId } from "../../shared/planPricing";
import type {
  IssueInvoiceTomador,
  TomadorDocumentType,
} from "../providers/fiscalTypes";

export type FiscalInvoiceStatusRow =
  | "pending"
  | "processing"
  | "issued"
  | "failed"
  | "canceled"
  | "blocked_missing_data";

/**
 * Estados dos quais o pipeline NUNCA sai sozinho.
 *
 * 'failed' fica de FORA: falha definitiva ainda pode ser retomada por acao
 * humana ou pela reconciliacao da Fase 4 depois de o dado ser corrigido, e
 * trata-la como terminal impediria a retomada. 'blocked_missing_data' tambem
 * fica de fora, pelo mesmo motivo e de forma mais obvia: ele existe justamente
 * para ser destravado quando o cadastro chegar.
 */
const TERMINAL_STATUSES = new Set<FiscalInvoiceStatusRow>([
  "issued",
  "canceled",
]);

export function isTerminalFiscalStatus(status: string): boolean {
  return TERMINAL_STATUSES.has(status as FiscalInvoiceStatusRow);
}

/**
 * Estados que o retry MANUAL do admin aceita.
 *
 * So os dois que representam trabalho INTERROMPIDO. A lista e curta e cada
 * exclusao tem um motivo diferente:
 *
 *   issued/canceled  terminais. Reprocessar tentaria emitir de novo o que ja
 *                    existe na prefeitura, que e o dano que o pipeline inteiro
 *                    evita.
 *   pending/processing  ja estao na fila. O jobId deterministico dedupa, entao
 *                    um retry aqui nao quebraria nada, mas o botao diria ter
 *                    feito algo que nao fez. Botao que mente e pior que botao
 *                    ausente.
 *
 * Mora AQUI, e nao dentro da rota, para poder ser testado sem subir o Express.
 */
const RETRYABLE_STATUSES = new Set<FiscalInvoiceStatusRow>([
  "failed",
  "blocked_missing_data",
]);

export function isRetryableFiscalStatus(status: string): boolean {
  return RETRYABLE_STATUSES.has(status as FiscalInvoiceStatusRow);
}

/**
 * Descricao do servico que vai na nota.
 *
 * Sem travessao nem meia-risca: a regra do projeto (CLAUDE.md) proibe os dois em
 * QUALQUER texto, e aqui o texto sai impresso num documento fiscal, que e o
 * pior lugar possivel para um caractere que alguns sistemas de prefeitura ainda
 * mastigam mal.
 *
 * O periodo e formatado no dia de BRASILIA (nao no dia UTC): uma cobranca as 22h
 * de 31/07 e do dia 31 para quem pagou, e sairia como 01/08 no recorte cru do
 * ISO.
 */
export function buildServiceDescription(params: {
  planCode: string | null;
  periodStart: string | null;
  periodEnd: string | null;
}): string {
  const label = isPlanId(params.planCode ?? "")
    ? PLAN_PRICING[
        params.planCode as keyof typeof PLAN_PRICING
      ].label.toLowerCase()
    : null;

  const base = label
    ? `Assinatura Bora na Tech Pro, plano ${label}`
    : "Assinatura Bora na Tech Pro";

  const inicio = formatarDiaCivil(diaBrasilia(params.periodStart));
  const fim = formatarDiaCivil(diaBrasilia(params.periodEnd));

  // Periodo so entra COMPLETO. Meio periodo ("de 01/08/2026 a") seria pior que
  // nenhum, porque parece dado e nao e.
  if (inicio && fim) {
    return `${base}, período de ${inicio} a ${fim}`;
  }
  return base;
}

/**
 * Perfil como o pipeline fiscal precisa dele.
 *
 * Estende os campos de identidade compartilhados com o unico dado que so o
 * servidor usa: o e-mail. Os demais vem de shared/fiscalIdentity.ts, e e de la
 * que sai a decisao de completude, para o cliente e o servidor nunca
 * discordarem sobre o que falta.
 */
export type FiscalProfileRow = FiscalIdentityFields & {
  email?: string | null;
};

export type TomadorResolution =
  | { ok: true; tomador: IssueInvoiceTomador }
  | { ok: false; missing: string[] };

/**
 * Monta o tomador a partir do perfil, ou diz exatamente o que falta.
 *
 * TIPO DO DOCUMENTO POR ORIGEM, NAO POR FORMA. Ele sai de
 * `fiscal_documento_preferencia`, um campo DECLARADO pelo titular, e cada
 * documento e lido da coluna que promete guardar aquele documento (`cpf` ou
 * `cnpj`). Contar digitos para adivinhar o tipo seria classificar pela forma do
 * valor, que e a pergunta errada; o comprimento e o digito verificador entram so
 * como VALIDACAO do que a origem promete.
 *
 * PESSOA JURIDICA leva RAZAO SOCIAL no lugar do nome civil, e nao exige
 * full_name nem CPF: uma nota para CNPJ nao identifica pessoa fisica nenhuma.
 *
 * ENDERECO NAO ENTRA em `missing` (contrato herdado da Fase 1). Ele e montado
 * quando houver o minimo (CEP, cidade, UF) e omitido quando nao houver, sem
 * jamais bloquear.
 */
export function resolveTomador(
  profile: FiscalProfileRow | null,
  authEmail: string | null,
): TomadorResolution {
  // Fonte UNICA da completude, compartilhada com o cliente. Se esta lista e a
  // do banner divergirem, o usuario ve "tudo certo" com a nota travada.
  const missing = [...missingFiscalIdentity(profile)];

  // E-mail nao entra em missingFiscalIdentity porque o cliente nao consegue
  // responder por ele: o fallback e o e-mail de AUTH, que so o servidor le.
  const email = (profile?.email || authEmail || "").trim();
  if (!email) missing.push("email");

  if (missing.length > 0) return { ok: false, missing };

  const tipoDocumento: TomadorDocumentType = resolveFiscalDocumentType(profile);
  const pessoaJuridica = tipoDocumento === "cnpj";

  const nome = pessoaJuridica
    ? (profile?.razao_social ?? "").trim()
    : (profile?.full_name ?? "").trim();
  const documento = onlyDigits(pessoaJuridica ? profile?.cnpj : profile?.cpf);

  const endereco = buildFiscalEndereco(profile);

  return {
    ok: true,
    tomador: {
      nome,
      documento,
      tipoDocumento,
      email,
      // Chave OMITIDA quando nao ha endereco, em vez de `endereco: null`: o
      // contrato do provider diz opcional, e null obrigaria cada adapter a
      // distinguir "sem endereco" de "endereco vazio".
      ...(endereco ? { endereco } : {}),
    },
  };
}
