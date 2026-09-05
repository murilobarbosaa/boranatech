import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteProgress,
  listProgress,
  upsertProgress,
} from "@/services/userProgressService";
import {
  PROJECT_PROGRESS_CONTEXT,
  type ProjectStagesLocal,
  clearProjectProgress,
  clearProjectStages,
  loadProjectProgress,
  loadProjectStages,
  saveProjectProgress,
  saveProjectStages,
} from "@/lib/projectProgress";
import {
  loadProgress as loadTrailProgress,
  saveProgress as saveTrailProgress,
} from "@/lib/roadmapV2/progressStorage";
import { parseProjectProgressState } from "@shared/projects/progressState";
import { projectTrailLinks } from "@shared/roadmapV2/projectLinks.generated";

// Conclusao de projeto como entidade propria (Fase 5b), espelhada com os nos
// de trilha vinculados via projectLinks.generated.ts. Mesmo padrao do
// useRoadmapProgress: anonimo em localStorage, migracao unica no login,
// toggle otimista com rollback.
//
// MUDANCA DE SEMANTICA (lote 03): `done` deixa de ser "existe linha em
// user_progress" e passa a ser `state.done === true`. As linhas antigas tem
// `{ done: true }` e continuam concluidas; a diferenca aparece a partir de
// agora, porque marcar uma ETAPA cria a linha sem concluir o projeto. Ler a
// presenca da linha faria toda etapa marcada virar projeto concluido.
export function useProjectCompletion() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [done, setDone] = useState<Set<string>>(new Set());
  const [stages, setStages] = useState<Map<string, Record<string, string>>>(
    new Map(),
  );
  const [ready, setReady] = useState(false);
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const prevUser = prevUserRef.current;
    prevUserRef.current = userId;

    if (!userId) {
      setDone(loadProjectProgress());
      setStages(new Map(Object.entries(loadProjectStages())));
      setReady(true);
      return;
    }

    const justSignedIn = !prevUser && !!userId;
    setReady(false);

    const migrateAndLoad = async () => {
      if (justSignedIn) {
        const local = loadProjectProgress();
        const locaisEtapas = loadProjectStages();
        // Array.from e nao spread: o tsconfig da aplicacao nao declara
        // `target`, cai em ES5 e espalhar um Set nao compila (TS2802).
        const ids = new Set(
          Array.from(local).concat(Object.keys(locaisEtapas)),
        );
        if (ids.size > 0) {
          try {
            await Promise.all(
              Array.from(ids).map((id) =>
                upsertProgress(PROJECT_PROGRESS_CONTEXT, id, {
                  done: local.has(id),
                  etapas: locaisEtapas[id] ?? {},
                }),
              ),
            );
            clearProjectProgress();
            clearProjectStages();
          } catch (err) {
            // Mantem o local pra tentar de novo numa proxima sessao, igual ao
            // useRoadmapProgress.
            console.error("[useProjectCompletion] migracao falhou:", err);
          }
        }
      }
      const entries = await listProgress(PROJECT_PROGRESS_CONTEXT);
      if (cancelled) return;
      const doneSet = new Set<string>();
      const stageMap = new Map<string, Record<string, string>>();
      for (const entry of entries) {
        // O server valida na escrita; aqui normaliza a leitura, inclusive das
        // linhas antigas `{ done: true }`. `null` em etapaIds nao serve na
        // leitura (nao sabemos se o projeto e v2 sem carregar o modulo), entao
        // aceitamos as chaves que vierem: o que o banco tem ja passou pela
        // validacao da escrita.
        const parsed = parseProjectProgressState(
          entry.state,
          Object.keys((entry.state as { etapas?: object })?.etapas ?? {}),
        );
        const value = parsed.ok ? parsed.value : { done: false, etapas: {} };
        if (value.done) doneSet.add(entry.itemKey);
        if (Object.keys(value.etapas).length > 0)
          stageMap.set(entry.itemKey, value.etapas);
      }
      setDone(doneSet);
      setStages(stageMap);
      setReady(true);
    };

    void migrateAndLoad();
    return () => {
      cancelled = true;
    };
  }, [userId, authLoading]);

  // Persiste o estado COMPLETO do projeto (done + etapas). O server so aceita
  // o objeto inteiro, entao mandar so um dos dois apagaria o outro.
  const persistir = (
    projectId: string,
    proximoDone: boolean,
    proximasEtapas: Record<string, string>,
  ): Promise<void> => {
    const semEtapas = Object.keys(proximasEtapas).length === 0;
    // Linha sem nada nao fica no banco: `deleteProgress` so quando o projeto
    // volta ao zero, pra nao acumular linha vazia por projeto visitado.
    if (!proximoDone && semEtapas)
      return deleteProgress(PROJECT_PROGRESS_CONTEXT, projectId);
    return upsertProgress(PROJECT_PROGRESS_CONTEXT, projectId, {
      done: proximoDone,
      etapas: proximasEtapas,
    });
  };

  // Toggle otimista com espelhamento projeto -> nos de trilha vinculados.
  // Logado: project_progress + course_progress dos vinculos em Promise.all;
  // falha de qualquer um reverte o estado otimista (rollback conjunto).
  // Anonimo: storages locais, sincronos.
  const toggle = (projectId: string) => {
    const wasDone = done.has(projectId);
    const nextDone = !wasDone;
    const etapasAtuais = stages.get(projectId) ?? {};
    const links = projectTrailLinks[projectId] ?? [];

    setDone((prev) => {
      const next = new Set(prev);
      if (nextDone) next.add(projectId);
      else next.delete(projectId);
      return next;
    });

    if (!userId) {
      const local = loadProjectProgress();
      if (nextDone) local.add(projectId);
      else local.delete(projectId);
      saveProjectProgress(local);
      for (const { slug, nodeId } of links) {
        const trail = loadTrailProgress(slug);
        if (nextDone) trail.add(nodeId);
        else trail.delete(nodeId);
        saveTrailProgress(slug, trail);
      }
      return;
    }

    const ops: Promise<void>[] = [persistir(projectId, nextDone, etapasAtuais)];
    for (const { slug, nodeId } of links) {
      const itemKey = `${slug}:${nodeId}`;
      ops.push(
        nextDone
          ? upsertProgress("course_progress", itemKey, { done: true })
          : deleteProgress("course_progress", itemKey),
      );
    }
    void Promise.all(ops).catch((err) => {
      console.error("[useProjectCompletion] toggle falhou:", err);
      setDone((prev) => {
        const next = new Set(prev);
        if (wasDone) next.add(projectId);
        else next.delete(projectId);
        return next;
      });
    });
  };

  // Marca ou desmarca uma etapa. Nao mexe em `done` nem nos nos de trilha: sao
  // conclusoes de granularidade diferente, e uma etapa marcada nao afirma que
  // o projeto acabou.
  const toggleStage = (projectId: string, etapaId: string) => {
    const atuais = stages.get(projectId) ?? {};
    const marcada = etapaId in atuais;
    const proximas = { ...atuais };
    if (marcada) delete proximas[etapaId];
    else proximas[etapaId] = new Date().toISOString();

    setStages((prev) => {
      const next = new Map(prev);
      if (Object.keys(proximas).length === 0) next.delete(projectId);
      else next.set(projectId, proximas);
      return next;
    });

    if (!userId) {
      const locais = loadProjectStages();
      if (Object.keys(proximas).length === 0) delete locais[projectId];
      else locais[projectId] = proximas;
      saveProjectStages(locais);
      return;
    }

    void persistir(projectId, done.has(projectId), proximas).catch((err) => {
      console.error("[useProjectCompletion] toggleStage falhou:", err);
      setStages((prev) => {
        const next = new Map(prev);
        if (Object.keys(atuais).length === 0) next.delete(projectId);
        else next.set(projectId, atuais);
        return next;
      });
    });
  };

  return { done, stages, ready, toggle, toggleStage };
}

export type { ProjectStagesLocal };
