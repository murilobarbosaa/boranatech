import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fallback do e-mail do `resume-render` para o e-mail do CADASTRO.
 *
 * O que este arquivo trava: em 30 dias, 15 chamadas morreram com
 * `invalid_format@dadosPessoais.email`, em 7 usuarios, tres dos quais nunca
 * conseguiram gerar um curriculo. O prompt ja mandava copiar o e-mail do
 * cadastro; quando falha, o modelo desobedeceu, e o servidor tinha o valor certo
 * em `req.user.email` sem usar.
 *
 * As expectativas aqui sao ESCRITAS A MAO (o e-mail esperado, o tamanho
 * esperado), nunca derivadas de chamar o proprio normalizador: expectativa
 * derivada do mecanismo passa junto com o mecanismo quando ele erra.
 */

// Sentry mockado no molde de server/routes/stats.test.ts: prova a captura sem
// rede, e deixa o payload inteiro disponivel para a assercao de nao-vazamento.
const sentrySpy = vi.hoisted(() => ({ captureMessage: vi.fn() }));
vi.mock("@sentry/node", () => ({ captureMessage: sentrySpy.captureMessage }));

import { AI_TOOLS } from "./aiTools";

// O e-mail do cadastro dos testes. Escrito a mao, nao lido de lugar nenhum.
const EMAIL_DO_CADASTRO = "pessoa.cadastrada@gmail.com";

// O que o modelo escreveu no lugar do e-mail. Comprimento contado a mao:
// "quero" 5 + 1 + "usar" 4 + 1 + "outro" 5 + 1 + "email" 5 = 22.
const LIXO_DO_MODELO = "quero usar outro email";
const LIXO_TAMANHO = 22;

function normalizar(parsed: unknown, userEmail: string): unknown {
  const hook = AI_TOOLS["resume-render"].responseFormat?.normalizarSaida;
  if (!hook) throw new Error("resume-render sem normalizarSaida configurado.");
  return hook(parsed, { userEmail });
}

/** Curriculo minimo: so o que o normalizador navega, mais um campo vizinho. */
function curriculo(email: unknown) {
  return {
    idioma: "pt-BR",
    dadosPessoais: {
      nome: "Pessoa Cadastrada",
      email,
      telefone: null,
      linkedin: null,
      github: null,
      cidade: "Recife/PE",
    },
    resumoProfissional: "Resumo qualquer.",
  };
}

