import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UserListRow } from "./UserListRow";

afterEach(cleanup);
it("texto da linha é selecionável e só Abrir usuário navega", () => {
  const onOpen = vi.fn();
  const row = {
    user_id: "synthetic-user",
    name: "Pessoa Exemplo",
    email: "pessoa@example.test",
    created_at: "2026-09-22T00:00:00Z",
    last_sign_in_at: null,
    pro_source: null,
    subscription_status: null,
    renewal_type: null,
    current_period_end: null,
    plan_code: null,
    total_pago_cents: 0,
  } as Parameters<typeof UserListRow>[0]["row"];
  render(<UserListRow row={row} onOpen={onOpen} />);
  const name = screen.getByText("Pessoa Exemplo");
  fireEvent.click(name);
  fireEvent.touchStart(name);
  fireEvent.touchEnd(name);
  window.getSelection()?.selectAllChildren(name);
  expect(window.getSelection()?.toString()).toContain("Pessoa Exemplo");
  expect(onOpen).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Abrir usuário" }));
  expect(onOpen).toHaveBeenCalledExactlyOnceWith("synthetic-user");
});
