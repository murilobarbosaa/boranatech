import { afterEach, describe, expect, it, vi } from "vitest";

// O adapter le `env` no momento da serializacao. Mock ANTES do import, com
// valores reconheciveis: um campo trocado no payload aparece como o valor de
// outro slot, e nao como undefined, que passaria despercebido.
vi.mock("../lib/env", () => ({
  env: {
    nfseFocusEnv: "homologacao",
    nfseFocusToken: "token-de-teste",
    nfsePrestadorCnpj: "11222333000181",
    nfsePrestadorInscricaoMunicipal: "IM-12345",
    nfsePrestadorCodigoMunicipio: "3550308",
    nfseServicoItemLista: "1.05",
    nfseServicoAliquota: "2",
    nfseServicoCodigoTributarioMunicipio: "",
    nfseOptanteSimples: true,
    // Vazias por padrao: os testes de presenca sobrescrevem o modulo.
    nfseNaturezaOperacao: "",
    nfseRegimeEspecialTributacao: "",
  },
}));

// Import ESTATICO, e nao `await import`: o `vi.mock` acima e hoisted pelo
// vitest para antes dos imports, entao o modulo ja carrega com o env dublado.
// Top-level await tambem NAO compila no tsconfig da aplicacao (target ES5), e
// o `pnpm check` reprova.
import {
  dataEmissaoBrasilia,
  extractFocusErro,
  mapFocusStatus,
  serializeEndereco,
  serializeNfsePayload,
} from "./fiscalFocus";
import type { IssueInvoiceInput } from "./fiscalTypes";
// O mock acima devolve um OBJETO real, entao os testes de enquadramento abaixo
// mutam campos dele e restauram no fim. E o jeito de exercitar presenca e
// ausencia das envs opcionais sem um segundo arquivo de teste so para isso.
import { env } from "../lib/env";

/**
 * O que estes testes protegem, e por que cada um existe:
 *
 *   - o PAYLOAD e o unico ponto onde o nosso vocabulario vira o da prefeitura.
 *     Um campo trocado aqui nao da erro: da rejeicao assincrona horas depois,
 *     com uma mensagem da prefeitura que nao aponta para o nosso codigo.
 *   - o MAPEAMENTO de status decide se uma nota vira 'issued' no nosso banco.
 *     Errar para 'issued' e afirmar que existe um documento fiscal que nao
 *     existe.
 *   - a CLASSIFICACAO retryable decide entre insistir e desistir. Errar para
 *     'nao retentavel' abandona uma nota que sairia sozinha; errar para
 *     'retentavel' esconde um erro permanente atras de 12 tentativas.
 */

const TOMADOR_PF: IssueInvoiceInput["tomador"] = {
  nome: "Maria da Silva",
  documento: "52998224725",
  tipoDocumento: "cpf",
  email: "maria@example.com",
};

const ENDERECO_COMPLETO = {
  cep: "01310100",
  logradouro: "Avenida Paulista",
  numero: "1000",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
  codigoMunicipio: "3550308",
};

function input(over: Partial<IssueInvoiceInput> = {}): IssueInvoiceInput {
  return {
    referenceId: "11111111-2222-3333-4444-555555555555",
    tomador: TOMADOR_PF,
    servico: {
      descricao: "Assinatura Bora na Tech Pro, plano mensal",
      valorCents: 2990,
    },
    ...over,
  };
}

const AGORA = new Date("2026-08-04T15:30:00Z");

describe("dataEmissaoBrasilia", () => {
  it("usa o fuso de Brasilia com offset explicito", () => {
    expect(dataEmissaoBrasilia(AGORA)).toBe("2026-08-04T12:30:00-03:00");
  });

  it("vira o dia no fuso certo, nao no UTC", () => {
    // 02:00 UTC de 01/08 ainda e 31/07 em Brasilia.
    expect(dataEmissaoBrasilia(new Date("2026-08-01T02:00:00Z"))).toBe(
      "2026-07-31T23:00:00-03:00",
    );
  });
});

