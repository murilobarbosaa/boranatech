import type { IntakeChatMessage } from "@/components/ai/IntakeChatPanel";
import type { IntakeChatProposal } from "@/services/aiRoadmapService";

// Rascunho do chat de intake do Roadmap com IA, no localStorage.
//
// Extraido da pagina para ser testavel sem DOM: a reidratacao de um rascunho
// ANTIGO e o caminho de desbloqueio de quem ficou preso com 12-13 turnos, e ele
// nao pode depender de renderizar a pagina inteira para ser verificado.
//
// A CHAVE JA E VERSIONADA (`:v1:`). Ela NAO foi promovida a v2 na fase 2 de
// proposito: a unica mudanca de shape foi ADITIVA (`restantes?`), e subir a
// versao descartaria justamente os rascunhos das pessoas travadas que a fase
// existe para destravar. Versao nova so quando o shape mudar de forma
// incompativel, e ai o descarte e o comportamento desejado.
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export function draftKey(userId: string): string {
  return `bnt:roadmap-intake-chat:v1:${userId}`;
}

export interface ChatDraft {
  savedAt: number;
  messages: IntakeChatMessage[];
  intake: IntakeChatProposal | null;
  missing: string[];
  ready: boolean;
  // Opcional: rascunhos salvos antes da fase 2 nao tem este campo, e restaurar
  // sem ele so significa nao mostrar o aviso ate o proximo turno.
  restantes?: number | null;
}

// Mensagem valida = o MESMO criterio do servidor (validateIntakeChatBody em
// server/lib/aiRoadmap/intakeChat.ts): role conhecido e content string
// nao-vazia. Espelhar o servidor importa porque o que sai daqui vai direto para
// ele; divergir faria a UI mostrar bolha que o backend descarta.
function mensagemValida(item: unknown): item is IntakeChatMessage {
  if (!item || typeof item !== "object") return false;
  const m = item as { role?: unknown; content?: unknown };
  if (m.role !== "user" && m.role !== "assistant") return false;
  return typeof m.content === "string" && m.content.trim().length > 0;
}

/**
 * Le o rascunho, DESCARTANDO em silencio o que nao reconhece.
 *
 * Itens malformados sao filtrados em vez de derrubarem o rascunho inteiro (é o
 * que o servidor faz com o mesmo dado); o rascunho so e descartado quando NAO
 * SOBRA mensagem nenhuma, porque ai nao ha conversa para retomar. A alternativa
 * (descartar tudo ao primeiro item torto) custaria a conversa inteira de quem
 * esta travado, que e o oposto do objetivo.
 */
export function loadDraft(userId: string): ChatDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      window.localStorage.removeItem(draftKey(userId));
      return null;
    }
    const rec = parsed as Record<string, unknown>;
    if (typeof rec.savedAt !== "number" || !Array.isArray(rec.messages)) {
      window.localStorage.removeItem(draftKey(userId));
      return null;
    }
    if (Date.now() - rec.savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(draftKey(userId));
      return null;
    }

    const messages = rec.messages.filter(mensagemValida);
    if (messages.length === 0) {
      window.localStorage.removeItem(draftKey(userId));
      return null;
    }

    return {
      savedAt: rec.savedAt,
      messages,
      // Um intake que nao e objeto viraria acesso a campo em string/numero mais
      // adiante, e o resumo renderizaria lixo silenciosamente.
      intake:
        rec.intake && typeof rec.intake === "object"
          ? (rec.intake as IntakeChatProposal)
          : null,
      missing: Array.isArray(rec.missing)
        ? rec.missing.filter((m): m is string => typeof m === "string")
        : [],
      ready: rec.ready === true,
      restantes: typeof rec.restantes === "number" ? rec.restantes : null,
    };
  } catch {
    return null;
  }
}

export function saveDraft(
  userId: string,
  draft: Omit<ChatDraft, "savedAt">,
): void {
  try {
    window.localStorage.setItem(
      draftKey(userId),
      JSON.stringify({ savedAt: Date.now(), ...draft }),
    );
  } catch {
    // Storage cheio ou indisponivel: o rascunho e best-effort, ignora.
  }
}

export function clearDraft(userId: string): void {
  try {
    window.localStorage.removeItem(draftKey(userId));
  } catch {
    // Ignora: limpeza best-effort.
  }
}
