import { useState } from "react";

import FiscalDataModal from "@/components/fiscal/FiscalDataModal";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNfseEnabled } from "@/services/nfseStatus";
import { hasFiscalIdentity } from "@shared/fiscalIdentity";

// Aviso para quem PAGA e ainda nao tem dados fiscais completos.
//
// TRES decisoes que valem o comentario:
//
// 1. SO PARA ASSINANTE ATIVO. Quem nao paga nao gera nota, entao pedir CPF a
//    quem esta no plano gratis seria coletar dado sem finalidade (e a coleta e
//    justificada exatamente pela emissao). Cortesia de admin e influencer tem
//    status 'free' e tambem nao ve: nao ha cobranca, nao ha nota.
//
// 2. A dispensa vive no sessionStorage, nao no localStorage nem no banco.
//    O pedido e "dispensavel, mas reaparece em nova sessao": sessionStorage e
//    exatamente isso, morre com a aba. localStorage esconderia o aviso para
//    sempre depois de um clique, e o efeito seria uma nota travada em silencio.
//
// 3. Ele mora no Layout, que REMONTA A CADA NAVEGACAO (ver CLAUDE.md). Duas
//    consequencias, e as duas estao tratadas:
//
//    a) NAO ha fetch aqui. O perfil vem do AuthContext, montado uma vez em
//       App.tsx. Um `getMyProfile()` num efeito deste componente viraria uma
//       chamada de API por troca de rota, que e exatamente o defeito que o
//       CLAUDE.md descreve para efeitos de fetch no Header e no Footer.
//    b) A dispensa vive no sessionStorage e nao em useState, porque o useState
//       renasceria na proxima pagina e o aviso voltaria a cada navegacao.

const DISMISS_KEY = "bnt_fiscal_banner_dismissed";

function foiDispensado(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    // sessionStorage bloqueado (modo restrito): mostrar o aviso e o lado
    // seguro. Esconder por causa de um erro de storage seria esconder por
    // acidente.
    return false;
  }
}

export default function FiscalDataBanner() {
  const { user, profile, refreshProfile } = useAuth();
  const { subscription, loading } = useSubscription();
  const nfseEnabled = useNfseEnabled();
  const [dispensado, setDispensado] = useState(() => foiDispensado());
  const [modalAberto, setModalAberto] = useState(false);

  // Assinatura REAL e vigente. Cortesia de admin e influencer tem status 'free'
  // e cai fora aqui; boleto pendente tambem, que e o correto (nao houve
  // cobranca liquidada, entao nao ha nota a emitir).
  const status = (subscription as { status?: string } | null)?.status;
  const assinanteAtivo = status === "active" || status === "trialing";

  // MESMA funcao que o servidor usa para decidir se a nota sai. Um criterio
  // proprio aqui faria o banner sumir com a nota ainda bloqueada.
  //
  // `profile` ausente (ainda carregando, ou falha de leitura) NAO vira aviso:
  // pedir dado que a pessoa talvez ja tenha preenchido, por causa de um estado
  // transitorio nosso, e pior que demorar um pouco para pedir.
  const faltaDado = profile ? !hasFiscalIdentity(profile) : false;

  // `nfseEnabled` PRIMEIRO na condicao: com a emissao desligada nao existe nota
  // para emitir, entao pedir dado fiscal seria cobrar cadastro por um recurso
  // que nao vai rodar. A guarda mora aqui dentro, junto das outras condicoes, e
  // nao em quem monta o banner, para valer para todo call site (hoje so o
  // Layout, mas a regra do projeto e proteger dentro da funcao).
  if (
    !nfseEnabled ||
    loading ||
    !user ||
    !assinanteAtivo ||
    !faltaDado ||
    dispensado
  ) {
    return null;
  }

  return (
    <>
      <div
        role="status"
        className="border-b-2 border-slate-900 bg-[#FFB800] px-4 py-3"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <p className="flex-1 text-sm font-bold text-slate-950">
            Falta pouco para suas notas fiscais: complete seus dados fiscais
            para receber a nota da sua assinatura.
          </p>
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="rounded-full border-2 border-slate-900 bg-white px-4 py-1.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-px"
          >
            Completar dados
          </button>
          <button
            type="button"
            onClick={() => {
              setDispensado(true);
              try {
                window.sessionStorage.setItem(DISMISS_KEY, "1");
              } catch {
                /* sem storage o aviso volta na proxima navegacao; aceitavel */
              }
            }}
            aria-label="Dispensar aviso"
            className="rounded-full border-2 border-slate-900 px-3 py-1.5 text-sm font-black text-slate-950"
          >
            Agora não
          </button>
        </div>
      </div>

      <FiscalDataModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        onSaved={() => {
          setModalAberto(false);
          // Recarrega o perfil do contexto: e ele que decide se este banner
          // continua aparecendo, e sem isso o aviso ficaria na tela depois de a
          // pessoa ter acabado de preencher.
          void refreshProfile();
        }}
      />
    </>
  );
}
