import { AlertCircle, FileText, History, RefreshCw } from "lucide-react";
import ProGate from "@/components/pro/ProGate";
import { Skeleton } from "@/components/ui/skeleton";

export function LinkedinSkeleton() {
  return (
    <div className="space-y-6">
      <div className="card-brutal overflow-hidden rounded-2xl border-slate-950 bg-white">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 bg-slate-200" />
              <Skeleton className="h-6 w-56 bg-slate-200" />
              <Skeleton className="h-4 w-72 bg-slate-200" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Skeleton className="h-7 w-24 rounded-full bg-slate-200" />
              <Skeleton className="h-7 w-20 rounded-full bg-slate-200" />
              <Skeleton className="h-7 w-28 rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="border-t-2 border-slate-950 md:w-56 md:border-l-2 md:border-t-0">
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
              <Skeleton className="h-14 w-24 bg-slate-200" />
              <Skeleton className="h-6 w-24 rounded-full bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="h-28 w-full rounded-2xl bg-slate-200" />
      <Skeleton className="h-40 w-full rounded-2xl bg-slate-200" />
      <Skeleton className="h-40 w-full rounded-2xl bg-slate-200" />
    </div>
  );
}

/**
 * COPY DO TIMEOUT E DA RECUPERACAO.
 *
 * Exportada porque o teste afirma o TEXTO, e nao a classe nem a cor: a distincao
 * entre "sua analise talvez exista" e "tente de novo" precisa existir para quem
 * nao enxerga cor.
 *
 * A frase antiga era "A analise demorou mais que o esperado. Isso costuma ser
 * instabilidade momentanea: tente de novo em alguns minutos." Ela mandava
 * exatamente a acao mais cara: o servidor NAO percebe o aborto do client, entao
 * ele termina a analise, grava a linha de uso e persiste normalmente. Quem
 * seguia o conselho pagava uma segunda analise por um trabalho ja concluido.
 *
 * A promessa nova e CONDICIONAL e verificavel pelo clique: "se ela estiver la,
 * abrir nao gasta uma nova analise" e verdade porque a consulta do historico
 * (`GET /api/linkedin/analyses`) nao toca em IA nem em cota, e o teste irmao
 * afirma zero chamada da rota de analise nesse fluxo.
 */
// TODO(Ana): copy do estado de timeout da analise e da busca no historico.
export const LINKEDIN_TIMEOUT_COPY = {
  mensagem:
    "A análise demorou mais do que o esperado aqui no navegador, mas ela pode ter terminado no servidor. Procure no seu histórico antes de pedir outra: se ela estiver lá, abrir não gasta uma nova análise.",
  acao: "Procurar no meu histórico",
  procurando: "Procurando no histórico...",
  vazio:
    "Ainda não encontramos essa análise no seu histórico. Se ela tiver terminado, costuma aparecer em instantes: espere um pouco e procure de novo, ou peça uma nova análise.",
} as const;

/**
 * COPY DA SEGUNDA ANALISE SIMULTANEA (409 `analise_em_andamento`).
 *
 * Estado NOVO, e nao um sabor de "limite atingido". As duas sao recusas, e e por
 * isso que precisam de frases diferentes: quem esgotou a cota tem de voltar
 * amanha, e quem tem uma analise rodando so precisa esperar alguns segundos.
 * Colapsar as duas mandaria a pessoa embora de um problema que se resolve
 * sozinho.
 *
 * A frase NAO manda tentar de novo, e o botao de tentar de novo tambem some
 * neste estado: tentar de novo aqui e exatamente o que produz a cobranca dupla
 * que o lote fecha. O que ela oferece e a busca no historico, que ja e provada
 * sem custo de IA nem de cota.
 */
// TODO(Ana): copy do estado de analise ja em andamento (409).
export const LINKEDIN_EM_ANDAMENTO_COPY =
  "Você já tem uma análise deste perfil em andamento, provavelmente em outra aba ou de um envio de alguns segundos atrás. Espere ela terminar: o resultado aparece na aba que está rodando e também fica salvo no seu histórico.";

/** Estados em que procurar no historico e a acao util, e nao analisar de novo. */
const ESTADOS_COM_BUSCA_NO_HISTORICO = ["TIMEOUT", "ANALISE_EM_ANDAMENTO"];

