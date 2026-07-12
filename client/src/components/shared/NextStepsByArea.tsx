import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen, ExternalLink, FolderGit2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourses } from "@/services/contentService";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { projetos } from "@/lib/data";
import { areaLabel, GENERAL_AREA, type AreaSelection } from "@shared/areas";

interface CourseCard {
  id: string;
  titulo: string;
  canal: string;
  link: string;
  nivel: string;
  areaSlug: string | null;
}

const MAX_ITEMS = 3;

export default function NextStepsByArea({ area }: { area: AreaSelection }) {
  const isGeneral = area === GENERAL_AREA;
  const label = areaLabel(area);
  const { isPro } = useSubscription();

  const [loading, setLoading] = useState(!isGeneral);
  const [courses, setCourses] = useState<CourseCard[]>([]);

  // Projetos vem do catalogo estatico (mesma fonte da pagina /projetos).
  // Sugestao nunca oferece projeto pro a quem nao e assinante: seria um
  // convite pra uma porta trancada.
  const projects = useMemo(() => {
    if (isGeneral) return [];
    return projetos
      .filter((p) => p.areaSlug === area && (p.pro !== true || isPro))
      .slice(0, MAX_ITEMS);
  }, [area, isGeneral, isPro]);

  useEffect(() => {
    if (isGeneral) return;
    let alive = true;
    setLoading(true);

    getCourses({ area })
      .catch(() => [] as unknown[])
      .then((crs) => {
        if (!alive) return;
        const c = (crs as CourseCard[])
          .filter((x) => x.areaSlug === area)
          .slice(0, MAX_ITEMS);
        setCourses(c);
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [area, isGeneral]);

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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-72 bg-slate-200" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Skeleton className="h-28 w-full rounded-2xl bg-slate-200" />
          <Skeleton className="h-28 w-full rounded-2xl bg-slate-200" />
        </div>
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
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
