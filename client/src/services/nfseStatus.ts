import { useEffect, useState } from "react";

import { apiUrl } from "@/lib/api";

/**
 * PONTO UNICO DE VERDADE do frontend sobre a emissao de NFS-e.
 *
 * Toda superficie fiscal (banner, secao de notas do perfil, bloco de dados
 * fiscais, gate do checkout, painel do admin) pergunta AQUI se deve existir.
 * Antes disto o cliente nao tinha como saber: nao havia uma unica ocorrencia de
 * NFSE em client/, e as cinco superficies montavam incondicionalmente.
 *
 * FAIL-CLOSED, em todos os caminhos de duvida. So o literal exato "enabled"
 * mostra; ausencia do campo, valor desconhecido, resposta malformada, erro de
 * rede e o estado de carregamento resolvem para DESLIGADO. O caso do campo
 * ausente e o da janela de deploy: a Vercel sobe antes do Railway, entao existe
 * um intervalo em que o bundle novo conversa com o backend antigo, que nao
 * conhece a rota. Nessa janela a resposta certa e esconder, nao adivinhar.
 *
 * Cacheado por CARGA DE APP, no mesmo desenho de `lib/newsletterState.ts` e
 * pelo mesmo motivo: o Layout vive dentro de cada pagina, entao o banner
 * remonta a cada navegacao e sem cache cada troca de rota dispararia um
 * request. O valor nao depende do usuario (e flag de configuracao do servidor),
 * entao nao ha invalidacao em login ou logout, e nenhum fluxo do app o altera.
 *
 * DUAS FLAGS, UMA REQUISICAO. A mesma resposta declara `nfse` (emissao) e
 * `coleta` (coleta de dados do tomador), e as duas sao independentes: a coleta
 * antecede a emissao, para o backlog de notas sair com tomador identificado.
 * Quem PEDE ou EDITA dado do tomador (gate do checkout, banner, bloco de dados
 * do perfil) pergunta a `useFiscalCollectionEnabled`; quem LISTA ou OPERA nota
 * (secao de notas, painel do admin) pergunta a `useNfseEnabled`. O cache e a
 * chamada em voo sao um so para os dois, entao montar os dois hooks na mesma
 * pagina continua custando uma requisicao.
 */

export type NfseStatus = "enabled" | "disabled";

type FiscalFlag = "nfse" | "coleta";
type FiscalStatus = Record<FiscalFlag, NfseStatus>;

let cached: FiscalStatus | null = null;
let inFlight: Promise<FiscalStatus> | null = null;

async function fetchStatus(): Promise<FiscalStatus> {
  const res = await fetch(apiUrl("/api/billing/nfse-status"));
  if (!res.ok) throw new Error("nfse status indisponivel");
  const json = (await res.json()) as {
    data?: { nfse?: string; coleta?: string };
  };
  // Cada campo resolve SOZINHO, pelo literal exato. `coleta` ausente e o caso
  // do backend anterior a este campo (janela de deploy): desligado, sem tentar
  // deduzir de `nfse`. A implicacao "emissao ligada implica coleta ligada" e do
  // servidor (`coletaFiscalLigada`), que ja a entrega resolvida em `coleta`.
  return {
    nfse: json?.data?.nfse === "enabled" ? "enabled" : "disabled",
    coleta: json?.data?.coleta === "enabled" ? "enabled" : "disabled",
  };
}

/**
 * Resolve o estado. Devolve o cacheado quando ja resolvido e dedupa a chamada
 * em voo (dois mounts simultaneos = 1 request), inclusive entre as duas flags.
 *
 * Erro NAO e cacheado: o `inFlight` e limpo e a promessa rejeita, para o mount
 * seguinte poder tentar de novo em vez de fixar "disabled" para sempre. Quem
 * consome ja trata a rejeicao como desligado, entao a falha esconde a interface
 * sem travar a recuperacao.
 */
function getFiscalStatus(): Promise<FiscalStatus> {
  if (cached !== null) return Promise.resolve(cached);
  if (inFlight) return inFlight;
  inFlight = fetchStatus()
    .then((status) => {
      cached = status;
      inFlight = null;
      return status;
    })
    .catch((err) => {
      inFlight = null;
      throw err;
    });
  return inFlight;
}

export function getNfseStatus(): Promise<NfseStatus> {
  return getFiscalStatus().then((status) => status.nfse);
}

export function getFiscalCollectionStatus(): Promise<NfseStatus> {
  return getFiscalStatus().then((status) => status.coleta);
}

/** Leitura sincrona do cache (null se ainda nao resolvido). */
export function peekNfseStatus(): NfseStatus | null {
  return cached?.nfse ?? null;
}

/** Leitura sincrona do cache (null se ainda nao resolvido). */
export function peekFiscalCollectionStatus(): NfseStatus | null {
  return cached?.coleta ?? null;
}

/** Limpa o cache. Usado nos testes. */
export function resetNfseStatusCache(): void {
  cached = null;
  inFlight = null;
}

/**
 * Hook das superficies. `false` enquanto carrega e `false` em qualquer falha,
 * que e o default seguro: uma superficie fiscal que aparece e some ao resolver
 * seria pior que uma que nunca apareceu.
 */
function useFiscalFlag(flag: FiscalFlag): boolean {
  const [enabled, setEnabled] = useState<boolean>(
    () => cached?.[flag] === "enabled",
  );

  useEffect(() => {
    let cancelado = false;
    getFiscalStatus()
      .then((status) => {
        if (!cancelado) setEnabled(status[flag] === "enabled");
      })
      .catch(() => {
        if (!cancelado) setEnabled(false);
      });
    return () => {
      cancelado = true;
    };
  }, [flag]);

  return enabled;
}

/** EMISSAO: listar nota, operar nota. */
export function useNfseEnabled(): boolean {
  return useFiscalFlag("nfse");
}

/** COLETA: pedir ou editar dado do tomador. */
export function useFiscalCollectionEnabled(): boolean {
  return useFiscalFlag("coleta");
}
