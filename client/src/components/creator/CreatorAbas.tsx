import type { ReactNode } from "react";
import {
  AtSign,
  BarChart3,
  CalendarDays,
  KeyRound,
  Trophy,
  UserRound,
} from "lucide-react";

import {
  CREATOR_ABAS,
  idDaAba,
  idDoPainel,
  type CreatorAba,
} from "@/components/creator/creatorAbas";

// FAIXA DE ABAS DO /creator (lote 08b), no lugar onde antes ficava o aviso
// grande de chave Pix. No lote 09 passou a ter quatro abas: o Ranking saiu da
// Comunidade e virou aba propria, porque sao dois assuntos com ritmos
// diferentes (o calendario e do dia a dia, o ranking fecha no mes).
//
// Ela faz duas coisas ao mesmo tempo: troca de aba e diz o que falta
// preencher. O aviso antigo era um cartao tracejado que so aparecia quando
// faltava a chave, entao ocupava meia tela num caso e nada no outro; a faixa
// ocupa o mesmo lugar sempre, e o que muda e o chip do lado direito.
//
// PENDENCIA SO COM RESPOSTA: `temPix` e `temRedes` sao `boolean | null`, e
// `null` (o perfil ainda nao respondeu, ou falhou) NAO desenha chip nenhum.
// "Nao sei" nao e "falta": acusar pendencia que talvez nao exista manda a
// pessoa conferir um cadastro que ja esta feito.
//
// As pilulas sao as do seletor de grupos do /roadmaps, um degrau maiores por
// serem abas de pagina. O `dark:` que aparece aqui e o mesmo que veio de la.

const ABA_ATIVA =
  "shrink-0 whitespace-nowrap rounded-full border-2 border-violet-600 bg-violet-600 px-4 py-2 text-sm font-black text-white shadow-[2px_2px_0_var(--bnt-shadow)] dark:border-slate-900 dark:bg-slate-900 dark:text-white";

const ABA_INATIVA =
  "shrink-0 whitespace-nowrap rounded-full border-2 border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100";

const CHIP_DE_PENDENCIA =
  "rounded-full border-2 border-amber-700 bg-amber-100 px-3 py-1 text-xs font-black text-amber-900 hover:bg-amber-200";

// TODO(Ana)
const ROTULO_DA_ABA: Record<CreatorAba, string> = {
  numeros: "Números",
  comunidade: "Comunidade",
  ranking: "Ranking",
  perfil: "Perfil",
};

const ICONE_DA_ABA: Record<CreatorAba, ReactNode> = {
  numeros: <BarChart3 aria-hidden="true" className="h-4 w-4" />,
  comunidade: <CalendarDays aria-hidden="true" className="h-4 w-4" />,
  ranking: <Trophy aria-hidden="true" className="h-4 w-4" />,
  perfil: <UserRound aria-hidden="true" className="h-4 w-4" />,
};

type Pendencia = { chave: "pix" | "redes"; rotulo: string; icone: ReactNode };

/** O que falta preencher, na ordem em que aparece na aba Perfil. */
export function pendenciasDoPerfil(
  temRedes: boolean | null,
  temPix: boolean | null,
): Pendencia[] {
  const lista: Pendencia[] = [];
  if (temRedes === false) {
    lista.push({
      chave: "redes",
      // TODO(Ana)
      rotulo: "Cadastre suas redes",
      icone: <AtSign aria-hidden="true" className="h-3.5 w-3.5" />,
    });
  }
  if (temPix === false) {
    lista.push({
      chave: "pix",
      // TODO(Ana)
      rotulo: "Falta a chave Pix",
      icone: <KeyRound aria-hidden="true" className="h-3.5 w-3.5" />,
    });
  }
  return lista;
}

export function CreatorAbas({
  aba,
  onAba,
  temRedes,
  temPix,
}: {
  aba: CreatorAba;
  onAba: (aba: CreatorAba) => void;
  /** Ha pelo menos um @ cadastrado. `null` enquanto o perfil nao respondeu. */
  temRedes: boolean | null;
  /** Ha chave Pix cadastrada. `null` enquanto o perfil nao respondeu. */
  temPix: boolean | null;
}) {
  const pendencias = pendenciasDoPerfil(temRedes, temPix);

  return (
    <div
      data-testid="creator-abas"
      className="card-brutal flex flex-col gap-3 rounded-3xl bg-white p-2 sm:p-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div
        role="tablist"
        // TODO(Ana)
        aria-label="Seções do painel"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
      >
        {CREATOR_ABAS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={idDaAba(id)}
            aria-selected={aba === id}
            aria-controls={idDoPainel(id)}
            data-testid={idDaAba(id)}
            onClick={() => onAba(id)}
            className={`inline-flex items-center gap-2 ${aba === id ? ABA_ATIVA : ABA_INATIVA}`}
          >
            {ICONE_DA_ABA[id]}
            {ROTULO_DA_ABA[id]}
            {id === "perfil" && pendencias.length > 0 ? (
              <span
                data-testid="creator-aba-perfil-pendencias"
                className="ml-1.5 rounded-full bg-amber-300 px-1.5 text-[11px] font-black text-ink-on-accent"
              >
                {pendencias.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {pendencias.length > 0 ? (
        <div data-testid="creator-pendencias" className="flex flex-wrap gap-2">
          {pendencias.map((p) => (
            <button
              key={p.chave}
              type="button"
              data-testid={`creator-pendencia-${p.chave}`}
              onClick={() => onAba("perfil")}
              className={`inline-flex items-center gap-1.5 ${CHIP_DE_PENDENCIA}`}
            >
              {p.icone}
              {p.rotulo}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
