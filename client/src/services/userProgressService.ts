import { assertSupabaseConfigured } from "@/lib/supabase";

export type ProgressContext =
  | "portfolio_checklist"
  | "favorites"
  | "course_progress"
  | "quiz_history";

export interface ProgressEntry {
  itemKey: string;
  state: Record<string, unknown>;
  updatedAt: string;
}

export async function listProgress(
  context: ProgressContext,
): Promise<ProgressEntry[]> {
  const client = assertSupabaseConfigured();
  const { data, error } = await client
    .from("user_progress")
    .select("item_key, state, updated_at")
    .eq("context", context);

  if (error) {
    console.error("[userProgress] listProgress error:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    itemKey: row.item_key,
    state: (row.state ?? {}) as Record<string, unknown>,
    updatedAt: row.updated_at,
  }));
}

export async function upsertProgress(
  context: ProgressContext,
  itemKey: string,
  state: Record<string, unknown>,
): Promise<void> {
  const client = assertSupabaseConfigured();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  const { error } = await client.from("user_progress").upsert(
    {
      user_id: user.id,
      context,
      item_key: itemKey,
      state,
    },
    { onConflict: "user_id,context,item_key" },
  );

  if (error) {
    console.error("[userProgress] upsertProgress error:", error);
    throw error;
  }
}

export async function deleteProgress(
  context: ProgressContext,
  itemKey: string,
): Promise<void> {
  const client = assertSupabaseConfigured();
  const { error } = await client
    .from("user_progress")
    .delete()
    .eq("context", context)
    .eq("item_key", itemKey);

  if (error) {
    console.error("[userProgress] deleteProgress error:", error);
    throw error;
  }
}
