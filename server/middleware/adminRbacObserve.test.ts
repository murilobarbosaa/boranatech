import { beforeEach, describe, expect, it, vi } from "vitest";

const adminRoleDb = vi.hoisted(() => ({
  reads: 0,
  result: {
    data: [] as Array<{ role: unknown }> | null,
    error: null as unknown,
  },
}));

vi.mock("../lib/env", () => ({
  env: {
    supabaseUrl: "https://exemplo.supabase.co",
    isProd: false,
    devProUserIds: [],
  },
}));

vi.mock("../lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table: string) => {
      if (table !== "admin_roles") throw new Error(`table:${table}`);
      const chain = {
        select: () => chain,
        eq: async () => {
          adminRoleDb.reads += 1;
          return adminRoleDb.result;
        },
      };
      return chain;
    },
    rpc: async () => ({ data: false, error: null }),
  },
}));

import type { NextFunction, Request, Response } from "express";

import { requireAdmin } from "./auth";
import {
  buildAdminRbacObservation,
  observeAdminCapability,
} from "./adminRbacObserve";

function request(overrides: Partial<Request> = {}): Request {
  return {
    method: "GET",
    originalUrl: "/api/admin/overview",
    ...overrides,
  } as Request;
}

function response(requestId = "request-1"): Response {
  return { locals: { requestId } } as unknown as Response;
}

async function runRequireAdmin(req: Request) {
  let error: unknown;
  await requireAdmin(req, response(), ((value?: unknown) => {
    error = value;
  }) as NextFunction);
  return error;
}

function principal(
  role: "owner" | "editor" | "viewer" | null,
  roleResolution: "resolved" | "null" | "legacy" | "duplicate" = role === null
    ? "legacy"
    : "resolved",
) {
  return {
    userId: "private-user-id",
    role,
    roleResolution,
    authorizationSource: "admin_roles" as const,
    context: { mode: "observe" as const, meRole: role ?? "editor" },
  };
}