function resolveError(error: string): string {
  if (error === "LOGIN_REQUIRED") return "Faça login para usar a análise.";
  if (error.startsWith("RATE_LIMITED")) {
    const detail = error.replace("RATE_LIMITED:", "").trim();
    return detail || "Você atingiu o limite diário de análises. Tente amanhã.";
  }
  if (error === "INVALID_REQUEST") {
    return "Confira os campos do formulário e tente de novo.";
  }
  // TODO(Ana): copy do estado de falha ao verificar o limite de uso (503).
  if (error === "LINKEDIN_BUSY") {
    return "Não conseguimos verificar seu limite de uso agora. Tente em instantes.";
  }
  if (error === "ANALYSIS_FAILED") {
    return "Não consegui completar a análise agora. Tente de novo.";
  }
  if (error === "TIMEOUT") return LINKEDIN_TIMEOUT_COPY.mensagem;
  if (error === "ANALISE_EM_ANDAMENTO") return LINKEDIN_EM_ANDAMENTO_COPY;
  // TODO(Ana): copy do estado de falha de rede.
  if (error === "NETWORK") {
    return "Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo; se persistir, a plataforma pode estar em manutenção.";
  }
  return error || "Não consegui completar a análise agora. Tente de novo.";
}

interface LinkedinErrorProps {
  error: string;
  onRetry?: () => void;
  /**
   * Consulta o HISTORICO ja existente, e so isso. Nunca dispara analise nova:
   * essa e a diferenca inteira entre esta acao e `onRetry`, e o teste irmao a
   * afirma pela negativa, com a rota de analise em zero chamada.
   */
  onRecuperar?: () => void;
  recuperando?: boolean;
  /** A consulta rodou e nao achou analise nova. Estado, nao erro. */
  recuperacaoVazia?: boolean;
}

export function LinkedinError({
  error,
  onRetry,
  onRecuperar,
  recuperando = false,
  recuperacaoVazia = false,
}: LinkedinErrorProps) {
  if (error === "PRO_REQUIRED") {
    return (
      <ProGate
        feature="linkedin_analyzer"
        description="O analisador de LinkedIn faz parte do Plano Pro. Assine para liberar a análise completa."
      />
    );
  }

  if (error === "UNREADABLE") {
    return (
      <div className="card-brutal rounded-2xl border-slate-300 bg-amber-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-900 bg-white shadow-[3px_3px_0_var(--bnt-shadow)]">
          <FileText className="h-7 w-7 text-amber-600" />
        </div>
        <p className="mx-auto max-w-2xl text-base font-bold text-slate-800">
          Não consegui ler seu perfil a partir do texto enviado. Tente colar o
          texto do perfil manualmente no campo de texto, copiando direto das
          seções do seu LinkedIn (headline, Sobre e experiências).
        </p>
      </div>
    );
  }

  // A busca no historico so faz sentido onde PODE haver analise a encontrar:
  // depois de um timeout do client (o servidor nao percebe o aborto e termina) e
  // quando a rota recusou porque ja existe uma rodando. Nos outros erros nao ha
  // nada em voo, e oferecer a busca seria prometer o que nao existe.
  const podeRecuperar =
    ESTADOS_COM_BUSCA_NO_HISTORICO.includes(error) && !!onRecuperar;
  // TENTAR DE NOVO SOME quando ja existe uma analise rodando: e literalmente a
  // acao que cobra a segunda chamada de IA que este estado existe para evitar.
  const podeTentarDeNovo = error !== "ANALISE_EM_ANDAMENTO" && !!onRetry;

  return (
    <div className="card-brutal rounded-2xl border-slate-300 bg-red-50 p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-900 bg-white shadow-[3px_3px_0_var(--bnt-shadow)]">
        <AlertCircle className="h-7 w-7 text-red-600" />
      </div>
      <p className="mx-auto max-w-2xl text-base font-bold text-slate-800">
        {resolveError(error)}
      </p>
      {podeRecuperar && recuperacaoVazia ? (
        <p className="mx-auto mt-3 max-w-2xl text-sm font-bold text-slate-600">
          {LINKEDIN_TIMEOUT_COPY.vazio}
        </p>
      ) : null}
      {podeRecuperar || podeTentarDeNovo ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {podeRecuperar ? (
            <button
              type="button"
              onClick={onRecuperar}
              disabled={recuperando}
              className="btn-brutal-primary inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-slate-900 disabled:opacity-60"
            >
              <History className="h-4 w-4" />
              {recuperando
                ? LINKEDIN_TIMEOUT_COPY.procurando
                : LINKEDIN_TIMEOUT_COPY.acao}
            </button>
          ) : null}
          {podeTentarDeNovo ? (
            /* SECUNDARIA no timeout, primaria no resto. Tentar de novo continua
               disponivel de proposito: ela e a saida certa quando a analise
               realmente nao completou. O que mudou e a ORDEM, porque a acao
               barata tem de vir antes da que cobra. */
            <button
              type="button"
              onClick={onRetry}
              className={
                podeRecuperar
                  ? "inline-flex items-center gap-2 rounded-full border-2 border-slate-400 px-5 py-2.5 text-sm font-black text-slate-700"
                  : "btn-brutal-primary inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-slate-900"
              }
            >
              <RefreshCw className="h-4 w-4" />
              Tentar de novo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
