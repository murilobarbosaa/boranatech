import { describe, expect, it, vi } from "vitest";

import {
  beginLinkedinProgressSession,
  beginLinkedinProgressSessionViaRpc,
  mutateLinkedinImprovementViaRpc,
  quantidadeDeMelhorias,
  saveLinkedinImprovement,
  type LinkedinImprovementMutation,
  type SaveLinkedinImprovementDependencies,
} from "../lib/linkedinImprovementProgress";

function melhoria(index: number) {
  return {
    prioridade: "alta" as const,
    titulo: `Melhoria ${index}`,
    comoFazer: "Aplicar a melhoria descrita.",
  };
}

function dependencies(
  status:
    | "saved"
    | "not_found"
    | "stale_progress_revision"
    | "invalid_improvement_index" = "saved",
): SaveLinkedinImprovementDependencies & {
  mutateAtomically: ReturnType<typeof vi.fn>;
} {
  return {
    mutateAtomically: vi.fn(async () => ({ status })),
  };
}

const BASE = {
  userId: "user-1",
  analysisId: "analysis-1",
  done: true,
  revision: 1,
};

describe("mutação comportamental da rota de progresso", () => {
  it("análise inexistente ou alheia não revela existência e não grava", async () => {
    const deps = dependencies("not_found");
    await expect(
      saveLinkedinImprovement({ ...BASE, index: 0 }, deps),
    ).resolves.toEqual({ status: "not_found" });
    expect(deps.mutateAtomically).toHaveBeenCalledTimes(1);
  });

  it.each([-1, 0.5])(
    "rejeita índice inválido %s antes de consultar/gravar",
    async (index) => {
      const deps = dependencies();
      await expect(
        saveLinkedinImprovement({ ...BASE, index }, deps),
      ).resolves.toEqual({ status: "invalid_request" });
      expect(deps.mutateAtomically).not.toHaveBeenCalled();
    },
  );

  it("rejeita índice igual ao total", async () => {
    const deps = dependencies("invalid_improvement_index");
    await expect(
      saveLinkedinImprovement({ ...BASE, index: 2 }, deps),
    ).resolves.toEqual({ status: "invalid_improvement_index" });
    expect(deps.mutateAtomically).toHaveBeenCalledTimes(1);
  });

  it("envia posse, índice, estado e revisão para a mutação atômica", async () => {
    const deps = dependencies();

    await expect(
      saveLinkedinImprovement({ ...BASE, index: 1 }, deps),
    ).resolves.toEqual({ status: "saved" });
    expect(deps.mutateAtomically).toHaveBeenCalledWith({
      userId: "user-1",
      analysisId: "analysis-1",
      index: 1,
      done: true,
      revision: 1,
    });
  });

  it("calcula o total de resultado legado sem versão", () => {
    const legacy = {
      qualitative: {
        melhorias: [melhoria(0), melhoria(1), melhoria(2)],
        skillsSugeridas: ["React"],
      },
    };
    expect(quantidadeDeMelhorias(legacy)).toBe(3);
  });

  it("RPC degrada resultado corrompido e recusa o índice", async () => {
    const deps = dependencies("invalid_improvement_index");
    await expect(
      saveLinkedinImprovement({ ...BASE, index: 0 }, deps),
    ).resolves.toEqual({ status: "invalid_improvement_index" });
  });

  it("rejeita revisão ausente, decimal, zero ou negativa antes da RPC", async () => {
    for (const revision of [undefined, 1.5, 0, -1]) {
      const deps = dependencies();
      await expect(
        saveLinkedinImprovement({ ...BASE, index: 0, revision }, deps),
      ).resolves.toEqual({ status: "invalid_request" });
      expect(deps.mutateAtomically).not.toHaveBeenCalled();
    }
  });

  it("revision 1 não altera o banco depois que revision 2 foi criada", async () => {
    let storedDone = false;
    let currentRevision = 1;
    let release!: () => void;
    let reachedDatabase!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const atDatabase = new Promise<void>((resolve) => {
      reachedDatabase = resolve;
    });
    const deps: SaveLinkedinImprovementDependencies = {
      mutateAtomically: vi.fn(async (mutation: LinkedinImprovementMutation) => {
        reachedDatabase();
        await gate;
        if (mutation.revision !== currentRevision) {
          return { status: "stale_progress_revision" as const };
        }
        storedDone = mutation.done;
        return { status: "saved" as const };
      }),
    };

    const oldPut = saveLinkedinImprovement({ ...BASE, index: 0 }, deps);
    await atDatabase;
    currentRevision = 2;
    release();

    await expect(oldPut).resolves.toEqual({
      status: "stale_progress_revision",
    });
    expect(storedDone).toBe(false);
  });

  it("rejeita resposta de abertura com revisão inválida", async () => {
    await expect(
      beginLinkedinProgressSession({
        beginAtomically: async () => ({ status: "started", revision: 0 }),
      }),
    ).resolves.toMatchObject({ status: "start_failed" });
  });

  it("service chama as duas RPCs com posse, revisão e inputs exatos", async () => {
    const beginRpc = vi.fn(async () => ({
      data: [{ status: "started", revision: 7 }],
      error: null,
    }));
    await expect(
      beginLinkedinProgressSessionViaRpc(
        { userId: "user-1", analysisId: "analysis-1" },
        beginRpc,
      ),
    ).resolves.toEqual({ status: "started", revision: 7 });
    expect(beginRpc).toHaveBeenCalledWith("linkedin_begin_progress_session", {
      p_user_id: "user-1",
      p_analysis_id: "analysis-1",
    });

    const mutateRpc = vi.fn(async () => ({
      data: "stale_progress_revision",
      error: null,
    }));
    await expect(
      mutateLinkedinImprovementViaRpc(
        {
          userId: "user-1",
          analysisId: "analysis-1",
          index: 2,
          done: true,
          revision: 7,
        },
        mutateRpc,
      ),
    ).resolves.toEqual({ status: "stale_progress_revision" });
    expect(mutateRpc).toHaveBeenCalledWith(
      "linkedin_set_improvement_progress",
      {
        p_user_id: "user-1",
        p_analysis_id: "analysis-1",
        p_improvement_index: 2,
        p_done: true,
        p_revision: 7,
      },
    );
  });

  it("service degrada erro e resposta inválida da RPC sem gravar por fora", async () => {
    const rpcError = { code: "PGRST202" };
    await expect(
      mutateLinkedinImprovementViaRpc(
        {
          userId: "user-1",
          analysisId: "analysis-1",
          index: 0,
          done: false,
          revision: 1,
        },
        async () => ({ data: null, error: rpcError }),
      ),
    ).resolves.toEqual({ status: "save_failed", error: rpcError });

    await expect(
      beginLinkedinProgressSessionViaRpc(
        { userId: "user-1", analysisId: "analysis-1" },
        async () => ({
          data: [{ status: "started", revision: "7" }],
          error: null,
        }),
      ),
    ).resolves.toMatchObject({ status: "start_failed" });
  });
});
