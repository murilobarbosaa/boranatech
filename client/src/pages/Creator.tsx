import { useEffect, useState } from "react";
import { AtSign, KeyRound, Receipt, Sparkles } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { BlocoBoundary } from "@/components/admin/BlocoBoundary";
import { ErrorBlock, LoadingBlock } from "@/components/admin/StateBlocks";
import { CabecalhoDeSecao } from "@/components/creator/CabecalhoDeSecao";
import { CartaoDoRanking } from "@/components/creator/CartaoDoRanking";
import { CreatorAbas } from "@/components/creator/CreatorAbas";
import { CreatorCalendario } from "@/components/creator/CreatorCalendario";
import { CreatorDashboardView } from "@/components/creator/CreatorDashboardView";
import { CreatorPixForm } from "@/components/creator/CreatorPixForm";
import { CreatorPublicacoes } from "@/components/creator/CreatorPublicacoes";
import { CreatorRanking } from "@/components/creator/CreatorRanking";
import { CreatorRedesForm } from "@/components/creator/CreatorRedesForm";
import { MarcadorDeCor } from "@/components/creator/MarcadorDeCor";
import {
  CREATOR_ABA_PADRAO,
  idDaAba,
  idDoPainel,
  normalizarAba,
  type CreatorAba,
} from "@/components/creator/creatorAbas";
import {
  useCreatorPerfil,
  type PerfilDoCreator,
} from "@/components/creator/useCreatorPerfil";
import { AdminApiError, contentFetch } from "@/lib/adminApi";
import {
  CREATOR_DASHBOARD_JANELA_PADRAO,
  type CreatorDashboard,
  type CreatorDashboardJanela,
} from "@shared/creatorDashboard";

// PAINEL DO PROPRIO CREATOR, em QUATRO ABAS: Numeros (o painel de sempre),
// Comunidade (o registro de publicacoes e o calendario, que chega no lote 10),
// Ranking (o do mes, lote 11) e Perfil (as redes e a chave Pix).
//
// O Ranking saiu da Comunidade no lote 09: sao dois assuntos com ritmos
// diferentes, e a aba propria e o lugar onde o lote 11 entra sem reabrir esta
// decisao.
//
// A ABA VIVE NA URL (`?aba=`), lida a cada render e escrita com `replace`,
// igual ao `?grupo=` da vitrine de roadmaps. Assim recarregar a pagina, voltar
// no navegador ou colar o link caem na mesma aba, e a aba padrao (Numeros) nao
// escreve parametro nenhum: /creator continua sendo /creator.
//
// PAINEL INATIVO NAO MONTA. Nao e `hidden`: o painel de Numeros so busca
// `/creator/me` quando a aba dele esta aberta, e a aba Comunidade nao chama
// rede nenhuma. O preco e que voltar para Numeros busca de novo, e isso e
// deliberado: numero velho reaparecendo como se fosse de agora e pior que uma
// espera curta.
//
// O PERFIL, AO CONTRARIO, E BUSCADO EM QUALQUER ABA, pela pagina: a faixa do
// topo mostra o que falta preencher, e ela aparece nas tres abas. Enquanto a
// resposta nao chega, `temPix` e `temRedes` sao null e a faixa nao acusa nada:
// "nao sei" nao e "falta".
//
// O 403 `not_creator` tem tela propria e NAO redireciona: sumir com a pessoa em
// silencio para a home esconderia que ela chegou num lugar que nao e dela, e um
// link compartilhado para /creator sem explicacao nenhuma e pior que uma frase.
// O 403 `creator_check_failed` (o servidor nao conseguiu conferir) NAO e "voce
// nao e creator": cai no erro generico, com "tentar de novo".
//
// ESTRUTURA DO ADMIN: faixa `hero-pattern` no topo com o titulo, e corpo
// `section-alt`. SEM cartao de identidade: o avatar da pessoa ja esta no header
// do site. Por isso a view recebe `identidade="nenhuma"`.

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "nao_creator" }
  | { tipo: "ok"; painel: CreatorDashboard };