describe("principal administrativo e observação RBAC", () => {
  beforeEach(() => {
    adminRoleDb.reads = 0;
    adminRoleDb.result = { data: [], error: null };
    vi.restoreAllMocks();
  });

  it("mantém usuário deslogado rejeitado sem consultar admin_roles", async () => {
    const error = (await runRequireAdmin(request())) as {
      statusCode: number;
      code: string;
    };
    expect(error).toMatchObject({ statusCode: 401, code: "unauthorized" });
    expect(adminRoleDb.reads).toBe(0);
  });

  it("mantém usuário comum sem linha rejeitado", async () => {
    const req = request({
      user: { id: "u1", email: "", role: "authenticated" },
    });
    const error = (await runRequireAdmin(req)) as {
      statusCode: number;
      code: string;
    };
    expect(error).toMatchObject({ statusCode: 403, code: "forbidden" });
    expect(req.adminPrincipal).toBeUndefined();
    expect(adminRoleDb.reads).toBe(1);
  });

  it.each(["owner", "editor", "viewer"] as const)(
    "%s válido continua autorizado em observe",
    async (role) => {
      adminRoleDb.result = { data: [{ role }], error: null };
      const req = request({
        user: { id: "u1", email: "", role: "authenticated" },
      });
      expect(await runRequireAdmin(req)).toBeUndefined();
      expect(req.adminPrincipal).toEqual({
        userId: "u1",
        role,
        roleResolution: "resolved",
        authorizationSource: "admin_roles",
        context: { mode: "observe", meRole: role },
      });
      expect(adminRoleDb.reads).toBe(1);
    },
  );

  it.each([
    {
      label: "nulo",
      rows: [{ role: null }],
      resolution: "null",
      meRole: "editor",
    },
    {
      label: "legado",
      rows: [{ role: "superadmin" }],
      resolution: "legacy",
      meRole: "superadmin",
    },
    {
      label: "duplicado",
      rows: [{ role: "owner" }, { role: "viewer" }],
      resolution: "duplicate",
      meRole: "editor",
    },
  ] as const)(
    "papel $label permanece autorizado, mas não reconciliado",
    async ({ rows, resolution, meRole }) => {
      adminRoleDb.result = { data: [...rows], error: null };
      const req = request({
        user: { id: "u1", email: "", role: "authenticated" },
      });
      expect(await runRequireAdmin(req)).toBeUndefined();
      expect(req.adminPrincipal).toMatchObject({
        role: null,
        roleResolution: resolution,
        context: { meRole },
      });
      expect(
        buildAdminRbacObservation(req, response())?.hypotheticalDecision,
      ).toBe("unresolved");
      expect(adminRoleDb.reads).toBe(1);
    },
  );

  it("erro de banco continua falhando fechado", async () => {
    adminRoleDb.result = { data: null, error: new Error("db") };
    const req = request({
      user: { id: "u1", email: "", role: "authenticated" },
    });
    expect(await runRequireAdmin(req)).toMatchObject({ statusCode: 403 });
    expect(req.adminPrincipal).toBeUndefined();
    expect(adminRoleDb.reads).toBe(1);
  });

  it("claim forjada não altera o papel resolvido pelo servidor", async () => {
    adminRoleDb.result = { data: [{ role: "viewer" }], error: null };
    const req = request({
      user: {
        id: "u1",
        email: "",
        role: "authenticated",
        userMetadata: { admin_role: "owner" },
      },
    });
    expect(await runRequireAdmin(req)).toBeUndefined();
    expect(req.adminPrincipal?.role).toBe("viewer");
  });

  it("principal não vaza entre requisições", async () => {
    adminRoleDb.result = { data: [{ role: "owner" }], error: null };
    const first = request({
      user: { id: "u1", email: "", role: "authenticated" },
    });
    expect(await runRequireAdmin(first)).toBeUndefined();
    adminRoleDb.result = { data: [], error: null };
    const second = request({
      user: { id: "u2", email: "", role: "authenticated" },
    });
    expect(await runRequireAdmin(second)).toMatchObject({ statusCode: 403 });
    expect(first.adminPrincipal?.userId).toBe("u1");
    expect(second.adminPrincipal).toBeUndefined();
  });

  it("registra exatamente uma decisão sem PII nem URL concreta", () => {
    const req = request({
      method: "POST",
      originalUrl:
        "/api/admin/users/00000000-0000-4000-8000-000000000001/refunds?email=secret@example.com",
      body: { token: "secret", amount: 10 },
      query: { email: "secret@example.com" },
      adminPrincipal: principal("viewer"),
    });
    const next = vi.fn();
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    observeAdminCapability(req, response("correlation-1"), next);
    expect(next).toHaveBeenCalledOnce();
    expect(info).toHaveBeenCalledOnce();
    expect(info).toHaveBeenCalledWith("[admin_rbac_observe]", {
      schemaVersion: 1,
      event: "admin_rbac_observation",
      mode: "observe",
      capability: "finance.refund",
      role: "viewer",
      roleResolution: "resolved",
      hypotheticalDecision: "deny",
      method: "POST",
      routeTemplate: "/api/admin/users/:id/refunds",
      risk: "critical",
      requestId: "correlation-1",
    });
    const serialized = JSON.stringify(info.mock.calls);
    for (const forbidden of [
      "secret@example.com",
      "private-user-id",
      "00000000",
      "token",
      "amount",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("não emite evento para rota desconhecida ou pública", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    for (const originalUrl of ["/api/admin/inexistente", "/api/health"]) {
      observeAdminCapability(
        request({ originalUrl, adminPrincipal: principal("owner") }),
        response(),
        vi.fn(),
      );
    }
    expect(info).not.toHaveBeenCalled();
  });

  it("falha do logger não altera uma requisição autorizada", () => {
    vi.spyOn(console, "info").mockImplementation(() => {
      throw new Error("logger indisponível");
    });
    const next = vi.fn();
    expect(() =>
      observeAdminCapability(
        request({ adminPrincipal: principal("owner") }),
        response(),
        next,
      ),
    ).not.toThrow();
    expect(next).toHaveBeenCalledOnce();
  });

  it("produz allow, deny e unresolved sem enforcement", () => {
    const decisions = [
      principal("viewer"),
      principal("editor"),
      principal("owner"),
      principal(null, "legacy"),
    ].map((adminPrincipal) =>
      buildAdminRbacObservation(
        request({
          method: "POST",
          originalUrl: "/api/admin/finance/sync",
          adminPrincipal,
        }),
        response(),
      ),
    );
    expect(decisions.map((entry) => entry?.hypotheticalDecision)).toEqual([
      "deny",
      "deny",
      "allow",
      "unresolved",
    ]);
  });

  it("mantém principal e requestId isolados entre requisições", () => {
    const first = buildAdminRbacObservation(
      request({ adminPrincipal: principal("owner") }),
      response("request-a"),
    );
    const second = buildAdminRbacObservation(
      request({ adminPrincipal: principal("viewer") }),
      response("request-b"),
    );
    expect(first).toMatchObject({ requestId: "request-a", role: "owner" });
    expect(second).toMatchObject({ requestId: "request-b", role: "viewer" });
  });
});
