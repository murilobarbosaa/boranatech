import { describe, expect, it, vi } from "vitest";

import { createLinkedinProgressQueue } from "./linkedinProgressQueue";

describe("fila de toggles do progresso", () => {
  it("serializa toggles rápidos e marca a resposta antiga como ultrapassada", async () => {
    const queue = createLinkedinProgressQueue();
    let liberarPrimeira!: () => void;
    const primeiraPendente = new Promise<void>((resolve) => {
      liberarPrimeira = resolve;
    });
    const ordem: string[] = [];
    const primeira = queue.enqueue("analysis:0", async () => {
      ordem.push("primeira-inicio");
      await primeiraPendente;
      ordem.push("primeira-fim");
    });
    const segundaTask = vi.fn(async () => {
      ordem.push("segunda");
    });
    const segunda = queue.enqueue("analysis:0", segundaTask);

    await Promise.resolve();
    expect(segundaTask).not.toHaveBeenCalled();
    expect(queue.isLatest("analysis:0", primeira.mutation)).toBe(false);
    expect(queue.isLatest("analysis:0", segunda.mutation)).toBe(true);

    liberarPrimeira();
    await Promise.all([primeira.promise, segunda.promise]);
    expect(ordem).toEqual(["primeira-inicio", "primeira-fim", "segunda"]);
  });

  it("executa a intenção mais nova mesmo quando a gravação anterior falha", async () => {
    const queue = createLinkedinProgressQueue();
    const ordem: string[] = [];
    const primeira = queue.enqueue("analysis:0", async () => {
      ordem.push("primeira");
      throw new Error("falha antiga");
    });
    const segunda = queue.enqueue("analysis:0", async () => {
      ordem.push("segunda");
    });

    await expect(primeira.promise).rejects.toThrow("falha antiga");
    await expect(segunda.promise).resolves.toBeUndefined();
    expect(ordem).toEqual(["primeira", "segunda"]);
    expect(queue.isLatest("analysis:0", primeira.mutation)).toBe(false);
    expect(queue.isLatest("analysis:0", segunda.mutation)).toBe(true);
  });
});
