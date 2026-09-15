import { describe, expect, it, vi } from "vitest";

import {
  USER_SEGMENTS,
  fetchProStatusFlagsForUser,
  fetchProStatusSets,
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
    payingActive: new Set(flags.payingActive ? [USER] : []),
    pastDue: new Set(flags.pastDue ? [USER] : []),
    everPaid: new Set(flags.everPaid ? [USER] : []),
  };
}

function matchedSegments(flags: ProStatusFlags): UserSegment[] {
  return USER_SEGMENTS.filter((segment) => flagsMatchSegment(segment, flags));
}

// Perfis da tabela-verdade (decisao de 2026-07-16, alinhada ao is_user_pro
// com influencers; paying_pro adicionado depois). Cada caso lista TODOS os
// segmentos que o perfil casa. Distincao-chave: paying_pro exige payingActive
// (pagamento vigente), enquanto active_pro aceita tambem influencer de cortesia.
const CASES: Array<{
  name: string;
  flags: ProStatusFlags;
  expected: UserSegment[];
}> = [
  {
    name: "nunca pagou, nao e influencer",
    flags: {
      active: false,
      payingActive: false,
      pastDue: false,
      everPaid: false,
    },
    expected: ["all", "never_pro"],
  },
  {
    name: "assinante ativo pagante: active_pro E paying_pro",
    flags: { active: true, payingActive: true, pastDue: false, everPaid: true },
    expected: ["all", "active_pro", "paying_pro"],
  },
  {
    name: "ex-assinante (pagou, hoje sem plano)",
    flags: {
      active: false,
      payingActive: false,
      pastDue: false,
      everPaid: true,
    },
    expected: ["all", "ex_pro"],
  },
  {
    name: "past_due (recuperacao de pagamento) entra apenas em all",
    flags: {
      active: false,
      payingActive: false,
      pastDue: true,
      everPaid: true,
    },
    expected: ["all"],
  },
  {
    name: "influencer ativo que nunca assinou: active_pro SIM, paying_pro NAO",
    flags: {
      active: true,
      payingActive: false,
      pastDue: false,
      everPaid: false,
    },
    expected: ["all", "active_pro"],
  },
  {
    name: "ex-assinante que virou influencer: active_pro SIM, paying_pro NAO, sai de ex_pro",
    flags: {
      active: true,
      payingActive: false,
      pastDue: false,
      everPaid: true,
    },
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
      payingActive: false,
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

/**
 * Dublê mínimo do Supabase para as duas leituras de conjunto. Registra os
 * filtros aplicados a `creators`: o que se afirma é que a consulta NÃO filtra
 * kind, então afiliado entra em `active` exatamente como influencer.
 */
const estadoSeg = vi.hoisted(() => ({
  creators: [] as Array<{ user_id: string; kind: string }>,
  filtrosCreators: [] as string[],
}));

vi.mock("./supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (tabela: string) => {
      const q: Record<string, unknown> = {};
      const registrar = (coluna: string) => {
        if (tabela === "creators") estadoSeg.filtrosCreators.push(coluna);
        return q;
      };
      q.select = () => q;
      q.eq = registrar;
      q.is = registrar;
      q.neq = () => q;
      q.range = (from: number, to: number) => {
        const linhas = tabela === "creators" ? estadoSeg.creators : [];
        return Promise.resolve({
          data: linhas.slice(from, to + 1),
          error: null,
        });
      };
      q.maybeSingle = async () => ({
        data:
          tabela === "creators" && estadoSeg.creators.length > 0
            ? { id: "c1" }
            : null,
        error: null,
      });
      q.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve({
          data: tabela === "plans" ? [{ id: "p1", code: "pro_monthly" }] : [],
          error: null,
        }).then(resolve);
      return q;
    },
  },
}));

describe("afiliado entra em active e nunca em payingActive", () => {
  it("fetchProStatusSets: concessão de afiliado sem assinatura", async () => {
    estadoSeg.creators = [{ user_id: "afil", kind: "afiliado" }];
    estadoSeg.filtrosCreators = [];

    const sets = await fetchProStatusSets();

    expect(sets.active.has("afil")).toBe(true);
    expect(sets.payingActive.has("afil")).toBe(false);
    expect(userMatchesSegment("afil", "active_pro", sets)).toBe(true);
    expect(userMatchesSegment("afil", "paying_pro", sets)).toBe(false);
    expect(userMatchesSegment("afil", "never_pro", sets)).toBe(false);
    // Nenhum filtro por kind: qualquer concessão ativa conta. O CONJUNTO de
    // colunas filtradas, e não a lista: o paginateRange monta uma consulta por
    // página (a com dados e a vazia que encerra), e cada uma repete o filtro.
    expect(Array.from(new Set(estadoSeg.filtrosCreators))).toEqual([
      "revoked_at",
    ]);
  });

  it("fetchProStatusFlagsForUser: afiliado ativo é active, não payingActive", async () => {
    estadoSeg.creators = [{ user_id: "afil", kind: "afiliado" }];
    estadoSeg.filtrosCreators = [];

    const flags = await fetchProStatusFlagsForUser("afil");

    expect(flags).toEqual({
      active: true,
      payingActive: false,
      pastDue: false,
      everPaid: false,
    });
    expect(estadoSeg.filtrosCreators).not.toContain("kind");
  });
});
