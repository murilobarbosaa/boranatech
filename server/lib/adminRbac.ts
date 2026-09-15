export const ADMIN_ROLES = ["owner", "editor", "viewer"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_RESOLUTIONS = [
  "resolved",
  "null",
  "legacy",
  "duplicate",
] as const;

export type AdminRoleResolution = (typeof ADMIN_ROLE_RESOLUTIONS)[number];

export const ADMIN_AUTHORIZATION_SOURCE = "admin_roles" as const;
export const ADMIN_RBAC_MODE = "observe" as const;

export interface AdminPrincipal {
  userId: string;
  role: AdminRole | null;
  roleResolution: AdminRoleResolution;
  authorizationSource: typeof ADMIN_AUTHORIZATION_SOURCE;
  context: {
    mode: typeof ADMIN_RBAC_MODE;
    meRole: string;
  };
}

export const ADMIN_CAPABILITIES = [
  "admin.session.read",
  "admin.audit.read",
  "dashboard.read",
  "integrations.health.read",
  "users.read",
  "users.detail.read",
  "users.pii.reveal",
  "users.email_usage.read",
  "users.identity.update",
  "users.profile.update",
  "users.avatar_reports.read",
  "users.avatar.moderate",
  "subscriptions.read",
  "subscriptions.revoke",
  "subscriptions.cancel",
  "finance.read",
  "finance.orphan.read",
  "finance.orphan.resolve",
  "finance.expenses.write",
  "finance.refund",
  "finance.refund.record",
  "finance.sync",
  "fiscal.read",
  "fiscal.retry",
  "newsletter.subscribers.read",
  "ai.cost.read",
  "creators.read",
  "creators.access.grant",
  "creators.access.revoke",
  "content.read",
  "content.write",
  "email.campaign.read",
  "email.campaign.write",
  "email.recipients.read",
  "email.send",
  "contacts.read",
  "contacts.write",
  "communications.read",
  "communications.draft.write",
  "communications.publish",
  "communications.recipients.read",
  "bugs.read",
  "bugs.write.disabled",
  "crm.read",
  "crm.write",
  "jobs.read",
  "jobs.write",
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];
export type AdminRouteNature = "read" | "mutation";
export type AdminRisk = "low" | "medium" | "high" | "critical";
export type AdminHttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface AdminRouteRequirements {
  reason: boolean;
  confirmation: boolean;
  idempotency: boolean;
  audit: "none" | "access" | "required" | "fail_closed";
}

export interface AdminRoutePolicy {
  method: AdminHttpMethod;
  path: string;
  capability: AdminCapability;
  nature: AdminRouteNature;
  risk: AdminRisk;
  futureRoles: readonly AdminRole[];
  requirements: AdminRouteRequirements;
}

type RouteDefinition = readonly [AdminHttpMethod, string];
type RouteGroupOptions = Omit<AdminRoutePolicy, "method" | "path">;

const ALL_ROLES = ["viewer", "editor", "owner"] as const;
const EDITOR_AND_OWNER = ["editor", "owner"] as const;
const OWNER_ONLY = ["owner"] as const;

const NONE: AdminRouteRequirements = {
  reason: false,
  confirmation: false,
  idempotency: false,
  audit: "none",
};
const SENSITIVE_READ: AdminRouteRequirements = {
  reason: false,
  confirmation: false,
  idempotency: false,
  audit: "access",
};
const AUDITED_WRITE: AdminRouteRequirements = {
  reason: false,
  confirmation: false,
  idempotency: false,
  audit: "required",
};
const CRITICAL_WRITE: AdminRouteRequirements = {
  reason: true,
  confirmation: true,
  idempotency: true,
  audit: "fail_closed",
};

function group(
  options: RouteGroupOptions,
  definitions: readonly RouteDefinition[],
): AdminRoutePolicy[] {
  return definitions.map(([method, path]) => ({ method, path, ...options }));
}

const read = (
  capability: AdminCapability,
  risk: AdminRisk,
  futureRoles: readonly AdminRole[],
  definitions: readonly RouteDefinition[],
  requirements: AdminRouteRequirements = NONE,
) =>
  group(
    { capability, nature: "read", risk, futureRoles, requirements },
    definitions,
  );

const mutation = (
  capability: AdminCapability,
  risk: AdminRisk,
  futureRoles: readonly AdminRole[],
  definitions: readonly RouteDefinition[],
  requirements: AdminRouteRequirements = AUDITED_WRITE,
) =>
  group(
    { capability, nature: "mutation", risk, futureRoles, requirements },
    definitions,
  );

export const ADMIN_ROUTE_MANIFEST: readonly AdminRoutePolicy[] = [
  ...read("dashboard.read", "low", ALL_ROLES, [
    ["GET", "/api/admin/dashboard"],
    ["GET", "/api/admin/posthog-stats"],
    ["GET", "/api/admin/online-now"],
    ["GET", "/api/admin/health-band"],
    ["GET", "/api/admin/churn-risk"],
    ["GET", "/api/admin/usage-retention"],
    ["GET", "/api/admin/linkedin-lastro"],
    ["GET", "/api/admin/overview"],
    ["GET", "/api/admin/paid-funnel"],
    ["GET", "/api/admin/overview-series"],
    ["GET", "/api/admin/attention"],
    ["GET", "/api/admin/signup-history"],
    ["GET", "/api/admin/subscription-history"],
    ["GET", "/api/admin/cancellation-reasons"],
  ]),
  ...read(
    "users.read",
    "medium",
    ALL_ROLES,
    [
      ["GET", "/api/admin/users-active-daily"],
      ["GET", "/api/admin/users"],
      ["GET", "/api/admin/users/:id/transactions"],
      ["GET", "/api/admin/users/:id/audit"],
      ["GET", "/api/admin/users/:id/activity"],
      ["GET", "/api/admin/users/:id/site-life"],
    ],
    SENSITIVE_READ,
  ),
  ...read(
    "users.detail.read",
    "medium",
    ALL_ROLES,
    [["GET", "/api/admin/users/:id"]],
    SENSITIVE_READ,
  ),
  ...read("integrations.health.read", "medium", EDITOR_AND_OWNER, [
    ["GET", "/api/admin/integrations/health"],
  ]),
  ...read(
    "finance.orphan.read",
    "high",
    ALL_ROLES,
    [["GET", "/api/admin/billing/orphan-payments"]],
    SENSITIVE_READ,
  ),
  ...mutation(
    "finance.orphan.resolve",
    "critical",
    OWNER_ONLY,
    [["POST", "/api/admin/billing/orphan-payments/:id/resolve"]],
    CRITICAL_WRITE,
  ),
  ...read("admin.session.read", "low", ALL_ROLES, [["GET", "/api/admin/me"]]),
  ...read("content.read", "low", ALL_ROLES, [
    ["GET", "/api/admin/content/:type"],
    ["GET", "/api/admin/content/:type/:id"],
  ]),
  ...mutation("content.write", "medium", EDITOR_AND_OWNER, [
    ["POST", "/api/admin/content/:type"],
    ["PATCH", "/api/admin/content/:type/:id"],
    ["DELETE", "/api/admin/content/:type/:id"],
  ]),
  ...read(
    "admin.audit.read",
    "high",
    OWNER_ONLY,
    [["GET", "/api/admin/audit-logs"]],
    SENSITIVE_READ,
  ),
  ...read(
    "fiscal.read",
    "high",
    ALL_ROLES,
    [
      ["GET", "/api/admin/fiscal-invoices/summary"],
      ["GET", "/api/admin/fiscal-invoices"],
    ],
    SENSITIVE_READ,
  ),
  ...mutation(
    "fiscal.retry",
    "critical",
    OWNER_ONLY,
    [["POST", "/api/admin/fiscal-invoices/:id/retry"]],
    CRITICAL_WRITE,
  ),
  ...mutation(
    "users.pii.reveal",
    "high",
    OWNER_ONLY,
    [["POST", "/api/admin/users/:id/reveal-cpf"]],
    CRITICAL_WRITE,
  ),
  ...mutation(
    "creators.access.grant",
    "critical",
    OWNER_ONLY,
    [["POST", "/api/admin/users/:id/influencer"]],
    CRITICAL_WRITE,
  ),
  ...mutation(
    "creators.access.revoke",
    "critical",
    OWNER_ONLY,
    [["POST", "/api/admin/users/:id/influencer/revoke"]],
    CRITICAL_WRITE,
  ),
  ...read(
    "creators.read",
    "medium",
    ALL_ROLES,
    [
      ["GET", "/api/admin/creators"],
      ["GET", "/api/admin/creators/resumo"],
      ["GET", "/api/admin/creators/:userId"],
      ["GET", "/api/admin/affiliates-stats"],
    ],
    SENSITIVE_READ,
  ),
  ...mutation(
    "finance.refund",
    "critical",
    OWNER_ONLY,
    [["POST", "/api/admin/users/:id/refunds"]],
    CRITICAL_WRITE,
  ),
  ...mutation(
    "finance.refund.record",
    "critical",
    OWNER_ONLY,
    [["POST", "/api/admin/users/:id/external-refunds"]],
    CRITICAL_WRITE,
  ),
  ...mutation(
    "subscriptions.revoke",
    "critical",
    OWNER_ONLY,
    [["POST", "/api/admin/users/:id/subscription/revoke"]],
    CRITICAL_WRITE,
  ),
  ...mutation(
    "subscriptions.cancel",
    "critical",
    OWNER_ONLY,
    [["POST", "/api/admin/users/:id/subscription/cancel"]],
    CRITICAL_WRITE,
  ),
  ...read(
    "users.email_usage.read",
    "high",
    EDITOR_AND_OWNER,
    [["GET", "/api/admin/users/:id/email-usage"]],
    SENSITIVE_READ,
  ),
  ...mutation(
    "users.identity.update",
    "critical",
    OWNER_ONLY,
    [["POST", "/api/admin/users/:id/email"]],
    CRITICAL_WRITE,
  ),
  ...mutation(
    "users.profile.update",
    "high",
    OWNER_ONLY,
    [["PATCH", "/api/admin/users/:id"]],
    CRITICAL_WRITE,
  ),
  ...read(
    "subscriptions.read",
    "high",
    ALL_ROLES,
    [
      ["GET", "/api/admin/subscriptions"],
      ["GET", "/api/admin/subscribers"],
      ["GET", "/api/admin/billing-metrics"],
    ],
    SENSITIVE_READ,
  ),
  ...read(
    "finance.read",
    "high",
    ALL_ROLES,
    [
      ["GET", "/api/admin/finance/summary"],
      ["GET", "/api/admin/finance/payment-methods"],
      ["GET", "/api/admin/finance/timeseries"],
      ["GET", "/api/admin/finance/transactions"],
      ["GET", "/api/admin/finance/expenses"],
      ["GET", "/api/admin/finance/fx-preview"],
    ],
    SENSITIVE_READ,
  ),
  ...read(
    "newsletter.subscribers.read",
    "high",
    OWNER_ONLY,
    [["GET", "/api/admin/newsletter/subscribers"]],
    SENSITIVE_READ,
  ),
  ...mutation(
    "finance.expenses.write",
    "high",
    OWNER_ONLY,
    [
      ["POST", "/api/admin/finance/expenses"],
      ["PATCH", "/api/admin/finance/expenses/:id"],
      ["DELETE", "/api/admin/finance/expenses/:id"],
    ],
    CRITICAL_WRITE,
  ),
  ...mutation(
    "finance.sync",
    "critical",
    OWNER_ONLY,
    [["POST", "/api/admin/finance/sync"]],
    CRITICAL_WRITE,
  ),
  ...read(
    "ai.cost.read",
    "medium",
    ALL_ROLES,
    [
      ["GET", "/api/admin/ai-stats"],
      ["GET", "/api/admin/ai-cost-per-user"],
      ["GET", "/api/admin/ai-usage-summary"],
    ],
    SENSITIVE_READ,
  ),
  ...read(
    "users.avatar_reports.read",
    "medium",
    ALL_ROLES,
    [["GET", "/api/admin/avatar-reports"]],
    SENSITIVE_READ,
  ),
  ...mutation("users.avatar.moderate", "medium", EDITOR_AND_OWNER, [
    ["POST", "/api/admin/avatar-reports/:userId/restore"],
    ["POST", "/api/admin/avatar-reports/:userId/confirm"],
  ]),
  ...mutation("email.campaign.write", "medium", EDITOR_AND_OWNER, [
    ["POST", "/api/admin/email-campaigns"],
    ["PATCH", "/api/admin/email-campaigns/:id"],
    ["DELETE", "/api/admin/email-campaigns/:id"],
  ]),
  ...read(
    "email.campaign.read",
    "medium",
    ALL_ROLES,
    [
      ["GET", "/api/admin/email-campaigns"],
      ["GET", "/api/admin/email-campaigns/audience-count"],
      ["GET", "/api/admin/email-campaigns/:id"],
    ],
    SENSITIVE_READ,
  ),
  ...read(
    "email.recipients.read",
    "high",
    OWNER_ONLY,
    [
      ["GET", "/api/admin/email-campaigns/audience-recipients"],
      ["GET", "/api/admin/email-campaigns/:id/recipients"],
    ],
    SENSITIVE_READ,
  ),
  ...mutation(
    "email.send",
    "critical",
    OWNER_ONLY,
    [
      ["POST", "/api/admin/email-campaigns/:id/test"],
      ["POST", "/api/admin/email-campaigns/:id/batches"],
      ["DELETE", "/api/admin/email-campaigns/:id/batches/:batchId"],
    ],
    CRITICAL_WRITE,
  ),
  ...mutation(
    "contacts.write",
    "high",
    OWNER_ONLY,
    [
      ["POST", "/api/admin/contact-lists/preview"],
      ["POST", "/api/admin/contact-lists"],
      ["DELETE", "/api/admin/contact-lists/:id"],
    ],
    CRITICAL_WRITE,
  ),
  ...read(
    "contacts.read",
    "high",
    OWNER_ONLY,
    [
      ["GET", "/api/admin/contact-lists"],
      ["GET", "/api/admin/contact-lists/:id"],
      ["GET", "/api/admin/contact-lists/:id/export"],
    ],
    SENSITIVE_READ,
  ),
  ...read(
    "communications.read",
    "medium",
    ALL_ROLES,
    [
      ["GET", "/api/admin/notifications"],
      ["GET", "/api/admin/notifications/audience-preview"],
      ["GET", "/api/admin/notifications/:id/stats"],
    ],
    SENSITIVE_READ,
  ),
  ...mutation("communications.draft.write", "medium", EDITOR_AND_OWNER, [
    ["POST", "/api/admin/notifications"],
    ["PATCH", "/api/admin/notifications/:id"],
  ]),
  ...mutation(
    "communications.publish",
    "critical",
    OWNER_ONLY,
    [
      ["POST", "/api/admin/notifications/:id/publish"],
      ["POST", "/api/admin/notifications/:id/schedule"],
      ["POST", "/api/admin/notifications/:id/unschedule"],
      ["POST", "/api/admin/notifications/:id/archive"],
    ],
    CRITICAL_WRITE,
  ),
  ...read(
    "communications.recipients.read",
    "high",
    OWNER_ONLY,
    [["GET", "/api/admin/notifications/:id/recipients"]],
    SENSITIVE_READ,
  ),
  ...read(
    "bugs.read",
    "medium",
    ALL_ROLES,
    [["GET", "/api/admin/bugs"]],
    SENSITIVE_READ,
  ),
  ...mutation("bugs.write.disabled", "medium", OWNER_ONLY, [
    ["POST", "/api/admin/bugs"],
    ["PATCH", "/api/admin/bugs/:id"],
    ["DELETE", "/api/admin/bugs/:id"],
  ]),
  ...read(
    "crm.read",
    "medium",
    ALL_ROLES,
    [
      ["GET", "/api/admin/crm/boards"],
      ["GET", "/api/admin/crm/boards/:id/snapshot"],
      ["GET", "/api/admin/crm/tasks/:id"],
      ["GET", "/api/admin/crm/tasks/:id/activity"],
    ],
    SENSITIVE_READ,
  ),
  ...mutation("crm.write", "medium", EDITOR_AND_OWNER, [
    ["POST", "/api/admin/crm/boards"],
    ["PATCH", "/api/admin/crm/boards/:id"],
    ["DELETE", "/api/admin/crm/boards/:id"],
    ["POST", "/api/admin/crm/columns"],
    ["PATCH", "/api/admin/crm/columns/reorder"],
    ["PATCH", "/api/admin/crm/columns/:id"],
    ["DELETE", "/api/admin/crm/columns/:id"],
    ["POST", "/api/admin/crm/tasks"],
    ["PATCH", "/api/admin/crm/tasks/:id"],
    ["PATCH", "/api/admin/crm/tasks/:id/move"],
    ["DELETE", "/api/admin/crm/tasks/:id"],
    ["POST", "/api/admin/crm/labels"],
    ["PATCH", "/api/admin/crm/labels/:id"],
    ["DELETE", "/api/admin/crm/labels/:id"],
    ["POST", "/api/admin/crm/tasks/:id/labels"],
    ["DELETE", "/api/admin/crm/tasks/:id/labels/:labelId"],
    ["POST", "/api/admin/crm/tasks/:id/comments"],
    ["PATCH", "/api/admin/crm/comments/:id"],
    ["DELETE", "/api/admin/crm/comments/:id"],
    ["POST", "/api/admin/crm/tasks/:id/checklist"],
    ["PATCH", "/api/admin/crm/checklist/:id"],
    ["DELETE", "/api/admin/crm/checklist/:id"],
    ["PATCH", "/api/admin/crm/tasks/:id/checklist/reorder"],
  ]),
  ...read("jobs.read", "medium", ALL_ROLES, [["GET", "/api/vagas/admin"]]),
  ...mutation("jobs.write", "medium", EDITOR_AND_OWNER, [
    ["POST", "/api/vagas/admin"],
    ["PATCH", "/api/vagas/admin/:id"],
  ]),
] as const;

export function isAdminRole(value: unknown): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}

