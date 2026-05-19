const STORAGE_KEY = "boranatech.pending_intent";
const TTL_MS = 5 * 60 * 1000;

export type ProgressContext =
  | "portfolio_checklist"
  | "course_progress"
  | "quiz_history";

export interface ProgressIntent {
  kind: "progress";
  context: ProgressContext;
  itemKey: string;
}

export interface FavoriteIntent {
  kind: "favorite";
  type: string;
  itemKey: string;
  snapshot?: {
    title?: string;
    subtitle?: string;
    url?: string;
  };
}

export type PendingIntent = ProgressIntent | FavoriteIntent;

type StoredPendingIntent = PendingIntent & { timestamp: number };

export function savePendingIntent(intent: PendingIntent): void {
  try {
    const payload: StoredPendingIntent = { ...intent, timestamp: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage indisponível (private mode, quota, SSR): silencioso
  }
}

export function consumePendingIntent(): PendingIntent | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPendingIntent;
    sessionStorage.removeItem(STORAGE_KEY);
    if (Date.now() - parsed.timestamp > TTL_MS) return null;
    const { timestamp: _timestamp, ...intent } = parsed;
    return intent;
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
