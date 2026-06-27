import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

// ── Mocks controlaveis ───────────────────────────────────────────────────────
const authState = vi.hoisted(() => ({
  value: { user: null as { id: string } | null, loading: false },
}));
const getData = vi.hoisted(() => ({ value: [] as unknown[] }));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState.value,
}));

vi.mock("posthog-js", () => ({
  default: { capture: vi.fn(), identify: vi.fn(), reset: vi.fn() },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { access_token: "tok" } },
      })),
      refreshSession: vi.fn(async () => ({
        data: { session: { access_token: "tok2" } },
      })),
    },
  },
}));

// apiUrl identidade: o primeiro arg do fetch vira o path cru, mais facil de assertar.
vi.mock("@/lib/api", () => ({ apiUrl: (path: string) => path }));

const fetchMock = vi.fn(async (_url: string, _opts?: RequestInit) => ({
  ok: true,
  status: 200,
  json: async () => ({ data: getData.value }),
}));

import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { peekPendingGate, savePendingGate } from "@/lib/authGate";

const GATE_KEY = "boranatech.pending_gate";

function renderProvider() {
  return render(
    <FavoritesProvider>
      <div data-testid="child" />
    </FavoritesProvider>,
  );
}

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
  });
}

function postCalls() {
  return fetchMock.mock.calls.filter(
    (call) => (call[1] as RequestInit | undefined)?.method === "POST",
  );
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  fetchMock.mockClear();
  getData.value = [];
  authState.value = { user: { id: "u1" }, loading: false };
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("FavoritesContext: replay de favorito via pending_gate", () => {
  it("1. DomainIntent favorito valido -> POST uma vez + pending_gate limpo", async () => {
    savePendingGate({
      destination: "/tecnologias/react",
      intent: {
        kind: "domain",
        domain: "favorite",
        payload: {
          type: "tecnologia",
          itemKey: "react",
          snapshot: { title: "React", subtitle: "Lib", url: "/tecnologias/react" },
        },
      },
    });

    renderProvider();
    await flush();

    const posts = postCalls();
    expect(posts).toHaveLength(1);
    const body = JSON.parse((posts[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({
      resource_type: "tecnologia",
      resource_id: "react",
      title_snapshot: "React",
      subtitle_snapshot: "Lib",
      url_snapshot: "/tecnologias/react",
    });
    expect(peekPendingGate()).toBeNull();
  });

  it("2. intent de navegacao (ou ausente) -> sem POST + pending_gate NAO limpo", async () => {
    savePendingGate({
      destination: "/x",
      intent: { kind: "navigate", to: "/y" },
    });

    renderProvider();
    await flush();

    expect(postCalls()).toHaveLength(0);
    // peek, nao consumiu: o gate continua la pra um consumidor de navegacao.
    expect(peekPendingGate()?.destination).toBe("/x");
  });

  it("3. domain favorite com payload malformado -> sem POST + limpo + warn", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    savePendingGate({
      destination: "/x",
      intent: {
        kind: "domain",
        domain: "favorite",
        payload: { type: "tecnologia" }, // sem itemKey
      },
    });

    renderProvider();
    await flush();

    expect(postCalls()).toHaveLength(0);
    expect(peekPendingGate()).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it("4. favorito ja presente na lista -> ainda faz POST (espelha OAuth: sem dedup)", async () => {
    // O consumidor roda no bloco justSignedIn ANTES do GET da lista, igual ao
    // maybeConsumeOAuthFavorite. Nao ha dedup; o POST ocorre mesmo que o GET
    // depois traga o mesmo item.
    getData.value = [
      {
        resource_type: "tecnologia",
        resource_id: "react",
        title_snapshot: "React",
      },
    ];

    savePendingGate({
      destination: "/tecnologias/react",
      intent: {
        kind: "domain",
        domain: "favorite",
        payload: {
          type: "tecnologia",
          itemKey: "react",
          snapshot: { title: "React" },
        },
      },
    });

    renderProvider();
    await flush();

    expect(postCalls()).toHaveLength(1);
    expect(peekPendingGate()).toBeNull();
  });

  it("5. sem pending_gate -> nenhum POST (smoke), sem throw", async () => {
    renderProvider();
    await flush();

    expect(postCalls()).toHaveLength(0);
  });

  it("6. sessionStorage.getItem lanca no pending_gate -> sem throw, sem POST", async () => {
    const orig = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (
      this: Storage,
      key: string,
    ) {
      if (key === GATE_KEY) throw new Error("boom");
      return orig.call(this, key);
    });

    renderProvider();
    await flush();

    expect(postCalls()).toHaveLength(0);
  });
});
