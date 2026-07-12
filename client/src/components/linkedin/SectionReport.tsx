import { CheckCircle2, ChevronDown, ExternalLink, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveCheckActionUrl } from "@shared/linkedin/checkLinks";
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
export type SectionVerdict = "trocar" | "ajustes" | "bom";

export function deriveSectionVerdict(
  checks: LinkedinCheckResult[],
): SectionVerdict | null {
  if (checks.length === 0) return null;
  const reprovados = checks.filter((check) => !check.aprovado);
  if (reprovados.length === 0) return "bom";
  if (reprovados.some((check) => check.tier === "essencial")) return "trocar";
  return "ajustes";
}

// Cores do veredito na mesma familia semantica da faixa da nota (faixaUi):
// red pra trocar, amber pra ajustes, emerald pra bom.
// TODO(Ana): revisar os rotulos dos vereditos do prontuario.
const VERDICT_UI: Record<SectionVerdict, { label: string; chip: string }> = {
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
  /** Conteudo extra sempre visivel (ex: nota honesta de estado vazio). */
  children?: React.ReactNode;
}

export default function SectionReport({
  title,
  icon,
  checks,
  atual,
  paste,
  children,
}: SectionReportProps) {
  const verdict = deriveSectionVerdict(checks);
  const verdictUi = verdict ? VERDICT_UI[verdict] : null;
  const pasteOpen = verdict !== "bom";
  const pendentes = checks.filter((check) => !check.aprovado).length;

  return (
    // Triagem por veredito: o card nasce aberto SO quando "precisa trocar";
    // bom e ajustes (e o card so de texto pronto, sem veredito) nascem
    // recolhidos com o cabecalho convidando. details/summary nativo: teclado
    // gratis e o open e so o default (toggle da pessoa nao e resetado pelo
    // React, que diffa contra o vdom anterior). Sem animacao de abertura;
    // o chevron gira por transition-transform, padrao do historico.
    <details
      className="card-brutal group rounded-2xl border-slate-950 bg-white"
      open={verdict === "trocar"}
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
            {/* TODO(Ana): revisar o resumo de criterios do cabecalho. */}
            {pendentes > 0
              ? `${pendentes} de ${checks.length} critérios pendentes`
              : `${checks.length} critérios ok`}
          </span>
        ) : paste ? (
          <span className="mt-2 block text-xs font-bold text-slate-500">
            {/* TODO(Ana): revisar o convite do card so de texto pronto. */}
            Abra para copiar o texto pronto.
          </span>
        ) : null}
      </summary>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        {checks.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {checks.map((check) => {
              const Icon = check.aprovado ? CheckCircle2 : XCircle;
              // Deep link honesto de "Resolver agora" (shared/linkedin/
              // checkLinks): so nos reprovados e so quando a correcao e
              // edicao do proprio perfil; sem URL, fica so o hint textual.
              const actionUrl = !check.aprovado
                ? resolveCheckActionUrl(check.id)
                : null;
              return (
                <li key={check.id} className="flex items-start gap-3">
                  <Icon
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0",
                      check.aprovado ? "text-emerald-600" : "text-red-600",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900">
                      {check.label}
                    </p>
                    <p className="text-sm text-slate-500">{check.detail}</p>
                    {!check.aprovado && HINT_BY_ID.has(check.id) ? (
                      <p className="mt-0.5 text-xs font-medium text-slate-400">
                        {/* TODO(Ana): revisar o rotulo "como resolver". */}
                        <span className="font-bold text-slate-500">
                          como resolver:
                        </span>{" "}
                        {HINT_BY_ID.get(check.id)}
                      </p>
                    ) : null}
                    {actionUrl ? (
                      <a
                        href={actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 rounded-full border-2 border-slate-950 bg-white px-2.5 py-0.5 text-[11px] font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-colors hover:bg-yellow-100"
                      >
                        {/* TODO(Ana): revisar o rotulo "Resolver agora". */}
                        Resolver agora
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
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
              {/* TODO(Ana): revisar o rotulo da camada do texto atual. */}
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
                {/* TODO(Ana): revisar o rotulo da camada pronta para colar. */}
                pronto para colar
              </p>
              <div className="mt-3 min-w-0">{paste}</div>
            </div>
          ) : (
            <details className="mt-5 rounded-xl border-2 border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-black text-slate-800">
                {/* TODO(Ana): revisar o convite do para colar no veredito bom. */}
                Quer deixar ainda melhor?
              </summary>
              <div className="mt-3 min-w-0">{paste}</div>
            </details>
          )
        ) : null}
      </div>
    </details>
  );
}
