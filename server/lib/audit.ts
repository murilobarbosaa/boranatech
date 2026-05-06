import { supabaseAdmin } from "./supabaseAdmin";

export async function logAudit(params: {
  actorUserId: string;
  action: "create" | "update" | "delete" | "publish" | "unpublish";
  resourceType: string;
  resourceId?: string;
  resourceSlug?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  try {
    await supabaseAdmin.from("content_audit_logs").insert({
      actor_user_id: params.actorUserId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      resource_slug: params.resourceSlug || null,
      before_json: params.before || null,
      after_json: params.after || null,
    });
  } catch (err) {
    console.warn("[audit] Falha ao registrar log:", err);
  }
}
