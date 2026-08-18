import { beforeEach, describe, expect, it, vi } from "vitest";

const context = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.mock("../userContext/pool", () => ({
  fetchUserContextPool: context.fetch,
}));

import { buildUserSnapshot } from "./userSnapshot";

beforeEach(() => {
  context.fetch.mockReset();
});

describe("snapshot do agente valida nota LinkedIn", () => {
  it("não transforma score/faixa corrompidos em fato textual", async () => {
    context.fetch.mockResolvedValue({
      plan: { ok: false },
      quiz: { ok: false },
      roadmaps: { ok: false },
      courses: { ok: false },
      skills: { ok: false },
      studyDiary: { ok: false },
      profile: { ok: false },
      bookmarks: { ok: false },
      linkedin: {
        ok: true,
        data: {
          area: "frontend",
          level: "pleno",
          score: 10,
          faixa: "magnetico",
          deterministicVersion: 8,
          notaIncompleta: false,
          createdAt: "2026-08-15T12:00:00Z",
        },
      },
      github: { ok: false },
      badges: { ok: false },
      resumeAnalysis: { ok: false },
      resumes: { ok: false },
      interview: { ok: false },
      careerPlan: { ok: false },
    });

    const snapshot = await buildUserSnapshot("user-1");
    expect(snapshot).toContain("nota indisponivel");
    expect(snapshot).not.toContain("nota 10");
    expect(snapshot).not.toContain("faixa magnetico");
  });
});