function painelDaResposta(json: unknown): CreatorDashboard | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: unknown }).data;
  if (
    typeof data !== "object" ||
    data === null ||
    !("creator" in data) ||
    !("totais" in data) ||
    !("codigos" in data) ||
    !("eventos" in data)
  ) {
    return null;
  }
  return data as CreatorDashboard;
}

export default function Creator() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const perfil = useCreatorPerfil();

  const pedida = new URLSearchParams(search).get("aba");
  const aba: CreatorAba = normalizarAba(pedida) ?? CREATOR_ABA_PADRAO;
  const escolherAba = (nova: CreatorAba) =>
    navigate(
      nova === CREATOR_ABA_PADRAO ? "/creator" : `/creator?aba=${nova}`,
      {
        replace: true,
      },
    );

  const temPix =
    perfil.estado.tipo === "ok" ? perfil.estado.perfil.pix !== null : null;
  const temRedes =
    perfil.estado.tipo === "ok"
      ? perfil.estado.perfil.instagram_handle !== null ||
        perfil.estado.perfil.tiktok_handle !== null
      : null;

  return (
    <Layout>
      {/* TODO(Ana) */}
      <SEO title="Painel de Creator" url="/creator" noindex />
      <section className="hero-pattern border-b-2 border-slate-900 py-8 md:py-10">
        <div className="container">
          <div>
            <p className="social-badge mb-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wide">
              <Sparkles className="h-4 w-4" />
              {/* TODO(Ana) */}
              painel de creator
            </p>
            <h1 className="font-display text-4xl font-black text-slate-950 lg:text-5xl">
              {/* TODO(Ana) */}
              Painel de Creator
            </h1>
            <p className="mt-3 max-w-2xl text-base font-semibold leading-relaxed text-slate-700">
              {/* TODO(Ana) */}
              Seu link, seus números e o que você já gerou para a Bora na Tech.
            </p>
          </div>
        </div>
      </section>

      <section className="section-alt py-8 md:py-10">
        <div className="container space-y-8">
          <CreatorAbas
            aba={aba}
            onAba={escolherAba}
            temRedes={temRedes}
            temPix={temPix}
          />

          {aba === "numeros" ? (
            <div
              role="tabpanel"
              id={idDoPainel("numeros")}
              aria-labelledby={idDaAba("numeros")}
              className="space-y-8"
            >
              {/* O cartao do ranking (lote 11) busca sozinho e some sem
                  resposta; fica ANTES do painel para a posicao do mes ser a
                  primeira coisa da aba, e fora do painel para nao esperar por
                  ele. */}
              <BlocoBoundary
                // TODO(Ana)
                nome="Ranking do mês"
              >
                <CartaoDoRanking />
              </BlocoBoundary>
              <PainelDeNumeros />
            </div>
          ) : null}

          {aba === "calendario" ? (
            <div
              role="tabpanel"
              id={idDoPainel("calendario")}
              aria-labelledby={idDaAba("calendario")}
              className="space-y-8"
            >
              {/* O calendario vem PRIMEIRO (lote 10d): a aba e o calendario,
                  e o registro de publicacoes e o segundo cartao. */}
              <Comunidade />
              <BlocoBoundary
                // TODO(Ana)
                nome="Suas publicações"
              >
                {/* O cabecalho mora DENTRO do componente desde o lote 10: ele
                    e a primeira coisa da coluna da esquerda, e a lista ocupa a
                    direita. Aqui fica so a casca do cartao. */}
                <section
                  data-testid="creator-card-publicacoes"
                  aria-labelledby="creator-publicacoes-titulo"
                  className="card-brutal rounded-3xl bg-white p-6 md:p-8"
                >
                  <CreatorPublicacoes />
                </section>
              </BlocoBoundary>
            </div>
          ) : null}

          {aba === "ranking" ? (
            <div
              role="tabpanel"
              id={idDoPainel("ranking")}
              aria-labelledby={idDaAba("ranking")}
            >
              <Ranking />
            </div>
          ) : null}

          {aba === "perfil" ? (
            <div
              role="tabpanel"
              id={idDoPainel("perfil")}
              aria-labelledby={idDaAba("perfil")}
            >
              <AbaDePerfil perfil={perfil} />
            </div>
          ) : null}
        </div>
      </section>
    </Layout>
  );
}

