export interface LinkedinProgressOperation {
  mutation: number;
  promise: Promise<void>;
}

/** Serializa PUTs por análise/índice e identifica respostas ultrapassadas. */
export function createLinkedinProgressQueue() {
  const queues = new Map<string, Promise<void>>();
  const latest = new Map<string, number>();

  return {
    enqueue(key: string, task: () => Promise<void>): LinkedinProgressOperation {
      const mutation = (latest.get(key) ?? 0) + 1;
      latest.set(key, mutation);
      const previous = queues.get(key) ?? Promise.resolve();
      const promise = previous.catch(() => undefined).then(task);
      queues.set(key, promise);
      return { mutation, promise };
    },
    isLatest(key: string, mutation: number): boolean {
      return latest.get(key) === mutation;
    },
    finish(key: string, promise: Promise<void>): void {
      if (queues.get(key) === promise) queues.delete(key);
    },
  };
}
