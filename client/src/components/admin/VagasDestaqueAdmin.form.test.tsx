import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const service = vi.hoisted(() => ({
  fetch: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/services/vagasService", () => ({
  fetchVagasAdmin: (...args: unknown[]) => service.fetch(...args),
  createVagaAdmin: (...args: unknown[]) => service.create(...args),
  updateVagaAdmin: (...args: unknown[]) => service.update(...args),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import VagasDestaqueAdmin from "./VagasDestaqueAdmin";

const job = {
  id: "synthetic-job",
  title: "Pessoa desenvolvedora",
  company: "Empresa Exemplo",
  location: "Remoto",
  country: "br",
  url: "https://example.test/vaga",
  seniority: null,
  contract: null,
  modality: null,
  description: null,
  featured: true,
  featuredUntil: null,
  published: true,
  publishedAt: null,
  salaryMin: 4500,
  salaryMax: 7000,
  salaryCurrency: "BRL",
  salaryIsPredicted: false,
};
beforeEach(() => {
  service.fetch.mockReset().mockResolvedValue([]);
  service.create.mockReset().mockResolvedValue(undefined);
  service.update.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("formulário de vagas: salário não informado", () => {
  it("cria sem salário omitindo os campos e mostra opção explícita", async () => {
    render(<VagasDestaqueAdmin />);
    expect(screen.getByRole("radio", { name: "Não informado" })).toHaveProperty(
      "checked",
      true,
    );
    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: job.title },
    });
    fireEvent.change(screen.getByLabelText("Empresa"), {
      target: { value: job.company },
    });
    fireEvent.change(screen.getByLabelText("Localização"), {
      target: { value: job.location },
    });
    fireEvent.change(screen.getByLabelText("URL da vaga (https)"), {
      target: { value: job.url },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Criar vaga destaque" }),
    );
    await waitFor(() => expect(service.create).toHaveBeenCalledTimes(1));
    const payload = service.create.mock.calls[0][0];
    expect(JSON.parse(JSON.stringify(payload))).not.toHaveProperty(
      "salary_min",
    );
    expect(JSON.parse(JSON.stringify(payload))).not.toHaveProperty(
      "salary_max",
    );
  });
  it("edita salário existente e envia null ao selecionar Não informado", async () => {
    service.fetch.mockResolvedValue([job]);
    render(<VagasDestaqueAdmin />);
    fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
    expect(
      screen.getByRole("radio", { name: "Informar salário" }),
    ).toHaveProperty("checked", true);
    fireEvent.click(screen.getByRole("radio", { name: "Não informado" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() =>
      expect(service.update).toHaveBeenCalledWith(
        "synthetic-job",
        expect.objectContaining({
          salary_min: null,
          salary_max: null,
          salary_currency: null,
        }),
      ),
    );
  });
});
