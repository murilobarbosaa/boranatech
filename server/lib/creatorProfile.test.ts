import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * DATA DOS SEGUIDORES DECLARADOS: `followers_updated_at` so muda quando os
 * numeros mudam. Trocar o consentimento ou o @ com os mesmos seguidores nao
 * pode "rejuvenescer" um numero dito semanas antes.
 *
 * O dublê e o do harness do admin (valida tabela e colunas contra a
 * migration), com uma resposta que GUARDA a linha do upsert e a devolve no
 * select seguinte: e o que torna possivel uma sequencia de gravacoes em que
 * cada uma le a anterior.
 */

const estado = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("./supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.client;
  },
}));

import {
  criarSupabaseDouble,
  type Chamada,
  type LinhaQualquer,
} from "../routes/adminUsersHarness.test";
import { salvarPerfilDoCreator, type EntradaDoPerfil } from "./creatorProfile";

const UID = "33333333-3333-3333-3333-333333333333";

let gravado: LinhaQualquer | null;
let double: ReturnType<typeof criarSupabaseDouble>;

function montar(inicial: LinhaQualquer | null) {
  gravado = inicial;
  double = criarSupabaseDouble({
    creator_profiles: (c: Chamada) => {
      if (c.op === "upsert") {
        gravado = { ...c.payload };
        return { rows: [] };
      }
      return { rows: gravado ? [gravado] : [] };
    },
    creator_pix_keys: { rows: [] },
  });
  estado.client = double.client;
}

function entrada(parcial: Partial<EntradaDoPerfil>): EntradaDoPerfil {
  return {
    instagram_handle: "ana.cria",
    tiktok_handle: null,
    instagram_followers: null,
    tiktok_followers: null,
    visible_to_creators: false,
    ...parcial,
  };
}

function dataGravada(): unknown {
  return gravado?.followers_updated_at;
}

beforeEach(() => {
  montar(null);
});

describe("salvarPerfilDoCreator: followers_updated_at", () => {
  it("1200 grava a data; 1200 de novo com consentimento trocado mantem; 1500 troca; os dois nulos zeram", async () => {
    const primeira = await salvarPerfilDoCreator(
      UID,
      entrada({ instagram_followers: 1200 }),
      new Date("2026-09-10T12:00:00.000Z"),
    );
    expect(dataGravada()).toBe("2026-09-10T12:00:00.000Z");
    expect(primeira.followers_updated_at).toBe("2026-09-10T12:00:00.000Z");

    const segunda = await salvarPerfilDoCreator(
      UID,
      entrada({ instagram_followers: 1200, visible_to_creators: true }),
      new Date("2026-09-11T12:00:00.000Z"),
    );
    expect(dataGravada()).toBe("2026-09-10T12:00:00.000Z");
    expect(gravado?.visible_to_creators).toBe(true);
    expect(gravado?.updated_at).toBe("2026-09-11T12:00:00.000Z");
    expect(segunda.followers_updated_at).toBe("2026-09-10T12:00:00.000Z");

    await salvarPerfilDoCreator(
      UID,
      entrada({ instagram_followers: 1500, visible_to_creators: true }),
      new Date("2026-09-12T12:00:00.000Z"),
    );
    expect(dataGravada()).toBe("2026-09-12T12:00:00.000Z");

    const quarta = await salvarPerfilDoCreator(
      UID,
      entrada({ visible_to_creators: true }),
      new Date("2026-09-13T12:00:00.000Z"),
    );
    expect(dataGravada()).toBe(null);
    expect(quarta.followers_updated_at).toBe(null);

    // Cada gravacao le a linha atual ANTES do upsert.
    const ops = double.de("creator_profiles").map((c) => c.op);
    expect(ops.slice(0, 2)).toEqual(["select", "upsert"]);
  });

  it("um dos dois removido, com o outro igual, e mudanca: grava o instante", async () => {
    montar({
      user_id: UID,
      instagram_handle: "ana.cria",
      tiktok_handle: "ana.cria",
      instagram_followers: 1200,
      tiktok_followers: 800,
      followers_updated_at: "2026-09-10T12:00:00.000Z",
      visible_to_creators: false,
    });
    await salvarPerfilDoCreator(
      UID,
      entrada({ instagram_followers: 1200, tiktok_followers: null }),
      new Date("2026-09-11T12:00:00.000Z"),
    );
    expect(dataGravada()).toBe("2026-09-11T12:00:00.000Z");
  });

  it("linha anterior com os mesmos numeros mas sem data: grava o instante", async () => {
    montar({
      user_id: UID,
      instagram_handle: "ana.cria",
      tiktok_handle: null,
      instagram_followers: 1200,
      tiktok_followers: null,
      followers_updated_at: null,
      visible_to_creators: false,
    });
    await salvarPerfilDoCreator(
      UID,
      entrada({ instagram_followers: 1200 }),
      new Date("2026-09-11T12:00:00.000Z"),
    );
    expect(dataGravada()).toBe("2026-09-11T12:00:00.000Z");
  });

  it("falha na leitura da linha atual: lanca e nao grava nada", async () => {
    double = criarSupabaseDouble({
      creator_profiles: { error: { message: "timeout" } },
      creator_pix_keys: { rows: [] },
    });
    estado.client = double.client;
    await expect(
      salvarPerfilDoCreator(
        UID,
        entrada({ instagram_followers: 1200 }),
        new Date("2026-09-11T12:00:00.000Z"),
      ),
    ).rejects.toThrow();
    expect(
      double.de("creator_profiles").filter((c) => c.op === "upsert"),
    ).toHaveLength(0);
  });
});
