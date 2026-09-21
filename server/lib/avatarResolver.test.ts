import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * resolveAvatars (lote 11d): quem e Pro para o avatar de TERCEIROS.
 *
 * A copia da regra de is_user_pro dentro do resolvedor tinha ficado na versao
 * antiga (so assinatura), e todo creator sem assinatura paga aparecia com a
 * borda Pro rebaixada e sem foto no calendario, no ranking e no admin, enquanto
 * o cabecalho mostrava as duas. O que se afirma: concessao de creator ATIVA
 * torna o dono Pro para o resolvedor (borda Pro mantida, foto limpa mostrada),
 * concessao revogada nao, e sem perfil vem o padrao.
 *
 * O double nao simula `.neq`/`.or` nem o `plans!inner` da consulta de
 * assinaturas: essa consulta cai no fail-closed (nenhum Pro por assinatura), e
 * e a de creators que decide aqui, que e exatamente o caminho novo.
 */

const estado = vi.hoisted(() => ({ client: null as unknown }));

vi.mock("./supabaseAdmin", () => ({
  get supabaseAdmin() {
    return estado.client;
  },
}));

import {
  criarSupabaseDouble,
  respostaQueFiltra,
} from "../routes/adminUsersHarness.test";
import { resolveAvatars } from "./avatarResolver";

const CREATOR = "11111111-1111-1111-1111-111111111111";
const REVOGADO = "22222222-2222-2222-2222-222222222222";
const COMUM = "33333333-3333-3333-3333-333333333333";
const SEM_PERFIL = "44444444-4444-4444-4444-444444444444";

const PERFIS = [
  {
    user_id: CREATOR,
    name: "Lorena",
    avatar_url: "https://a/lorena.png",
    avatar_mode: "photo",
    avatar_icon: "star",
    avatar_bg: "cream",
    avatar_border: "pro-holo",
    avatar_moderation_status: "clean",
  },
  {
    user_id: REVOGADO,
    name: "Rev",
    avatar_url: "https://a/rev.png",
    avatar_mode: "photo",
    avatar_icon: null,
    avatar_bg: null,
    avatar_border: "pro-rgb",
    avatar_moderation_status: "clean",
  },
  {
    user_id: COMUM,
    name: "Comum",
    avatar_url: null,
    avatar_mode: "icon",
    avatar_icon: "code",
    avatar_bg: "green",
    avatar_border: "gold",
    avatar_moderation_status: "clean",
  },
];

const CREATORS = [
  { user_id: CREATOR, kind: "afiliado", revoked_at: null },
  { user_id: REVOGADO, kind: "afiliado", revoked_at: "2026-09-10T12:00:00Z" },
];

beforeEach(() => {
  const double = criarSupabaseDouble({
    profiles: respostaQueFiltra(PERFIS),
    creators: respostaQueFiltra(CREATORS),
    // A consulta de assinaturas encadeia .neq/.or, que o double nao tem: cai
    // no catch do resolvedor (nenhum Pro por assinatura), de proposito.
    subscriptions: { rows: [] },
  });
  estado.client = double.client;
});

describe("resolveAvatars: creator ativo e Pro para terceiros", () => {
  it("mantem a borda Pro e mostra a foto limpa de quem tem concessao ativa", async () => {
    const [lorena] = await resolveAvatars([CREATOR]);
    expect(lorena).toEqual({
      userId: CREATOR,
      name: "Lorena",
      mode: "photo",
      avatarUrl: "https://a/lorena.png",
      icon: "star",
      bg: "cream",
      border: "pro-holo",
    });
  });

  it("concessao revogada nao e Pro: borda Pro cai no padrao e a foto vira icone", async () => {
    const [rev] = await resolveAvatars([REVOGADO]);
    expect(rev).toMatchObject({
      mode: "icon",
      avatarUrl: null,
      border: "classic",
    });
  });

  it("borda que nao e Pro passa sem depender de Pro; sem perfil vem o padrao", async () => {
    const [comum, semPerfil] = await resolveAvatars([COMUM, SEM_PERFIL]);
    expect(comum).toMatchObject({ border: "gold", bg: "green", icon: "code" });
    expect(semPerfil).toEqual({
      userId: SEM_PERFIL,
      name: "",
      mode: "icon",
      avatarUrl: null,
      icon: null,
      bg: null,
      border: null,
    });
  });
});
