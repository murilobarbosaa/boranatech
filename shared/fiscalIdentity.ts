// Identidade FISCAL do tomador: validacao de documento, CEP e UF, e a decisao
// de "este cadastro da para emitir nota?".
//
// COMPARTILHADO de proposito, e nao duplicado nos dois lados. Tres consumidores
// fazem a MESMA pergunta e precisam da mesma resposta:
//
//   - server/routes/me.ts        valida o que entra;
//   - server/lib/fiscalInvoice.ts decide se a nota sai ou fica bloqueada;
//   - o cliente (modal, gate do checkout, banner) decide se pede o dado.
//
// Se o cliente achasse "completo" o que o servidor considera incompleto, o
// banner sumiria e a nota continuaria bloqueada, sem ninguem perceber. Essa e
// exatamente a familia de falha que este projeto ja catalogou: veredito certo
// sobre uma superficie menor. Uma funcao so, e os tres perguntam a ela.

/** Documento fiscal do tomador. Declarado, nunca inferido por comprimento. */
export type FiscalDocumentType = "cpf" | "cnpj";

export const FISCAL_DOCUMENT_TYPES: readonly FiscalDocumentType[] = [
  "cpf",
  "cnpj",
];

export function isFiscalDocumentType(
  value: unknown,
): value is FiscalDocumentType {
  return value === "cpf" || value === "cnpj";
}

/** As 27 unidades federativas. Lista FECHADA: nao ha 28a. */
export const UF_LIST = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export type Uf = (typeof UF_LIST)[number];

const UF_SET = new Set<string>(UF_LIST);

export function onlyDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/**
 * Valida CPF pelos dois digitos verificadores. Opera so sobre digitos (qualquer
 * mascara e ignorada). Rejeita comprimento != 11 e as sequencias de digito
 * repetido (00000000000 ... 99999999999), que passam na conta mas nao sao CPFs.
 *
 * A implementacao MOROU em shared/certificates/types.ts ate a Fase 2 da NFS-e.
 * Foi movida para ca porque passou a ter dois donos (certificado e nota fiscal),
 * e aquele modulo continua exportando o mesmo nome por re-export: nenhum
 * chamador precisou mudar, e nao existe uma segunda copia para divergir.
 */
export function isValidCpf(raw: string): boolean {
  const digits = onlyDigits(raw);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const nums = digits.split("").map((d) => Number(d));

  const checkDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) {
      sum += nums[i] * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return checkDigit(9) === nums[9] && checkDigit(10) === nums[10];
}

/**
 * Valida CNPJ pelos dois digitos verificadores.
 *
 * Os pesos NAO sao uma progressao simples como no CPF: comecam em 5 (ou 6, para
 * o segundo digito) e voltam para 9 depois de chegar a 2. Escrever isso como
 * `length + 1 - i` (a formula do CPF) da um numero plausivel e errado, que e o
 * tipo de bug que so aparece em uma fracao dos documentos. Por isso os pesos
 * estao declarados, nao calculados.
 *
 * Mesma politica do CPF quanto a digito repetido: 00000000000000 passa na conta
 * e nao e CNPJ.
 */