/** Aba Numeros: o painel de sempre, com a busca que so acontece aqui. */
function PainelDeNumeros() {
  const [janela, setJanela] = useState<CreatorDashboardJanela>(
    CREATOR_DASHBOARD_JANELA_PADRAO,
  );
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

  useEffect(() => {
    let cancelado = false;
    // Zera ao trocar de janela: o painel anterior sob o rotulo novo diria
    // "7 dias" mostrando trinta.
    setEstado({ tipo: "carregando" });
    contentFetch(`/creator/me?janela=${janela}`)
      .then((json: unknown) => {
        if (cancelado) return;
        const painel = painelDaResposta(json);
        setEstado(painel ? { tipo: "ok", painel } : { tipo: "erro" });
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        const naoCreator =
          err instanceof AdminApiError &&
          err.status === 403 &&
          err.code === "not_creator";
        setEstado(naoCreator ? { tipo: "nao_creator" } : { tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [janela, tentativa]);

  if (estado.tipo === "carregando") {
    // TODO(Ana)
    return <LoadingBlock label="Carregando seu painel..." />;
  }

  if (estado.tipo === "erro") {
    return (
      <div data-testid="creator-erro" className="space-y-3">
        {/* TODO(Ana) */}
        <ErrorBlock message="Não foi possível carregar o seu painel agora." />
        <div className="text-center">
          <button
            type="button"
            onClick={() => setTentativa((n) => n + 1)}
            className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
          >
            {/* TODO(Ana) */}
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  if (estado.tipo === "nao_creator") {
    return (
      <section
        data-testid="creator-nao-creator"
        className="card-brutal rounded-3xl bg-white p-6 text-center"
      >
        <p className="font-display text-lg font-black text-slate-950">
          {/* TODO(Ana) */}
          Este painel é para creators da Bora na Tech.
        </p>
        <Link
          href="/"
          className="mt-3 inline-block text-sm font-black text-slate-900 underline underline-offset-2"
        >
          {/* TODO(Ana) */}
          Voltar para a página inicial
        </Link>
      </section>
    );
  }

  return (
    <CreatorDashboardView
      painel={estado.painel}
      janela={janela}
      onJanelaChange={setJanela}
      visao="creator"
      identidade="nenhuma"
    />
  );
}

/**
 * Aba Calendario, primeiro cartao: o calendario compartilhado (lote 10; a aba
 * chamava Comunidade ate o 10c).
 *
 * O cabecalho mora DENTRO do componente, como no cartao de publicacoes: aqui
 * fica so a casca. O `data-testid` continua `creator-comunidade` de proposito,
 * porque e por ele que os testes da pagina afirmam qual painel esta montado.
 */
function Comunidade() {
  return (
    <BlocoBoundary
      // TODO(Ana)
      nome="Calendário dos creators"
    >
      <section
        data-testid="creator-comunidade"
        aria-labelledby="creator-calendario-titulo"
        className="card-brutal rounded-3xl bg-white p-6 md:p-8"
      >
        <CreatorCalendario />
      </section>
    </BlocoBoundary>
  );
}

/**
 * Aba Ranking: o ranking do mes (lote 11). O componente busca sozinho e
 * desenha o proprio cartao, como o calendario; aqui fica so a fronteira de
 * erro, para um ranking quebrado nao derrubar a faixa de abas.
 */
function Ranking() {
  return (
    <BlocoBoundary
      // TODO(Ana)
      nome="Ranking do mês"
    >
      <CreatorRanking />
    </BlocoBoundary>
  );
}

/** Aba Perfil: dois cartoes, Redes e Pagamento, sobre o MESMO perfil lido. */
function AbaDePerfil({ perfil }: { perfil: PerfilDoCreator }) {
  const { estado, recarregar, definirPerfil, definirPix } = perfil;

  if (estado.tipo === "carregando") {
    // TODO(Ana)
    return <LoadingBlock label="Carregando seu perfil..." />;
  }

  if (estado.tipo === "erro") {
    return (
      <div data-testid="creator-perfil-erro" className="space-y-3">
        {/* TODO(Ana) */}
        <ErrorBlock message="Não foi possível carregar o seu perfil agora." />
        <div className="text-center">
          <button
            type="button"
            onClick={recarregar}
            className="bnt-pressable rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0_var(--bnt-shadow)]"
          >
            {/* TODO(Ana) */}
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  return (
    // Lado a lado no desktop (lote 09): sao dois assuntos independentes, e
    // empilhados eles empurravam o Pagamento para fora da primeira tela. No
    // celular continuam um abaixo do outro.
    //
    // `items-stretch` com `h-full` nos dois cartoes (lote 10): eles tem alturas
    // naturais diferentes, e um mais curto que o outro lia como cartao pela
    // metade. Funciona porque o BlocoBoundary devolve os filhos sem elemento
    // proprio (o ErrorBoundary tambem), entao a `section` E o item da grade.
    <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
      <BlocoBoundary
        // TODO(Ana)
        nome="Redes"
      >
        <section
          data-testid="creator-card-redes"
          aria-labelledby="creator-redes-titulo"
          className="card-brutal h-full space-y-5 rounded-3xl bg-white p-6 md:p-8"
        >
          <CabecalhoDeSecao
            id="creator-redes-titulo"
            icone={<AtSign aria-hidden="true" className="h-4 w-4" />}
            // TODO(Ana)
            selo="instagram e tiktok"
            // TODO(Ana)
            titulo="Redes"
            // TODO(Ana)
            frase="Seus @ e quantos seguidores você tem hoje, informados por você."
            // A cor com que este creator aparece no calendario (lote 10c).
            aoLadoDoTitulo={
              <MarcadorDeCor
                cor={estado.perfil.calendar_color}
                testId="creator-redes-cor-titulo"
              />
            }
          />
          <CreatorRedesForm perfil={estado.perfil} onSalvo={definirPerfil} />
        </section>
      </BlocoBoundary>

      <BlocoBoundary
        // TODO(Ana)
        nome="Pagamento"
      >
        <section
          data-testid="creator-card-pagamento"
          aria-labelledby="creator-pagamento-titulo"
          className="card-brutal h-full space-y-5 rounded-3xl bg-white p-6 md:p-8"
        >
          <CabecalhoDeSecao
            id="creator-pagamento-titulo"
            icone={<KeyRound aria-hidden="true" className="h-4 w-4" />}
            // TODO(Ana)
            selo="chave pix"
            // TODO(Ana)
            titulo="Pagamento"
            // TODO(Ana)
            frase="É por esta chave que a sua comissão será paga."
          />
          <CreatorPixForm pix={estado.perfil.pix} onSalvo={definirPix} />

          {/* COMPROVANTES (lote 10): o lugar onde o lote 13 vai listar os
              pagamentos de comissao. Hoje e so o estado vazio, e nao ha rota
              nem dado por tras dele. O cabecalho aqui e menor de proposito: o
              cartao ja tem um titulo (Pagamento), e um segundo `h2` do mesmo
              tamanho leria como outro cartao. */}
          <div
            data-testid="creator-comprovantes"
            className="space-y-2 border-t-2 border-dashed border-slate-300 pt-5"
          >
            <p className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-3 py-1 text-xs font-black uppercase text-violet-800 shadow-[2px_2px_0_var(--bnt-shadow)]">
              <Receipt aria-hidden="true" className="h-4 w-4" />
              {/* TODO(Ana) */}
              comissões pagas
            </p>
            <p
              data-testid="creator-comprovantes-vazio"
              className="text-sm font-semibold text-slate-600"
            >
              {/* TODO(Ana) */}
              Nenhum pagamento ainda. Quando uma comissão for paga, o
              comprovante aparece aqui.
            </p>
          </div>
        </section>
      </BlocoBoundary>
    </div>
  );
}
