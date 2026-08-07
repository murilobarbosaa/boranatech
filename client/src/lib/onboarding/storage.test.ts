import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Profile } from "@/services/contracts";

const { updateMyProfile } = vi.hoisted(() => ({ updateMyProfile: vi.fn() }));
vi.mock("@/services/profileService", () => ({ updateMyProfile }));

import {
  hasSeenOnboarding,
  markOnboardingSeen,
  migrateLocalRecordsToProfile,
  readAllLocalRecords,
  readProfileRecords,
  writeLocalRecord,
} from "./storage";

const RECORD = {
  seen: true as const,
  how: "concluido" as const,
  at: "2026-08-07T12:00:00.000Z",
};

function profileWith(preferences: Record<string, unknown>): Profile {
  return { id: "u1", preferences } as unknown as Profile;
}

beforeEach(() => {
  window.localStorage.clear();
  updateMyProfile.mockReset();
  updateMyProfile.mockResolvedValue({});
});

describe("leitura do perfil", () => {
  it("le os registros validos", () => {
    const profile = profileWith({ onboardings: { "/": RECORD } });
    expect(readProfileRecords(profile)).toEqual({ "/": RECORD });
  });

  it("registro corrompido conta como NAO visto, sem lancar", () => {
    const profile = profileWith({
      onboardings: {
        "/": { seen: true, how: "inventado", at: "x" },
        "/cursos": { seen: false, how: "pulado", at: "x" },
        "/vagas": "isto nem e objeto",
        "/areas": RECORD,
      },
    });
    // Parse POR ENTRADA: a entrada boa sobrevive as tortas.
    expect(readProfileRecords(profile)).toEqual({ "/areas": RECORD });
    expect(hasSeenOnboarding("/", profile)).toBe(false);
    expect(hasSeenOnboarding("/areas", profile)).toBe(true);
  });

  it("preferences ausente ou de outro tipo nao quebra", () => {
    expect(readProfileRecords(null)).toEqual({});
    expect(readProfileRecords(profileWith({}))).toEqual({});
    expect(readProfileRecords(profileWith({ onboardings: [] }))).toEqual({});
    expect(readProfileRecords(profileWith({ onboardings: null }))).toEqual({});
  });
});

describe("localStorage (anonimo)", () => {
  it("grava e le sob a chave bnt_onb:<routeKey>", () => {
    writeLocalRecord("/", RECORD);
    expect(window.localStorage.getItem("bnt_onb:/")).toBe(
      JSON.stringify(RECORD),
    );
    expect(readAllLocalRecords()).toEqual({ "/": RECORD });
    expect(hasSeenOnboarding("/", null)).toBe(true);
  });

  it("JSON invalido e registro fora do schema sao ignorados", () => {
    window.localStorage.setItem("bnt_onb:/quebrado", "{nao e json");
    window.localStorage.setItem(
      "bnt_onb:/torto",
      JSON.stringify({ seen: true, how: "abandonado", at: "x" }),
    );
    window.localStorage.setItem("outra_chave", "irrelevante");
    writeLocalRecord("/ok", RECORD);

    expect(readAllLocalRecords()).toEqual({ "/ok": RECORD });
    expect(hasSeenOnboarding("/quebrado", null)).toBe(false);
  });
});

describe("markOnboardingSeen", () => {
  it("anonimo grava no localStorage e nao chama a API", async () => {
    const result = await markOnboardingSeen({
      routeKey: "/",
      record: RECORD,
      profile: null,
      signedIn: false,
    });
    expect(result).toBe("local");
    expect(updateMyProfile).not.toHaveBeenCalled();
    expect(readAllLocalRecords()).toEqual({ "/": RECORD });
  });

  it("logado faz read-modify-write e NAO destroi as outras chaves de preferences", async () => {
    const profile = profileWith({
      tema: "escuro",
      newsletter: { semanal: true },
      onboardings: { "/cursos": RECORD },
    });

    await markOnboardingSeen({
      routeKey: "/",
      record: RECORD,
      profile,
      signedIn: true,
    });

    // O PATCH /api/me sobrescreve `preferences` inteiro, entao o payload tem
    // de trazer o blob completo, nao so o sub-objeto.
    expect(updateMyProfile).toHaveBeenCalledWith({
      preferences: {
        tema: "escuro",
        newsletter: { semanal: true },
        onboardings: { "/cursos": RECORD, "/": RECORD },
      },
    });
  });

  it("PATCH falhando cai para o localStorage", async () => {
    updateMyProfile.mockRejectedValue(new Error("500"));

    const result = await markOnboardingSeen({
      routeKey: "/",
      record: RECORD,
      profile: profileWith({}),
      signedIn: true,
    });

    expect(result).toBe("local");
    expect(hasSeenOnboarding("/", profileWith({}))).toBe(true);
  });
});

describe("migracao anonimo -> logado", () => {
  it("migra o que falta, preserva o resto de preferences e limpa as chaves", async () => {
    writeLocalRecord("/", RECORD);
    writeLocalRecord("/cursos", { ...RECORD, how: "pulado" });
    const profile = profileWith({ tema: "claro", onboardings: {} });

    const result = await migrateLocalRecordsToProfile(profile);

    expect(result.persisted).toBe(true);
    expect(result.migrated.sort()).toEqual(["/", "/cursos"]);
    expect(updateMyProfile).toHaveBeenCalledWith({
      preferences: {
        tema: "claro",
        onboardings: {
          "/": RECORD,
          "/cursos": { ...RECORD, how: "pulado" },
        },
      },
    });
    expect(readAllLocalRecords()).toEqual({});
  });

  it("o registro do PERFIL vence o local para a mesma rota", async () => {
    writeLocalRecord("/", { ...RECORD, how: "pulado" });
    const doPerfil = { ...RECORD, how: "concluido" as const };
    const profile = profileWith({ onboardings: { "/": doPerfil } });

    const result = await migrateLocalRecordsToProfile(profile);

    // Nada a migrar: a rota ja esta no perfil. Mas as chaves locais somem para
    // a migracao nao rodar de novo a cada carga.
    expect(result.migrated).toEqual([]);
    expect(updateMyProfile).not.toHaveBeenCalled();
    expect(readAllLocalRecords()).toEqual({});
  });

  it("PATCH falhando MANTEM o localStorage como fallback", async () => {
    updateMyProfile.mockRejectedValue(new Error("rede"));
    writeLocalRecord("/", RECORD);

    const result = await migrateLocalRecordsToProfile(profileWith({}));

    expect(result).toEqual({ migrated: [], persisted: false });
    expect(readAllLocalRecords()).toEqual({ "/": RECORD });
  });

  it("sem chaves locais nao chama a API", async () => {
    const result = await migrateLocalRecordsToProfile(profileWith({}));
    expect(result).toEqual({ migrated: [], persisted: false });
    expect(updateMyProfile).not.toHaveBeenCalled();
  });
});
