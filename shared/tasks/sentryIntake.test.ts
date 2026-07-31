import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ARQUIVADO_PELO_SYNC,
  ARQUIVADO_POR_HUMANO,
  DIAS_SEM_EVENTO_PARA_ARQUIVAR,
  INTAKE_SENTRY,
  JANELA_LISTAGEM_DIAS,
} from "./sentryIntake";

/**
 * Trava as duas coisas que um numero solto num arquivo nao consegue proteger
 * sozinho: a RELACAO dele com outro numero, e a paridade com o SQL.
 *
 * A relacao importa porque `DIAS_SEM_EVENTO_PARA_ARQUIVAR` parece arbitrario
 * (21) e nao e: ele so cumpre o proposito enquanto for maior que a janela da
 * listagem. Alguem baixando para 14 "para podar mais rapido" nao veria nada
 * quebrar, e a poda passaria a alcancar card cuja issue ainda esta visivel no
 * feed. O comentario no arquivo explica; este teste impede.
 */

const migrationsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "supabase",
  "migrations",
);

function sql(arquivo: string): string {
  return readFileSync(path.join(migrationsDir, arquivo), "utf8");
}

/** Extrai os literais de um `check (col in ('a', 'b'))` ancorado no nome da coluna. */
function valoresDoCheck(texto: string, coluna: string): string[] {
  const bloco = texto.match(
    new RegExp(`${coluna}\\s+in\\s*\\(([^)]*)\\)`, "i"),
  );
  if (!bloco) return [];
  const literais = bloco[1].match(/'([^']+)'/g);
  return literais ? literais.map((s) => s.slice(1, -1)) : [];
}

describe("janela da poda", () => {
  it("21 dias, o valor fixado", () => {
    expect(DIAS_SEM_EVENTO_PARA_ARQUIVAR).toBe(21);
  });

  it("é ESTRITAMENTE maior que a janela da listagem", () => {
    // A asserção que carrega o motivo. A poda nao pode alcancar nada que ainda
    // esteja aparecendo no feed normal; se os dois se encostarem, um card sai da
    // fila no mesmo dia em que a issue ainda podia estar visivel.
    expect(DIAS_SEM_EVENTO_PARA_ARQUIVAR).toBeGreaterThan(JANELA_LISTAGEM_DIAS);
  });

  it("a janela da listagem é 14, que é o que a API do Sentry aceita", () => {
    // Nao e escolha nossa: o endpoint aceita '', '24h' e '14d' e nada mais.
    // Trocar este numero sem trocar o que vai na querystring desalinharia a
    // regra da API que a impoe.
    expect(JANELA_LISTAGEM_DIAS).toBe(14);
  });
});

describe("paridade com o SQL", () => {
  it("archived_source aceita exatamente os dois valores que o TS declara", () => {
    const valores = valoresDoCheck(
      sql("20260731050300_add_archive_provenance_to_admin_tasks.sql"),
      "archived_source",
    );
    // Total antes da pertinencia: um regex que parar de casar devolve lista
    // vazia, e comparar vazio com vazio passaria de bobeira.
    expect(valores).toHaveLength(2);
    expect(valores.slice().sort()).toEqual(
      [ARQUIVADO_PELO_SYNC, ARQUIVADO_POR_HUMANO].slice().sort(),
    );
  });

  it("intake_source aceita exatamente o marcador que o TS declara", () => {
    const valores = valoresDoCheck(
      sql("20260731050100_add_task_automation_flags.sql"),
      "intake_source",
    );
    expect(valores).toHaveLength(1);
    expect(valores[0]).toBe(INTAKE_SENTRY);
  });

  it("source de admin_tasks declara os tres valores esperados", () => {
    const valores = valoresDoCheck(
      sql("20260731050200_allow_system_actor_on_admin_tasks.sql"),
      "source",
    );
    expect(valores).toHaveLength(3);
    expect(valores.slice().sort()).toEqual(
      ["human", "migrated_bug", "sentry"].slice().sort(),
    );
  });
});

describe("o que a Fase 2 promete ao schema", () => {
  const m3 = sql("20260731050000_add_sentry_fields_to_admin_tasks.sql");
  const m6 = sql("20260731050300_add_archive_provenance_to_admin_tasks.sql");

  it("a deduplicacao do invariante 3 e um indice UNICO, nao um if", () => {
    expect(m3).toMatch(
      /create unique index[\s\S]*admin_tasks_sentry_numeric_id_key/i,
    );
    // Parcial: card humano tem o campo nulo e nao pode colidir com ninguem.
    expect(m3).toMatch(/where sentry_numeric_id is not null/i);
  });

  it("a idempotencia da migracao de dados tambem e por indice unico", () => {
    expect(m3).toMatch(
      /create unique index[\s\S]*admin_tasks_legacy_bug_id_key/i,
    );
  });

  it("existe indice para a varredura de arquivados da ressurreicao", () => {
    // Sem ele, o unico lugar do modulo que le arquivados le a tabela inteira.
    expect(m6).toMatch(/admin_tasks_sync_archived_idx/i);
    expect(m6).toMatch(/where archived_source = 'sentry_sync'/i);
  });

  it("a coerencia de archived_at com archived_source e imposta por TRIGGER", () => {
    // A rota de hoje arquiva setando so archived_at. Se a coerencia dependesse
    // de quem escreve, aplicar a migration quebraria o arquivamento em producao
    // antes do codigo novo subir.
    expect(m6).toMatch(/create trigger admin_tasks_set_archive_source/i);
    expect(m6).toMatch(/before insert or update on public\.admin_tasks/i);
  });
});
