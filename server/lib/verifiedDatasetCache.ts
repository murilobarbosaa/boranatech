/** Cache curto, limitado por conjuntos, apenas para leituras completas e verificadas. */
export function createVerifiedDatasetCache<T>(
  ttlMs: number,
  maxEntries: number,
  now: () => number = Date.now,
) {
  const entries = new Map<
    string,
    { value: T; expires: number; generation: number }
  >();
  const pending = new Map<string, Promise<T>>();
  const generations = new Map<string, number>();

  async function get(
    key: string,
    compute: () => Promise<T>,
    fresh = false,
    verify?: (value: T) => Promise<boolean>,
  ): Promise<T> {
    const cached = entries.get(key);
    if (!fresh && cached && cached.expires > now()) {
      if (!verify || (await verify(cached.value))) return cached.value;
      entries.delete(key);
    }
    const inFlight = pending.get(key);
    if (!fresh && inFlight) return inFlight;
    const generation = (generations.get(key) ?? 0) + 1;
    generations.set(key, generation);
    const task = compute().then((value) => {
      if (generations.get(key) === generation) {
        entries.delete(key);
        entries.set(key, { value, expires: now() + ttlMs, generation });
        while (entries.size > maxEntries) {
          const oldest = entries.keys().next().value;
          if (oldest) {
            entries.delete(oldest);
            if (!pending.has(oldest)) generations.delete(oldest);
          }
        }
      }
      return value;
    });
    pending.set(key, task);
    try {
      return await task;
    } finally {
      if (pending.get(key) === task) {
        pending.delete(key);
        if (!entries.has(key)) generations.delete(key);
      }
    }
  }

  return { get };
}
