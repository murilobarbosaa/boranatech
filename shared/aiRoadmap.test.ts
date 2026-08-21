import { describe, expect, it } from "vitest";

import {
  buildGenerationIntake,
  DEFAULT_INTAKE_FORMAT,
  INTAKE_REQUIRED_CHOICE_FIELDS,
  type IntakeProposalLike,
} from "./aiRoadmap";

/**
 * `buildGenerationIntake` e a FONTE UNICA de "da pra gerar?".
 *
 * O bug que originou esta funcao: o botao de gerar dependia de `ready` (sinal do
 * modelo de que a conversa acabou) enquanto o payload era montado e validado por
 * outro caminho no client. Quando os dois discordavam, a pessoa via "Faltou
 * alguma informacao essencial pra gerar" sem saber o que faltava e sem saida.
 *
 * O teste que importa aqui e o do INVARIANTE (ultimo bloco): canGenerate false
 * SEMPRE vem com missing nao-vazio. E ele que garante que a UI tenha o que
 * mostrar e o que pedir em todo estado alcancavel.
 */

const COMPLETO: IntakeProposalLike = {
  goal: "primeira-vaga",
  hoursPerWeek: "5-10",
  deadline: "6m",
};

describe("buildGenerationIntake: intake completo", () => {
  it("gera o payload com os tres campos de escolha e o format padrao", () => {
    const r = buildGenerationIntake(COMPLETO);
    expect(r.canGenerate).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.intake).toEqual({
      goal: "primeira-vaga",
      hoursPerWeek: "5-10",
      deadline: "6m",
      format: DEFAULT_INTAKE_FORMAT,
    });
  });

  it("preserva um format valido quando ele vem no intake", () => {
    const r = buildGenerationIntake({ ...COMPLETO, format: "projetos" });
    expect(r.intake?.format).toBe("projetos");
  });

  it("cai no format padrao quando o format e invalido, sem bloquear", () => {
    const r = buildGenerationIntake({ ...COMPLETO, format: "telepatia" });
    expect(r.canGenerate).toBe(true);
    expect(r.intake?.format).toBe(DEFAULT_INTAKE_FORMAT);
  });

  it("carrega os campos narrativos opcionais quando existem", () => {
    const r = buildGenerationIntake({
      ...COMPLETO,
      stackFocus: "react",
      startingPoint: "sei html e css",
      motivation: "quero sair do suporte",
      constraints: "estudo de madrugada",
    });
    expect(r.intake).toMatchObject({
      stackFocus: "react",
      startingPoint: "sei html e css",
      motivation: "quero sair do suporte",
      constraints: "estudo de madrugada",
    });
  });
});

describe("buildGenerationIntake: campo obrigatorio faltando", () => {
  // Um caso por campo, derivado da propria lista: acrescentar um campo
  // obrigatorio novo cria o caso de teste sozinho, em vez de exigir que alguem
  // lembre de escrever mais um `it`.
  for (const campo of INTAKE_REQUIRED_CHOICE_FIELDS) {
    it(`bloqueia e nomeia '${campo}' quando ele esta ausente`, () => {
      const parcial = { ...COMPLETO };
      delete parcial[campo];
      const r = buildGenerationIntake(parcial);
      expect(r.canGenerate).toBe(false);
      expect(r.missing).toEqual([campo]);
      expect(r.intake).toBeNull();
    });

    it(`bloqueia e nomeia '${campo}' quando ele vem null (proposta do chat)`, () => {
      const r = buildGenerationIntake({ ...COMPLETO, [campo]: null });
      expect(r.canGenerate).toBe(false);
      expect(r.missing).toEqual([campo]);
    });

    it(`bloqueia e nomeia '${campo}' quando o valor esta fora do enum`, () => {
      const r = buildGenerationIntake({ ...COMPLETO, [campo]: "chutei" });
      expect(r.canGenerate).toBe(false);
      expect(r.missing).toEqual([campo]);
    });
  }

  it("nomeia TODOS os campos que faltam, nao so o primeiro", () => {
    const r = buildGenerationIntake({});
    expect(r.canGenerate).toBe(false);
    expect([...r.missing].sort()).toEqual(
      [...INTAKE_REQUIRED_CHOICE_FIELDS].sort(),
    );
  });

  it("proposta nula ou indefinida nao explode", () => {
    expect(buildGenerationIntake(null).canGenerate).toBe(false);
    expect(buildGenerationIntake(undefined).canGenerate).toBe(false);
  });
});

describe("buildGenerationIntake: campo opcional invalido DESCARTA, nunca bloqueia", () => {
  // Regra de produto: um stackFocus fora do regex (o modelo devolveu "React e
  // AWS" em vez de "react") nao pode custar o roadmap inteiro da pessoa.
  it("descarta stackFocus fora do regex e ainda gera", () => {
    const r = buildGenerationIntake({
      ...COMPLETO,
      stackFocus: "React e AWS!",
    });
    expect(r.canGenerate).toBe(true);
    expect(r.intake?.stackFocus).toBeUndefined();
  });

  it("descarta texto narrativo acima do teto e ainda gera", () => {
    const r = buildGenerationIntake({
      ...COMPLETO,
      motivation: "x".repeat(501),
    });
    expect(r.canGenerate).toBe(true);
    expect(r.intake?.motivation).toBeUndefined();
  });

  it("ignora string vazia em campo opcional", () => {
    const r = buildGenerationIntake({ ...COMPLETO, constraints: "" });
    expect(r.canGenerate).toBe(true);
    expect(r.intake?.constraints).toBeUndefined();
  });
});

describe("INVARIANTE: canGenerate false implica missing nao-vazio", () => {
  // Se este teste cair, existe um estado em que a UI diz "nao da pra gerar" e
  // nao tem o que pedir. E exatamente o beco sem saida que a fase 2 fechou.
  const valoresPorCampo: Record<string, unknown[]> = {
    goal: [undefined, null, "", "invalido", "primeira-vaga", 42],
    hoursPerWeek: [undefined, null, "", "invalido", "5-10", {}],
    deadline: [undefined, null, "", "invalido", "6m", true],
  };

  it("vale para todas as combinacoes dos tres campos", () => {
    let checadas = 0;
    for (const g of valoresPorCampo.goal) {
      for (const h of valoresPorCampo.hoursPerWeek) {
        for (const d of valoresPorCampo.deadline) {
          const r = buildGenerationIntake({
            goal: g,
            hoursPerWeek: h,
            deadline: d,
          } as IntakeProposalLike);
          checadas += 1;
          if (r.canGenerate) {
            expect(r.missing).toEqual([]);
            expect(r.intake).not.toBeNull();
          } else {
            expect(r.missing.length).toBeGreaterThan(0);
            expect(r.intake).toBeNull();
          }
        }
      }
    }
    // Afirma o TOTAL varrido, nao so que "passou": se alguem mexer na matriz e
    // ela encolher, o numero denuncia em vez de o teste passar sobre menos.
    expect(checadas).toBe(6 * 6 * 6);
  });
});
