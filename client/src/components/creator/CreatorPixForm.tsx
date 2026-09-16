import { useState } from "react";
import { toast } from "sonner";

import {
  BOTAO_PRIMARIO,
  BOTAO_SECUNDARIO,
  erroClass,
  inputClass,
  labelClass,
} from "@/components/creator/creatorFormEstilos";
import { BntSelect } from "@/components/shared/BntSelect";
import { contentFetch } from "@/lib/adminApi";
import { diaBrasilia, formatarDiaCivil } from "@shared/brasiliaDay";
import {
  normalizarChavePix,
  TIPOS_DE_CHAVE_PIX,
  type CodigoDeChavePix,
  type CreatorPixMascarada,
  type TipoDeChavePix,
} from "@shared/creatorProfile";

// CHAVE PIX DO CREATOR (lote 08b): a chave por onde a comissao sera paga.
//
// A outra metade do antigo CreatorPerfilForm. Separada das redes porque e o
// dado sensivel da pagina, e manter o que fala de dinheiro num arquivo so
// deixa a vista tudo que toca a chave.
//
// A CHAVE INTEIRA NUNCA FICA AQUI: o servidor devolve a mascarada, e o que foi
// digitado para salvar e apagado do estado assim que a gravacao responde. Quem
// precisa da chave inteira e o admin, pela revelacao auditada.
//
// NAO BUSCA: recebe a chave mascarada ja lida pela pagina e avisa por `onSalvo`
// o que o servidor devolveu (a mascarada nova, ou null depois do DELETE).

// TODO(Ana)
const MENSAGEM_DA_CHAVE: Record<CodigoDeChavePix, string> = {
  invalid_pix_type: "Escolha o tipo da chave.",
  invalid_pix_cpf: "CPF inválido.",
  invalid_pix_cnpj: "CNPJ inválido.",
  invalid_pix_email: "E-mail inválido.",
  invalid_pix_telefone: "Telefone inválido. Informe o DDD e o número.",
  invalid_pix_aleatoria: "Chave aleatória inválida.",
};

// TODO(Ana)
const ROTULO_DO_TIPO: Record<TipoDeChavePix, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  telefone: "Telefone",
  aleatoria: "Chave aleatória",
};

/**
 * Rotulo do tipo de chave vindo do servidor. Resolver com fallback neutro: um
 * tipo novo que este bundle ainda nao conhece mostra "Chave Pix" em vez de
 * derrubar a secao.
 */
export function rotuloDoTipoDePix(tipo: string): string {
  return (
    (ROTULO_DO_TIPO as Record<string, string | undefined>)[tipo] ?? "Chave Pix"
  );
}

function dataCurta(iso: string | null): string {
  const dia = diaBrasilia(iso);
  return dia ? formatarDiaCivil(dia) : "";
}

function pixDaResposta(json: unknown): CreatorPixMascarada | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: { pix?: unknown } }).data;
  const pix = data?.pix;
  if (typeof pix !== "object" || pix === null) return null;
  return pix as CreatorPixMascarada;
}

export function CreatorPixForm({
  pix,
  onSalvo,
}: {
  pix: CreatorPixMascarada | null;
  onSalvo: (pix: CreatorPixMascarada | null) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState<string>("");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  async function salvar() {
    const chave = normalizarChavePix(tipo, valor);
    if (!chave.ok) {
      setErro(MENSAGEM_DA_CHAVE[chave.code]);
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const json: unknown = await contentFetch("/creator/pix", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, valor }),
      });
      setValor("");
      setTipo("");
      setEditando(false);
      onSalvo(pixDaResposta(json));
      // TODO(Ana)
      toast.success("Chave Pix salva.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Não foi possível salvar a sua chave Pix.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function remover() {
    setRemovendo(true);
    try {
      await contentFetch("/creator/pix", { method: "DELETE" });
      setConfirmandoRemocao(false);
      onSalvo(null);
      // TODO(Ana)
      toast.success("Chave Pix removida.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : // TODO(Ana)
            "Não foi possível remover a sua chave Pix.",
      );
    } finally {
      setRemovendo(false);
    }
  }

  function cancelar() {
    setValor("");
    setTipo("");
    setErro(null);
    setEditando(false);
  }

  if (pix && !editando) {
    return (
      <div data-testid="creator-perfil-pix" className="space-y-3">
        <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
            {rotuloDoTipoDePix(pix.tipo)}
          </p>
          <p
            data-testid="creator-pix-mascarada"
            className="font-display mt-1 break-all text-xl font-black tabular-nums text-slate-950"
          >
            {pix.mascarada}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {/* TODO(Ana) */}
            {`Atualizada em ${dataCurta(pix.updated_at)}`}
          </p>
        </div>
        {confirmandoRemocao ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-rose-800">
              {/* TODO(Ana) */}
              Remover a chave? Sem ela a comissão não tem para onde ir.
            </p>
            <button
              type="button"
              data-testid="creator-pix-confirmar-remocao"
              onClick={() => void remover()}
              disabled={removendo}
              className={BOTAO_SECUNDARIO}
            >
              {/* TODO(Ana) */}
              {removendo ? "Removendo..." : "Confirmar remoção"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoRemocao(false)}
              disabled={removendo}
              className={BOTAO_SECUNDARIO}
            >
              {/* TODO(Ana) */}
              Manter a chave
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="creator-pix-alterar"
              onClick={() => setEditando(true)}
              className={BOTAO_SECUNDARIO}
            >
              {/* TODO(Ana) */}
              Alterar
            </button>
            <button
              type="button"
              data-testid="creator-pix-remover"
              onClick={() => setConfirmandoRemocao(true)}
              className={BOTAO_SECUNDARIO}
            >
              {/* TODO(Ana) */}
              Remover
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-testid="creator-pix-form" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        <div>
          {/* TODO(Ana) */}
          <span className={labelClass}>Tipo da chave</span>
          <BntSelect
            accent="neutral"
            // TODO(Ana)
            label="Tipo da chave Pix"
            // TODO(Ana)
            placeholder="Escolha o tipo..."
            value={tipo}
            onValueChange={setTipo}
            options={TIPOS_DE_CHAVE_PIX.map((t) => ({
              value: t,
              label: ROTULO_DO_TIPO[t],
            }))}
          />
        </div>
        <label className="block">
          {/* TODO(Ana) */}
          <span className={labelClass}>Chave</span>
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className={inputClass}
            autoComplete="off"
          />
          {erro ? <span className={erroClass}>{erro}</span> : null}
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="creator-pix-salvar"
          onClick={() => void salvar()}
          disabled={salvando}
          className={BOTAO_PRIMARIO}
        >
          {/* TODO(Ana) */}
          {salvando ? "Salvando..." : "Salvar chave Pix"}
        </button>
        {pix ? (
          <button
            type="button"
            onClick={cancelar}
            disabled={salvando}
            className={BOTAO_SECUNDARIO}
          >
            {/* TODO(Ana) */}
            Cancelar
          </button>
        ) : null}
      </div>
    </div>
  );
}
