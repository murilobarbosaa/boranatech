import { useCallback, useEffect, useRef, useState } from "react";

import { getBoardSnapshot, listBoards } from "@/services/adminTasksService";

import type { TaskBoard, TaskBoardSnapshot } from "./types";

// Carregamento do board: useState + useEffect + service, sem React Query e sem
// lib de estado, igual ao BugsDashboard.
//
// A parte que NAO e igual ao BugsDashboard e a guarda de resposta obsoleta. La,
// um refresh sozinho por vez basta. Aqui cada mover/criar/renomear dispara um
// refresh, entao duas respostas podem voltar fora de ordem e a mais VELHA
// sobrescrever a mais nova, desfazendo na tela algo que ja esta gravado. O
// contador abaixo descarta resposta que nao e a da ultima requisicao.
//
// O contador mora DENTRO do hook, nao no componente: assim nenhuma tela que use
// este hook pode esquecer de aplicar a guarda.

type SnapshotState = {
  boards: TaskBoard[];
  snapshot: TaskBoardSnapshot | null;
  /** Primeiro carregamento: e o unico que mostra skeleton. */
  loading: boolean;
  error: string | null;
};

export function useBoardSnapshot(boardId: string | null) {
  const [state, setState] = useState<SnapshotState>({
    boards: [],
    snapshot: null,
    loading: true,
    error: null,
  });

  // Sequencia da ultima requisicao disparada. Resposta com selo menor e lixo.
  const requestSeq = useRef(0);
  // Evita setState depois do unmount (trocar de aba no admin desmonta a secao).
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadBoards = useCallback(async () => {
    const seq = (requestSeq.current += 1);
    try {
      const { boards } = await listBoards();
      if (!mounted.current || seq !== requestSeq.current) return boards;
      setState((current) => ({ ...current, boards, error: null }));
      return boards;
    } catch (error) {
      if (mounted.current && seq === requestSeq.current) {
        setState((current) => ({
          ...current,
          loading: false,
          error:
            error instanceof Error ? error.message : "Erro ao listar quadros.",
        }));
      }
      return [];
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!boardId) return;
    const seq = (requestSeq.current += 1);
    try {
      const snapshot = await getBoardSnapshot(boardId);
      // Chegou atrasada: outra requisicao ja partiu depois desta, e o estado
      // dela e mais novo que este. Descarta em silencio.
      if (!mounted.current || seq !== requestSeq.current) return;
      setState((current) => ({
        ...current,
        snapshot,
        loading: false,
        error: null,
      }));
    } catch (error) {
      if (!mounted.current || seq !== requestSeq.current) return;
      setState((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof Error ? error.message : "Erro ao carregar o quadro.",
      }));
    }
  }, [boardId]);

  useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (!boardId) return;
    setState((current) => ({
      ...current,
      loading: current.snapshot === null,
    }));
    void refresh();
  }, [boardId, refresh]);

  /**
   * Aplica uma mutacao local ao snapshot (update otimista).
   *
   * NAO mexe no contador de requisicao: escrita local e imediata e nao compete
   * com resposta de rede. Quem compete e o refresh que vem depois.
   */
  const applyLocal = useCallback(
    (mutate: (snapshot: TaskBoardSnapshot) => TaskBoardSnapshot) => {
      setState((current) =>
        current.snapshot
          ? { ...current, snapshot: mutate(current.snapshot) }
          : current,
      );
    },
    [],
  );

  return {
    boards: state.boards,
    snapshot: state.snapshot,
    loading: state.loading,
    error: state.error,
    refresh,
    reloadBoards: loadBoards,
    applyLocal,
  };
}
