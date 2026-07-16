import { describe, expect, it } from "vitest";

import {
  USER_SEGMENTS,
  flagsMatchSegment,
  userMatchesSegment,
  type ProStatusFlags,
  type ProStatusSets,
  type UserSegment,
} from "./userSegments";

const USER = "11111111-1111-1111-1111-111111111111";

function setsFromFlags(flags: ProStatusFlags): ProStatusSets {
  return {
    active: new Set(flags.active ? [USER] : []),
    pastDue: new Set(flags.pastDue ? [USER] : []),
    everPaid: new Set(flags.everPaid ? [USER] : []),
  };
}

function matchedSegments(flags: ProStatusFlags): UserSegment[] {
  return USER_SEGMENTS.filter((segment) => flagsMatchSegment(segment, flags));
}

// Perfis da tabela-verdade (decisao de 2026-07-16, alinhada ao is_user_pro
// com influencers). Cada caso lista TODOS os segmentos que o perfil casa.
const CASES: Array<{
  name: string;
  flags: ProStatusFlags;
  expected: UserSegment[];
}> = [
  {
    name: "nunca pagou, nao e influencer",
    flags: { active: false, pastDue: false, everPaid: false },
    expected: ["all", "never_pro"],
  },
  {
    name: "assinante ativo",
    flags: { active: true, pastDue: false, everPaid: true },
    expected: ["all", "active_pro"],
  },
  {
    name: "ex-assinante (pagou, hoje sem plano)",
    flags: { active: false, pastDue: false, everPaid: true },
    expected: ["all", "ex_pro"],
  },
  {
    name: "past_due (recuperacao de pagamento) entra apenas em all",
    flags: { active: false, pastDue: true, everPaid: true },
    expected: ["all"],
  },
  {
    name: "influencer ativo que nunca assinou: active_pro, nunca never_pro",
    flags: { active: true, pastDue: false, everPaid: false },
    expected: ["all", "active_pro"],
  },
  {
    name: "ex-assinante que virou influencer: active_pro, sai de ex_pro",
    flags: { active: true, pastDue: false, everPaid: true },
    expected: ["all", "active_pro"],
  },
];

describe("userSegments truth table", () => {
  for (const testCase of CASES) {
    it(`flagsMatchSegment: ${testCase.name}`, () => {
      expect(matchedSegments(testCase.flags)).toEqual(testCase.expected);
    });

    // Paridade obrigatoria: a variante por sets (campanhas de email, base
    // toda) e a por flags (notificacoes, um usuario) decidem igual.
    it(`userMatchesSegment espelha flagsMatchSegment: ${testCase.name}`, () => {
      const sets = setsFromFlags(testCase.flags);
      for (const segment of USER_SEGMENTS) {
        expect(userMatchesSegment(USER, segment, sets)).toBe(
          flagsMatchSegment(segment, testCase.flags),
        );
      }
    });
  }

  it("usuario fora dos sets casa apenas all e never_pro", () => {
    const sets = setsFromFlags({
      active: false,
      pastDue: false,
      everPaid: false,
    });
    expect(
      USER_SEGMENTS.filter((segment) =>
        userMatchesSegment("outro-usuario", segment, sets),
      ),
    ).toEqual(["all", "never_pro"]);
  });
});
