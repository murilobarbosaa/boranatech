import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

/**
 * TRAVA DE REGRESSAO do redesign do modal (Fatia 3).
 *
 * Nao e um teste de comportamento novo: e a fotografia do conjunto de rotulos
 * visiveis ANTES do redesign, escrita para rodar VERDE contra o codigo antigo e
 * continuar verde depois. Reagrupar secoes e o tipo de mudanca em que um campo
 * some no meio do caminho sem ninguem notar, porque nada quebra: a tela so
 * passa a mostrar menos.
 *
 * O conjunto abaixo foi extraido do UserDetailModal em 558ab99: 22 rotulos
 * estaticos de <Field>, 1 dinamico (Expira em / Renova em), o rotulo "CPF" e os
 * 8 titulos de secao.
 */

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));

import { UserDetailModal } from "./UserDetailModal";

const ROTULOS_DE_CAMPO = [
  "Nome",
  "Nome completo",
  "E-mail",
  "Gênero",
  "Plano",
  "Status",
  "Método de pagamento",
  "Renovação",
  "Assinou em",
  "Valor pago (total)",
  "Área de interesse",
  "Nível atual",
  "Objetivo",
  "Bio",
  "Onboarding",
  "Passo do onboarding",
  "Opt-in de marketing",
  "Data do opt-in",
  "E-mail de boas-vindas",
  "Atividade",
  "Cadastro",
  "Atualizado em",
];

const TITULOS_DE_SECAO = [
  "Identificação",
  "Assinatura",
  "Documento",
  "Perfil e carreira",
  "Onboarding",
  "Marketing",
  "Sistema",
  "Atividade",
];

const DETALHE_COMPLETO = {
  data: {
    user_id: "u1",
    name: "Ana Moura",
    full_name: "Ana Ferreira Moura",
    email: "ana@exemplo.com",
    gender: "Feminino",
    bio: "Estudante de dados.",
    area_interesse: "Dados",
    nivel_atual: "Iniciante",
    objetivo: "Primeira vaga",
    onboarding_completed: true,
    onboarding_step: 4,
    marketing_opt_in: true,
    marketing_opt_in_at: "2026-02-01T12:00:00Z",
    welcome_email_sent: true,
    cpf_masked: "***.456.789-**",
    has_cpf: true,
    avatar: { url: null, mode: "icon", moderation_status: "clean" },
    subscription: {
      plan_code: "pro_annual",
      status: "active",
      payment_method: "card",
      renewal_type: "auto",
      created_at: "2026-01-10T12:00:00Z",
      current_period_end: "2027-01-10T12:00:00Z",
      cancel_at_period_end: false,
    },
    cancellation_intent: null,
    influencer: null,
    paid_total_cents: 22200,
    activity_status: "active",
    created_at: "2026-01-01T12:00:00Z",
    updated_at: "2026-07-01T12:00:00Z",
  },
};

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation((path: string) => {
    if (path.endsWith("/activity")) {
      return Promise.resolve({ data: { state: "ok", hasData: false } });
    }
    return Promise.resolve(DETALHE_COMPLETO);
  });
});

afterEach(() => {
  cleanup();
});

async function abrirTudo() {
  render(<UserDetailModal userId="u1" onClose={() => {}} />);
  await screen.findByText("Ana Ferreira Moura");
  // As secoes atras do dropdown so montam depois de expandi-lo.
  fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
  await screen.findByText("Perfil e carreira");
}

describe("nenhum campo visivel desapareceu no redesign", () => {
  it("os 22 rotulos de campo continuam na tela", async () => {
    await abrirTudo();

    const ausentes = ROTULOS_DE_CAMPO.filter(
      (rotulo) => screen.queryAllByText(rotulo).length === 0,
    );
    expect(ausentes).toEqual([]);
  });

  it("os 8 titulos de secao continuam na tela", async () => {
    await abrirTudo();

    const ausentes = TITULOS_DE_SECAO.filter(
      (titulo) => screen.queryAllByText(titulo).length === 0,
    );
    expect(ausentes).toEqual([]);
  });

  it("o rotulo do CPF e o numero mascarado continuam na tela", async () => {
    await abrirTudo();

    expect(screen.getAllByText("CPF").length).toBeGreaterThan(0);
    expect(screen.getByText("***.456.789-**")).toBeTruthy();
  });

  it("o rotulo de fim de periodo alterna entre Renova em e Expira em", async () => {
    await abrirTudo();
    expect(screen.getByText("Renova em")).toBeTruthy();
    cleanup();

    fetchMock.mockImplementation((path: string) => {
      if (path.endsWith("/activity")) {
        return Promise.resolve({ data: { state: "ok", hasData: false } });
      }
      return Promise.resolve({
        data: {
          ...DETALHE_COMPLETO.data,
          subscription: {
            ...DETALHE_COMPLETO.data.subscription,
            cancel_at_period_end: true,
          },
        },
      });
    });

    render(<UserDetailModal userId="u1" onClose={() => {}} />);
    expect(await screen.findByText("Expira em")).toBeTruthy();
  });

  it("os VALORES continuam aparecendo, nao so os rotulos", async () => {
    // Um redesign que mantivesse os rotulos e perdesse os valores passaria nos
    // testes acima. Amostra de um valor por secao.
    await abrirTudo();

    for (const valor of [
      "Ana Ferreira Moura", // Identificação
      "pro_annual", // Assinatura
      "R$ 222,00", // Assinatura (valor pago)
      "***.456.789-**", // Documento
      "Dados", // Perfil e carreira
      "Concluído", // Onboarding
      "Ativo", // Sistema (activity_status)
    ]) {
      expect(screen.queryAllByText(valor).length).toBeGreaterThan(0);
    }

    // Data do opt-in usa fmtDateTime, que anexa a hora ("01/02/2026, 09:00").
    // A hora depende do fuso da maquina, entao casa-se so a data.
    expect(screen.queryAllByText(/01\/02\/2026/).length).toBeGreaterThan(0);
  });
});
