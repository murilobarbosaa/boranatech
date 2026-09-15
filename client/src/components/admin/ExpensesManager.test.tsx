import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));

import { ExpensesManager } from "./ExpensesManager";

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation((path: unknown) => {
    const route = String(path);
    if (route.startsWith("/finance/expenses?")) {
      return Promise.resolve({
        data: { rows: [], total: 0, page: 1, pageSize: 25 },
      });
    }
    if (route.startsWith("/finance/summary?")) {
      return Promise.resolve({ data: { despesasPorCategoria: [] } });
    }
    return Promise.resolve({ data: {} });
  });
});

afterEach(cleanup);

describe("ExpensesManager", () => {
  it("abre o formulário sob demanda e preserva o rascunho ao fechar", async () => {
    render(<ExpensesManager />);
    expect(screen.queryByLabelText("Descrição")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Nova despesa" }));
    const description = screen.getByLabelText("Descrição") as HTMLInputElement;
    fireEvent.change(description, { target: { value: "Fixture sintética" } });
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));

    await waitFor(() =>
      expect(screen.queryByLabelText("Descrição")).toBeNull(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Nova despesa" }));
    expect((screen.getByLabelText("Descrição") as HTMLInputElement).value).toBe(
      "Fixture sintética",
    );
  });

  it("gerencia foco, Escape e retorno ao gatilho", async () => {
    render(<ExpensesManager />);
    const trigger = screen.getByRole("button", { name: "Nova despesa" });
    fireEvent.click(trigger);
    const description = screen.getByLabelText("Descrição");
    await waitFor(() => expect(document.activeElement).toBe(description));

    fireEvent.keyDown(document.activeElement ?? document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("não persiste rascunho entre montagens", async () => {
    const rendered = render(<ExpensesManager />);
    fireEvent.click(screen.getByRole("button", { name: "Nova despesa" }));
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Rascunho local" },
    });
    rendered.unmount();

    render(<ExpensesManager />);
    fireEvent.click(screen.getByRole("button", { name: "Nova despesa" }));
    expect((screen.getByLabelText("Descrição") as HTMLInputElement).value).toBe(
      "",
    );
  });

  it("bloqueia envio duplicado e limpa o formulário após sucesso", async () => {
    let resolvePost!: (value: unknown) => void;
    const pendingPost = new Promise((resolve) => {
      resolvePost = resolve;
    });
    fetchMock.mockImplementation(
      (path: unknown, options?: { method?: string }) => {
        const route = String(path);
        if (route === "/finance/expenses" && options?.method === "POST") {
          return pendingPost;
        }
        if (route.startsWith("/finance/expenses?")) {
          return Promise.resolve({
            data: { rows: [], total: 0, page: 1, pageSize: 25 },
          });
        }
        if (route.startsWith("/finance/summary?")) {
          return Promise.resolve({ data: { despesasPorCategoria: [] } });
        }
        return Promise.resolve({ data: {} });
      },
    );
    render(<ExpensesManager />);
    fireEvent.click(screen.getByRole("button", { name: "Nova despesa" }));
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Despesa sintética" },
    });
    fireEvent.change(screen.getByLabelText("Competência"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.change(screen.getByLabelText("Valor"), {
      target: { value: "10,00" },
    });
    const form = screen
      .getByRole("button", { name: "Lançar despesa" })
      .closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(
      fetchMock.mock.calls.filter(
        ([path, options]) =>
          path === "/finance/expenses" && options?.method === "POST",
      ),
    ).toHaveLength(1);

    resolvePost({ data: {} });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Nova despesa" }));
    expect((screen.getByLabelText("Descrição") as HTMLInputElement).value).toBe(
      "",
    );
  });
});
