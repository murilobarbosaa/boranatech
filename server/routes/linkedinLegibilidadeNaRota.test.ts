import express from "express";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

/**
 * A rota /analyze recusa texto ilegivel ANTES de reservar cota?
 *
 * O defeito que este arquivo trava e de ORDENACAO, nao de limiar. Ate o lote de
 * entrada de PDF a unica validacao de legibilidade morava dentro de
 * `analyzeLinkedin`, alcancada so depois do `checkAiDailyLimit`: um POST com
 * 200+ caracteres de lixo inseria a linha `reserved` e so entao era recusado. A
 * vaga voltava pelo ramo de erro, entao nao havia cobranca indevida, mas a
 * janela reservar-para-depois-anular existia: processo morto no meio deixava a
 * vaga presa ate o TTL.
 *
 * O criterio NAO e uma constante nova de tamanho. Foi medido que nenhuma
 * separa os conjuntos: o perfil escasso legitimo (`perfil-g-vazio.txt`, o
 * golden `perfil-vazio-sem-ia`) tem 211 caracteres nao-whitespace e o ruido de
 * glifo tem 216. Qualquer teto que barrasse o lixo barraria junto o perfil
 * legitimo. Quem separa e `parseLinkedinText(...).usable`, fonte unica que ja
 * existia, e e por isso que os dois lados aparecem lado a lado aqui.
 *
 * Nenhuma requisicao sai: `fetchWithTimeout` esta dublado e o `fetch` global
 * fica intacto so para o cliente de teste falar com o servidor efemero.
 */

vi.mock("../lib/env", async (importActual) => {
  const real = await importActual<typeof import("../lib/env")>();
  return {
    ...real,
    env: { ...real.env, openaiApiKey: "sk-de-teste-nao-usada" },
  };
});

interface UsuarioDoTeste {
  id: string;
  email: string;
  role: string;
}

vi.mock("../middleware/auth", () => ({
  requireAuth: (req: express.Request, _res: unknown, next: () => void) => {
    (req as express.Request & { user: UsuarioDoTeste }).user = {
      id: "00000000-0000-4000-8000-000000000001",
      email: "teste@boranatech.com.br",
      role: "authenticated",
    };
    next();
  },
  checkProStatus: (req: express.Request, _res: unknown, next: () => void) => {
    (req as express.Request & { isPro: boolean }).isPro = true;
    next();
  },
}));

/**
 * O SPY DA RESERVA. `checkAiDailyLimit` e a funcao que insere a linha
 * `reserved`: contar as chamadas dela e contar as reservas. Zero chamada e a
 * afirmacao central deste arquivo.
 */
const reservaSpy = vi.fn(async () => ({
  allowed: true,
  limit: 20,
  used: 0,
}));
const logSpy = vi.fn(async (_params: { status: string }) => undefined);
// OS SPIES NAO PODEM SE CHAMAR COMO AS FUNCOES REAIS, e o motivo nao e estilo.
//
// `server/lib/aiUsageTool.test.ts` audita `server/routes/` por regex, para
// garantir que a reserva e o log usam o mesmo identificador de ferramenta. O
// filtro de arquivos dele e `endsWith(".ts")`, que varre os `.test.ts` junto
// com as rotas. Com o nome real, o wrapper do mock (chamada sem argumento
// nenhum) casava o regex de quatro argumentos pelo parenteses de fechamento, e
// o guard passava a ler um parenteses como nome da ferramenta.
//
// Falso positivo, e nao falha silenciosa: o guard cumpriu o papel, e o defeito
// de escopo dele esta registrado no relatorio do lote, fora deste commit. Esta
// nota tambem evita escrever o nome real seguido de parenteses aqui: o proprio
// comentario que explicava o problema o reproduzia.
vi.mock("../lib/aiUsage", () => ({
  checkAiDailyLimit: () => reservaSpy(),
  logAiUsage: (params: { status: string }) => logSpy(params),
}));

vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => {
      throw new Error("sem banco neste teste");
    },
  },
}));

import * as http from "../lib/http";
import { errorHandler } from "../middleware/error";
import { parseLinkedinText } from "../../shared/linkedin/parse";
import linkedinRouter from "./linkedin";

const CONTEXTO = {
  area: "frontend",
  level: "junior",
  mercado: "brasil",
  skills: "React, TypeScript",
  foto: "sim",
  banner: "sim",
  openToWork: "sim",
  conexoes: "100-500",
  atividade: "semanal",
};

/**
 * OS TRES LIXOS MEDIDOS. Reproduzem as classes que chegaram pelo PDF, nao
 * textos escolhidos por conveniencia: rodape de scanner repetido pagina a
 * pagina, e ruido de glifo (o que sobra quando a fonte embutida nao mapeia
 * para Unicode), no tamanho curto e no longo.
 */
const RODAPE_SCANNER = "Scanned with CamScanner\n".repeat(12);
const RUIDO_GLIFO = "Ã¸Â¤Ã¾Âµ ".repeat(36);
const RUIDO_GLIFO_LONGO = "Ã¸Â¤Ã¾Âµ ".repeat(120);

const LIXOS: ReadonlyArray<readonly [string, string]> = [
  ["rodape de scanner repetido", RODAPE_SCANNER],
  ["ruido de glifo", RUIDO_GLIFO],
  ["ruido de glifo longo", RUIDO_GLIFO_LONGO],
];

