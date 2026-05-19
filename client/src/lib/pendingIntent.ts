const STORAGE_KEY = "boranatech.pending_intent";
const TTL_MS = 5 * 60 * 1000;

export type PendingIntentContext =
  | "portfolio_checklist"
  | "favorites"
  | "course_progress"
  | "quiz_history";

interface PendingIntent {
  context: PendingIntentContext;
  itemKey: string;
  timestamp: number;
}

export function savePendingIntent(
  context: PendingIntentContext,
  itemKey: string,
): void {
  try {
    const payload: PendingIntent = { context, itemKey, timestamp: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage indisponível (private mode, quota, SSR): silencioso
  }
}

export function consumePendingIntent(): PendingIntent | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingIntent;
    sessionStorage.removeItem(STORAGE_KEY);
    if (Date.now() - parsed.timestamp > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingIntent(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
