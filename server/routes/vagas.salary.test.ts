import { describe, expect, it, vi } from "vitest";
vi.mock("../middleware/auth", () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
  checkProStatus: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
vi.mock("../lib/supabaseAdmin", () => ({ supabaseAdmin: {} }));
import { AdminCreateSchema, AdminPatchSchema } from "./vagas";

const base = {
  title: "Pessoa desenvolvedora",
  company: "Empresa exemplo",
  location: "Remoto",
  url: "https://example.test/vaga",
};

describe("contrato administrativo de salário", () => {
  it("permite criação sem salário e com salário positivo", () => {
    expect(AdminCreateSchema.safeParse(base).success).toBe(true);
    expect(
      AdminCreateSchema.safeParse({
        ...base,
        salary_min: 4500,
        salary_currency: "BRL",
      }).success,
    ).toBe(true);
    expect(
      AdminCreateSchema.safeParse({
        ...base,
        salary_min: 7000,
        salary_max: 4500,
        salary_currency: "BRL",
      }).success,
    ).toBe(false);
  });
  it("PATCH distingue omissão de limpeza e rejeita zero ou negativos", () => {
    expect(AdminPatchSchema.parse({ title: "Outra vaga" })).not.toHaveProperty(
      "salary_min",
    );
    expect(
      AdminPatchSchema.parse({
        salary_min: null,
        salary_max: null,
        salary_currency: null,
      }),
    ).toMatchObject({
      salary_min: null,
      salary_max: null,
      salary_currency: null,
    });
    expect(
      AdminPatchSchema.safeParse({ salary_min: 0, salary_currency: "BRL" })
        .success,
    ).toBe(false);
    expect(
      AdminPatchSchema.safeParse({ salary_min: -1, salary_currency: "BRL" })
        .success,
    ).toBe(false);
    // A rota valida a moeda efetiva após ler o registro atual. O PATCH
    // parcial pode manter uma moeda já gravada sem reenviá-la.
    expect(AdminPatchSchema.safeParse({ salary_min: 4500 }).success).toBe(true);
  });
});