describe("serializeEndereco", () => {
  it("monta quando todos os campos exigidos pela Focus estao presentes", () => {
    expect(serializeEndereco(ENDERECO_COMPLETO)).toEqual({
      logradouro: "Avenida Paulista",
      numero: "1000",
      bairro: "Bela Vista",
      codigo_municipio: "3550308",
      uf: "SP",
      cep: "01310100",
    });
  });

  it("OMITE o endereco inteiro quando falta o codigo do municipio", () => {
    // E o campo que mais falta na pratica: so vem da consulta de CEP. Enviar o
    // resto sem ele seria rejeicao garantida da prefeitura.
    expect(
      serializeEndereco({ ...ENDERECO_COMPLETO, codigoMunicipio: undefined }),
    ).toBeUndefined();
  });

  it("OMITE quando falta numero ou bairro", () => {
    expect(
      serializeEndereco({ ...ENDERECO_COMPLETO, numero: undefined }),
    ).toBeUndefined();
    expect(
      serializeEndereco({ ...ENDERECO_COMPLETO, bairro: undefined }),
    ).toBeUndefined();
  });

  it("endereco ausente devolve undefined, nao objeto vazio", () => {
    expect(serializeEndereco(undefined)).toBeUndefined();
  });
});

describe("serializeNfsePayload, pessoa fisica", () => {
  const payload = serializeNfsePayload(input(), AGORA);

  it("manda cpf e NAO manda a chave cnpj", () => {
    const tomador = payload.tomador as Record<string, unknown>;
    expect(tomador.cpf).toBe("52998224725");
    // A chave nem existe: mandar `cnpj: null` deixaria a Focus decidir qual dos
    // dois documentos vale.
    expect("cnpj" in tomador).toBe(false);
  });

  it("leva o prestador das envs", () => {
    expect(payload.prestador).toEqual({
      cnpj: "11222333000181",
      inscricao_municipal: "IM-12345",
      codigo_municipio: "3550308",
    });
  });

  it("converte centavos para reais com 2 casas", () => {
    const servico = payload.servico as Record<string, unknown>;
    expect(servico.valor_servicos).toBe(29.9);
  });

  it("usa a nossa descricao como discriminacao e nao retem ISS", () => {
    const servico = payload.servico as Record<string, unknown>;
    expect(servico.discriminacao).toBe(
      "Assinatura Bora na Tech Pro, plano mensal",
    );
    expect(servico.iss_retido).toBe(false);
    expect(servico.item_lista_servico).toBe("1.05");
  });

  it("omite codigo_tributario_municipio quando a env esta vazia", () => {
    const servico = payload.servico as Record<string, unknown>;
    expect("codigo_tributario_municipio" in servico).toBe(false);
  });

  it("omite o endereco quando o tomador nao tem", () => {
    const tomador = payload.tomador as Record<string, unknown>;
    expect("endereco" in tomador).toBe(false);
  });
});

describe("serializeNfsePayload, enquadramento tributario", () => {
  const original = {
    optante: env.nfseOptanteSimples,
    natureza: env.nfseNaturezaOperacao,
    regime: env.nfseRegimeEspecialTributacao,
  };

  afterEach(() => {
    env.nfseOptanteSimples = original.optante;
    env.nfseNaturezaOperacao = original.natureza;
    env.nfseRegimeEspecialTributacao = original.regime;
  });

  it("declara optante_simples_nacional a partir da env", () => {
    expect(serializeNfsePayload(input(), AGORA).optante_simples_nacional).toBe(
      true,
    );
    env.nfseOptanteSimples = false;
    expect(serializeNfsePayload(input(), AGORA).optante_simples_nacional).toBe(
      false,
    );
  });

  it("LANCA quando o enquadramento nao esta declarado", () => {
    // Nao presume `false`: optante e nao-optante produzem tributacao diferente,
    // e a nota errada sai valida e so aparece no fechamento contabil.
    env.nfseOptanteSimples = null;
    expect(() => serializeNfsePayload(input(), AGORA)).toThrow(
      /NFSE_OPTANTE_SIMPLES/,
    );
  });

  it("OMITE natureza e regime quando as envs estao vazias", () => {
    // Chave ausente e diferente de chave vazia: `""` seria recusado por
    // validacao, enquanto a omissao deixa o default da Focus valer.
    const payload = serializeNfsePayload(input(), AGORA);
    expect("natureza_operacao" in payload).toBe(false);
    expect("regime_especial_tributacao" in payload).toBe(false);
  });

  it("manda natureza e regime VERBATIM quando configuradas", () => {
    env.nfseNaturezaOperacao = "1";
    env.nfseRegimeEspecialTributacao = "6";
    const payload = serializeNfsePayload(input(), AGORA);
    expect(payload.natureza_operacao).toBe("1");
    expect(payload.regime_especial_tributacao).toBe("6");
  });
});

