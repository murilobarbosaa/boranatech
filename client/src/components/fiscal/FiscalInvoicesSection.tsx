import { useEffect, useState } from "react";

import { useNfseEnabled } from "@/services/nfseStatus";

import {
  getMyFiscalInvoices,
  type FiscalInvoiceListItem,
} from "@/services/subscriptionService";

// Notas fiscais do usuario.
//
// BUSCA SOB DEMANDA, sem cache: as URLs de download vem ASSINADAS e expiram em
// minutos. Guardar a lista em contexto ou em cache de sessao faria o botao de
// download parar de funcionar depois de um tempo, e o sintoma (um clique que
// devolve erro de acesso negado) nao tem relacao obvia com a causa.
//
// Nao usa useSubscription: quem cancelou a assinatura continua tendo direito as
// notas do que ja pagou, entao a secao nao depende de estar ativo.

function formatBrl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatData(iso: string | null): string {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const downloadClass =
  "rounded-full border-2 border-[#1a1a1a] bg-white px-3 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-px";

export default function FiscalInvoicesSection() {
  const nfseEnabled = useNfseEnabled();
  const [invoices, setInvoices] = useState<FiscalInvoiceListItem[] | null>(
    null,
  );
  const [erro, setErro] = useState(false);

  useEffect(() => {
    // Sem emissao ligada NAO ha chamada. O gate precisa estar aqui dentro, e
    // nao so no render: montar a secao e nao pedir nada e diferente de esconder
    // a secao depois de ja ter pedido, e era esta chamada que ia ao banco a
    // cada abertura do /perfil de qualquer usuario logado.
    if (!nfseEnabled) return;
    let cancelled = false;
    getMyFiscalInvoices()
      .then((lista) => {
        if (!cancelled) setInvoices(lista);
      })
      .catch(() => {
        if (!cancelled) {
          // Estado de erro PROPRIO, distinto de lista vazia: "ainda nao ha
          // notas" e "nao consegui buscar" sao coisas diferentes, e mostrar o
          // vazio no lugar do erro faria alguem concluir que a nota nao foi
          // emitida quando ela existe.
          setErro(true);
          setInvoices([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [nfseEnabled]);

  // Escondida por completo com a emissao desligada: uma secao "Suas notas" que
  // promete notas de um pipeline que nao roda e pior que a ausencia dela.
  if (!nfseEnabled) return null;

  return (
    <section className="animate-fade-slide-up relative overflow-hidden rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a] md:p-8">
      {/* TODO(Ana): eyebrow e titulo da secao de notas do perfil. */}
      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">
        Notas fiscais
      </p>
      <h2 className="mt-2 font-display text-2xl font-black text-slate-950">
        Suas notas
      </h2>

      {/* TODO(Ana): os tres estados abaixo (carregando, falha de leitura e
          nenhuma nota ainda). Os dois ultimos dizem coisas diferentes de
          proposito e a copy precisa manter a distincao. */}
      {invoices === null ? (
        <p className="mt-4 text-sm font-semibold text-slate-500">
          Carregando...
        </p>
      ) : erro ? (
        <p className="mt-4 text-sm font-semibold text-slate-600">
          Não conseguimos carregar suas notas agora. Tente recarregar a página.
        </p>
      ) : invoices.length === 0 ? (
        <p className="mt-4 text-sm font-semibold text-slate-600">
          Suas notas fiscais aparecerão aqui após a confirmação de pagamentos.
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {invoices.map((nota) => (
            <li
              key={nota.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-slate-200 p-4"
            >
              <div className="flex-1">
                <p className="text-sm font-black text-slate-950">
                  {/* TODO(Ana): rotulo da nota (com e sem numero) e selo de cancelada. */}
                  {nota.numero ? `Nota ${nota.numero}` : "Nota emitida"}
                  {nota.status === "canceled" ? (
                    <span className="ml-2 rounded-full border-2 border-rose-300 bg-rose-50 px-2 py-0.5 text-xs font-black uppercase text-rose-700">
                      Cancelada
                    </span>
                  ) : null}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {[formatData(nota.issuedAt), formatBrl(nota.amountCents)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              <div className="flex gap-2">
                {/* TODO(Ana): rotulos dos botoes de download (PDF e XML). */}
                {/* Botao so aparece com URL: nota sem documento arquivado
                    mostra os dados e omite o download, em vez de oferecer um
                    link que devolve erro. */}
                {nota.pdfUrl ? (
                  <a
                    href={nota.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={downloadClass}
                  >
                    PDF
                  </a>
                ) : null}
                {nota.xmlUrl ? (
                  <a
                    href={nota.xmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={downloadClass}
                  >
                    XML
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
