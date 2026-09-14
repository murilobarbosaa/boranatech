import { useEffect, useState } from "react";

import { BntSelect } from "@/components/shared/BntSelect";
import { AdminApiError, adminFetch } from "@/lib/adminApi";
import { formatarCentavos } from "@/lib/formatarCentavos";
import {
  AFFILIATE_CODE_PATTERN,
  normalizarCodigoDeAfiliado,
} from "@shared/affiliateCode";

// CODIGOS DE CREATOR de um usuario, no modal do admin.
//
// A fonte e GET /admin/affiliates-stats (todos os codigos, com `user_id`
// desde o lote 01), filtrada aqui pelo dono. Vincular e desvincular sao o PATCH
// generico de /content/affiliates/:id com `user_id`; criar ja vinculado e o
// POST generico com `user_id` no payload. Nenhuma rota nova.
//
// Troca de dono NAO existe de proposito: "vincular codigo existente" so oferece
// codigos SEM dono. Mudar um codigo de pessoa e desvincular de uma e vincular
// na outra, dois atos que o admin ve.
//
// Leitura com TRES estados distintos: carregando, erro e a lista (que pode ser
// vazia). Resposta que nao e lista vira erro, nunca "nenhum codigo".

type CodigoDeAfiliado = {
  id: string;
  name: string;
  code: string;
  discount_percent: number;
  commission_percent: number;
  status: string;
  clicks: number;
  sales: number;
  revenue_cents: number;
  user_id?: string | null;
};

type Leitura =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; codigos: CodigoDeAfiliado[] };

type Modo = "nenhum" | "vincular" | "criar";

// TODO(Ana)
const ROTULO_DO_STATUS: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  inactive: "Inativo",
};

/** Status vem do servidor: resolver com fallback neutro (CLAUDE.md). */
function rotuloDoStatus(status: string): string {
  return ROTULO_DO_STATUS[status] ?? status;
}

function ehCodigo(item: unknown): item is CodigoDeAfiliado {
  if (typeof item !== "object" || item === null) return false;
  const c = item as Record<string, unknown>;
  return typeof c.id === "string" && typeof c.code === "string";
}

function codigosDaResposta(json: unknown): CodigoDeAfiliado[] | null {
  if (typeof json !== "object" || json === null) return null;
  const data = (json as { data?: unknown }).data;
  if (!Array.isArray(data)) return null;
  return data.filter(ehCodigo);
}

function percentualValido(texto: string): number | null {
  if (!/^\d{1,3}$/.test(texto.trim())) return null;
  const n = Number(texto.trim());
  return n >= 0 && n <= 100 ? n : null;
}

const BOTAO =
  "rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black uppercase transition hover:bg-yellow-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-60 dark:hover:bg-secondary";

const BOTAO_CONFIRMAR =
  "rounded-full border-2 border-slate-900 bg-yellow-300 px-3 py-1.5 text-xs font-black uppercase disabled:opacity-60";

const BOTAO_DESVINCULAR =
  "rounded-full border-2 border-rose-600 bg-rose-50 px-3 py-1.5 text-xs font-black uppercase text-rose-700 transition hover:bg-rose-100 disabled:opacity-60";

const CAMPO =
  "w-full rounded-xl border-2 border-slate-900 bg-white px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none";

