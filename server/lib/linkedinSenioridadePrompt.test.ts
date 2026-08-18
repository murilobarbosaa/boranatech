import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import { LINKEDIN_LEVELS } from "../../shared/linkedin/schema";

vi.mock("./env", () => ({
  env: { openaiApiKey: "test", billingEnabled: false },
}));

import { SYSTEM_PROMPT } from "./linkedinAnalyze";

const PERFIL_EXPERIENTE = readFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "__fixtures__",
    "linkedin",
    "perfil-a-senior.txt",
  ),
  "utf8",
);

describe("golden de senioridade no prompt", () => {
  it("a fixture de pleno contém evidências inequívocas de atuação experiente", () => {
    expect(PERFIL_EXPERIENTE).toContain("8 anos de experiência");
    expect(PERFIL_EXPERIENTE).toContain("arquitetura de microsserviços");
    expect(PERFIL_EXPERIENTE).toContain("liderei");
  });

  it("o seletor é contexto, nunca teto nem licença para inflar", () => {
    expect(SYSTEM_PROMPT).toContain(
      "iniciantes, profissionais intermediários e profissionais experientes",
    );
    expect(SYSTEM_PROMPT).toContain(
      "nunca teto nem autorização para reduzir ou inflar",
    );
    expect(SYSTEM_PROMPT).toContain("nem a rebaixe artificialmente");
    expect(SYSTEM_PROMPT).toContain(
      "não a chame de sênior, especialista ou líder",
    );
    expect(SYSTEM_PROMPT).toContain("define ao mesmo tempo o piso e o teto");
  });

  it("não amplia o enum público nesta fase", () => {
    expect(LINKEDIN_LEVELS).toContain("pleno");
    expect(LINKEDIN_LEVELS).not.toContain("senior" as never);
  });
});
