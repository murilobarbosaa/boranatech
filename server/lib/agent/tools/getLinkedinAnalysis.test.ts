import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ maybeSingle: vi.fn() }));

vi.mock("../../supabaseAdmin", () => {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order", "limit"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.maybeSingle = db.maybeSingle;
  return { supabaseAdmin: { from: vi.fn(() => chain) } };
});

import { getLinkedinAnalysis } from "./getLinkedinAnalysis";

beforeEach(() => {
  db.maybeSingle.mockReset();
});

describe("get_linkedin_analysis com nota pendente", () => {
  it("retorna score/faixa junto ao estado provisório inequívoco", async () => {
    db.maybeSingle.mockResolvedValue({
      data: {
        area: "frontend",
        level: "pleno",
        score: 67,
        faixa: "em-construcao",
        created_at: "2026-08-15T12:00:00Z",
        result: {
          deterministic: { notaIncompleta: true },
          qualitative: { melhorias: [], proximoPasso: "Revisar headline" },
        },
      },
      error: null,
    });

    const raw = await getLinkedinAnalysis.execute(
      {},
      { userId: "user-1", isPro: true },
    );
    const payload = JSON.parse(raw) as {
      data: {
        score: number;
        faixa: string;
        notaIncompleta: boolean;
        statusNota: string;
      };
    };
    expect(payload.data).toMatchObject({
      score: 67,
      faixa: "em-construcao",
      notaIncompleta: true,
      statusNota: "provisoria_a_confirmar",
    });
  });

  it("degrada score/faixa persistidos em combinação impossível", async () => {
    db.maybeSingle.mockResolvedValue({
      data: {
        area: "frontend",
        level: "pleno",
        score: 10,
        faixa: "magnetico",
        created_at: "2026-08-15T12:00:00Z",
        result: {
          deterministicVersion: 8,
          deterministic: { notaIncompleta: false },
          qualitative: { melhorias: [] },
        },
      },
      error: null,
    });

    const raw = await getLinkedinAnalysis.execute(
      {},
      { userId: "user-1", isPro: true },
    );
    expect(JSON.parse(raw).data).toMatchObject({
      score: null,
      faixa: null,
      deterministicVersion: 8,
      statusNota: "indisponivel",
    });
  });
});
