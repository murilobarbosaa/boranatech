import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Construction,
  Lightbulb,
  Map,
  Sparkles,
  Wrench,
} from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { AreaIconBox } from "@/components/areas/AreaIconBox";
import { DifficultyDots } from "@/components/areas/DifficultyDots";
import { areasTI, type SubArea, type AreaTI } from "@/lib/data";
import { accentForAreaSlug } from "@/lib/detailPageAccents";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const CARD_BASE =
  "rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a] md:p-8";

interface ZoneCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accentTextClass?: string;
  children: React.ReactNode;
  className?: string;
}

function ZoneCard({
  title,
  icon: Icon,
  accentTextClass,
  children,
  className,
}: ZoneCardProps) {
  return (
    <section className={cn(CARD_BASE, className)}>
      <header className="mb-5 flex items-center gap-2.5">
        {Icon ? (
          <Icon
            className={cn("h-5 w-5", accentTextClass ?? "text-slate-700")}
            strokeWidth={2.5}
          />
        ) : null}
        <h2 className="font-display text-xl font-black text-slate-950 md:text-2xl">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-2.5 text-sm leading-relaxed text-slate-700"
        >
          <span
            className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({
  items,
  accentBg,
}: {
  items: string[];
  accentBg: string;
}) {
  return (
    <ol className="space-y-3">
      {items.map((item, idx) => (
        <li
          key={item}
          className="flex gap-3 text-sm leading-relaxed text-slate-700"
        >
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 text-xs font-black text-slate-950",
              accentBg,
            )}
          >
            {idx + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

interface SubAreaHeaderProps {
  area: AreaTI;
  subarea: SubArea;
  parentSlug: string;
}

function SubAreaHeader({ area, subarea, parentSlug }: SubAreaHeaderProps) {
  return (
    <header className="mb-8 md:mb-12">
      <Link
        href={`/areas/${parentSlug}`}
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-sm font-bold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={3} />
        Voltar para {area.nome}
      </Link>

      <div className="mb-4 flex items-center gap-3">
        <AreaIconBox icon={area.icon} areaSlug={area.slug} size="sm" />
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em]",
            area.tagClass,
          )}
        >
          {area.nome} · Subárea
        </span>
      </div>

      <h1 className="font-display mb-3 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
        {subarea.nome}
      </h1>

      {subarea.descricaoCurta ? (
        <p className="max-w-3xl text-base font-semibold leading-relaxed text-slate-700 md:text-lg">
          {subarea.descricaoCurta}
        </p>
      ) : null}
    </header>
  );
}

interface SubAreaStatsRowProps {
  subarea: SubArea;
  fillClass: string;
  iconMutedClass: string;
}

function SubAreaStatsRow({
  subarea,
  fillClass,
  iconMutedClass,
}: SubAreaStatsRowProps) {
  const hasDificuldade = typeof subarea.dificuldade === "number";
  const hasSalario = !!subarea.faixaSalarial;
  const hasCargos = !!subarea.cargos && subarea.cargos.length > 0;

  if (!hasDificuldade && !hasSalario && !hasCargos) return null;

  return (
    <div className={cn(CARD_BASE, "mb-10")}>
      <div className="grid gap-6 md:grid-cols-3">
        {hasDificuldade ? (
          <div>
            <p
              className={cn(
                "mb-2 text-xs font-black uppercase tracking-[0.18em]",
                iconMutedClass,
              )}
            >
              Dificuldade
            </p>
            <DifficultyDots
              level={subarea.dificuldade as number}
              fillClass={fillClass}
            />
          </div>
        ) : null}
        {hasSalario ? (
          <div
            className={cn(
              hasDificuldade && "md:border-l-2 md:border-slate-100 md:pl-6",
            )}
          >
            <p
              className={cn(
                "mb-2 text-xs font-black uppercase tracking-[0.18em]",
                iconMutedClass,
              )}
            >
              Faixa salarial
            </p>
            <p className="text-sm font-bold leading-snug text-slate-900">
              {subarea.faixaSalarial}
            </p>
          </div>
        ) : null}
        {hasCargos ? (
          <div
            className={cn(
              (hasDificuldade || hasSalario) &&
                "md:border-l-2 md:border-slate-100 md:pl-6",
            )}
          >
            <p
              className={cn(
                "mb-2 text-xs font-black uppercase tracking-[0.18em]",
                iconMutedClass,
              )}
            >
              Cargos típicos
            </p>
            <p className="text-sm font-bold leading-snug text-slate-900">
              {subarea.cargos!.length}{" "}
              {subarea.cargos!.length === 1 ? "cargo" : "cargos"}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface FullSubAreaProps {
  area: AreaTI;
  subarea: SubArea;
  parentSlug: string;
}

function FullSubArea({ area, subarea, parentSlug }: FullSubAreaProps) {
  const accent = accentForAreaSlug(area.slug);
  const ac = getPageAccentUi(accent);

  const hasZona1 = !!(
    subarea.descricaoCompleta ||
    subarea.diferencasDaAreaMae ||
    subarea.oQueFaz
  );
  const hasHabilidades = !!subarea.habilidadesEspecificas?.length;
  const hasFerramentas = !!subarea.ferramentasEspecificas?.length;
  const hasZona2 = hasHabilidades || hasFerramentas;
  const hasRoadmap = !!subarea.roadmapEspecifico?.length;
  const hasCursos = !!subarea.cursosGratuitos?.length;
  const hasProjetos = !!subarea.projetosSugeridos?.length;
  const hasZona3 = hasRoadmap || hasCursos || hasProjetos;
  const hasCargos = !!subarea.cargos?.length;
  const hasSalario = !!subarea.faixaSalarial;
  const hasDicas = !!subarea.dicasIniciais;
  const hasZona4 = hasCargos || hasSalario || hasDicas;

  return (
    <div className={cn("min-h-screen", ac.contentBg)}>
      <div className="container max-w-5xl py-12 md:py-16">
        <SubAreaHeader area={area} subarea={subarea} parentSlug={parentSlug} />

        <SubAreaStatsRow
          subarea={subarea}
          fillClass={ac.progressFill}
          iconMutedClass={ac.iconMuted}
        />

        {hasZona1 ? (
          <ZoneCard
            title="O que é essa subárea"
            icon={Sparkles}
            accentTextClass={ac.iconMuted}
            className="mb-8"
          >
            {subarea.descricaoCompleta ? (
              <p className="text-base leading-relaxed text-slate-700">
                {subarea.descricaoCompleta}
              </p>
            ) : null}

            {subarea.diferencasDaAreaMae ? (
              <div
                className={cn(
                  "mt-5 rounded-2xl border-2 p-4 md:p-5",
                  ac.panelBorder,
                  ac.panelSoft,
                )}
              >
                <p
                  className={cn(
                    "mb-1.5 text-xs font-black uppercase tracking-[0.18em]",
                    ac.iconMuted,
                  )}
                >
                  Como difere de {area.nome}
                </p>
                <p className="text-sm leading-relaxed text-slate-800">
                  {subarea.diferencasDaAreaMae}
                </p>
              </div>
            ) : null}

            {subarea.oQueFaz ? (
              <div className="mt-5 border-t-2 border-slate-100 pt-5">
                <p className="mb-1.5 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  No dia a dia
                </p>
                <p className="text-sm leading-relaxed text-slate-700">
                  {subarea.oQueFaz}
                </p>
              </div>
            ) : null}
          </ZoneCard>
        ) : null}

        {hasZona2 ? (
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            {hasHabilidades ? (
              <ZoneCard
                title="Habilidades específicas"
                icon={Sparkles}
                accentTextClass={ac.iconMuted}
              >
                <BulletList items={subarea.habilidadesEspecificas!} />
              </ZoneCard>
            ) : null}
            {hasFerramentas ? (
              <ZoneCard
                title="Ferramentas específicas"
                icon={Wrench}
                accentTextClass={ac.iconMuted}
              >
                <BulletList items={subarea.ferramentasEspecificas!} />
              </ZoneCard>
            ) : null}
          </div>
        ) : null}

        {hasZona3 ? (
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            {hasRoadmap ? (
              <ZoneCard
                title="Roadmap específico"
                icon={Map}
                accentTextClass={ac.iconMuted}
                className={hasCursos || hasProjetos ? "" : "lg:col-span-2"}
              >
                <NumberedList
                  items={subarea.roadmapEspecifico!}
                  accentBg={ac.panelSoft}
                />
              </ZoneCard>
            ) : null}
            {hasCursos ? (
              <ZoneCard
                title="Cursos gratuitos"
                icon={Sparkles}
                accentTextClass={ac.iconMuted}
              >
                <BulletList items={subarea.cursosGratuitos!} />
              </ZoneCard>
            ) : null}
            {hasProjetos ? (
              <ZoneCard
                title="Projetos pra portfólio"
                icon={Wrench}
                accentTextClass={ac.iconMuted}
              >
                <BulletList items={subarea.projetosSugeridos!} />
              </ZoneCard>
            ) : null}
          </div>
        ) : null}

        {hasZona4 ? (
          <div className="mb-10 grid gap-6 lg:grid-cols-2">
            {hasCargos ? (
              <ZoneCard
                title="Cargos típicos"
                icon={Briefcase}
                accentTextClass={ac.iconMuted}
              >
                <div className="flex flex-wrap gap-2">
                  {subarea.cargos!.map((cargo) => (
                    <span
                      key={cargo}
                      className={cn(
                        "inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-bold",
                        ac.panelBorder,
                        ac.panelSoft,
                        ac.iconMuted,
                      )}
                    >
                      {cargo}
                    </span>
                  ))}
                </div>
              </ZoneCard>
            ) : null}
            {hasSalario ? (
              <ZoneCard
                title="Faixa salarial"
                icon={Briefcase}
                accentTextClass={ac.iconMuted}
              >
                <p className="text-lg font-black leading-snug text-slate-950 md:text-xl">
                  {subarea.faixaSalarial}
                </p>
              </ZoneCard>
            ) : null}
            {hasDicas ? (
              <ZoneCard
                title="Dicas pra começar"
                icon={Lightbulb}
                accentTextClass={ac.iconMuted}
                className={hasCargos && hasSalario ? "lg:col-span-2" : ""}
              >
                <p className="text-sm leading-relaxed text-slate-700">
                  {subarea.dicasIniciais}
                </p>
              </ZoneCard>
            ) : null}
          </div>
        ) : null}

        <Link
          href={`/areas/${parentSlug}`}
          className="bnt-pressable inline-flex items-center gap-2 rounded-2xl border-2 border-slate-950 bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-[4px_4px_0_#0f172a] transition hover:bg-violet-700"
        >
          Ver área completa: {area.nome}
          <ArrowRight className="h-4 w-4" strokeWidth={3} />
        </Link>
      </div>
    </div>
  );
}

interface PlaceholderSubAreaProps {
  area: AreaTI;
  subarea: SubArea;
  parentSlug: string;
}

function PlaceholderSubArea({
  area,
  subarea,
  parentSlug,
}: PlaceholderSubAreaProps) {
  const accent = accentForAreaSlug(area.slug);
  const ac = getPageAccentUi(accent);

  return (
    <div className={cn("min-h-screen", ac.contentBg)}>
      <div className="container max-w-3xl py-12 md:py-16">
        <SubAreaHeader area={area} subarea={subarea} parentSlug={parentSlug} />

        <section className={cn(CARD_BASE, "md:p-12")}>
          <div
            className={cn(
              "mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2",
              ac.panelBorder,
              ac.panelSoft,
              ac.iconMuted,
            )}
          >
            <Construction className="h-7 w-7" strokeWidth={2.5} />
          </div>

          <h2 className="font-display mb-3 text-2xl font-black text-slate-950 md:text-3xl">
            Página detalhada em construção
          </h2>

          <p className="mb-7 text-base leading-relaxed text-slate-700">
            Estamos preparando conteúdo completo sobre{" "}
            <span className="font-bold text-slate-950">{subarea.nome}</span>{" "}
            como subárea de{" "}
            <span className="font-bold text-slate-950">{area.nome}</span>. Por
            enquanto, visite a área principal pra entender o contexto.
          </p>

          <Link
            href={`/areas/${parentSlug}`}
            className="bnt-pressable inline-flex items-center gap-2 rounded-2xl border-2 border-slate-950 bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-[4px_4px_0_#0f172a] transition hover:bg-violet-700"
          >
            Ir para {area.nome}
            <ArrowRight className="h-4 w-4" strokeWidth={3} />
          </Link>
        </section>
      </div>
    </div>
  );
}

export default function SubAreaDetalhe() {
  const [, params] = useRoute("/areas/:parent/:subarea");
  const parent = params?.parent;
  const subareaSlug = params?.subarea;

  const parentArea = areasTI.find((a) => a.slug === parent);
  const subarea = parentArea?.subareas?.find((s) => s.slug === subareaSlug);

  if (!parentArea || !subarea) {
    return (
      <Layout>
        <SEO
          title="Subárea não encontrada · Bora na Tech?"
          description="Subárea não encontrada."
          url={`/areas/${parent ?? ""}/${subareaSlug ?? ""}`}
        />
        <div className="container py-20 text-center">
          <p className="font-mono text-sm text-slate-600">
            {parentArea ? "Subárea" : "Área"} não encontrada.
          </p>
          <Link
            href="/areas"
            className="mt-4 inline-flex items-center gap-2 text-violet-700 hover:underline"
          >
            Ver todas as áreas
          </Link>
        </div>
      </Layout>
    );
  }

  const parentSlug = parent as string;
  const hasContent = !!subarea.descricaoCompleta;

  return (
    <Layout>
      <SEO
        title={`${subarea.nome} · ${parentArea.nome} · Bora na Tech?`}
        description={
          subarea.descricaoCurta ??
          `Subárea de ${parentArea.nome}: ${subarea.nome}.`
        }
        url={`/areas/${parentSlug}/${subareaSlug}`}
      />
      {hasContent ? (
        <FullSubArea
          area={parentArea}
          subarea={subarea}
          parentSlug={parentSlug}
        />
      ) : (
        <PlaceholderSubArea
          area={parentArea}
          subarea={subarea}
          parentSlug={parentSlug}
        />
      )}
    </Layout>
  );
}
