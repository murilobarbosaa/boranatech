import { afterEach, describe, expect, it, vi } from "vitest";

import type { LinkedinAnalyzeRequest } from "@shared/linkedin/schema";

vi.mock("./supabase", () => ({ supabase: null }));
vi.mock("./api", () => ({ apiUrl: (path: string) => path }));

import {
  analyzeLinkedin,
  getLinkedinImprovements,
  listLinkedinAnalyses,
  readAnalysisSummary,
  sanitizeLinkedinImprovementIndexes,
  setLinkedinImprovement,
} from "./linkedinClient";

const REQUEST: LinkedinAnalyzeRequest = {
  profileText: "x".repeat(300),
  area: "frontend",
  level: "junior",
  mercado: "brasil",
  skills: "React",
  foto: "sim",
  banner: "sim",
  openToWork: "nao",
  conexoes: "100-500",
  atividade: "semanal",
  entryPath: "manual",
};

const RESULT = {
  area: "frontend",
  level: "junior",
  mercado: "brasil",
  deterministic: { score: 42, faixa: "em-construcao", checks: [] },
  qualitative: {},
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cliente do analisador de LinkedIn", () => {
  it("envia o entryPath efetivo no payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: RESULT, analysisId: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await analyzeLinkedin(REQUEST);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.entryPath).toBe("manual");
  });

  it("falha de histórico não vira lista vazia", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Banco fora" } }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    await expect(listLinkedinAnalyses()).rejects.toThrow("Banco fora");
  });

  it("payload histórico não vazio e todo corrompido também é erro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [{ score: "quarenta" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    await expect(listLinkedinAnalyses()).rejects.toThrow("Histórico inválido");
  });

  it.each([
    [{ score: -12 }, "score negativo"],
    [{ score: 174 }, "score acima de 100"],
    [{ faixa: "super-magnetico" }, "faixa desconhecida"],
    [{ score: 10, faixa: "magnetico" }, "score e faixa incoerentes"],
  ])("descarta resumo inválido (%s): %s", (override, _caso) => {
    expect(
      readAnalysisSummary({
        id: "analysis-1",
        area: "frontend",
        level: "junior",
        score: 42,
        faixa: "em-construcao",
        created_at: "2026-08-15T12:00:00Z",
        ...override,
      }),
    ).toBeNull();
  });

  it("mantém deterministicVersion ausente como null no histórico legado", () => {
    expect(
      readAnalysisSummary({
        id: "analysis-1",
        area: "frontend",
        level: "junior",
        score: 42,
        faixa: "em-construcao",
        created_at: "2026-08-15T12:00:00Z",
      })?.deterministicVersion,
    ).toBeNull();
  });

  it("cliente ignora progresso negativo, decimal, NaN e acima do total", () => {
    expect(
      sanitizeLinkedinImprovementIndexes([-1, 0, 1, 1.5, Number.NaN, 4], 4),
    ).toEqual([0, 1]);
  });

  it("GET de progresso degrada payload corrompido antes de chegar à UI", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              applied: [-1, 0, 2.5, 3],
              progressAvailable: true,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
    );
    expect((await getLinkedinImprovements("analysis-1")).applied).toEqual([
      0, 3,
    ]);
  });

  it("GET exige revisão server-side para disponibilizar o checklist", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            applied: [1],
            progressAvailable: true,
            revision: 12,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ applied: [1], progressAvailable: true }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getLinkedinImprovements("analysis-1")).resolves.toEqual({
      applied: [1],
      progressAvailable: true,
      revision: 12,
    });
    await expect(getLinkedinImprovements("analysis-1")).resolves.toEqual({
      applied: [1],
      progressAvailable: false,
      revision: null,
    });
  });

  it("PUT envia a revisão estabelecida pelo GET", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await setLinkedinImprovement("analysis-1", 2, true, 12);

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({ done: true, revision: 12 });
  });

  it("PUT traduz 409 stale_progress_revision para conflito reconhecível", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "stale_progress_revision",
              message: "sessão antiga",
            },
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(
      setLinkedinImprovement("analysis-1", 0, true, 1),
    ).rejects.toThrow("STALE_PROGRESS_REVISION");
  });
});