export function CreatorCodesBlock({
  userId,
  nomeDoUsuario,
  temConcessao,
}: {
  userId: string;
  nomeDoUsuario: string;
  temConcessao: boolean;
}) {
  const [leitura, setLeitura] = useState<Leitura>({ tipo: "carregando" });
  const [versao, setVersao] = useState(0);
  const [modo, setModo] = useState<Modo>("nenhum");
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erroDeAcao, setErroDeAcao] = useState<string | null>(null);

  const [escolhido, setEscolhido] = useState("");

  const [nome, setNome] = useState(nomeDoUsuario);
  const [codigo, setCodigo] = useState("");
  const [desconto, setDesconto] = useState("");
  const [comissao, setComissao] = useState("");

  useEffect(() => {
    let cancelado = false;
    setLeitura({ tipo: "carregando" });
    adminFetch("/affiliates-stats")
      .then((json: unknown) => {
        if (cancelado) return;
        const codigos = codigosDaResposta(json);
        setLeitura(codigos ? { tipo: "ok", codigos } : { tipo: "erro" });
      })
      .catch(() => {
        if (!cancelado) setLeitura({ tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [versao]);

  function recarregar() {
    setModo("nenhum");
    setConfirmandoId(null);
    setEscolhido("");
    setErroDeAcao(null);
    setVersao((v) => v + 1);
  }

  async function executar(acao: () => Promise<unknown>, mensagemPadrao: string) {
    if (ocupado) return;
    setOcupado(true);
    setErroDeAcao(null);
    try {
      await acao();
      recarregar();
    } catch (err) {
      setErroDeAcao(err instanceof Error ? err.message : mensagemPadrao);
    } finally {
      setOcupado(false);
    }
  }

  function desvincular(id: string) {
    void executar(
      () =>
        adminFetch(`/content/affiliates/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ user_id: null }),
        }),
      // TODO(Ana)
      "Não foi possível desvincular o código.",
    );
  }

  function vincular() {
    if (!escolhido) return;
    void executar(
      () =>
        adminFetch(`/content/affiliates/${escolhido}`, {
          method: "PATCH",
          body: JSON.stringify({ user_id: userId }),
        }),
      // TODO(Ana)
      "Não foi possível vincular o código.",
    );
  }

  async function criar() {
    if (ocupado) return;
    const codigoNormalizado = normalizarCodigoDeAfiliado(codigo);
    const descontoValido = percentualValido(desconto);
    const comissaoValida = percentualValido(comissao);
    if (!nome.trim()) {
      // TODO(Ana)
      setErroDeAcao("Informe o nome do código.");
      return;
    }
    if (!AFFILIATE_CODE_PATTERN.test(codigoNormalizado)) {
      setErroDeAcao(
        // TODO(Ana)
        "O código precisa ter de 3 a 32 letras ou números, sem espaços nem acentos.",
      );
      return;
    }
    if (descontoValido === null || comissaoValida === null) {
      // TODO(Ana)
      setErroDeAcao("Desconto e comissão precisam ser números de 0 a 100.");
      return;
    }
    setOcupado(true);
    setErroDeAcao(null);
    try {
      await adminFetch("/content/affiliates", {
        method: "POST",
        body: JSON.stringify({
          name: nome.trim(),
          code: codigoNormalizado,
          discount_percent: descontoValido,
          commission_percent: comissaoValida,
          status: "active",
          user_id: userId,
        }),
      });
      setCodigo("");
      setDesconto("");
      setComissao("");
      recarregar();
    } catch (err) {
      // O servidor responde 409 `conflict` para codigo repetido (indice unico
      // em affiliates.code). A mensagem dele e generica ("slug"), entao a
      // frase que a pessoa le e escrita aqui, nomeando o codigo.
      if (err instanceof AdminApiError && err.status === 409) {
        // TODO(Ana)
        setErroDeAcao(`Já existe o código ${codigoNormalizado}. Escolha outro.`);
      } else {
        setErroDeAcao(
          // TODO(Ana)
          err instanceof Error ? err.message : "Não foi possível criar o código.",
        );
      }
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div
      data-testid="creator-codigos"
      className="space-y-2 rounded-2xl border-2 border-slate-200 bg-white p-3"
    >
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-600">
        {/* TODO(Ana) */}
        Códigos de creator
      </p>

      {!temConcessao ? (
        <p
          data-testid="creator-codigos-aviso"
          className="rounded-xl border-2 border-amber-400 bg-amber-50 p-2 text-xs font-bold text-amber-900"
        >
          {/* TODO(Ana) */}
          Este usuário ainda não é creator; o código só aparece no painel dele
          depois da concessão.
        </p>
      ) : null}

      {leitura.tipo === "carregando" ? (
        <p className="text-xs font-bold text-slate-500">
          {/* TODO(Ana) */}
          Carregando códigos...
        </p>
      ) : leitura.tipo === "erro" ? (
        <div className="flex flex-wrap items-center gap-2">
          <p
            data-testid="creator-codigos-erro"
            className="text-xs font-bold text-rose-700"
          >
            {/* TODO(Ana) */}
            Não foi possível carregar os códigos.
          </p>
          <button
            type="button"
            onClick={() => setVersao((v) => v + 1)}
            className={BOTAO}
          >
            {/* TODO(Ana) */}
            Tentar de novo
          </button>
        </div>
      ) : (
        <ConteudoDosCodigos
          codigos={leitura.codigos}
          userId={userId}
          modo={modo}
          setModo={(m) => {
            setErroDeAcao(null);
            setModo((atual) => (atual === m ? "nenhum" : m));
          }}
          confirmandoId={confirmandoId}
          setConfirmandoId={setConfirmandoId}
          ocupado={ocupado}
          desvincular={desvincular}
          escolhido={escolhido}
          setEscolhido={setEscolhido}
          vincular={vincular}
          nome={nome}
          setNome={setNome}
          codigo={codigo}
          setCodigo={setCodigo}
          desconto={desconto}
          setDesconto={setDesconto}
          comissao={comissao}
          setComissao={setComissao}
          criar={() => void criar()}
        />
      )}

      {erroDeAcao ? (
        <p
          data-testid="creator-codigos-erro-acao"
          className="text-xs font-bold text-rose-700"
        >
          {erroDeAcao}
        </p>
      ) : null}
    </div>
  );
}

function ConteudoDosCodigos(props: {
  codigos: CodigoDeAfiliado[];
  userId: string;
  modo: Modo;
  setModo: (m: Modo) => void;
  confirmandoId: string | null;
  setConfirmandoId: (id: string | null) => void;
  ocupado: boolean;
  desvincular: (id: string) => void;
  escolhido: string;
  setEscolhido: (id: string) => void;
  vincular: () => void;
  nome: string;
  setNome: (v: string) => void;
  codigo: string;
  setCodigo: (v: string) => void;
  desconto: string;
  setDesconto: (v: string) => void;
  comissao: string;
  setComissao: (v: string) => void;
  criar: () => void;
}) {
  const doUsuario = props.codigos.filter((c) => c.user_id === props.userId);
  const semDono = props.codigos
    .filter((c) => !c.user_id)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return (
    <>
      {doUsuario.length === 0 ? (
        <p
          data-testid="creator-codigos-vazio"
          className="text-xs font-bold text-slate-500"
        >
          {/* TODO(Ana) */}
          Nenhum código vinculado a este usuário.
        </p>
      ) : (
        <ul className="space-y-2">
          {doUsuario.map((c) => (
            <li
              key={c.id}
              data-testid={`creator-codigo-${c.code}`}
              className="rounded-xl border-2 border-slate-900 bg-slate-50 p-2"
            >
              <p className="font-mono text-sm font-black text-slate-950">
                {c.code}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                {/* TODO(Ana) */}
                {`${c.discount_percent}% de desconto · ${c.commission_percent}% de comissão · ${rotuloDoStatus(c.status)}`}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                {/* TODO(Ana) */}
                {`${c.clicks} cliques · ${c.sales} vendas · ${formatarCentavos(c.revenue_cents)}`}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {props.confirmandoId === c.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => props.desvincular(c.id)}
                      disabled={props.ocupado}
                      className={BOTAO_DESVINCULAR}
                    >
                      {/* TODO(Ana) */}
                      Confirmar desvínculo
                    </button>
                    <button
                      type="button"
                      onClick={() => props.setConfirmandoId(null)}
                      disabled={props.ocupado}
                      className={BOTAO}
                    >
                      {/* TODO(Ana) */}
                      Manter
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => props.setConfirmandoId(c.id)}
                    className={BOTAO_DESVINCULAR}
                  >
                    {/* TODO(Ana) */}
                    Desvincular
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => props.setModo("vincular")}
          aria-expanded={props.modo === "vincular"}
          className={BOTAO}
        >
          {/* TODO(Ana) */}
          Vincular código existente
        </button>
        <button
          type="button"
          onClick={() => props.setModo("criar")}
          aria-expanded={props.modo === "criar"}
          className={BOTAO}
        >
          {/* TODO(Ana) */}
          Criar código para este usuário
        </button>
      </div>

      {props.modo === "vincular" ? (
        semDono.length === 0 ? (
          <p className="text-xs font-bold text-slate-500">
            {/* TODO(Ana) */}
            Não há códigos sem dono para vincular.
          </p>
        ) : (
          <div className="space-y-2">
            <BntSelect
              accent="gold"
              size="sm"
              // TODO(Ana)
              label="Código sem dono"
              // TODO(Ana)
              placeholder="Escolha um código..."
              value={props.escolhido}
              onValueChange={props.setEscolhido}
              options={semDono.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.code})`,
              }))}
            />
            <button
              type="button"
              onClick={props.vincular}
              disabled={!props.escolhido || props.ocupado}
              className={BOTAO_CONFIRMAR}
            >
              {/* TODO(Ana) */}
              Vincular
            </button>
          </div>
        )
      ) : null}

      {props.modo === "criar" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-black uppercase text-slate-600">
            {/* TODO(Ana) */}
            Nome
            <input
              value={props.nome}
              onChange={(e) => props.setNome(e.target.value)}
              className={CAMPO}
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-600">
            {/* TODO(Ana) */}
            Código
            <input
              value={props.codigo}
              onChange={(e) =>
                props.setCodigo(e.target.value.toUpperCase())
              }
              className={`${CAMPO} font-mono`}
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-600">
            {/* TODO(Ana) */}
            Desconto (%)
            <input
              inputMode="numeric"
              value={props.desconto}
              onChange={(e) => props.setDesconto(e.target.value)}
              className={CAMPO}
            />
          </label>
          <label className="text-xs font-black uppercase text-slate-600">
            {/* TODO(Ana) */}
            Comissão (%)
            <input
              inputMode="numeric"
              value={props.comissao}
              onChange={(e) => props.setComissao(e.target.value)}
              className={CAMPO}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={props.criar}
              disabled={props.ocupado}
              className={BOTAO_CONFIRMAR}
            >
              {/* TODO(Ana) */}
              {props.ocupado ? "Criando..." : "Criar código"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
