import {
  fetchUserContextPool,
  type UserContextPool,
} from "../userContext/pool";

// Formatter FINO do snapshot do agente Pro: converte o pool de contexto
// estruturado (server/lib/userContext/pool.ts, fonte unica de coleta) em texto
// compacto em portugues para injetar como mensagem system.
//
// Regras:
//  - Nenhuma query aqui: toda coleta (e o filtro por user_id) vive no pool.
//  - Fontes { ok: false } sao OMITIDAS (falha nunca vira dado inventado),
//    EXCETO o quiz, que quando ausente ou indisponivel mantem a linha explicita
//    "ainda nao realizado" que o PRO_SYSTEM_PROMPT referencia.
//  - Orcamento maximo de SNAPSHOT_MAX_CHARS: as fontes entram em ordem de
//    prioridade e, na primeira que nao couber inteira, o corte para (fontes de
//    menor prioridade saem inteiras; nunca corta no meio de uma linha).

// Orcamento do snapshot em caracteres. Ajustavel. // TODO: calibrar.
const SNAPSHOT_MAX_CHARS = 2000;
// Tetos de itens por fonte, para o snapshot ficar compacto. // TODO: calibrar.
const MAX_ROADMAP_LINES = 5;
const MAX_COURSE_LINES = 5;
const MAX_SKILL_ITEMS = 12;
const MAX_BOOKMARK_ITEMS = 5;
const MAX_BADGE_ITEMS = 10;

function day(value: string | null): string {
  return value ? value.slice(0, 10) : "data desconhecida";
}

// Monta as linhas de cada fonte, em ordem de prioridade:
// plano > quiz > roadmaps > cursos > skills > linkedin > github > diario >
// perfil > favoritos > badges. Cada bloco e um array de linhas completas.
function buildSourceBlocks(pool: UserContextPool): string[][] {
  const blocks: string[][] = [];

  // Plano.
  if (pool.plan.ok) {
    // TODO(Ana): copy do status de plano no snapshot.
    blocks.push([
      pool.plan.data.isPro
        ? "- Plano: Pro ativo."
        : "- Plano: gratuito (sem Pro ativo).",
    ]);
  }

  // Quiz: unica fonte que aparece mesmo vazia ou indisponivel, porque o prompt
  // Pro instrui o modelo a sugerir o quiz quando ele nao existe.
  if (pool.quiz.ok && pool.quiz.data) {
    const q = pool.quiz.data;
    const area = q.area ?? "nao registrada";
    const nivel = q.level ?? "nao registrado";
    // TODO(Ana): copy do resultado do quiz no snapshot.
    blocks.push([
      `- Quiz de carreira: area ${area}, nivel ${nivel} (concluido em ${day(q.completedAt)}).`,
    ]);
  } else {
    // TODO(Ana): copy de quiz ausente no snapshot.
    blocks.push(["- Quiz de carreira: ainda nao realizado."]);
  }

  // Roadmaps (progresso do formato antigo, user_roadmap_progress).
  if (pool.roadmaps.ok && pool.roadmaps.data.length > 0) {
    const lines = pool.roadmaps.data
      .slice(0, MAX_ROADMAP_LINES)
      .map((r) => {
        const nome = r.title ?? "roadmap sem titulo";
        const total = r.totalSteps !== null ? ` de ${r.totalSteps}` : "";
        return `- Roadmap ${nome}: ${r.completedSteps}${total} passos concluidos (ultimo avanco em ${day(r.lastActivityAt)}).`;
      });
    blocks.push(lines);
  }

  // Cursos / trilhas v2 (user_progress course_progress). Roadmaps gerados por
  // IA (slug ia-<hex>) usam o titulo resolvido pelo pool quando presente.
  if (pool.courses.ok && pool.courses.data.length > 0) {
    const lines = pool.courses.data
      .slice(0, MAX_COURSE_LINES)
      .map((c) => {
        const nome = c.title
          ? `${c.title} (roadmap gerado por IA)`
          : c.courseSlug;
        return `- Trilha ${nome}: ${c.completedItems} itens concluidos (ultimo avanco em ${day(c.lastActivityAt)}).`;
      });
    blocks.push(lines);
  }

  // Skills declaradas.
  if (pool.skills.ok && pool.skills.data.length > 0) {
    const items = pool.skills.data
      .slice(0, MAX_SKILL_ITEMS)
      .map((s) => `${s.label} (${s.level})`)
      .join(", ");
    blocks.push([`- Skills declaradas: ${items}.`]);
  }

  // Analise de LinkedIn mais recente.
  if (pool.linkedin.ok && pool.linkedin.data) {
    const l = pool.linkedin.data;
    blocks.push([
      `- Analise de LinkedIn mais recente: area ${l.area ?? "nao registrada"}, nivel ${l.level ?? "nao registrado"}, nota ${l.score ?? "?"} (faixa ${l.faixa ?? "?"}), em ${day(l.createdAt)}.`,
    ]);
  }

  // Analise de GitHub mais recente (tabela pode nao existir ainda; nesse caso a
  // fonte vem ok: false e o bloco simplesmente nao entra).
  if (pool.github.ok && pool.github.data) {
    const g = pool.github.data;
    blocks.push([
      `- Analise de GitHub mais recente: area ${g.area ?? "nao registrada"}, nota ${g.score ?? "?"} (faixa ${g.faixa ?? "?"}), em ${day(g.createdAt)}.`,
    ]);
  }

  // Diario de estudos (ultimos 30 dias).
  if (pool.studyDiary.ok && pool.studyDiary.data.activeDays30d > 0) {
    const d = pool.studyDiary.data;
    blocks.push([
      `- Diario de estudos (30 dias): ${d.totalMinutes30d} minutos em ${d.activeDays30d} dias ativos (ultimo registro em ${day(d.lastEntryAt)}).`,
    ]);
  }

  // Perfil (so campos preenchidos).
  if (pool.profile.ok && pool.profile.data) {
    const p = pool.profile.data;
    const parts: string[] = [];
    if (p.headline) parts.push(`headline "${p.headline}"`);
    if (p.careerGoal) parts.push(`objetivo "${p.careerGoal}"`);
    if (p.city && p.uf) parts.push(`de ${p.city}/${p.uf}`);
    if (parts.length > 0) {
      blocks.push([`- Perfil: ${parts.join(", ")}.`]);
    }
  }

  // Favoritos.
  if (pool.bookmarks.ok && pool.bookmarks.data.total > 0) {
    const b = pool.bookmarks.data;
    const recent = b.recent
      .slice(0, MAX_BOOKMARK_ITEMS)
      .map((r) => `${r.title ?? "sem titulo"} (${r.resourceType})`)
      .join(", ");
    blocks.push([`- Favoritos: ${b.total} salvos. Mais recentes: ${recent}.`]);
  }

  // Badges.
  if (pool.badges.ok && pool.badges.data.length > 0) {
    const items = pool.badges.data
      .slice(0, MAX_BADGE_ITEMS)
      .map((b) => b.badgeId)
      .join(", ");
    blocks.push([`- Conquistas: ${items}.`]);
  }

  return blocks;
}

