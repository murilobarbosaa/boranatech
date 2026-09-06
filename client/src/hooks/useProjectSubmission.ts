import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  ProjectSubmissionError,
  getSubmission,
  upsertSubmission,
  verifySubmission,
  type ProjectSubmission,
} from "@/services/projectSubmissionService";
import type { SubmissionInput } from "@shared/projects/submission";

export type StatusEntrega = "carregando" | "pronto" | "erro" | "indisponivel";

/**
 * A entrega de UM projeto.
 *
 * `indisponivel` e um estado proprio, e nao "sem entrega": e a janela entre o
 * deploy do codigo e o SQL da migration, e nela a UI precisa dizer "volte
 * depois" em vez de oferecer um formulario que vai falhar.
 */
export function useProjectSubmission(projectId: string, ativo: boolean) {
  const { user, loading: authLoading } = useAuth();
  const [submission, setSubmission] = useState<ProjectSubmission | null>(null);
  const [status, setStatus] = useState<StatusEntrega>("carregando");

  const carregar = useCallback(async () => {
    setStatus("carregando");
    try {
      setSubmission(await getSubmission(projectId));
      setStatus("pronto");
    } catch (err) {
      setStatus(
        err instanceof ProjectSubmissionError &&
          err.code === "feature_unavailable"
          ? "indisponivel"
          : "erro",
      );
    }
  }, [projectId]);

  useEffect(() => {
    if (!ativo || authLoading) return;
    if (!user) {
      // Anonimo nao tem entrega: `pronto` com null, e a UI pede login.
      setSubmission(null);
      setStatus("pronto");
      return;
    }
    void carregar();
  }, [ativo, authLoading, user, carregar]);

  const entregar = useCallback(
    async (input: SubmissionInput) => {
      const salva = await upsertSubmission(projectId, input);
      setSubmission(salva);
      setStatus("pronto");
      return salva;
    },
    [projectId],
  );

  const verificar = useCallback(async () => {
    const atualizada = await verifySubmission(projectId);
    setSubmission(atualizada);
    setStatus("pronto");
    return atualizada;
  }, [projectId]);

  return { submission, status, entregar, verificar, recarregar: carregar };
}
