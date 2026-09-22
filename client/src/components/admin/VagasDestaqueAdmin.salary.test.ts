import { describe, expect, it } from "vitest";
import { payloadFromForm } from "./VagasDestaqueAdmin";
import { salaryLine } from "@/components/vagas/VagasJobCard";
import type { VagaItem } from "@/services/vagasService";

type Form = Parameters<typeof payloadFromForm>[0];
const form: Form = {
  title: "Pessoa desenvolvedora",
  company: "Empresa exemplo",
  location: "Remoto",
  country: "br",
  url: "https://example.test/vaga",
  seniority: "",
  contract: "",
  modality: "",
  description: "",
  salaryMode: "not_informed",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "",
  featured: true,
  featuredUntil: "",
  published: true,
};

describe("salário de vaga manual", () => {
  it("omite salário na criação sem informação e envia null para limpar no PATCH", () => {
    const create = payloadFromForm(form, false);
    const clear = payloadFromForm(form, true);
    expect(JSON.parse(JSON.stringify(create))).not.toHaveProperty("salary_min");
    expect(clear).toMatchObject({
      salary_min: null,
      salary_max: null,
      salary_currency: null,
    });
  });
  it("preserva valores positivos e moeda quando informados", () => {
    expect(
      payloadFromForm(
        {
          ...form,
          salaryMode: "informed",
          salaryMin: "4500",
          salaryMax: "7000",
          salaryCurrency: "BRL",
        },
        true,
      ),
    ).toMatchObject({
      salary_min: 4500,
      salary_max: 7000,
      salary_currency: "BRL",
    });
  });
  it("mostra ausência e zero legado como Não informado, sem converter o registro", () => {
    const item = {
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryIsPredicted: null,
    } as VagaItem;
    expect(salaryLine(item)).toBe("Não informado");
    expect(salaryLine({ ...item, salaryMin: 0, salaryCurrency: "BRL" })).toBe(
      "Não informado",
    );
    expect(
      salaryLine({ ...item, salaryMin: 4500, salaryCurrency: "BRL" }),
    ).toContain("4.500");
  });
});