describe("serializeNfsePayload, pessoa juridica e endereco", () => {
  it("manda cnpj e razao social, sem a chave cpf", () => {
    const payload = serializeNfsePayload(
      input({
        tomador: {
          nome: "Empresa Exemplo LTDA",
          documento: "11222333000181",
          tipoDocumento: "cnpj",
          email: "financeiro@example.com",
          endereco: ENDERECO_COMPLETO,
        },
      }),
      AGORA,
    );
    const tomador = payload.tomador as Record<string, unknown>;
    expect(tomador.cnpj).toBe("11222333000181");
    expect("cpf" in tomador).toBe(false);
    expect(tomador.razao_social).toBe("Empresa Exemplo LTDA");
    expect(tomador.endereco).toEqual({
      logradouro: "Avenida Paulista",
      numero: "1000",
      bairro: "Bela Vista",
      codigo_municipio: "3550308",
      uf: "SP",
      cep: "01310100",
    });
  });
});

describe("mapFocusStatus", () => {
  it("autorizado vira issued com numero, codigo e documentos absolutos", () => {
    const r = mapFocusStatus({
      status: "autorizado",
      numero: "123",
      serie: "A",
      codigo_verificacao: "XYZ-789",
      caminho_xml_nota_fiscal: "/arquivos/nota.xml",
      caminho_danfse: "/arquivos/nota.pdf",
    });
    expect(r.status).toBe("issued");
    if (r.status === "issued") {
      expect(r.numero).toBe("123");
      expect(r.serie).toBe("A");
      expect(r.codigoVerificacao).toBe("XYZ-789");
      // Caminho RELATIVO resolvido contra a base do ambiente.
      expect(r.xmlUrl).toBe(
        "https://homologacao.focusnfe.com.br/arquivos/nota.xml",
      );
      expect(r.pdfUrl).toBe(
        "https://homologacao.focusnfe.com.br/arquivos/nota.pdf",
      );
    }
  });

  it("URL ja absoluta e preservada", () => {
    const r = mapFocusStatus({
      status: "autorizado",
      caminho_xml_nota_fiscal: "https://outro.host/nota.xml",
    });
    if (r.status === "issued") {
      expect(r.xmlUrl).toBe("https://outro.host/nota.xml");
    }
  });

  it("campo ausente fica ausente, nunca string vazia", () => {
    const r = mapFocusStatus({ status: "autorizado" });
    if (r.status === "issued") {
      expect(r.numero).toBeUndefined();
      expect(r.codigoVerificacao).toBeUndefined();
      expect(r.pdfUrl).toBeUndefined();
    }
  });

  it("processando_autorizacao vira processing", () => {
    expect(mapFocusStatus({ status: "processando_autorizacao" })).toEqual({
      status: "processing",
    });
  });

  it("cancelado vira canceled", () => {
    expect(mapFocusStatus({ status: "cancelado" })).toEqual({
      status: "canceled",
    });
  });

  it("erro_autorizacao vira failed NAO retentavel", () => {
    // Rejeicao da prefeitura: reenviar o mesmo payload da a mesma rejeicao.
    const r = mapFocusStatus({
      status: "erro_autorizacao",
      erros: [{ codigo: "E123", mensagem: "Inscricao municipal invalida" }],
    });
    expect(r).toEqual({
      status: "failed",
      errorCode: "E123",
      errorMessage: "Inscricao municipal invalida",
      retryable: false,
    });
  });

  it("status DESCONHECIDO cai em processing, nunca em issued nem failed", () => {
    // Um status novo da Focus nao pode dar a nota como emitida (mentira grave)
    // nem como falhada (encerraria o acompanhamento).
    expect(mapFocusStatus({ status: "aguardando_prefeitura" })).toEqual({
      status: "processing",
    });
    expect(mapFocusStatus(null)).toEqual({ status: "processing" });
  });
});

describe("extractFocusErro", () => {
  it("usa o primeiro erro do array e sinaliza que ha mais", () => {
    expect(
      extractFocusErro({
        erros: [
          { codigo: "A1", mensagem: "primeiro" },
          { codigo: "A2", mensagem: "segundo" },
        ],
      }),
    ).toEqual({ codigo: "A1", mensagem: "primeiro (+1 erro(s))" });
  });

  it("cai para codigo/mensagem do corpo quando nao ha array", () => {
    expect(
      extractFocusErro({ codigo: "requisicao_invalida", mensagem: "faltou X" }),
    ).toEqual({ codigo: "requisicao_invalida", mensagem: "faltou X" });
  });

  it("corpo vazio nao explode", () => {
    expect(extractFocusErro(null).codigo).toBe("focus_erro");
  });
});
