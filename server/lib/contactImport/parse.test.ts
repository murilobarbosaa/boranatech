import { describe, expect, it } from "vitest";

import { parseText } from "./parse";
import { classifyContacts } from "./validate";

describe("parseText", () => {
  it("um por linha, Nome <email> e separados por virgula/ponto-e-virgula", () => {
    const rows = parseText(
      "a@x.com\nJohn Doe <john@y.com>\nc@z.com, d@w.com; e@v.com",
    );
    expect(rows.map((r) => r.email)).toEqual([
      "a@x.com",
      "john@y.com",
      "c@z.com",
      "d@w.com",
      "e@v.com",
    ]);
    expect(rows[1].name).toBe("John Doe");
  });
});

describe("classifyContacts", () => {
  it("classifica syntax, duplicate, disposable, suppressed e usuario existente", () => {
    const parsed = [
      { email: "ok@x.com", name: null, rawLine: "ok@x.com" },
      { email: "ok@x.com", name: null, rawLine: "ok@x.com" }, // duplicate
      { email: "naoemail", name: null, rawLine: "naoemail" }, // syntax
      {
        email: "temp@mailinator.com",
        name: null,
        rawLine: "temp@mailinator.com",
      }, // disposable
      { email: "sup@x.com", name: null, rawLine: "sup@x.com" }, // suppressed
      { email: "user@x.com", name: null, rawLine: "user@x.com" }, // ja usuario
    ];
    const report = classifyContacts("paste", parsed, {
      suppressedLower: new Set(["sup@x.com"]),
      existingUsersLower: new Map([["user@x.com", "uid-1"]]),
    });
    expect(report.totalRows).toBe(6);
    expect(report.validCount).toBe(2);
    expect(report.duplicateCount).toBe(1);
    expect(report.invalidCount).toBe(2);
    expect(report.suppressedCount).toBe(1);
    expect(report.existingUserCount).toBe(1);
    expect(report.members[5].userId).toBe("uid-1");
    expect(report.members[3].invalidReason).toBe("disposable");
    expect(report.members[2].invalidReason).toBe("syntax");
  });
});
