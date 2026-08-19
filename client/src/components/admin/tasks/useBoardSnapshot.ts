import { useCallback, useEffect, useRef, useState } from "react";

import { getBoardSnapshot, listBoards } from "@/services/adminTasksService";

import type { TaskBoard, TaskBoardSnapshot } from "./types";

// Carregamento do board: useState + useEffect + service, sem React Query e sem
// lib de estado, igual ao antigo BugsDashboard (removido na Fase 5).
//
// A parte que NAO e igual ao antigo BugsDashboard (removido na Fase 5) e a guarda de resposta obsoleta. La,
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
  /**
   * De QUAL quadro e o snapshot acima.
   *
   * Sem este campo o estado nao sabe responder "o que esta na tela e do quadro
   * que a pessoa escolheu?", e era essa a pergunta que faltava: na troca de
   * quadro o snapshot antigo existia, o carregamento ficava falso e o quadro
   * VELHO seguia renderizado ate o novo chegar. E gravado no MESMO setState que
   * grava o snapshot, com o boardId daquela requisicao, nunca com o atual.
   */
  snapshotBoardId: string | null;
  /** Carregando: primeiro carregamento OU troca de quadro. Ver o efeito abaixo. */
  loading: boolean;
  error: string | null;
};

export function useBoardSnapshot(
  boardId: string | null,
  // Arquivadas sao a UNICA dimensao de filtro que muda o que o servidor devolve;
  // todo o resto e filtrado no cliente sobre este snapshot (ver taskFilters.ts).
  includeArchived = false,
) {
  const [state, setState] = useState<SnapshotState>({
    boards: [],
    snapshot: null,
    snapshotBoardId: null,
    loading: true,
    error: null,
  });

  // UM contador POR RECURSO. Duas requisicoes de recursos diferentes nunca sao
  // obsoletas uma em relacao a outra, e um contador compartilhado fazia o
  // refresh do snapshot invalidar a resposta da lista de quadros: criar um
  // quadro buscava a lista nova com sucesso e a jogava fora, e o quadro sumia
  // do seletor ate algum outro evento refazer a lista.
  // Reproduzido em useBoardSnapshot.seq.test.tsx.
  const boardsSeq = useRef(0);
  const snapshotSeq = useRef(0);
  // Evita setState depois do unmount (trocar de aba no admin desmonta a secao).
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadBoards = useCallback(async () => {
    const seq = (boardsSeq.current += 1);
    try {
      const { boards } = await listBoards();
      if (!mounted.current || seq !== boardsSeq.current) return boards;
      setState((current) => ({ ...current, boards, error: null }));
      return boards;
    } catch (error) {
      if (mounted.current && seq === boardsSeq.current) {
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
    const seq = (snapshotSeq.current += 1);
    try {
      const snapshot = await getBoardSnapshot(boardId, { includeArchived });
      // Chegou atrasada: outra requisicao ja partiu depois desta, e o estado
      // dela e mais novo que este. Descarta em silencio.
      //
      // A guarda protege TAMBEM o `snapshotBoardId`: resposta do quadro antigo
      // que volta depois da troca nao pode carimbar o estado com o quadro dela,
      // senao a transicao terminaria cedo mostrando o quadro errado.
      if (!mounted.current || seq !== snapshotSeq.current) return;
      setState((current) => ({
        ...current,
        snapshot,
        // `boardId` do closure DESTA requisicao, nao o atual: e dele o snapshot.
        snapshotBoardId: boardId,
        loading: false,
        error: null,
      }));
    } catch (error) {
      if (!mounted.current || seq !== snapshotSeq.current) return;
      setState((current) => ({
        ...current,
        loading: false,
        error:
          error instanceof Error ? error.message : "Erro ao carregar o quadro.",
      }));
    }
  }, [boardId, includeArchived]);

  useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (!boardId) return;
    setState((current) => ({
      ...current,
      // DOIS casos, que a condicao antiga (`snapshot === null`) fundia num so:
      //
      //   1. refresh SILENCIOSO do mesmo quadro (mover, criar, renomear, trocar
      //      `includeArchived`): snapshot presente e do mesmo quadro, entao
      //      carregando fica falso e a tela nao pisca. Comportamento bom, mantido;
      //   2. TROCA de quadro: o snapshot presente e de OUTRO quadro, e exibi-lo
      //      como se fosse o atual e o bug. Carregando fica verdadeiro ate a
      //      resposta do quadro novo chegar.
      loading: current.snapshot === null || current.snapshotBoardId !== boardId,
    }));
    void refresh();
  }, [boardId, refresh]);

  /**
   * Insere um quadro na lista a partir da RESPOSTA da criacao, sem refetch.
   *
   * O refetch e justamente o que abria a janela para a lista voltar sem o quadro
   * novo. A RPC ja devolve o quadro pronto, entao nao ha o que buscar; e a
   * ordenacao local repete a do servidor (position, desempate por created_at)
   * para o quadro nascer no mesmo lugar em que ele vai aparecer no proximo load.
   */
  const addBoard = useCallback((board: TaskBoard) => {
    setState((current) => ({
      ...current,
      boards: [...current.boards.filter((b) => b.id !== board.id), board].sort(
        (a, b) =>
          a.position - b.position || a.created_at.localeCompare(b.created_at),
      ),
    }));
  }, []);

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

  // As duas telas de espera sao DIFERENTES e quem decide isso e aqui, nao o
  // componente: no primeiro carregamento nao existe barra de quadros para
  // manter (nem se sabe quais quadros existem), entao o painel inteiro vira
  // esqueleto; na troca a barra fica, porque a pessoa acabou de clicar nela, e
  // so a area das colunas vira esqueleto.
  const trocandoDeBoard = state.loading && state.snapshot !== null;

  return {
    boards: state.boards,
    snapshot: state.snapshot,
    loading: state.loading,
    trocandoDeBoard,
    error: state.error,
    refresh,
    reloadBoards: loadBoards,
    addBoard,
    applyLocal,
  };
}
