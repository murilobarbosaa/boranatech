import { CheckCircle2, ChevronDown, CircleHelp, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveCheckPassos } from "@shared/linkedin/checkLinks";
import {
  LINKEDIN_CHECK_CATALOG,
  type LinkedinCheckResult,
} from "@shared/linkedin/schema";

// Hints do catalogo (fonte unica em shared): renderizados como "como
// resolver" nos checks reprovados. Lookup por id, sem duplicar textos.
const HINT_BY_ID = new Map(
  LINKEDIN_CHECK_CATALOG.filter((entry) => entry.hint).map((entry) => [
    entry.id,
    entry.hint as string,
  ]),
);

// Veredito da secao derivado SO dos checks reais da categoria (teatro
// honesto): essencial reprovado = precisa trocar; so checks menores
// reprovados = bom com ajustes (os pontos ficam listados nos proprios
// checks); tudo aprovado = esta bom. Secao sem checks (ex: mensagem para
// recrutador) fica sem veredito, o card nao inventa selo.
export type SectionVerdict = "pendente" | "trocar" | "ajustes" | "bom";

export function deriveSectionVerdict(
  checks: LinkedinCheckResult[],
): SectionVerdict | null {
  if (checks.length === 0) return null;
  if (checks.some((check) => check.pendente === true)) return "pendente";
  const reprovados = checks.filter(
    (check) => !check.aprovado && check.pendente !== true,
  );
  if (reprovados.length === 0) return "bom";
  if (reprovados.some((check) => check.tier === "essencial")) return "trocar";
  return "ajustes";
}

// Cores do veredito na mesma familia semantica da faixa da nota (faixaUi):
// red pra trocar, amber pra ajustes, emerald pra bom.
//
// COPY REVISADA E FECHADA (pre-deploy). Os cinco textos deste arquivo estavam
// com TODO desde a criacao e todos renderizam para o usuario, ou seja, eram
// copy provisoria a caminho de producao. A revisao manteve os cinco, e o
// motivo de cada um esta escrito onde ele aparece. Trocar por trocar teria
// custado familiaridade sem ganhar clareza.
//
// Os tres rotulos abaixo: escala de tres estados alinhada com a cor (vermelho,
// ambar, verde) e com o verbo que a pessoa precisa executar. "Precisa trocar"
// diz o que fazer, nao so que esta ruim.
const VERDICT_UI: Record<SectionVerdict, { label: string; chip: string }> = {
  pendente: { label: "A confirmar", chip: "bg-sky-200" },
  trocar: { label: "Precisa trocar", chip: "bg-red-300" },
  ajustes: { label: "Bom, com ajustes", chip: "bg-amber-300" },
  bom: { label: "Está bom", chip: "bg-emerald-300" },
};

interface SectionReportProps {
  title: string;
  icon?: React.ReactNode;
  /** Checks da categoria da secao. Vazio = card sem veredito e sem lista. */
  checks: LinkedinCheckResult[];
  /**
   * Camada "seu atual": SO conteudo detectado de fato na analise exibida
   * (nada inventado). null quando nao ha fonte honesta.
   */
  atual?: React.ReactNode;
  /**
   * Camada "para colar": em destaque quando o veredito e ruim (ou quando a
   * secao nao tem veredito), recolhida em details no veredito bom.
   */
  paste?: React.ReactNode;
  /**
   * Uma linha dizendo ONDE colar e O QUE fazer com o que ja esta la.
   *
   * Obrigatoria sempre que houver `paste`. Sem ela o bloco aparecia sob um
   * rotulo generico ("pronto para colar", "Quer deixar ainda melhor?") que nao
   * dizia nem o campo de destino nem se o texto SOMA ou SUBSTITUI o que existe.
   * Competencias soma e headline substitui, e a UI tratava as duas igual.
   */
  pasteHint?: string;
  /** Conteudo extra sempre visivel (ex: nota honesta de estado vazio). */
  children?: React.ReactNode;
}

