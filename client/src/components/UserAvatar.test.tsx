import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import UserAvatar from "./UserAvatar";

/**
 * UserAvatar (lote 11c): o fundo escolhido sai pela classe do token, que e a
 * mesma nos dois temas (nao existe `dark:` nem token redefinido; o segundo
 * ponto e provado em constants/avatarOptions.test.ts).
 */

afterEach(() => {
  cleanup();
});

describe("UserAvatar: fundo por token", () => {
  it("bg cream carrega bg-[var(--avatar-bg-creme)] e a tinta do creme, sem dark:", () => {
    const { container } = render(
      <UserAvatar name="Murilo Barbosa" bg="cream" icon="initials" size="sm" />,
    );
    const html = container.innerHTML;
    expect(html).toContain("bg-[var(--avatar-bg-creme)]");
    expect(html).toContain("text-[var(--avatar-ink-creme)]");
    expect(html).not.toContain("dark:");
    expect(html).not.toContain("brand-cream");
    expect(html).toContain("MB");
  });

  it("bg desconhecido cai no padrao (amarelo), que tambem e por token", () => {
    const { container } = render(
      <UserAvatar name="Ana" bg={null} icon="rocket" size="md" />,
    );
    expect(container.innerHTML).toContain("bg-[var(--avatar-bg-amarelo)]");
  });
});
