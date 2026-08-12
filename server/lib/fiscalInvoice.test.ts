import { describe, expect, it } from "vitest";

import {
  buildServiceDescription,
  isRetryableFiscalStatus,
  isTerminalFiscalStatus,
  resolveTomador,
} from "./fiscalInvoice";

/**
 * As tres decisoes que doem se sairem erradas, e o motivo de cada uma estar
 * aqui e nao no worker:
 *
 *   - status TERMINAL decide se uma nota ja emitida pode ser emitida de novo;
 *   - o tomador decide se a nota SAI ou fica bloqueada;
 *   - a descricao e texto impresso em documento fiscal.
 *
 * Nenhuma delas precisa de Redis, Postgres ou mock de env para ser exercitada,
 * e e por isso que elas moram num modulo que nao importa nenhum dos tres.
 */

describe("isTerminalFiscalStatus", () => {
  it("trata issued e canceled como terminais", () => {
    expect(isTerminalFiscalStatus("issued")).toBe(true);
    expect(isTerminalFiscalStatus("canceled")).toBe(true);
  });

  it("NAO trata failed nem blocked_missing_data como terminais", () => {
    // Os dois existem para serem retomados: failed depois de correcao humana,
    // blocked_missing_data quando o cadastro chegar. Terminais aqui travariam a
    // retomada para sempre.
    expect(isTerminalFiscalStatus("failed")).toBe(false);
    expect(isTerminalFiscalStatus("blocked_missing_data")).toBe(false);
    expect(isTerminalFiscalStatus("pending")).toBe(false);
    expect(isTerminalFiscalStatus("processing")).toBe(false);
  });

  it("status desconhecido nao vira terminal por engano", () => {
    // Fail para o lado de PROCESSAR: um status novo que ninguem ensinou aqui
    // nao pode fazer o worker desistir em silencio.
    expect(isTerminalFiscalStatus("emitida")).toBe(false);
    expect(isTerminalFiscalStatus("")).toBe(false);
  });
});

describe("isRetryableFiscalStatus (retry manual do admin)", () => {
  it("aceita os dois estados de trabalho interrompido", () => {
    expect(isRetryableFiscalStatus("failed")).toBe(true);
    expect(isRetryableFiscalStatus("blocked_missing_data")).toBe(true);
  });

  it("RECUSA os terminais: reprocessar emitiria de novo o que ja existe", () => {
    expect(isRetryableFiscalStatus("issued")).toBe(false);
    expect(isRetryableFiscalStatus("canceled")).toBe(false);
  });

  it("RECUSA quem ja esta na fila: o botao mentiria sobre ter feito algo", () => {
    expect(isRetryableFiscalStatus("pending")).toBe(false);
    expect(isRetryableFiscalStatus("processing")).toBe(false);
  });

  it("status desconhecido nao vira retentavel por engano", () => {
    expect(isRetryableFiscalStatus("qualquer_coisa")).toBe(false);
    expect(isRetryableFiscalStatus("")).toBe(false);
  });
});

describe("buildServiceDescription", () => {
  it("monta plano e periodo no dia de Brasilia", () => {
    expect(
      buildServiceDescription({
        planCode: "pro_monthly",
        periodStart: "2026-08-01T12:00:00Z",
        periodEnd: "2026-09-01T12:00:00Z",
      }),
    ).toBe(
      "Assinatura Bora na Tech Pro, plano mensal, período de 01/08/2026 a 01/09/2026",
    );
  });

  it("usa o dia de Brasilia, nao o dia UTC", () => {
    // 01/08 as 02:00 UTC ainda e 31/07 em Brasilia. Quem pagou viu 31/07.
    expect(
      buildServiceDescription({
        planCode: "pro_annual",
        periodStart: "2026-08-01T02:00:00Z",
        periodEnd: "2027-08-01T02:00:00Z",
      }),
    ).toBe(
      "Assinatura Bora na Tech Pro, plano anual, período de 31/07/2026 a 31/07/2027",
    );
  });

  it("omite o periodo inteiro quando falta uma das pontas", () => {
    // Meio periodo pareceria dado e nao e.
    expect(
      buildServiceDescription({
        planCode: "pro_semiannual",
        periodStart: "2026-08-01T12:00:00Z",
        periodEnd: null,
      }),
    ).toBe("Assinatura Bora na Tech Pro, plano semestral");
  });

  it("degrada sem o plano em vez de imprimir o code cru", () => {
    expect(
      buildServiceDescription({
        planCode: "plano_que_nao_existe",
        periodStart: null,
        periodEnd: null,
      }),
    ).toBe("Assinatura Bora na Tech Pro");
  });

  it("nunca usa travessao nem meia-risca", () => {
    const texto = buildServiceDescription({
      planCode: "pro_monthly",
      periodStart: "2026-08-01T12:00:00Z",
      periodEnd: "2026-09-01T12:00:00Z",
    });
    expect(texto).not.toMatch(/[—–]/);
  });
});

