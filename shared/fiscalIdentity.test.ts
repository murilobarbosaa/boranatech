import { describe, expect, it } from "vitest";

import {
  buildFiscalEndereco,
  hasFiscalIdentity,
  isValidCep,
  isValidCnpj,
  isValidCpf,
  isValidFullName,
  isValidUf,
  missingFiscalIdentity,
  resolveFiscalDocumentType,
  UF_LIST,
} from "./fiscalIdentity";

/**
 * Documento invalido que PASSA num teste de comprimento e o caso que importa.
 *
 * Uma validacao que so conta digitos aceita "11111111111" e "12345678901" e
 * manda os dois para a prefeitura, que rejeita a nota depois de ela ja estar em
 * transito. Por isso cada bloco abaixo tem um caso de comprimento certo e
 * digito verificador errado, e nao so os obvios de tamanho.
 */

describe("isValidCpf", () => {
  it("aceita CPF com digitos verificadores corretos", () => {
    expect(isValidCpf("52998224725")).toBe(true);
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("recusa comprimento certo com digito verificador errado", () => {
    expect(isValidCpf("52998224726")).toBe(false);
    expect(isValidCpf("12345678901")).toBe(false);
  });

  it("recusa sequencia de digito repetido", () => {
    for (const d of "0123456789") {
      expect(isValidCpf(d.repeat(11)), d.repeat(11)).toBe(false);
    }
  });

  it("recusa comprimento diferente de 11", () => {
    expect(isValidCpf("5299822472")).toBe(false);
    expect(isValidCpf("529982247250")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });
});

describe("isValidCnpj", () => {
  it("aceita CNPJ com digitos verificadores corretos", () => {
    expect(isValidCnpj("11222333000181")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
  });

  it("recusa comprimento certo com digito verificador errado", () => {
    // Ultimo digito trocado: o unico jeito de pegar isto e fazendo a conta.
    expect(isValidCnpj("11222333000182")).toBe(false);
    expect(isValidCnpj("12345678000100")).toBe(false);
  });

  it("recusa sequencia de digito repetido", () => {
    for (const d of "0123456789") {
      expect(isValidCnpj(d.repeat(14)), d.repeat(14)).toBe(false);
    }
  });

  it("recusa comprimento diferente de 14", () => {
    expect(isValidCnpj("1122233300018")).toBe(false);
    expect(isValidCnpj("112223330001811")).toBe(false);
    // CPF valido NAO e CNPJ valido: os dois algoritmos sao diferentes.
    expect(isValidCnpj("52998224725")).toBe(false);
  });
});

describe("isValidCep e isValidUf", () => {
  it("CEP e exatamente 8 digitos, com ou sem mascara", () => {
    expect(isValidCep("01310100")).toBe(true);
    expect(isValidCep("01310-100")).toBe(true);
    expect(isValidCep("0131010")).toBe(false);
    expect(isValidCep("013101000")).toBe(false);
  });

  it("UF vem de lista fechada de 27, case-insensitive", () => {
    expect(UF_LIST).toHaveLength(27);
    expect(isValidUf("SP")).toBe(true);
    expect(isValidUf("sp")).toBe(true);
    expect(isValidUf(" df ")).toBe(true);
    expect(isValidUf("XX")).toBe(false);
    expect(isValidUf("")).toBe(false);
    expect(isValidUf(null)).toBe(false);
  });
});

describe("isValidFullName", () => {
  it("exige duas palavras de 2+ caracteres", () => {
    expect(isValidFullName("Maria Silva")).toBe(true);
    expect(isValidFullName("  Maria  da  Silva ")).toBe(true);
    expect(isValidFullName("Maria")).toBe(false);
    expect(isValidFullName("M S")).toBe(false);
    expect(isValidFullName("")).toBe(false);
    expect(isValidFullName(null)).toBe(false);
  });
});

describe("resolveFiscalDocumentType", () => {
  it("a preferencia declarada manda", () => {
    expect(
      resolveFiscalDocumentType({ fiscal_documento_preferencia: "cnpj" }),
    ).toBe("cnpj");
  });

  it("sem preferencia cai em cpf, que e o que o produto sempre coletou", () => {
    // Nenhuma conta anterior a Fase 2 tem preferencia gravada; todas precisam
    // continuar resolvendo como CPF, sem backfill.
    expect(resolveFiscalDocumentType({})).toBe("cpf");
    expect(resolveFiscalDocumentType(null)).toBe("cpf");
    expect(
      resolveFiscalDocumentType({ fiscal_documento_preferencia: "lixo" }),
    ).toBe("cpf");
  });
});

describe("missingFiscalIdentity", () => {
  it("cadastro de pessoa fisica completo nao tem pendencia", () => {
    expect(
      missingFiscalIdentity({
        full_name: "Maria Silva",
        cpf: "529.982.247-25",
      }),
    ).toEqual([]);
  });

  it("lista TODAS as pendencias, nao so a primeira", () => {
    expect(missingFiscalIdentity({})).toEqual(["nome", "cpf"]);
  });

  it("distingue documento ausente de documento invalido", () => {
    expect(
      missingFiscalIdentity({ full_name: "Maria Silva", cpf: "11111111111" }),
    ).toEqual(["cpf_invalido"]);
  });

  it("nome de exibicao NAO substitui o nome civil", () => {
    // `name` nem entra no tipo: a nota leva full_name ou nao sai.
    expect(
      missingFiscalIdentity({ full_name: "Maria", cpf: "52998224725" }),
    ).toEqual(["nome"]);
  });

  it("com preferencia cnpj, cobra razao social e CNPJ (e nao cobra CPF)", () => {
    expect(
      missingFiscalIdentity({ fiscal_documento_preferencia: "cnpj" }),
    ).toEqual(["razao_social", "cnpj"]);

    expect(
      missingFiscalIdentity({
        fiscal_documento_preferencia: "cnpj",
        razao_social: "Empresa LTDA",
        cnpj: "11.222.333/0001-81",
        // Sem full_name e sem cpf de propósito: PJ nao depende deles.
      }),
    ).toEqual([]);
  });

  it("com preferencia cnpj, CNPJ invalido e reportado como invalido", () => {
    expect(
      missingFiscalIdentity({
        fiscal_documento_preferencia: "cnpj",
        razao_social: "Empresa LTDA",
        cnpj: "11222333000182",
      }),
    ).toEqual(["cnpj_invalido"]);
  });

  it("endereco ausente NAO e pendencia (contrato da Fase 1)", () => {
    expect(
      hasFiscalIdentity({ full_name: "Maria Silva", cpf: "52998224725" }),
    ).toBe(true);
  });
});

describe("buildFiscalEndereco", () => {
  it("monta quando ha CEP, cidade e UF", () => {
    expect(
      buildFiscalEndereco({
        endereco_cep: "01310-100",
        endereco_logradouro: "Avenida Paulista",
        endereco_numero: "1000",
        endereco_bairro: "Bela Vista",
        endereco_cidade: "São Paulo",
        endereco_uf: "sp",
        endereco_codigo_municipio: "3550308",
      }),
    ).toEqual({
      cep: "01310100",
      logradouro: "Avenida Paulista",
      numero: "1000",
      complemento: undefined,
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "SP",
      codigoMunicipio: "3550308",
    });
  });

  it("devolve null com endereco PARCIAL em vez de objeto meio preenchido", () => {
    expect(
      buildFiscalEndereco({
        endereco_cep: "01310100",
        endereco_logradouro: "Avenida Paulista",
        // sem cidade e sem uf
      }),
    ).toBeNull();

    expect(
      buildFiscalEndereco({
        endereco_cep: "0131010",
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
      }),
    ).toBeNull();

    expect(
      buildFiscalEndereco({
        endereco_cep: "01310100",
        endereco_cidade: "São Paulo",
        endereco_uf: "XX",
      }),
    ).toBeNull();
  });

  it("null quando nao ha endereco nenhum", () => {
    expect(buildFiscalEndereco({})).toBeNull();
    expect(buildFiscalEndereco(null)).toBeNull();
  });
});
