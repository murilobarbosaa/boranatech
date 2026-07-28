import { describe, expect, it } from "vitest";

import { activityDotOf, activityLineOf } from "./taskActivityMeta";
import type { TaskActivity, TaskActivityAction } from "./types";

function entry(
  action: string,
  payload: Record<string, unknown> = {},
): TaskActivity {
  return {
    id: "act-1",
    task_id: "task-1",
    actor_id: "user-1",
    action: action as TaskActivityAction,
    payload,
    created_at: "2026-07-28T12:00:00.000Z",
  };
}

describe("activityLineOf: frases", () => {
  it("criacao usa o nome da coluna gravado no payload", () => {
    expect(entryText("created", { column_id: "c1", column_name: "Backlog" })).toBe(
      "criou a tarefa em Backlog",
    );
  });

  it("movimentacao mostra origem e destino", () => {
    expect(
      entryText("moved", {
        from_column_id: "c1",
        from_column_name: "A Fazer",
        to_column_id: "c2",
        to_column_name: "Em Progresso",
      }),
    ).toBe("moveu de A Fazer para Em Progresso");
  });

  it("responsavel usa o nome denormalizado", () => {
    expect(
      entryText("assigned", { to: "u1", to_name: "Murilo" }),
    ).toBe("definiu Murilo como responsável");
    expect(
      entryText("unassigned", { from: "u1", from_name: "Murilo" }),
    ).toBe("removeu Murilo da tarefa");
  });

  it("etiqueta usa o nome denormalizado", () => {
    expect(
      entryText("label_added", { label_id: "l1", label_name: "Urgente" }),
    ).toBe("aplicou a etiqueta Urgente");
    expect(
      entryText("label_removed", { label_id: "l1", label_name: "Urgente" }),
    ).toBe("removeu a etiqueta Urgente");
  });

  it("prioridade e tipo saem em portugues", () => {
    expect(entryText("priority_changed", { from: "media", to: "urgente" })).toBe(
      "mudou a prioridade de média para urgente",
    );
    expect(entryText("type_changed", { from: "tarefa", to: "debito_tecnico" })).toBe(
      "mudou o tipo de tarefa para débito técnico",
    );
  });

  it("vencimento sai em dd/mm/aaaa e trata a ausencia", () => {
    expect(
      entryText("due_date_changed", { from: null, to: "2026-08-15" }),
    ).toBe("mudou o vencimento de sem data para 15/08/2026");
  });

  it("acoes sem payload", () => {
    expect(entryText("archived")).toBe("arquivou a tarefa");
    expect(entryText("completed")).toBe("concluiu a tarefa");
    expect(entryText("reopened")).toBe("reabriu a tarefa");
  });
});

// O bloco que justifica o modulo existir. Cada caso aqui e uma forma de a tela
// quebrar ou de o histórico mentir.
describe("activityLineOf: degradacao", () => {
  it("action DESCONHECIDO nao lanca e nao devolve linha em branco", () => {
    const line = activityLineOf(entry("teleportou_a_tarefa"));
    expect(line.text).toBe("registrou uma alteração");
    expect(line.kind).toBe("other");
  });

  it("payload vazio nao lanca em nenhuma action conhecida", () => {
    const actions = [
      "created",
      "moved",
      "renamed",
      "assigned",
      "unassigned",
      "priority_changed",
      "type_changed",
      "due_date_changed",
      "label_added",
      "label_removed",
      "archived",
      "unarchived",
      "completed",
      "reopened",
    ];
    for (const action of actions) {
      const line = activityLineOf(entry(action, {}));
      expect(line.text.length).toBeGreaterThan(0);
    }
  });

  // Linha antiga, gravada antes de o server denormalizar o rotulo: cai no id, e
  // depois no texto neutro. Nunca em undefined.
  it("linha ANTIGA sem o nome denormalizado cai no id", () => {
    expect(entryText("label_added", { label_id: "l-42" })).toBe(
      "aplicou a etiqueta l-42",
    );
    expect(entryText("assigned", { to: "u-42" })).toBe(
      "definiu u-42 como responsável",
    );
  });

  it("sem nome e sem id cai no texto neutro", () => {
    expect(entryText("label_removed", {})).toBe("removeu a etiqueta uma etiqueta");
    expect(entryText("moved", {})).toBe("moveu de outra etapa para outra etapa");
  });

  it("payload nulo ou de tipo errado nao lanca", () => {
    const line = activityLineOf({
      ...entry("label_added"),
      payload: null as unknown as Record<string, unknown>,
    });
    expect(line.text).toBe("aplicou a etiqueta uma etiqueta");

    // Valor numerico onde se esperava string: ignorado, cai no fallback.
    expect(entryText("label_added", { label_name: 42 })).toBe(
      "aplicou a etiqueta uma etiqueta",
    );
    expect(entryText("label_added", { label_name: "   " })).toBe(
      "aplicou a etiqueta uma etiqueta",
    );
  });

  it("valor de prioridade desconhecido aparece cru, nao some", () => {
    expect(entryText("priority_changed", { from: "media", to: "catastrofica" })).toBe(
      "mudou a prioridade de média para catastrofica",
    );
  });
});

describe("activityDotOf", () => {
  it("kind conhecido tem cor propria", () => {
    expect(activityDotOf("moved")).not.toBe(activityDotOf("label"));
  });

  it("kind desconhecido cai no neutro em vez de undefined", () => {
    expect(activityDotOf("nao_existe")).toBe(activityDotOf("other"));
    expect(activityDotOf("nao_existe")).toBeTruthy();
  });
});

function entryText(action: string, payload: Record<string, unknown> = {}) {
  return activityLineOf(entry(action, payload)).text;
}
