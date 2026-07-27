import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen, ExternalLink, FolderGit2 } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { cursosGratuitos, projetos } from "@/lib/data";
import { areaLabel, GENERAL_AREA, type AreaSelection } from "@shared/areas";
import {
  recomendarCursos,
  recomendarProjetos,
  type ContextoRecomendacao,
} from "@shared/linkedin/proximosPassos";

interface CourseCard {
  id: string;
  titulo: string;
  canal: string;
  link: string;
  nivel: string;
  areaSlug: string | null;
  /** Por que este item, e não outro. null no modo só-área. */
  motivo: string | null;
}

const MAX_ITEMS = 3;

/**
 * `contexto` ausente = comportamento antigo (só a área). É o que a análise
 * gravada antes da Fase 2B produz, e o que qualquer chamador sem análise
 * produz. Presente, a escolha passa a usar nível, lacunas e dedup.
 */
export default function NextStepsByArea({
  area,
  contexto,
}: {
  area: AreaSelection;
  contexto?: Omit<ContextoRecomendacao, "area" | "isPro">;
}) {
  const isGeneral = area === GENERAL_AREA;
  const label = areaLabel(area);
  const { isPro } = useSubscription();

  // Projetos vem do catalogo estatico (mesma fonte da pagina /projetos).
  // Sugestao nunca oferece projeto pro a quem nao e assinante: seria um
  // convite pra uma porta trancada.
  const projects = useMemo(() => {
    if (isGeneral) return [];
    if (contexto) {
      return recomendarProjetos(projetos as never, {
        ...contexto,
        area,
        isPro,
      }).map((r) => ({ ...r.item, motivo: r.motivo }));
    }
    return projetos
      .filter((p) => p.areaSlug === area && (p.pro !== true || isPro))
      .slice(0, MAX_ITEMS)
      .map((p) => ({ ...p, motivo: null as string | null }));
  }, [area, isGeneral, isPro, contexto]);

  // Cursos tambem do catalogo estatico (mesma fonte da pagina /cursos). Antes
  // vinha de getCourses({area}); a rota /api/content/courses agora e fatiada
  // por tier no servidor e, sem token, serviria so a amostra, sub-representando
  // estas sugestoes por area. A fonte canonica cobre todas as areas.
  const courses = useMemo<CourseCard[]>(() => {
    if (isGeneral) return [];
    const crus = contexto
      ? recomendarCursos(cursosGratuitos as never, {
          ...contexto,
          area,
          isPro,
        }).map((r) => ({ ...r.item, motivo: r.motivo }))
      : cursosGratuitos
          .filter((c) => c.areaSlug === area)
          .slice(0, MAX_ITEMS)
          .map((c) => ({ ...c, motivo: null as string | null }));
    return crus.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      canal: c.canal,
      link: c.link,
      nivel: c.nivel,
      areaSlug: c.areaSlug,
      motivo: c.motivo,
    }));
  }, [area, isGeneral, isPro, contexto]);

  if (isGeneral) {
    // Sem area definida, o quiz e o caminho pros proximos passos.
    return (
      <div className="card-brutal rounded-2xl border-slate-950 bg-violet-50 p-6">
        {/* TODO(Ana): revisar a copy do CTA de quiz na area geral. */}
        <h2 className="font-display text-xl font-black text-slate-950">
          Descubra sua área para receber próximos passos personalizados
        </h2>
        <p className="mt-2 text-sm font-medium text-slate-600">
          Com a sua área definida, a gente indica projetos e cursos certos pra
          continuar depois da análise. O quiz leva poucos minutos.
        </p>
        <Link
          href="/quiz-carreira"
          className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-950 bg-[#FFB800] px-5 py-2.5 font-display text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-px"
        >
          Fazer o quiz de carreira
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (projects.length === 0 && courses.length === 0) return null;

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-black text-slate-950">
        Próximos passos em {label} na BoraNaTech
      </h2>

      {projects.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-600">
              <FolderGit2 className="h-4 w-4" />
              Projetos pra praticar
            </p>
            <Link
              href={`/projetos?area=${area}`}
              className="inline-flex items-center gap-1 text-xs font-black text-violet-700 hover:underline"
            >
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="card-brutal rounded-2xl border-slate-950 bg-white p-4"
              >
                <p className="font-display text-base font-black text-slate-950">
                  {project.nome}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {project.nivel}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-700">
                  {project.objetivo}
                </p>
                {project.motivo ? (
                  <p className="mt-2 border-t-2 border-dashed border-slate-200 pt-2 text-xs font-medium text-violet-800">
                    {project.motivo}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {courses.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-600">
              <BookOpen className="h-4 w-4" />
              Cursos pra estudar
            </p>
            <Link
              href={`/cursos?area=${area}`}
              className="inline-flex items-center gap-1 text-xs font-black text-violet-700 hover:underline"
            >
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {courses.map((course) => (
              <a
                key={course.id}
                href={course.link}
                target="_blank"
                rel="noopener noreferrer"
                className="card-brutal block rounded-2xl border-slate-950 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-base font-black text-slate-950">
                    {course.titulo}
                  </p>
                  <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-500" />
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {course.canal ? `${course.canal} | ` : ""}
                  {course.nivel}
                </p>
                {course.motivo ? (
                  <p className="mt-2 border-t-2 border-dashed border-slate-200 pt-2 text-xs font-medium text-violet-800">
                    {course.motivo}
                  </p>
                ) : null}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
