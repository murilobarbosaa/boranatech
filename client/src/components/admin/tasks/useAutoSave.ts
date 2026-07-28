import { useCallback, useEffect, useRef, useState } from "react";

// Salvamento automatico dos campos de texto do modal: debounce ao digitar, flush
// no blur e no fechamento.
//
// O modo de falha que este hook existe para impedir e perder texto digitado. Ele
// aparece em quatro caminhos diferentes, e um debounce ingenuo cobre nenhum:
// Esc, clique fora, trocar de tarefa e F5. Os tres primeiros sao resolvidos pelo
// `flush`, que o chamador e obrigado a aguardar antes de sair; o quarto pelo
// aviso de `beforeunload`, porque nao existe forma confiavel de completar uma
// requisicao autenticada durante o unload da pagina.
//
// O patch e ACUMULADO: digitar no titulo e depois nas notas antes do debounce
// vencer manda uma requisicao com os dois campos, nao duas requisicoes que
// competem.

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 700;

export function useAutoSave<T extends Record<string, unknown>>(
  save: (patch: Partial<T>) => Promise<void>,
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const pending = useRef<Partial<T>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  // `save` vem do componente e muda de identidade a cada render; guardar em ref
  // mantem `queue` e `flush` estaveis, que e o que permite usa-los em efeitos e
  // handlers sem recriar o agendamento a cada tecla.
  const saveRef = useRef(save);
  saveRef.current = save;

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const run = useCallback(async () => {
    clearTimer();
    const patch = pending.current;
    if (Object.keys(patch).length === 0) return;
    pending.current = {};
    setStatus("saving");
    const promise = (async () => {
      try {
        await saveRef.current(patch);
        // Se outra alteracao entrou na fila enquanto esta salvava, o estado
        // honesto continua sendo "salvando", nao "salvo".
        setStatus(Object.keys(pending.current).length > 0 ? "saving" : "saved");
      } catch {
        // Devolve o patch para a fila: a proxima tentativa (ou o flush do
        // fechamento) leva o que nao foi gravado, em vez de descartar em
        // silencio o que a pessoa escreveu.
        pending.current = { ...patch, ...pending.current };
        setStatus("error");
      }
    })();
    inFlight.current = promise;
    await promise;
    inFlight.current = null;
  }, [clearTimer]);

  /** Enfileira uma alteracao e reinicia o debounce. */
  const queue = useCallback(
    (patch: Partial<T>) => {
      pending.current = { ...pending.current, ...patch };
      setStatus("saving");
      clearTimer();
      timer.current = setTimeout(() => void run(), DEBOUNCE_MS);
    },
    [clearTimer, run],
  );

  /**
   * Grava agora o que estiver pendente e espera terminar. Todo caminho de saida
   * (Esc, clique fora, trocar de tarefa) precisa aguardar isto.
   */
  const flush = useCallback(async () => {
    if (inFlight.current) await inFlight.current;
    await run();
  }, [run]);

  /** Ha algo digitado que ainda nao chegou ao servidor. */
  const isDirty = useCallback(
    () => Object.keys(pending.current).length > 0 || inFlight.current !== null,
    [],
  );

  /** Descarta o agendamento sem gravar. So para troca de tarefa APOS o flush. */
  const reset = useCallback(() => {
    clearTimer();
    pending.current = {};
    setStatus("idle");
  }, [clearTimer]);

  // F5 / fechar aba com alteracao pendente. Nao da para await aqui: o navegador
  // nao espera promessa no unload. Entao o caminho honesto e AVISAR, e deixar a
  // pessoa decidir, em vez de fingir que salvou.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => clearTimer, [clearTimer]);

  return { queue, flush, reset, status, isDirty };
}