export function adminRouteKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${normalizePath(path)}`;
}

function normalizePath(path: string): string {
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  const normalized = withLeadingSlash.replace(/\/{2,}/g, "/");
  return normalized.length > 1 && normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
}

function templateMatches(template: string, actualPath: string): boolean {
  const expected = normalizePath(template).split("/").filter(Boolean);
  const actual = normalizePath(actualPath).split("/").filter(Boolean);
  return (
    expected.length === actual.length &&
    expected.every(
      (segment, index) =>
        (segment.startsWith(":") && actual[index].length > 0) ||
        segment === actual[index],
    )
  );
}

export function findAdminRoutePolicy(
  method: string,
  path: string,
  manifest: readonly AdminRoutePolicy[] = ADMIN_ROUTE_MANIFEST,
): AdminRoutePolicy | null {
  const normalizedMethod = method.toUpperCase();
  return (
    manifest.find(
      (entry) =>
        entry.method === normalizedMethod && templateMatches(entry.path, path),
    ) ?? null
  );
}

export function roleWouldBeAllowed(
  role: AdminRole,
  policy: AdminRoutePolicy,
): boolean {
  return policy.futureRoles.includes(role);
}

export function validateAdminRouteManifest(
  manifest: readonly AdminRoutePolicy[],
  actualRoutes?: readonly RouteDefinition[],
): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const entry of manifest) {
    const key = adminRouteKey(entry.method, entry.path);
    if (seen.has(key)) errors.push(`duplicate:${key}`);
    seen.add(key);

    const expectedNature = entry.method === "GET" ? "read" : "mutation";
    if (entry.nature !== expectedNature) {
      errors.push(`nature:${key}:${entry.nature}:${expectedNature}`);
    }
    if (!ADMIN_CAPABILITIES.includes(entry.capability)) {
      errors.push(`capability:${key}`);
    }
    if (entry.futureRoles.length === 0) errors.push(`roles:${key}:empty`);
    if (new Set(entry.futureRoles).size !== entry.futureRoles.length) {
      errors.push(`roles:${key}:duplicate`);
    }
  }

  const rolesByCapability = new Map<AdminCapability, string>();
  for (const entry of manifest) {
    const roles = [...entry.futureRoles].sort().join(",");
    const known = rolesByCapability.get(entry.capability);
    if (known !== undefined && known !== roles) {
      errors.push(`capability_roles:${entry.capability}`);
    } else {
      rolesByCapability.set(entry.capability, roles);
    }
  }

  if (actualRoutes) {
    const actual = new Set<string>();
    for (const [method, path] of actualRoutes) {
      const key = adminRouteKey(method, path);
      if (actual.has(key)) errors.push(`actual_duplicate:${key}`);
      actual.add(key);
    }
    for (const key of Array.from(actual)) {
      if (!seen.has(key)) errors.push(`unclassified:${key}`);
    }
    for (const key of Array.from(seen)) {
      if (!actual.has(key)) errors.push(`orphan:${key}`);
    }
  }

  return Array.from(new Set(errors)).sort();
}

const manifestErrors = validateAdminRouteManifest(ADMIN_ROUTE_MANIFEST);
if (manifestErrors.length > 0) {
  throw new Error(`Invalid admin RBAC manifest: ${manifestErrors.join(";")}`);
}
