import { describe, expect, it } from "vitest";

import {
  ADMIN_RBAC_MODE,
  ADMIN_ROUTE_MANIFEST,
  findAdminRoutePolicy,
  roleWouldBeAllowed,
  validateAdminRouteManifest,
  type AdminRoutePolicy,
} from "./adminRbac";

function policy(method: string, path: string) {
  const found = findAdminRoutePolicy(method, path);
  if (!found) throw new Error(`Policy ausente para ${method} ${path}`);
  return found;
}

describe("manifesto administrativo fechado", () => {
  it("permanece exclusivamente em modo observe", () => {
    expect(ADMIN_RBAC_MODE).toBe("observe");
  });

  it("mantém as leituras financeiras protegidas e classificadas", () => {
    expect(policy("GET", "/api/admin/finance/summary")).toMatchObject({
      capability: "finance.read",
      nature: "read",
    });
    expect(policy("GET", "/api/admin/finance/transactions")).toMatchObject({
      capability: "finance.read",
      nature: "read",
    });
  });

  it("calcula a decisão hipotética conservadora por papel", () => {
    const dashboard = policy("GET", "/api/admin/overview");
    const content = policy("PATCH", "/api/admin/content/news/abc");
    const refund = policy("POST", "/api/admin/users/u1/refunds");

    expect(
      ["viewer", "editor", "owner"].map((role) =>
        roleWouldBeAllowed(role as "viewer" | "editor" | "owner", dashboard),
      ),
    ).toEqual([true, true, true]);
    expect(
      ["viewer", "editor", "owner"].map((role) =>
        roleWouldBeAllowed(role as "viewer" | "editor" | "owner", content),
      ),
    ).toEqual([false, true, true]);
    expect(
      ["viewer", "editor", "owner"].map((role) =>
        roleWouldBeAllowed(role as "viewer" | "editor" | "owner", refund),
      ),
    ).toEqual([false, false, true]);
  });

  it("valida invariantes da matriz para os três papéis em todas as rotas", () => {
    // 129 -> 130 com `POST /api/admin/creators/:userId/reveal-pix` (creators,
    // lote 08), no grupo users.pii.reveal ao lado do reveal-cpf.
    expect(ADMIN_ROUTE_MANIFEST).toHaveLength(130);
    for (const route of ADMIN_ROUTE_MANIFEST) {
      expect(roleWouldBeAllowed("owner", route)).toBe(true);
      if (route.nature === "mutation") {
        expect(roleWouldBeAllowed("viewer", route)).toBe(false);
      }
      if (route.futureRoles.length === 1) {
        expect(route.futureRoles).toEqual(["owner"]);
        expect(roleWouldBeAllowed("editor", route)).toBe(false);
      }
    }
  });

  it("mantém operações críticas e exportação sensível exclusivas de owner", () => {
    const critical = ADMIN_ROUTE_MANIFEST.filter(
      (route) =>
        route.capability === "finance.refund" ||
        route.capability === "subscriptions.cancel" ||
        route.capability === "creators.access.grant" ||
        route.capability === "finance.sync" ||
        route.capability === "email.send" ||
        route.path === "/api/admin/newsletter/subscribers" ||
        route.path.endsWith("/export"),
    );
    expect(critical.length).toBeGreaterThan(0);
    for (const route of critical) {
      expect(route.futureRoles).toEqual(["owner"]);
    }

    // Não existem endpoints de gestão de papéis ou baixa de comissão nesta base.
    // O teste fechado de rotas obriga classificá-los quando forem introduzidos.
    expect(
      ADMIN_ROUTE_MANIFEST.filter(
        (route) =>
          route.path.includes("admin_roles") ||
          route.path.includes("commission"),
      ),
    ).toEqual([]);
  });

  it("casa por método e template, sem usar query string", () => {
    expect(
      findAdminRoutePolicy("POST", "/api/admin/users/abc/subscription/cancel")
        ?.capability,
    ).toBe("subscriptions.cancel");
    expect(
      findAdminRoutePolicy("GET", "/api/admin/users/abc/subscription/cancel"),
    ).toBeNull();
    expect(findAdminRoutePolicy("GET", "/api/admin/overview/")?.path).toBe(
      "/api/admin/overview",
    );
  });

  it("recusa duplicidade", () => {
    const duplicate = [ADMIN_ROUTE_MANIFEST[0], ADMIN_ROUTE_MANIFEST[0]];
    expect(validateAdminRouteManifest(duplicate)).toContain(
      "duplicate:GET /api/admin/dashboard",
    );
  });

  it("recusa rota real sem classificação", () => {
    expect(
      validateAdminRouteManifest(ADMIN_ROUTE_MANIFEST, [
        ...ADMIN_ROUTE_MANIFEST.map(
          (entry) => [entry.method, entry.path] as const,
        ),
        ["GET", "/api/admin/route-added-without-policy"],
      ]),
    ).toContain("unclassified:GET /api/admin/route-added-without-policy");
  });

  it("recusa entrada órfã ou divergência de método e caminho", () => {
    const actual = ADMIN_ROUTE_MANIFEST.slice(1).map(
      (entry) => [entry.method, entry.path] as const,
    );
    const errors = validateAdminRouteManifest(ADMIN_ROUTE_MANIFEST, actual);
    expect(errors).toContain("orphan:GET /api/admin/dashboard");

    const changed = ADMIN_ROUTE_MANIFEST.map(
      (entry, index) =>
        [index === 0 ? "POST" : entry.method, entry.path] as const,
    );
    const changedErrors = validateAdminRouteManifest(
      ADMIN_ROUTE_MANIFEST,
      changed,
    );
    expect(changedErrors).toContain("unclassified:POST /api/admin/dashboard");
    expect(changedErrors).toContain("orphan:GET /api/admin/dashboard");
  });

  it("recusa mutação classificada como leitura", () => {
    const invalid: AdminRoutePolicy = {
      ...ADMIN_ROUTE_MANIFEST.find((entry) => entry.method === "POST")!,
      nature: "read",
    };
    expect(validateAdminRouteManifest([invalid])).toContain(
      `nature:${invalid.method} ${invalid.path}:read:mutation`,
    );
  });
});