export async function buildUserSnapshot(userId: string): Promise<string> {
  const pool = await fetchUserContextPool(userId);

  // DIAG: ligado so com AGENT_DIAG=1 (desligado em producao). Sem PII: so
  // booleanos e status de fonte, nunca area/nivel nem conteudo do quiz.
  if (process.env.AGENT_DIAG === "1") {
    console.log("[agent/diag] is_user_pro:", {
      data: pool.plan.ok ? pool.plan.data.isPro : null,
      error: pool.plan.ok ? null : "source_failed",
    });
    console.log("[agent/diag] quiz query:", {
      hasQuiz: pool.quiz.ok && pool.quiz.data !== null,
      error: pool.quiz.ok ? null : "source_failed",
    });
  }

  const blocks = buildSourceBlocks(pool);

  // TODO(Ana): cabecalho do snapshot.
  const header =
    "Resumo do usuario (use como contexto factual; nunca invente dados alem destes):";

  const lines: string[] = [];
  let used = header.length;
  for (const block of blocks) {
    // +1 por linha pela quebra. O bloco entra INTEIRO ou o corte para aqui:
    // fontes de menor prioridade saem inteiras, nunca ha corte no meio.
    const blockChars = block.reduce((sum, line) => sum + line.length + 1, 0);
    if (used + blockChars > SNAPSHOT_MAX_CHARS) break;
    lines.push(...block);
    used += blockChars;
  }

  if (lines.length === 0) {
    // Todas as fontes falharam (ate o fallback do quiz caberia; so chegamos
    // aqui se o orcamento for menor que a primeira linha, na pratica nunca).
    // TODO(Ana): copy de snapshot indisponivel.
    return "Resumo do usuario indisponivel no momento.";
  }

  const text = `${header}\n${lines.join("\n")}`;

  // DIAG: ligado so com AGENT_DIAG=1. So contagens, nunca o texto do snapshot.
  if (process.env.AGENT_DIAG === "1") {
    console.log("[agent/diag] snapshot final:", {
      chars: text.length,
      linhas: lines.length,
      fontes: blocks.length,
    });
  }

  return text;
}
