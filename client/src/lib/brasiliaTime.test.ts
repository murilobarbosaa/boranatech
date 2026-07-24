import { describe, expect, it } from "vitest";

import {
  brasiliaLocalToIso,
  formatBrasiliaDateTime,
  isoToBrasiliaLocal,
} from "./brasiliaTime";

// Brasília é UTC-3 fixo (sem horário de verão desde 2019), então um wall-clock
// local está sempre 3h à frente do UTC. Os valores esperados abaixo valem em
// QUALQUER fuso de máquina: os helpers ancoram a conversão em America/Sao_Paulo
// via Intl, sem passar pelo fuso local (nunca chamam `new Date("...local...")`).
describe("brasiliaLocalToIso", () => {
  it("interpreta o wall-clock como horário de Brasília (-03:00) ao serializar", () => {
    expect(brasiliaLocalToIso("2026-07-20T14:30")).toBe(
      "2026-07-20T17:30:00.000Z",
    );
  });

  it("vira o dia quando o horário de Brasília cruza a meia-noite em UTC", () => {
    // 23:30 BRT do dia 20 = 02:30 UTC do dia 21.
    expect(brasiliaLocalToIso("2026-07-20T23:30")).toBe(
      "2026-07-21T02:30:00.000Z",
    );
  });

  it("independe do fuso do navegador (resultado é determinístico)", () => {
    // Se a conversão dependesse do fuso da máquina, este valor mudaria conforme
    // TZ; como é fixo em Brasília, o ISO esperado é o mesmo em qualquer runner.
    expect(brasiliaLocalToIso("2026-01-15T09:00")).toBe(
      "2026-01-15T12:00:00.000Z",
    );
  });

  it("rejeita entrada vazia ou inválida", () => {
    expect(brasiliaLocalToIso("")).toBeNull();
    expect(brasiliaLocalToIso("não-é-data")).toBeNull();
  });
});

describe("isoToBrasiliaLocal", () => {
  it("desserializa o ISO UTC de volta pro wall-clock de Brasília", () => {
    expect(isoToBrasiliaLocal("2026-07-20T17:30:00.000Z")).toBe(
      "2026-07-20T14:30",
    );
  });

  it("string inválida vira vazio", () => {
    expect(isoToBrasiliaLocal("nada")).toBe("");
  });
});

describe("round-trip agendar -> salvar -> reabrir", () => {
  it("14:30 BRT sobrevive à ida e volta, independente do fuso do navegador", () => {
    const local = "2026-07-20T14:30";
    const iso = brasiliaLocalToIso(local);
    expect(iso).not.toBeNull();
    expect(isoToBrasiliaLocal(iso as string)).toBe(local);
  });
});

describe("formatBrasiliaDateTime", () => {
  it("formata o instante no horário de Brasília, não no fuso local", () => {
    // 17:30 UTC = 14:30 em Brasília.
    expect(formatBrasiliaDateTime("2026-07-20T17:30:00.000Z")).toContain(
      "14:30",
    );
  });
});
