import { describe, expect, it } from "vitest";

import {
  partitionSendableEmails,
  validateEmailForSending,
} from "./emailValidation";

describe("validateEmailForSending", () => {
  it("aceita e-mail normal", () => {
    expect(validateEmailForSending("ana@boranatech.com.br")).toEqual({
      ok: true,
    });
  });

  it("rejeita example.com como reservado (probe vazado em producao)", () => {
    expect(validateEmailForSending("latency-test-local-1@example.com")).toEqual(
      { ok: false, reason: "reserved" },
    );
    expect(validateEmailForSending("redteam-probe-unb@example.com").ok).toBe(
      false,
    );
  });

  it("rejeita example.org e example.net", () => {
    expect(validateEmailForSending("x@example.org")).toEqual({
      ok: false,
      reason: "reserved",
    });
    expect(validateEmailForSending("x@example.net")).toEqual({
      ok: false,
      reason: "reserved",
    });
  });

  it("rejeita TLDs reservados .test/.invalid/.localhost", () => {
    expect(validateEmailForSending("x@foo.test")).toEqual({
      ok: false,
      reason: "reserved",
    });
    expect(validateEmailForSending("x@foo.invalid")).toEqual({
      ok: false,
      reason: "reserved",
    });
    expect(validateEmailForSending("x@host.localhost")).toEqual({
      ok: false,
      reason: "reserved",
    });
  });

  it("distingue sintaxe invalida de dominio reservado", () => {
    expect(validateEmailForSending("sem-arroba")).toEqual({
      ok: false,
      reason: "syntax",
    });
    expect(validateEmailForSending("a@b")).toEqual({
      ok: false,
      reason: "syntax",
    });
  });
});

describe("partitionSendableEmails", () => {
  it("separa enviaveis dos rejeitados com o motivo", () => {
    const { sendable, rejected } = partitionSendableEmails([
      "ok@dominio.com",
      "probe@example.com",
      "ruim",
    ]);
    expect(sendable).toEqual(["ok@dominio.com"]);
    expect(rejected).toEqual([
      { email: "probe@example.com", reason: "reserved" },
      { email: "ruim", reason: "syntax" },
    ]);
  });
});