export function isValidCnpj(raw: string): boolean {
  const digits = onlyDigits(raw);
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const nums = digits.split("").map((d) => Number(d));

  const checkDigit = (weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i += 1) {
      sum += nums[i] * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const first = checkDigit([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return first === nums[12] && second === nums[13];
}

/**
 * CEP: 8 digitos. NAO ha digito verificador em CEP, entao a validacao para no
 * comprimento de propósito, e o resolver nunca afirma que o endereco existe.
 * Quem confirma isso e a consulta ao ViaCEP no cliente, que e sugestao e nao
 * barreira (CEP novo pode nao estar na base e o usuario precisa poder digitar).
 */
export function isValidCep(raw: string): boolean {
  return onlyDigits(raw).length === 8;
}

/** UF pela lista fechada, case-insensitive na entrada. */
export function isValidUf(raw: string | null | undefined): boolean {
  return UF_SET.has((raw ?? "").trim().toUpperCase());
}

/**
 * Nome civil: pelo menos duas palavras de 2+ caracteres.
 *
 * Mesma regra que server/routes/me.ts ja aplicava a full_name e que a
 * CompleteProfileModal do certificado repetia por conta propria. Aqui ela passa
 * a ter um dono so.
 */
export function isValidFullName(raw: string | null | undefined): boolean {
  const words = (raw ?? "").trim().split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.every((word) => word.length >= 2);
}

/** Campos de identidade fiscal, como vivem em public.profiles. */
export type FiscalIdentityFields = {
  full_name?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  razao_social?: string | null;
  fiscal_documento_preferencia?: string | null;
  endereco_cep?: string | null;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  endereco_codigo_municipio?: string | null;
};

/**
 * Qual documento vai na nota.
 *
 * A preferencia DECLARADA manda. Sem preferencia, cai em CPF, que e o unico que
 * o produto coletava antes da Fase 2: assim toda conta anterior continua
 * resolvendo do jeito que sempre resolveu, sem backfill.
 */
export function resolveFiscalDocumentType(
  fields: FiscalIdentityFields | null | undefined,
): FiscalDocumentType {
  const declared = fields?.fiscal_documento_preferencia;
  return isFiscalDocumentType(declared) ? declared : "cpf";
}

/**
 * O que falta para emitir. Lista TODOS os pendentes, nunca so o primeiro: quem
 * for completar o cadastro precisa ver tudo de uma vez, e nao descobrir o
 * proximo campo a cada tentativa.
 *
 * ENDERECO NAO ENTRA. Ele e recomendado, nao obrigatorio, e o contrato vem da
 * Fase 1: ausencia de endereco jamais bloqueia a emissao. Quando um municipio
 * exigir, quem cobra e o adapter dele, com mensagem propria.
 */
export function missingFiscalIdentity(
  fields: FiscalIdentityFields | null | undefined,
): string[] {
  const missing: string[] = [];
  const tipo = resolveFiscalDocumentType(fields);

  if (tipo === "cnpj") {
    // Pessoa juridica: quem assina a nota e a razao social, nao o nome civil.
    if (!(fields?.razao_social ?? "").trim()) missing.push("razao_social");
    const cnpj = onlyDigits(fields?.cnpj);
    if (!cnpj) missing.push("cnpj");
    else if (!isValidCnpj(cnpj)) missing.push("cnpj_invalido");
    return missing;
  }

  // Pessoa fisica: nome CIVIL (full_name). `name` e nome de exibicao e pode ser
  // apelido; apelido em documento fiscal nao serve.
  if (!isValidFullName(fields?.full_name)) missing.push("nome");
  const cpf = onlyDigits(fields?.cpf);
  if (!cpf) missing.push("cpf");
  else if (!isValidCpf(cpf)) missing.push("cpf_invalido");
  return missing;
}

export function hasFiscalIdentity(
  fields: FiscalIdentityFields | null | undefined,
): boolean {
  return missingFiscalIdentity(fields).length === 0;
}

export type FiscalEndereco = {
  cep: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  codigoMunicipio?: string;
};

/**
 * Monta o endereco do tomador, ou devolve null.
 *
 * MINIMO EXIGIDO: CEP valido, cidade e UF. Abaixo disso devolve null em vez de
 * um objeto meio preenchido: endereco parcial num documento fiscal parece dado
 * e nao e, e o provedor rejeitaria depois de a nota ja estar em transito. Null
 * e um estado legitimo aqui (a Fase 1 decidiu que endereco nao bloqueia).
 */
export function buildFiscalEndereco(
  fields: FiscalIdentityFields | null | undefined,
): FiscalEndereco | null {
  const cep = onlyDigits(fields?.endereco_cep);
  const cidade = (fields?.endereco_cidade ?? "").trim();
  const uf = (fields?.endereco_uf ?? "").trim().toUpperCase();

  if (!isValidCep(cep) || !cidade || !isValidUf(uf)) return null;

  const opcional = (value: string | null | undefined): string | undefined => {
    const trimmed = (value ?? "").trim();
    return trimmed === "" ? undefined : trimmed;
  };

  return {
    cep,
    logradouro: opcional(fields?.endereco_logradouro),
    numero: opcional(fields?.endereco_numero),
    complemento: opcional(fields?.endereco_complemento),
    bairro: opcional(fields?.endereco_bairro),
    cidade,
    uf,
    codigoMunicipio: opcional(fields?.endereco_codigo_municipio),
  };
}
