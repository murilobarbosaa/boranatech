import { supabaseAdmin } from "../supabaseAdmin";

// Snapshot read-only e COMPACTO do usuario, para ser injetado no contexto do
// agente Pro na proxima rodada (aqui so construimos e testamos o helper).
//
// Principios de seguranca desta fase:
//  - Toda query filtra explicitamente por user_id = userId (supabaseAdmin usa
//    service role e BYPASSA o RLS; nunca confiar so no RLS aqui).
//  - userId vem sempre do JWT verificado (req.user.id), nunca do corpo.
//  - Falha de query NAO lanca e NAO vira valor legitimo: a parte que falhou e
//    OMITIDA (degrada com graca) e logada como warn. Nunca inventa dado.
//
// Inclui apenas sinais de baixo risco e baixa cardinalidade: status de plano Pro
// e o resultado do quiz mais recente concluido. Conteudo pessoal pesado (texto de
// curriculo, analises) NAO entra no snapshot; vira tool sob demanda depois.

interface QuizSnapshotRow {
  result_area: string | null;
  level: string | null;
  confidence: number | null;
  completed_at: string | null;
}

export async function buildUserSnapshot(userId: string): Promise<string> {
  const parts: string[] = [];

  // Status Pro: usa a RPC canonica is_user_pro (a MESMA fonte de verdade do
  // checkProStatus), em vez de reimplementar o criterio de assinatura ativa aqui.
  // Reimplementar seria o tipo de divergencia por tras do incidente de
  // all-accounts-Pro. A RPC ja escopa por p_user_id.
  try {
    const { data, error } = await supabaseAdmin.rpc("is_user_pro", {
      p_user_id: userId,
    });
    if (error) {
      console.warn("[agent/snapshot] is_user_pro falhou:", error.message);
    } else if (data === true) {
      // TODO(Ana): copy do status Pro no snapshot.
      parts.push("Plano: Pro ativo.");
    } else {
      // TODO(Ana): copy do status free no snapshot.
      parts.push("Plano: gratuito (sem Pro ativo).");
    }
  } catch (err) {
    console.warn("[agent/snapshot] erro ao verificar Pro:", err);
  }

  // Quiz mais recente concluido: completed_at nao nulo, ordenado desc. Filtra
  // explicitamente por user_id.
  try {
    const { data, error } = await supabaseAdmin
      .from("career_quiz_attempts")
      .select("result_area, level, confidence, completed_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[agent/snapshot] quiz query falhou:", error.message);
    } else if (data) {
      const row = data as QuizSnapshotRow;
      const area = row.result_area ?? "nao registrada";
      const nivel = row.level ?? "nao registrado";
      const dia = row.completed_at ? row.completed_at.slice(0, 10) : "data desconhecida";
      // TODO(Ana): copy do resultado do quiz no snapshot.
      parts.push(`Quiz de carreira: area ${area}, nivel ${nivel} (concluido em ${dia}).`);
    } else {
      // Ausencia de quiz e um sinal valido (o agente pode sugerir fazer o quiz).
      // TODO(Ana): copy de quiz ausente no snapshot.
      parts.push("Quiz de carreira: ainda nao realizado.");
    }
  } catch (err) {
    console.warn("[agent/snapshot] erro ao ler quiz:", err);
  }

  if (parts.length === 0) {
    // TODO(Ana): copy de snapshot indisponivel.
    return "Resumo do usuario indisponivel no momento.";
  }

  // TODO(Ana): cabecalho do snapshot.
  return `Resumo do usuario (use como contexto factual; nunca invente dados alem destes):\n${parts
    .map((p) => `- ${p}`)
    .join("\n")}`;
}
