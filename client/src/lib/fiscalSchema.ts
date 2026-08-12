// Schema zod do formulario fiscal.
//
// Ele NAO reimplementa regra nenhuma: cada `refine` chama a mesma funcao de
// shared/fiscalIdentity.ts que o servidor chama. O zod aqui cuida da forma
// (campo presente, tipo certo, qual mensagem mostrar em qual campo); a decisao
// de "este documento e valido" continua tendo um dono so.
//
// A validacao do cliente e conveniencia: quem decide e o PATCH /api/me. Se as
// duas discordassem, a discordancia apareceria como um formulario que aceita e
// um servidor que recusa, sem explicacao util para quem esta preenchendo.

import { z } from "zod";

import {
  isValidCep,
  isValidCnpj,
  isValidCpf,
  isValidFullName,
  isValidUf,
  onlyDigits,
} from "@shared/fiscalIdentity";

const opcional = z.string().trim().optional().or(z.literal(""));

export const fiscalFormSchema = z
  .object({
    tipoDocumento: z.enum(["cpf", "cnpj"]),
    fullName: z.string().trim(),
    razaoSocial: z.string().trim(),
    documento: z.string().trim(),
    cep: opcional,
    logradouro: opcional,
    numero: opcional,
    complemento: opcional,
    bairro: opcional,
    cidade: opcional,
    uf: opcional,
  })
  // superRefine, e nao refine por campo: qual campo e obrigatorio depende do
  // tipo de documento, e essa dependencia nao cabe num validador de campo
  // isolado.
  .superRefine((data, ctx) => {
    if (data.tipoDocumento === "cnpj") {
      if (!data.razaoSocial) {
        ctx.addIssue({
          code: "custom",
          path: ["razaoSocial"],
          message: "Informe a razão social.",
        });
      }
      if (!isValidCnpj(data.documento)) {
        ctx.addIssue({
          code: "custom",
          path: ["documento"],
          message: "CNPJ inválido.",
        });
      }
    } else {
      if (!isValidFullName(data.fullName)) {
        ctx.addIssue({
          code: "custom",
          path: ["fullName"],
          message: "Informe nome e sobrenome.",
        });
      }
      if (!isValidCpf(data.documento)) {
        ctx.addIssue({
          code: "custom",
          path: ["documento"],
          message: "CPF inválido.",
        });
      }
    }

    // Endereco e OPCIONAL, mas quando preenchido precisa estar coerente: um CEP
    // pela metade nao pode ser salvo como se estivesse certo.
    if (data.cep && !isValidCep(data.cep)) {
      ctx.addIssue({
        code: "custom",
        path: ["cep"],
        message: "CEP deve ter 8 dígitos.",
      });
    }
    if (data.uf && !isValidUf(data.uf)) {
      ctx.addIssue({
        code: "custom",
        path: ["uf"],
        message: "UF inválida.",
      });
    }
  });

export type FiscalFormValues = z.infer<typeof fiscalFormSchema>;

/** Erros por campo, no formato que o formulario consome. */
export function fiscalFormErrors(
  values: FiscalFormValues,
): Record<string, string> {
  const parsed = fiscalFormSchema.safeParse(values);
  if (parsed.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? "");
    // Primeira mensagem por campo: a segunda so repetiria o mesmo problema.
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

/**
 * Converte o formulario no corpo do PATCH /api/me.
 *
 * String vazia vira `null` de propósito: e assim que o servidor entende
 * "limpar o campo". Mandar "" gravaria vazio, e um endereco com strings vazias
 * passaria a parecer preenchido para quem so checa presenca da coluna.
 */
export function fiscalFormToPayload(
  values: FiscalFormValues,
): Record<string, string | null> {
  const vazioVirarNull = (value: string | undefined): string | null => {
    const trimmed = (value ?? "").trim();
    return trimmed === "" ? null : trimmed;
  };

  const pj = values.tipoDocumento === "cnpj";

  return {
    fiscal_documento_preferencia: values.tipoDocumento,
    // O nome civil continua sendo gravado mesmo no fluxo de CNPJ quando a
    // pessoa ja o tinha: ele e do certificado tambem, e apaga-lo aqui quebraria
    // outra feature. So nao e exigido.
    ...(values.fullName.trim() ? { full_name: values.fullName.trim() } : {}),
    ...(pj
      ? {
          cnpj: onlyDigits(values.documento),
          razao_social: vazioVirarNull(values.razaoSocial),
        }
      : { cpf: onlyDigits(values.documento) }),
    endereco_cep: values.cep ? onlyDigits(values.cep) : null,
    endereco_logradouro: vazioVirarNull(values.logradouro),
    endereco_numero: vazioVirarNull(values.numero),
    endereco_complemento: vazioVirarNull(values.complemento),
    endereco_bairro: vazioVirarNull(values.bairro),
    endereco_cidade: vazioVirarNull(values.cidade),
    endereco_uf: values.uf ? values.uf.trim().toUpperCase() : null,
  };
}
