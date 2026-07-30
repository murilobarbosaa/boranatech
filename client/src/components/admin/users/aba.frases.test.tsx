import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

/**
 * INVENTARIO DE FRASES da aba Usuarios inteira.
 *
 * Este teste existe porque o outro modelo nao serve. `UserDetailModal.campos`
 * pergunta "os rotulos que eu conheco continuam la?", e uma pergunta assim so
 * sabe responder sobre o que alguem lembrou de listar: copy que SOME de um
 * ramo nao listado passa, copy que APARECE sem ninguem decidir passa tambem. E
 * a classe que o CLAUDE.md documenta, a do instrumento que falha PASSANDO,
 * porque o escopo dele e derivado de uma lista escrita a mao.
 *
 * A contramedida registrada no projeto e afirmar o TOTAL, com aborto em item
 * nao classificado (o desenho de scripts/mutateLinkedinThresholds.mjs). Aqui:
 * toda frase visivel na aba precisa estar em UMA das duas listas abaixo, e uma
 * frase nova derruba o teste ate alguem decidir de que lado ela fica.
 *
 * A verificacao roda nos DOIS sentidos:
 *   1. o que esta na tela esta declarado?  (frase nova nao entra em silencio)
 *   2. o que esta declarado esta na tela?  (a lista nao apodrece com copy morta)
 *
 * As datas do fixture sao nulas de proposito. fmtDate depende do fuso da
 * maquina, e um teste de CONJUNTO nao pode ter membro que muda com o ambiente.
 * O rotulo continua sendo exercido; so o valor vira o marcador de vazio.
 */

const fetchMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminApi", () => ({
  adminFetch: (...args: unknown[]) => fetchMock(...args),
}));

import { UsersDashboard } from "./UsersDashboard";

// Todo valor de DADO e um sentinela reconhecivel. O que sobrar na tela sem ser
// sentinela e sem estar na lista de copy e, por definicao, frase nova.
const SENTINELAS = new Set([
  "SENTINELA_NOME",
  "SENTINELA_NOME_COMPLETO",
  "sentinela@exemplo.com",
  "SENTINELA_GENERO",
  "SENTINELA_BIO",
  "SENTINELA_AREA",
  "SENTINELA_NIVEL",
  "SENTINELA_OBJETIVO",
  "SENTINELA_PLANO",
  "SENTINELA_CPF",
  "SENTINELA_ATOR",
  "SENTINELA_COBRANCA",
  "SENTINELA_DETALHE_RESULTADO",
  "R$ 222,00",
  // Numero e inicial derivados do fixture, nao copy: pagina, passo do
  // onboarding e a letra do avatar saem de SENTINELA_NOME.
  "1",
  "3",
  "S",
  // Status CRU do servidor. Aparece assim porque o resolver de status cai no
  // fallback neutro para um valor que ele nao traduz, que e o comportamento
  // desejado (convencao de lookup por valor do servidor). E dado, nao copy.
  "active",
]);

const LISTA = {
  data: {
    items: [
      {
        user_id: "u1",
        name: "SENTINELA_NOME",
        email: "sentinela@exemplo.com",
        created_at: null,
        is_pro: false,
        pro_source: null,
        plan_code: null,
        subscription_status: null,
      },
    ],
    total: 1,
    page: 1,
    pageSize: 50,
  },
};

const DETALHE = {
  data: {
    user_id: "u1",
    name: "SENTINELA_NOME",
    full_name: "SENTINELA_NOME_COMPLETO",
    email: "sentinela@exemplo.com",
    gender: "SENTINELA_GENERO",
    bio: "SENTINELA_BIO",
    area_interesse: "SENTINELA_AREA",
    nivel_atual: "SENTINELA_NIVEL",
    objetivo: "SENTINELA_OBJETIVO",
    onboarding_completed: true,
    onboarding_step: 3,
    marketing_opt_in: true,
    marketing_opt_in_at: null,
    welcome_email_sent: true,
    cpf_masked: "SENTINELA_CPF",
    has_cpf: true,
    avatar: { url: null, mode: "icon", moderation_status: "clean" },
    subscription: {
      plan_code: "SENTINELA_PLANO",
      status: "active",
      payment_method: "card",
      renewal_type: "auto",
      created_at: null,
      current_period_end: null,
      cancel_at_period_end: false,
    },
    cancellation_intent: null,
    influencer: null,
    paid_total_cents: 22200,
    activity_status: "active",
    created_at: null,
    updated_at: null,
  },
};

