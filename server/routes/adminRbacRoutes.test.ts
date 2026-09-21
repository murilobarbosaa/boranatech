import fs from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import {
  ADMIN_ROUTE_MANIFEST,
  validateAdminRouteManifest,
  type AdminHttpMethod,
} from "../lib/adminRbac";

type Route = readonly [AdminHttpMethod, string];

const ROUTE_METHODS = new Set(["get", "post", "patch", "put", "delete"]);
const SERVER_DIR = path.resolve(process.cwd(), "server");

function sourceFile(file: string) {
  const contents = fs.readFileSync(file, "utf8");
  return ts.createSourceFile(
    file,
    contents,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function importsByIdentifier(file: ts.SourceFile) {
  const imports = new Map<string, string>();
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const imported = statement.importClause?.name;
    if (!imported) continue;
    imports.set(imported.text, statement.moduleSpecifier.text);
  }
  return imports;
}

function joined(prefix: string, suffix: string) {
  const value = `${prefix}/${suffix}`.replace(/\/{2,}/g, "/");
  return value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
}

function routerCalls(file: ts.SourceFile) {
  return file.statements.flatMap((statement) => {
    if (!ts.isExpressionStatement(statement)) return [];
    const expression = statement.expression;
    if (!ts.isCallExpression(expression)) return [];
    if (!ts.isPropertyAccessExpression(expression.expression)) return [];
    if (expression.expression.expression.getText(file) !== "router") return [];
    return [
      {
        method: expression.expression.name.text,
        args: expression.arguments,
        position: statement.pos,
      },
    ];
  });
}

function routesFromRouter(
  filename: string,
  prefix: string,
  visited = new Set<string>(),
): Route[] {
  const resolved = path.resolve(filename);
  if (visited.has(resolved))
    throw new Error(`router montado duas vezes: ${resolved}`);
  visited.add(resolved);

  const file = sourceFile(resolved);
  const imports = importsByIdentifier(file);
  const routes: Route[] = [];

  for (const call of routerCalls(file)) {
    if (ROUTE_METHODS.has(call.method)) {
      const routePath = call.args[0];
      if (!routePath || !ts.isStringLiteral(routePath)) {
        throw new Error(`rota dinâmica não enumerável em ${resolved}`);
      }
      routes.push([
        call.method.toUpperCase() as AdminHttpMethod,
        joined(prefix, routePath.text),
      ]);
      continue;
    }
    if (call.method !== "use" || call.args.length < 2) continue;
    const mountPath = call.args[0];
    const childIdentifier = call.args[1];
    if (!ts.isStringLiteral(mountPath) || !ts.isIdentifier(childIdentifier)) {
      continue;
    }
    const modulePath = imports.get(childIdentifier.text);
    if (!modulePath?.startsWith(".")) {
      throw new Error(
        `router ${childIdentifier.text} sem import local em ${resolved}`,
      );
    }
    routes.push(
      ...routesFromRouter(
        path.resolve(path.dirname(resolved), `${modulePath}.ts`),
        joined(prefix, mountPath.text),
        visited,
      ),
    );
  }
  return routes;
}

function mountedAdminRouters() {
  const appFile = sourceFile(path.join(SERVER_DIR, "app.ts"));
  const imports = importsByIdentifier(appFile);
  const mounts: Array<{ prefix: string; file: string }> = [];

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText(appFile) === "app" &&
      node.expression.name.text === "use" &&
      ts.isStringLiteral(node.arguments[0]) &&
      ts.isIdentifier(node.arguments[1])
    ) {
      const modulePath = imports.get(node.arguments[1].text);
      if (modulePath === "./routes/admin" || modulePath === "./routes/vagas") {
        mounts.push({
          prefix: node.arguments[0].text,
          file: path.resolve(SERVER_DIR, `${modulePath.slice(2)}.ts`),
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(appFile);
  return mounts;
}

function actualAdminRoutes() {
  return mountedAdminRouters().flatMap(({ file, prefix }) =>
    routesFromRouter(file, prefix).filter(
      ([, routePath]) =>
        routePath.startsWith("/api/admin/") ||
        routePath.startsWith("/api/vagas/admin"),
    ),
  );
}

describe("inventário independente das rotas administrativas", () => {
  it("enumera mounts e routers aninhados sem consultar o manifesto", () => {
    expect(mountedAdminRouters()).toEqual([
      {
        prefix: "/api/vagas",
        file: path.join(SERVER_DIR, "routes/vagas.ts"),
      },
      {
        prefix: "/api/admin",
        file: path.join(SERVER_DIR, "routes/admin.ts"),
      },
    ]);

    const actual = actualAdminRoutes();
    // 129 -> 130 (e 63 -> 64 fora de GET) com
    // `POST /api/admin/creators/:userId/reveal-pix` (creators, lote 08).
    // 130 -> 132 com as duas de publicacoes (creators, lote 09): uma e GET
    // (66 -> 67) e a outra e DELETE (64 -> 65).
    // 132 -> 134 com a conferencia de publicacoes (creators, lote 10b): a
    // lista de pendentes e GET (67 -> 68) e a confirmacao e POST (65 -> 66).
    // 134 -> 135 com `GET /api/admin/creators/calendar` (lote 10d): GET 68 -> 69.
    // 135 -> 136 com `GET /api/admin/creators/ranking` (lote 11c): GET 69 -> 70.
    expect(actual).toHaveLength(136);
    expect(actual.filter(([method]) => method === "GET")).toHaveLength(70);
    expect(actual.filter(([method]) => method !== "GET")).toHaveLength(66);
    expect(actual.some(([, routePath]) => routePath.includes(":"))).toBe(true);
    expect(actual.some(([, routePath]) => routePath.includes("*"))).toBe(false);
    expect(validateAdminRouteManifest(ADMIN_ROUTE_MANIFEST, actual)).toEqual(
      [],
    );
  });

  it("prova a ordem das guardas e do observador no router principal", () => {
    const file = sourceFile(path.join(SERVER_DIR, "routes/admin.ts"));
    const calls = routerCalls(file);
    const firstRoute = calls.findIndex((call) =>
      ROUTE_METHODS.has(call.method),
    );
    const middleware = calls
      .slice(0, firstRoute)
      .map((call) => call.args.map((arg) => arg.getText(file)).join(","));
    expect(middleware).toEqual([
      "requireAuth",
      "requireAdmin",
      "observeAdminCapability",
      '"/email-campaigns",emailCampaignsRouter',
      '"/contact-lists",contactListsRouter',
      '"/notifications",notificationsAdminRouter',
      '"/bugs",bugsAdminRouter',
      '"/crm",tasksAdminRouter',
    ]);
    expect(
      calls.filter((call) =>
        call.args.some(
          (argument) => argument.getText(file) === "observeAdminCapability",
        ),
      ),
    ).toHaveLength(1);
  });

  it("prova guardas e observador em cada rota admin de vagas", () => {
    const file = sourceFile(path.join(SERVER_DIR, "routes/vagas.ts"));
    const guards = file.statements.find(
      (statement): statement is ts.VariableStatement =>
        ts.isVariableStatement(statement) &&
        statement.declarationList.declarations.some(
          (declaration) =>
            declaration.name.getText(file) === "adminRouteGuards",
        ),
    );
    expect(guards?.getText(file)).toContain(
      "[requireAdmin, observeAdminCapability] as const",
    );
    const routes = routerCalls(file).filter(
      (call) =>
        ROUTE_METHODS.has(call.method) &&
        ts.isStringLiteral(call.args[0]) &&
        call.args[0].text.startsWith("/admin"),
    );
    expect(routes).toHaveLength(3);
    for (const route of routes) {
      expect(route.args[1]?.getText(file)).toBe("...adminRouteGuards");
      expect(route.args.filter(ts.isSpreadElement)).toHaveLength(1);
    }
  });

  it("/me reutiliza o principal e não consulta admin_roles novamente", () => {
    const contents = fs.readFileSync(
      path.join(SERVER_DIR, "routes/admin.ts"),
      "utf8",
    );
    const start = contents.indexOf('router.get("/me"');
    const end = contents.indexOf('router.get("/content/:type"', start);
    const handler = contents.slice(start, end);
    expect(handler).toContain("req.adminPrincipal");
    expect(handler).not.toContain('from("admin_roles")');
  });
});
