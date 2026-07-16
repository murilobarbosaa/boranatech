import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

import type { NotificationsPage } from "@/services/notificationsService";

// ── Mocks controláveis ──────────────────────────────────────────────────────
const authState = vi.hoisted(() => ({
  value: { user: null as { id: string } | null },
}));

const svc = vi.hoisted(() => ({
  fetch: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState.value,
}));

vi.mock("@/services/notificationsService", () => ({
  fetchNotifications: (...args: unknown[]) => svc.fetch(...args),
  markAsRead: (...args: unknown[]) => svc.markAsRead(...args),
  markAllAsRead: (...args: unknown[]) => svc.markAllAsRead(...args),
}));

import {
  NotificationsProvider,
  useNotifications,
} from "@/contexts/NotificationsContext";
import { useBellRing } from "@/components/notifications/NotificationBell";

type Ctx = ReturnType<typeof useNotifications>;

let ctx: Ctx | null = null;
function Capture() {
  ctx = useNotifications();
  return null;
}

function page(unread: number, data: NotificationsPage["data"] = []) {
  return { data, unread_count: unread, next_cursor: null } as NotificationsPage;
}

function unreadItem(id: string) {
  return {
    id,
    title: "t",
    body: "b",
    type: "announcement",
    category: "product",
    audience: "all",
    coupon_code: null,
    discount_percent: null,
    cta_url: null,
    cta_label: null,
    expires_at: null,
    published_at: "2026-07-16T00:00:00.000Z",
    is_expired: false,
    read_at: null,
  } as NotificationsPage["data"][number];
}

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function poll(nextPage: NotificationsPage) {
  svc.fetch.mockResolvedValueOnce(nextPage);
  await act(async () => {
    await ctx!.refresh({ silent: true });
  });
}

beforeEach(() => {
  svc.fetch.mockReset();
  svc.markAsRead.mockReset().mockResolvedValue(undefined);
  svc.markAllAsRead.mockReset().mockResolvedValue(1);
  authState.value = { user: { id: "u1" } };
  ctx = null;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Monta o provider e deixa o fetch inicial (login) virar baseline.
async function mountWithBaseline(baseline: NotificationsPage) {
  svc.fetch.mockResolvedValueOnce(baseline);
  render(
    <NotificationsProvider>
      <Capture />
    </NotificationsProvider>,
  );
  await flush();
}

describe("NotificationsContext: sinal de chegada (arrivalSignal)", () => {
  it("baseline: primeira resposta da sessão NÃO emite, mesmo com não lidas", async () => {
    await mountWithBaseline(page(3));
    expect(ctx!.unreadCount).toBe(3);
    expect(ctx!.arrivalSignal).toBe(0);
  });

  it("aumento vindo do servidor emite uma vez", async () => {
    await mountWithBaseline(page(1));
    await poll(page(2));
    expect(ctx!.unreadCount).toBe(2);
    expect(ctx!.arrivalSignal).toBe(1);
  });

  it("dois aumentos distintos emitem dois sinais", async () => {
    await mountWithBaseline(page(0));
    await poll(page(1));
    await poll(page(3));
    expect(ctx!.arrivalSignal).toBe(2);
  });

  it("mesmo valor ou queda vinda do servidor não emite", async () => {
    await mountWithBaseline(page(2));
    await poll(page(2)); // igual
    await poll(page(1)); // queda
    expect(ctx!.arrivalSignal).toBe(0);
  });

  it("refetch ao abrir (mesmo valor do servidor) não emite", async () => {
    // Simula handleOpenChange -> refresh({silent}) trazendo o count atual.
    await mountWithBaseline(page(5));
    await poll(page(5));
    expect(ctx!.arrivalSignal).toBe(0);
  });

  it("markAsRead otimista (sucesso) não emite", async () => {
    await mountWithBaseline(page(2, [unreadItem("n1")]));
    await act(async () => {
      await ctx!.markAsRead("n1");
    });
    expect(ctx!.unreadCount).toBe(1);
    expect(ctx!.arrivalSignal).toBe(0);
  });

  it("rollback de markAsRead (falha) re-incrementa o count mas NÃO emite", async () => {
    await mountWithBaseline(page(2, [unreadItem("n1")]));
    svc.markAsRead.mockRejectedValueOnce(new Error("boom"));
    await act(async () => {
      await ctx!.markAsRead("n1");
    });
    expect(ctx!.unreadCount).toBe(2); // voltou
    expect(ctx!.arrivalSignal).toBe(0); // sino não balança no rollback
  });

  it("markAllAsRead otimista não emite", async () => {
    await mountWithBaseline(page(3, [unreadItem("n1"), unreadItem("n2")]));
    await act(async () => {
      await ctx!.markAllAsRead();
    });
    expect(ctx!.unreadCount).toBe(0);
    expect(ctx!.arrivalSignal).toBe(0);
  });

  it("chegada logo após ler tudo emite (compara com o servidor, não com o count local)", async () => {
    await mountWithBaseline(page(1, [unreadItem("n1")]));
    await act(async () => {
      await ctx!.markAllAsRead(); // count local -> 0, servidor continua 1
    });
    await poll(page(2)); // servidor 1 -> 2: chegada real
    expect(ctx!.arrivalSignal).toBe(1);
  });
});

// ── Hook do sino: reage ao sinal e é resiliente à remontagem ─────────────────
function BellHarness({ signal }: { signal: number }) {
  const ringing = useBellRing(signal);
  return <span data-testid="ring">{ringing ? "ring" : "idle"}</span>;
}

describe("useBellRing: reação ao sinal e resiliência a remount", () => {
  it("semear no mount não toca; incremento toca", async () => {
    const { getByTestId, rerender } = render(<BellHarness signal={0} />);
    await flush();
    expect(getByTestId("ring").textContent).toBe("idle");

    await act(async () => {
      rerender(<BellHarness signal={1} />);
    });
    expect(getByTestId("ring").textContent).toBe("ring");
  });

  it("remontar o sino com o sinal atual não reemite (não duplica); novo incremento toca", async () => {
    // Sinal já em 1 (uma chegada aconteceu). O sino remonta numa navegação.
    const first = render(<BellHarness signal={1} />);
    await flush();
    expect(first.getByTestId("ring").textContent).toBe("idle");
    first.unmount();

    // Remonta lendo o mesmo sinal 1 do provider durável: não deve tocar.
    const second = render(<BellHarness signal={1} />);
    await flush();
    expect(second.getByTestId("ring").textContent).toBe("idle");

    // Próxima chegada (1 -> 2) toca normalmente após a remontagem.
    await act(async () => {
      second.rerender(<BellHarness signal={2} />);
    });
    expect(second.getByTestId("ring").textContent).toBe("ring");
  });
});