const AUDIT = {
  data: {
    entries: [
      {
        id: "a1",
        action: "refund",
        resource_type: "charge",
        resource_slug: "SENTINELA_COBRANCA",
        actor_user_id: "admin-1",
        actor_name: "SENTINELA_ATOR",
        created_at: null,
        before: {},
        after: {},
        campos_alterados: [],
        outcome: "confirmed",
        outcome_detail: "SENTINELA_DETALHE_RESULTADO",
      },
    ],
    truncated: false,
    limit: 100,
    cross_reference_ok: true,
  },
};

/**
 * Copy da aba. Cada frase aqui e uma decisao de produto: a lista existe para
 * que acrescentar ou remover uma seja um ato deliberado no commit, e nao um
 * efeito colateral que ninguem viu.
 */
const COPY_ESTATICA = new Set<string>([
  "Usuário",
  "Acesso",
  "Assinatura",
  "Todos",
  "Assinantes",
  "Influencers",
  "Grátis",
  "Anterior",
  "Próxima",
  "Página",
  "de",
  "resultado",
  "Identificação",
  "Documento",
  "Perfil e carreira",
  "Onboarding",
  "Marketing",
  "Sistema",
  "Atividade",
  "Compras",
  "Histórico administrativo",
  "Nome",
  "Nome completo",
  "E-mail",
  "Gênero",
  "Plano",
  "Status",
  "Método de pagamento",
  "Renovação",
  "Assinou em",
  "Renova em",
  "Valor pago (total)",
  "Área de interesse",
  "Nível atual",
  "Objetivo",
  "Bio",
  "Passo do onboarding",
  "Opt-in de marketing",
  "Data do opt-in",
  "E-mail de boas-vindas",
  "Cadastro",
  "Atualizado em",
  "CPF",
  "Cartão",
  "Automática",
  "Concluído",
  "Sim",
  "Ativo",
  "Modo do avatar:",
  "Ícone",
  "Sem foto",
  "Sem foto enviada.",
  "Não informado",
  "Sem assinatura",
  "—",
  "Nenhuma compra registrada.",
  "Sem atividade registrada para este usuário.",
  "Fechar",
  "Editar",
  "Revelar CPF",
  "Revelar fica registrado: quem revelou, de quem e quando.",
  "Tornar influencer",
  "Trocar e-mail",
  "Cancelar Pro",
  "Mais informações",
  "Reembolso",
  "Confirmado",
  "por",
]);

function frasesVisiveis(): string[] {
  const raiz = document.body;
  const encontradas = new Set<string>();
  const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  let no: Node | null = walker.nextNode();
  while (no) {
    const texto = (no.textContent ?? "").replace(/\s+/g, " ").trim();
    if (texto) encontradas.add(texto);
    no = walker.nextNode();
  }
  return Array.from(encontradas);
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation((path: string) => {
    if (path.includes("/audit")) return Promise.resolve(AUDIT);
    if (path.includes("/activity"))
      return Promise.resolve({ data: { state: "ok", hasData: false } });
    if (path.includes("/transactions"))
      return Promise.resolve({
        data: { items: [], truncated: false, limit: 200 },
      });
    if (path.includes("/users/u1")) return Promise.resolve(DETALHE);
    return Promise.resolve(LISTA);
  });
});

afterEach(cleanup);

async function abrirAbaInteira() {
  render(<UsersDashboard />);
  const linha = await screen.findByText("SENTINELA_NOME");
  fireEvent.click(linha);
  await screen.findByText("SENTINELA_NOME_COMPLETO");
  fireEvent.click(screen.getByRole("button", { name: /Mais informações/i }));
  await screen.findByText("Histórico administrativo");
}

describe("inventário de frases da aba Usuários", () => {
  it("toda frase visível está declarada como copy ou como sentinela de dado", async () => {
    await abrirAbaInteira();

    const naoClassificadas = frasesVisiveis().filter(
      (f) => !COPY_ESTATICA.has(f) && !SENTINELAS.has(f),
    );

    expect(naoClassificadas.sort()).toEqual([]);
  });

  it("toda copy declarada continua na tela", async () => {
    await abrirAbaInteira();

    const visiveis = new Set(frasesVisiveis());
    const declaradasAusentes = Array.from(COPY_ESTATICA).filter(
      (f) => !visiveis.has(f),
    );

    expect(declaradasAusentes.sort()).toEqual([]);
  });
});
