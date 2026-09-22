import { describe, expect, it } from "vitest";
import {
  isTaskMoveDestination,
  taskMoveDestinations,
} from "./taskMoveDestinations";

const columns = [
  { id: "intake", is_pinned: true },
  { id: "todo", is_pinned: false },
  { id: "done", is_pinned: false },
];

describe("destinos explícitos de tarefas", () => {
  it("não oferece a etapa atual nem a entrada fixa, mas permite sair dela", () => {
    expect(
      taskMoveDestinations(columns, "todo").map((item) => item.id),
    ).toEqual(["done"]);
    expect(
      taskMoveDestinations(columns, "intake").map((item) => item.id),
    ).toEqual(["todo", "done"]);
    expect(isTaskMoveDestination(columns[0], "todo")).toBe(false);
    expect(isTaskMoveDestination(columns[1], "todo")).toBe(false);
  });

  it("não inventa destino para quadro sem outra etapa humana", () => {
    expect(taskMoveDestinations(columns.slice(0, 2), "todo")).toEqual([]);
  });
});