const CPF_VALIDO = "529.982.247-25";
const CNPJ_VALIDO = "11.222.333/0001-81";

describe("resolveTomador, pessoa fisica", () => {
  it("leva o nome CIVIL, e o de exibicao nao substitui", () => {
    // Fase 1 aceitava `name` como fallback. Fase 2 nao: apelido em documento
    // fiscal nao serve, e a coluna `name` nem entra mais no tipo de entrada.
    const r = resolveTomador(
      { full_name: "Maria da Silva", cpf: CPF_VALIDO, email: "m@example.com" },
      null,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.tomador.nome).toBe("Maria da Silva");
      expect(r.tomador.tipoDocumento).toBe("cpf");
      expect(r.tomador.documento).toBe("52998224725");
    }
  });

  it("cai para o e-mail de auth quando o perfil nao tem", () => {
    const r = resolveTomador(
      { full_name: "Maria Silva", cpf: CPF_VALIDO, email: null },
      "auth@example.com",
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tomador.email).toBe("auth@example.com");
  });

  it("lista TODOS os campos faltantes, nao so o primeiro", () => {
    const r = resolveTomador({}, null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toEqual(["nome", "cpf", "email"]);
  });

  it("bloqueia CPF com digito verificador errado", () => {
    // Comprimento certo, conta errada: e o caso que so a validacao completa pega.
    const r = resolveTomador(
      { full_name: "Maria Silva", cpf: "12345678901", email: "m@example.com" },
      null,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toEqual(["cpf_invalido"]);
  });

  it("perfil ausente nao explode: reporta o que falta", () => {
    const r = resolveTomador(null, null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toContain("cpf");
  });

  it("nome incompleto conta como ausente", () => {
    const r = resolveTomador(
      { full_name: "Maria", cpf: CPF_VALIDO, email: "m@e.com" },
      null,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toEqual(["nome"]);
  });
});

describe("resolveTomador, pessoa juridica", () => {
  it("leva razao social e CNPJ, sem exigir nome civil nem CPF", () => {
    const r = resolveTomador(
      {
        fiscal_documento_preferencia: "cnpj",
        razao_social: "Empresa Exemplo LTDA",
        cnpj: CNPJ_VALIDO,
        email: "financeiro@example.com",
        // Sem full_name e sem cpf de propósito.
      },
      null,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.tomador.nome).toBe("Empresa Exemplo LTDA");
      expect(r.tomador.tipoDocumento).toBe("cnpj");
      expect(r.tomador.documento).toBe("11222333000181");
    }
  });

  it("preferencia cnpj sem os dados de PJ bloqueia, e nao cai para o CPF", () => {
    // O silencio perigoso seria emitir no CPF de quem pediu nota no CNPJ.
    const r = resolveTomador(
      {
        fiscal_documento_preferencia: "cnpj",
        full_name: "Maria Silva",
        cpf: CPF_VALIDO,
        email: "m@example.com",
      },
      null,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.missing).toEqual(["razao_social", "cnpj"]);
  });
});

describe("resolveTomador, endereco", () => {
  it("inclui o endereco quando ha CEP, cidade e UF", () => {
    const r = resolveTomador(
      {
        full_name: "Maria Silva",
        cpf: CPF_VALIDO,
        email: "m@example.com",
        endereco_cep: "01310100",
        endereco_logradouro: "Avenida Paulista",
        endereco_numero: "1000",
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
      },
      null,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.tomador.endereco?.cep).toBe("01310100");
      expect(r.tomador.endereco?.uf).toBe("SP");
    }
  });

  it("endereco ausente NAO bloqueia, e a chave nem aparece", () => {
    // Contrato herdado da Fase 1. `endereco: null` obrigaria cada adapter a
    // distinguir ausente de vazio; a chave some.
    const r = resolveTomador(
      { full_name: "Maria Silva", cpf: CPF_VALIDO, email: "m@example.com" },
      null,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect("endereco" in r.tomador).toBe(false);
  });

  it("endereco PARCIAL nao bloqueia e tambem nao entra pela metade", () => {
    const r = resolveTomador(
      {
        full_name: "Maria Silva",
        cpf: CPF_VALIDO,
        email: "m@example.com",
        endereco_cep: "01310100",
        endereco_logradouro: "Avenida Paulista",
        // sem cidade e sem UF
      },
      null,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tomador.endereco).toBeUndefined();
  });
});