describe("resume-render: e-mail invalido cai para o e-mail do cadastro", () => {
  beforeEach(() => {
    sentrySpy.captureMessage.mockClear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("o hook esta ligado no resume-render", () => {
    expect(
      typeof AI_TOOLS["resume-render"].responseFormat?.normalizarSaida,
    ).toBe("function");
  });

  it("(a) troca o valor invalido pelo e-mail do cadastro, sem vazar o valor", () => {
    const saida = normalizar(curriculo(LIXO_DO_MODELO), EMAIL_DO_CADASTRO) as {
      idioma: string;
      dadosPessoais: { nome: string; email: string; cidade: string };
      resumoProfissional: string;
    };

    expect(saida.dadosPessoais.email).toBe("pessoa.cadastrada@gmail.com");

    // Nenhum outro campo tocado.
    expect(saida.dadosPessoais.nome).toBe("Pessoa Cadastrada");
    expect(saida.dadosPessoais.cidade).toBe("Recife/PE");
    expect(saida.idioma).toBe("pt-BR");
    expect(saida.resumoProfissional).toBe("Resumo qualquer.");

    expect(sentrySpy.captureMessage).toHaveBeenCalledTimes(1);
    const [mensagem, contexto] = sentrySpy.captureMessage.mock.calls[0] as [
      string,
      {
        level: string;
        fingerprint: string[];
        tags: { tool: string };
        extra: {
          forma: {
            tipo: string;
            tamanho: number;
            temArroba: boolean;
            temEspaco: boolean;
            vazio: boolean;
          };
        };
      },
    ];

    expect(mensagem).toBe("resume_render_email_substituido");
    expect(contexto.level).toBe("warning");
    expect(contexto.fingerprint).toEqual(["resume-render-email-substituido"]);
    expect(contexto.tags).toEqual({ tool: "resume-render" });

    // Tamanho escrito a mao, conferido contra o comprimento do valor rejeitado.
    expect(contexto.extra.forma.tamanho).toBe(LIXO_TAMANHO);
    expect(LIXO_DO_MODELO.length).toBe(LIXO_TAMANHO);
    expect(contexto.extra.forma).toEqual({
      tipo: "string",
      tamanho: LIXO_TAMANHO,
      temArroba: false,
      temEspaco: true,
      vazio: false,
    });

    // O TESTE QUE IMPORTA: o valor rejeitado nao aparece em lugar nenhum da
    // captura. Asserta sobre o payload INTEIRO, nao sobre os campos que eu
    // lembrei de checar: campo novo em `forma` que carregue o valor cai aqui.
    const payload = JSON.stringify(sentrySpy.captureMessage.mock.calls[0]);
    expect(payload).not.toContain(LIXO_DO_MODELO);
    expect(payload).not.toContain("quero");
    expect(payload).not.toContain("outro");
  });

  it("(b) e-mail valido diferente do cadastro e preservado, sem captura", () => {
    // Caso legitimo: o proprio prompt permite outro e-mail se a pessoa pediu.
    const saida = normalizar(
      curriculo("contato.profissional@hotmail.com"),
      EMAIL_DO_CADASTRO,
    ) as { dadosPessoais: { email: string } };

    expect(saida.dadosPessoais.email).toBe("contato.profissional@hotmail.com");
    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
  });

  it("(c) sem dadosPessoais, devolve o parsed intacto e nao captura", () => {
    const entrada = { idioma: "pt-BR", resumoProfissional: "Resumo qualquer." };
    const saida = normalizar(entrada, EMAIL_DO_CADASTRO);

    expect(saida).toBe(entrada);
    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
  });

  it("(d) userEmail vazio: nao substitui, nao captura, deixa o Zod reprovar", () => {
    // `req.user.email` cai em "" quando o JWT nao traz a claim (auth.ts). Trocar
    // um invalido por outro invalido nao entrega curriculo e ainda registraria
    // uma substituicao que nao resolveu nada.
    const entrada = curriculo(LIXO_DO_MODELO);
    const saida = normalizar(entrada, "") as {
      dadosPessoais: { email: string };
    };

    expect(saida).toBe(entrada);
    expect(saida.dadosPessoais.email).toBe(LIXO_DO_MODELO);
    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
  });

  it("parsed que nao e objeto navegavel volta intacto", () => {
    expect(normalizar(null, EMAIL_DO_CADASTRO)).toBe(null);
    expect(normalizar("nao sou objeto", EMAIL_DO_CADASTRO)).toBe(
      "nao sou objeto",
    );
    const arr = [{ dadosPessoais: { email: LIXO_DO_MODELO } }];
    expect(normalizar(arr, EMAIL_DO_CADASTRO)).toBe(arr);
    expect(sentrySpy.captureMessage).not.toHaveBeenCalled();
  });

  it("email ausente ou de outro tipo tambem cai para o cadastro", () => {
    const semEmail = normalizar(curriculo(undefined), EMAIL_DO_CADASTRO) as {
      dadosPessoais: { email: string };
    };
    expect(semEmail.dadosPessoais.email).toBe("pessoa.cadastrada@gmail.com");

    sentrySpy.captureMessage.mockClear();

    const numero = normalizar(curriculo(42), EMAIL_DO_CADASTRO) as {
      dadosPessoais: { email: string };
    };
    expect(numero.dadosPessoais.email).toBe("pessoa.cadastrada@gmail.com");

    const contexto = sentrySpy.captureMessage.mock.calls[0][1] as {
      extra: { forma: { tipo: string; tamanho: number } };
    };
    // Numero nao tem comprimento de texto: `tipo` e quem carrega o sinal.
    expect(contexto.extra.forma.tipo).toBe("number");
    expect(contexto.extra.forma.tamanho).toBe(0);
  });
});
