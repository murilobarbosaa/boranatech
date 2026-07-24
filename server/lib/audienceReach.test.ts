import { describe, expect, it } from "vitest";

import { segmentReach, type ReachContext } from "./audienceReach";

// segmentReach e puro: mesmo alcance do audience-preview e do snapshot da
// publicacao. Contexto fixo com um influencer (em active, NAO em payingActive)
// pra provar a distincao active_pro vs paying_pro.
const CTX: ReachContext = {
  totalUsers: 100,
  sets: {
    active: new Set(["a", "b", "inf"]),
    payingActive: new Set(["a", "b"]),
    pastDue: new Set(["pd"]),
    everPaid: new Set(["a", "b", "expro"]),
  },
  optedInUserIds: [],
};

describe("segmentReach (product)", () => {
  it("all = total de usuarios", () => {
    expect(segmentReach("all", "product", CTX)).toBe(100);
  });

  it("active_pro inclui influencer (tamanho de active)", () => {
    expect(segmentReach("active_pro", "product", CTX)).toBe(3);
  });

  it("paying_pro exclui influencer (tamanho de payingActive)", () => {
    expect(segmentReach("paying_pro", "product", CTX)).toBe(2);
  });

  it("ex_pro = pagou, nao active, nao past_due", () => {
    // everPaid={a,b,expro}; a,b estao em active -> so expro conta.
    expect(segmentReach("ex_pro", "product", CTX)).toBe(1);
  });

  it("never_pro = total menos (everPaid uniao active)", () => {
    // {a,b,expro,inf} = 4 -> 100 - 4 = 96.
    expect(segmentReach("never_pro", "product", CTX)).toBe(96);
  });
});

describe("segmentReach (promotional)", () => {
  it("filtra os opt-in por segmento (active_pro)", () => {
    const ctx = { ...CTX, optedInUserIds: ["a", "x"] };
    // a em active; x fora de tudo.
    expect(segmentReach("active_pro", "promotional", ctx)).toBe(1);
  });

  it("paying_pro promotional exclui o influencer mesmo com opt-in", () => {
    const ctx = { ...CTX, optedInUserIds: ["a", "inf"] };
    // a em payingActive; inf so em active.
    expect(segmentReach("paying_pro", "promotional", ctx)).toBe(1);
  });
});
