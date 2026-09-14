import type { NextFunction, Request, Response } from "express";

import {
  ADMIN_RBAC_MODE,
  findAdminRoutePolicy,
  roleWouldBeAllowed,
  type AdminCapability,
  type AdminRole,
  type AdminRoleResolution,
  type AdminRisk,
} from "../lib/adminRbac";

export interface AdminRbacObservationEvent {
  schemaVersion: 1;
  event: "admin_rbac_observation";
  mode: typeof ADMIN_RBAC_MODE;
  capability: AdminCapability;
  role: AdminRole | null;
  roleResolution: AdminRoleResolution;
  hypotheticalDecision: "allow" | "deny" | "unresolved";
  method: string;
  routeTemplate: string;
  risk: AdminRisk;
  requestId: string | null;
}

export function buildAdminRbacObservation(
  req: Request,
  res: Response,
): AdminRbacObservationEvent | null {
  if (!req.adminPrincipal) return null;

  const path = req.originalUrl.split("?", 1)[0];
  const policy = findAdminRoutePolicy(req.method, path);
  if (!policy) return null;

  const principal = req.adminPrincipal;
  const hypotheticalDecision =
    principal.roleResolution !== "resolved" || principal.role === null
      ? "unresolved"
      : roleWouldBeAllowed(principal.role, policy)
        ? "allow"
        : "deny";

  return {
    schemaVersion: 1,
    event: "admin_rbac_observation",
    mode: ADMIN_RBAC_MODE,
    capability: policy.capability,
    role: principal.role,
    roleResolution: principal.roleResolution,
    hypotheticalDecision,
    method: req.method.toUpperCase(),
    routeTemplate: policy.path,
    risk: policy.risk,
    requestId:
      typeof res.locals.requestId === "string" ? res.locals.requestId : null,
  };
}

export function observeAdminCapability(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const observation = buildAdminRbacObservation(req, res);
  if (observation) {
    try {
      console.info("[admin_rbac_observe]", observation);
    } catch {
      // Observabilidade nunca altera a autorização efetiva nesta fase.
    }
  }

  // P1A e apenas observacao. A decisao hipotetica nunca altera o fluxo.
  next();
}
