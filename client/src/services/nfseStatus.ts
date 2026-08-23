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
 */

export type NfseStatus = "enabled" | "disabled";

let cached: NfseStatus | null = null;
let inFlight: Promise<NfseStatus> | null = null;

async function fetchStatus(): Promise<NfseStatus> {
  const res = await fetch(apiUrl("/api/billing/nfse-status"));
  if (!res.ok) throw new Error("nfse status indisponivel");
  const json = (await res.json()) as { data?: { nfse?: string } };
  return json?.data?.nfse === "enabled" ? "enabled" : "disabled";
}

/**
 * Resolve o estado. Devolve o cacheado quando ja resolvido e dedupa a chamada
 * em voo (dois mounts simultaneos = 1 request).
 *
 * Erro NAO e cacheado: o `inFlight` e limpo e a promessa rejeita, para o mount
 * seguinte poder tentar de novo em vez de fixar "disabled" para sempre. Quem
 * consome ja trata a rejeicao como desligado, entao a falha esconde a interface
 * sem travar a recuperacao.
 */
export function getNfseStatus(): Promise<NfseStatus> {
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

/** Leitura sincrona do cache (null se ainda nao resolvido). */
export function peekNfseStatus(): NfseStatus | null {
  return cached;
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
export function useNfseEnabled(): boolean {
  const [enabled, setEnabled] = useState<boolean>(
    () => peekNfseStatus() === "enabled",
  );

  useEffect(() => {
    let cancelado = false;
    getNfseStatus()
      .then((status) => {
        if (!cancelado) setEnabled(status === "enabled");
      })
      .catch(() => {
        if (!cancelado) setEnabled(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return enabled;
}
