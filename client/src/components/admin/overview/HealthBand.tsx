import { useEffect, useState } from "react";
import { AlertTriangle, Check, ChevronDown } from "lucide-react";

import { adminFetch } from "@/lib/adminApi";

// FAIXA DE SAÚDE: substitui os dois cartões que ocupavam o topo da Visão.
//
// VERDE É AUSÊNCIA, não selo. Quando está tudo bem a faixa é uma linha fina de
// uma frase, sem cor forte, sem ícone grande e sem número, some do caminho e
// devolve o topo da página para o que decide. Badge verde decorativo é ruído que
// treina a pessoa a não olhar, e aí o vermelho também não é visto.
//
// VERMELHO EXPANDE, e só com o que quebrou. Nada de listar os oito sinais para
// dizer que sete estão bem.
//
// NÃO TRAVA A PÁGINA: busca própria, independente das outras chamadas da Visão.
// A sonda do PostHog e o ping de Redis vivem atrás de um cache de 180s no
// servidor, mas mesmo num cache miss lento o resto da página já renderizou:
// esta faixa é a única coisa que espera por ela.

type Problema = {
  id: string;
  label: string;
  detalhe: string;
  severidade: "erro" | "atencao";
};

type BandData = { ok: boolean; problemas: Problema[] };

export function HealthBand() {
  const [data, setData] = useState<BandData | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // COLAPSADA POR PADRÃO, inclusive no mobile: quem abre o admin não abre para
  // ler saúde, abre para ver o negócio. Só o problema chama.
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminFetch("/health-band")
      .then((json) => {
        if (!cancelled) setData(json.data as BandData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Falha da própria faixa é um estado nomeado: dizer "tudo bem" quando
        // não se sabe seria a mentira mais cara desta tela.
        setErro(err instanceof Error ? err.message : "Erro ao checar a saúde.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (erro) {
    return (
      <div
        data-testid="health-band"
        data-estado="indisponivel"
        className="flex items-center gap-2 rounded-full border-2 border-amber-400 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900"
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Não foi possível checar a saúde do sistema.
      </div>
    );
  }

  // Enquanto carrega, NADA. Um esqueleto no topo chamaria atenção para a coisa
  // que deve ficar invisível quando está tudo bem.
  if (!data) return null;

  // LEITURA DEFENSIVA, e não zelo: na janela de deploy o frontend novo fala com
  // o backend antigo, e um `problemas` ausente aqui derrubaria o render inteiro
  // da Visão com TypeError, porque esta faixa é o primeiro bloco da página. É a
  // mesma classe do `STATUS_META[item.status].label` que já quebrou o admin em
  // produção. Sem a lista, a faixa degrada para o estado silencioso.
  const problemas = Array.isArray(data.problemas) ? data.problemas : [];

  if (data.ok || problemas.length === 0) {
    return (
      <p
        data-testid="health-band"
        data-estado="ok"
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400"
      >
        <Check className="h-3.5 w-3.5 shrink-0" />
        Tudo operacional
      </p>
    );
  }

  const erros = problemas.filter((p) => p.severidade === "erro").length;
  const resumo =
    erros > 0
      ? `${erros} ${erros === 1 ? "falha" : "falhas"}${
          problemas.length > erros
            ? ` e ${problemas.length - erros} aviso(s)`
            : ""
        }`
      : `${problemas.length} aviso(s)`;

  return (
    <div
      data-testid="health-band"
      data-estado={erros > 0 ? "erro" : "atencao"}
      className={`rounded-2xl border-2 ${
        erros > 0
          ? "border-rose-600 bg-rose-50"
          : "border-amber-500 bg-amber-50"
      }`}
    >
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs font-black uppercase tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
          erros > 0 ? "text-rose-900" : "text-amber-900"
        }`}
      >
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {resumo}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${aberta ? "rotate-180" : ""}`}
        />
      </button>

      {aberta ? (
        <ul data-testid="health-band-lista" className="space-y-1 px-4 pb-3">
          {problemas.map((p) => (
            <li key={p.id} className="text-xs font-semibold text-slate-800">
              <span
                className={`font-black ${
                  p.severidade === "erro" ? "text-rose-800" : "text-amber-900"
                }`}
              >
                {p.label}:
              </span>{" "}
              {p.detalhe}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