export default function SectionReport({
  title,
  icon,
  checks,
  atual,
  paste,
  pasteHint,
  children,
}: SectionReportProps) {
  const verdict = deriveSectionVerdict(checks);
  const verdictUi = verdict ? VERDICT_UI[verdict] : null;
  const pasteOpen = verdict !== "bom";
  const aConfirmar = checks.filter((check) => check.pendente === true).length;
  const reprovados = checks.filter(
    (check) => !check.aprovado && check.pendente !== true,
  ).length;

  return (
    // Triagem por veredito: o card nasce aberto SO quando "precisa trocar";
    // bom e ajustes (e o card so de texto pronto, sem veredito) nascem
    // recolhidos com o cabecalho convidando. details/summary nativo: teclado
    // gratis e o open e so o default (toggle da pessoa nao e resetado pelo
    // React, que diffa contra o vdom anterior). Sem animacao de abertura;
    // o chevron gira por transition-transform, padrao do historico.
    <details
      className="card-brutal group rounded-2xl border-slate-950 bg-white"
      open={verdict === "trocar" || verdict === "pendente"}
    >
      <summary className="cursor-pointer list-none p-5 sm:p-6">
        <span className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 font-display text-lg font-black text-slate-950">
            {icon}
            {title}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {verdictUi ? (
              <span
                className={cn(
                  "inline-flex rounded-full border-2 border-slate-950 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[2px_2px_0_#0f172a]",
                  verdictUi.chip,
                )}
              >
                {verdictUi.label}
              </span>
            ) : null}
            <ChevronDown
              className="h-5 w-5 shrink-0 text-slate-600 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </span>
        </span>
        {checks.length > 0 ? (
          <span className="mt-2 block text-xs font-bold text-slate-500">
            {/* "criterios" e a mesma palavra da lista logo abaixo, entao o
                cabecalho e a lista falam a mesma lingua. E desde a regua v2 o
                "N criterios ok" e confiavel: `exp-descricoes` passou a olhar
                cada experiencia, entao ele nao aprova mais um perfil com
                experiencia vazia. Antes este texto podia estar mentindo. */}
            {aConfirmar > 0
              ? `${aConfirmar} de ${checks.length} critérios a confirmar`
              : reprovados > 0
                ? `${reprovados} de ${checks.length} critérios pendentes`
                : `${checks.length} critérios ok`}
          </span>
        ) : paste ? (
          <span className="mt-2 block text-xs font-bold text-slate-500">
            {/* Card sem veredito (so texto pronto): o convite diz a acao, nao
                o conteudo, porque o conteudo ja esta no titulo da secao. */}
            Abra para copiar o texto pronto.
          </span>
        ) : null}
      </summary>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        {checks.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {checks.map((check) => {
              const pendente = check.pendente === true;
              const Icon = pendente
                ? CircleHelp
                : check.aprovado
                  ? CheckCircle2
                  : XCircle;
              // Caminho em passos (shared/linkedin/checkLinks): so nos
              // reprovados. Substituiu o botao "Resolver agora", que levava os
              // 28 checks editaveis para a MESMA URL (/in/me) e nao resolvia
              // nada. Ver o cabecalho de checkLinks.ts.
              const passos =
                !pendente && !check.aprovado
                  ? resolveCheckPassos(check.id)
                  : null;
              return (
                <li key={check.id} className="flex items-start gap-3">
                  <Icon
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0",
                      pendente
                        ? "text-sky-700"
                        : check.aprovado
                          ? "text-emerald-600"
                          : "text-red-600",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900">
                      {check.label}
                    </p>
                    <p className="text-sm text-slate-500">
                      {pendente
                        ? "Não foi possível confirmar este critério porque a headline pode estar incompleta."
                        : check.detail}
                    </p>
                    {!pendente &&
                    !check.aprovado &&
                    HINT_BY_ID.has(check.id) ? (
                      <p className="mt-0.5 text-xs font-medium text-slate-400">
                        {/* Rotulo em minuscula e proposital: e uma etiqueta de
                            apoio dentro do check, nao um titulo concorrente. */}
                        <span className="font-bold text-slate-500">
                          como resolver:
                        </span>{" "}
                        {HINT_BY_ID.get(check.id)}
                      </p>
                    ) : null}
                    {passos ? (
                      <details className="mt-1.5">
                        <summary className="inline-flex cursor-pointer items-center gap-1 rounded-full border-2 border-slate-950 bg-white px-2.5 py-0.5 text-[11px] font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-colors hover:bg-yellow-100">
                          Onde resolver isso
                        </summary>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs font-medium text-slate-600">
                          {passos.map((passo) => (
                            <li key={passo}>{passo}</li>
                          ))}
                        </ol>
                      </details>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        {atual ? (
          <div className="mt-5 rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
              {/* Par com "pronto para colar" logo abaixo: as duas camadas usam
                  a mesma forma (minuscula, caixa alta por CSS), entao a
                  oposicao entre o que existe e o que substituir fica visual. */}
              seu atual
            </p>
            <div className="mt-2 min-w-0 text-sm text-slate-700">{atual}</div>
          </div>
        ) : null}

        {children}

        {paste ? (
          pasteOpen ? (
            <div className="mt-5 rounded-xl border-2 border-sky-600 bg-sky-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-sky-700">
                pronto para colar
              </p>
              {pasteHint ? (
                <p className="mt-1 text-xs font-medium text-sky-900">
                  {pasteHint}
                </p>
              ) : null}
              <div className="mt-3 min-w-0">{paste}</div>
            </div>
          ) : (
            <details className="mt-5 rounded-xl border-2 border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-black text-slate-800">
                Está bom, mas dá para melhorar: ver o texto pronto para colar
              </summary>
              {pasteHint ? (
                <p className="mt-2 text-xs font-medium text-slate-600">
                  {pasteHint}
                </p>
              ) : null}
              <div className="mt-3 min-w-0">{paste}</div>
            </details>
          )
        ) : null}
      </div>
    </details>
  );
}