/**
 * O PERFIL ESCASSO LEGITIMO, copiado de
 * `server/lib/__fixtures__/linkedin/perfil-g-vazio.txt`, que e a entrada do
 * golden `perfil-vazio-sem-ia`. Ele existe aqui como CONTROLE: a guarda nova
 * nao pode encostar nele.
 */
const PERFIL_ESCASSO = `Contato
lucas.ferreira@email.com
www.linkedin.com/in/lucas-ferreira-exemplo
Lucas Ferreira
Education
Instituto Tecnico Delta
Curso Tecnico em Informatica
2021 - 2023
Instituto Tecnico Delta
Curso livre de logica de programacao
2020 - 2020
`;

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use("/api/linkedin", linkedinRouter);
app.use(errorHandler);
const servidor = createServer(app);
const pronto = new Promise<void>((resolve) => {
  servidor.listen(0, "127.0.0.1", () => resolve());
});

afterAll(() => {
  servidor.close();
});

beforeEach(() => {
  reservaSpy.mockClear();
  logSpy.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function analisar(profileText: string, extra: object = {}) {
  await pronto;
  const porta = (servidor.address() as AddressInfo).port;
  const r = await fetch(`http://127.0.0.1:${porta}/api/linkedin/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...CONTEXTO, profileText, ...extra }),
  });
  const body = (await r.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
  };
  return { status: r.status, body };
}

describe("PRE-CONDICAO: o zod nao pega nenhum dos tres lixos", () => {
  it.each(LIXOS)("%s passa no min(200) e e ilegivel", (_nome, texto) => {
    // Se um lixo caisse no zod, o resto do arquivo estaria provando outra
    // coisa: o 400 chegaria antes e a guarda nunca seria exercitada.
    expect(texto.length).toBeGreaterThanOrEqual(200);
    expect(texto.length).toBeLessThanOrEqual(12_000);
    expect(parseLinkedinText(texto).usable).toBe(false);
  });

  it("o perfil escasso legitimo e legivel para o parser", () => {
    expect(parseLinkedinText(PERFIL_ESCASSO).usable).toBe(true);
  });

  it.each(LIXOS)(
    "%s tem MAIS caracteres uteis que o perfil legitimo",
    (_nome, texto) => {
      // A prova de que nenhum limiar de tamanho resolveria. Medido: o controle
      // legitimo tem 211 caracteres nao-whitespace e os tres lixos tem 252, 288
      // e 960. Qualquer teto alto o bastante para barrar o lixo barra junto o
      // perfil escasso, e qualquer teto baixo o bastante para poupar o perfil
      // deixa os tres passarem. Por isso a guarda troca a GRANDEZA em vez de
      // escolher um numero.
      const uteis = (t: string) => t.replace(/\s/g, "").length;
      expect(uteis(texto)).toBeGreaterThan(uteis(PERFIL_ESCASSO));
    },
  );
});

describe("legibilidade antes da reserva", () => {
  it.each(LIXOS)(
    "%s: 422 unreadable_text, e a reserva JAMAIS e chamada",
    async (_nome, texto) => {
      const fetchDublado = vi.spyOn(http, "fetchWithTimeout");
      const { status, body } = await analisar(texto);

      expect(status).toBe(422);
      expect(body.error?.code).toBe("unreadable_text");
      // O CORACAO DO LOTE: nem reserva, nem linha de uso, nem chamada de IA.
      expect(reservaSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
      expect(fetchDublado).not.toHaveBeenCalled();
    },
  );

  it("o codigo novo e distinto do `unreadable_profile` da invariante", async () => {
    // Os dois significam coisas diferentes: `unreadable_text` e recusa na
    // porta, `unreadable_profile` e a invariante de `analyzeLinkedin` tendo
    // sido violada por um chamador sem guarda. Colapsar os dois apagaria
    // justamente a informacao de qual caminho falhou.
    const { body } = await analisar(RUIDO_GLIFO);
    expect(body.error?.code).not.toBe("unreadable_profile");
  });

  it("texto colado ilegivel e recusado igual: a porta e a mesma", async () => {
    // `entryPath` e so telemetria; PDF e texto colado batem no mesmo POST.
    // Antes deste lote a pagina so validava legibilidade no caminho do PDF
    // (dentro de `handleFile`), e o textarea entrava sem guarda nenhuma.
    const fetchDublado = vi.spyOn(http, "fetchWithTimeout");
    const { status, body } = await analisar(RUIDO_GLIFO, {
      entryPath: "manual",
    });

    expect(status).toBe(422);
    expect(body.error?.code).toBe("unreadable_text");
    expect(reservaSpy).not.toHaveBeenCalled();
    expect(fetchDublado).not.toHaveBeenCalled();
  });
});

describe("NAO REGRESSAO: o perfil escasso legitimo segue como hoje", () => {
  it("passa da guarda, reserva cota e responde sem chamar a IA", async () => {
    const fetchDublado = vi.spyOn(http, "fetchWithTimeout");
    const { status } = await analisar(PERFIL_ESCASSO);

    // 200: o atalho caloroso (warm empty) responde sem IA, exatamente como
    // antes. A guarda nova nao pode transformar perfil escasso em 422.
    expect(status).toBe(200);
    expect(reservaSpy).toHaveBeenCalledTimes(1);
    expect(fetchDublado).not.toHaveBeenCalled();
    // `skipped` e nao `success`: o atalho nao consome vaga da cota diaria.
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0].status).toBe("skipped");
  });
});
