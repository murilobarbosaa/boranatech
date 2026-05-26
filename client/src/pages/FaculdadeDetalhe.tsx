import { Link, useParams } from "wouter";
import { ArrowLeft, Briefcase, CheckCircle, ExternalLink, GraduationCap, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import FavoriteButton from "@/components/FavoriteButton";
import { faculdades } from "@/lib/data";
import { companies } from "@/lib/companyData";
import { salaryRows } from "@/lib/marketData";
import { technologies } from "@/lib/technologyData";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";

const accent = "violet" as const;
const ac = getPageAccentUi(accent);

function slugifyCourse(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type CourseDetail = {
  summary: string;
  careerOptions: string[];
  salaryAreas: string[];
  coreContents: string[];
  practicalProjects: string[];
  technologies: string[];
  firstJobs: string[];
  roadmap: string[];
  marketContext: string;
  areaSlugs: string[];
};

const courseDetails: Record<string, CourseDetail> = {
  [slugifyCourse("Análise e Desenvolvimento de Sistemas (ADS)")]: {
    summary:
      "ADS é um caminho direto para aprender a criar, manter e entregar sistemas. O curso costuma ser mais prático, com foco em programação, banco de dados, análise de requisitos e desenvolvimento de aplicações para o mercado.",
    careerOptions: ["Desenvolvedor(a) Front-end", "Desenvolvedor(a) Back-end", "Analista de Sistemas", "Analista de Suporte", "QA Júnior"],
    salaryAreas: ["Front-end", "Back-end", "QA"],
    coreContents: ["Lógica de programação", "Banco de dados", "Desenvolvimento web", "Engenharia de software", "Redes e sistemas operacionais", "Gestão de projetos"],
    practicalProjects: ["Sistema CRUD com login", "API REST com banco de dados", "Dashboard administrativo", "Aplicativo web responsivo"],
    technologies: ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "PostgreSQL", "Git"],
    firstJobs: ["Estágio em Desenvolvimento", "Trainee em Tecnologia", "Desenvolvedor(a) Júnior", "Analista de Sistemas Júnior", "Analista de Suporte Técnico"],
    roadmap: ["Reforçar lógica e Git", "Criar páginas com HTML/CSS/JavaScript", "Aprender banco de dados e APIs", "Publicar 2 projetos no GitHub", "Aplicar para estágio, trainee e vagas júnior"],
    marketContext:
      "É uma boa escolha para quem quer entrar mais rápido no mercado. O diploma ajuda, mas o portfólio e a prática com projetos contam muito nas primeiras oportunidades.",
    areaSlugs: ["frontend", "backend", "qa"],
  },
  [slugifyCourse("Ciência da Computação")]: {
    summary:
      "Ciência da Computação aprofunda fundamentos da computação: algoritmos, estruturas de dados, matemática, arquitetura, sistemas operacionais e teoria. É uma formação forte para engenharia, pesquisa, dados, IA e áreas mais complexas.",
    careerOptions: ["Engenheiro(a) de Software", "Cientista de Dados", "Pesquisador(a)", "Desenvolvedor(a) Back-end", "Especialista em IA"],
    salaryAreas: ["Back-end", "Dados", "Cloud"],
    coreContents: ["Algoritmos", "Estruturas de dados", "Matemática discreta", "Cálculo e álgebra", "Sistemas operacionais", "IA e computação científica"],
    practicalProjects: ["Interpretador simples", "Modelo de classificação com dados reais", "Sistema distribuído básico", "Algoritmos visualizados em uma interface"],
    technologies: ["Python", "Java", "C#", "SQL", "TensorFlow", "Pandas", "Linux", "Git"],
    firstJobs: ["Estágio em Engenharia de Software", "Trainee em Engenharia de Software", "Desenvolvedor(a) Júnior", "Analista de Dados Júnior", "Bolsista de pesquisa"],
    roadmap: ["Estudar lógica e estruturas de dados", "Praticar algoritmos semanalmente", "Criar projetos com Python/Java", "Explorar dados ou IA", "Montar portfólio técnico explicando decisões"],
    marketContext:
      "É uma formação mais longa e exigente, mas abre portas para trilhas técnicas profundas, pesquisa, IA, dados e engenharia de software em empresas maiores.",
    areaSlugs: ["backend", "dados", "ia"],
  },
  [slugifyCourse("Engenharia de Software")]: {
    summary:
      "Engenharia de Software foca em construir software com qualidade, processo e escala. Além de programar, a pessoa aprende requisitos, arquitetura, testes, métricas, manutenção e colaboração em times.",
    careerOptions: ["Engenheiro(a) de Software", "Arquiteto(a) de Software", "QA Engineer", "Tech Lead", "Product Engineer"],
    salaryAreas: ["Back-end", "Front-end", "QA", "DevOps"],
    coreContents: ["Requisitos", "Arquitetura de software", "Testes e qualidade", "Metodologias ágeis", "DevOps", "Manutenção e evolução de sistemas"],
    practicalProjects: ["Sistema com testes automatizados", "API documentada", "Pipeline simples de CI/CD", "Aplicação com arquitetura em camadas"],
    technologies: ["TypeScript", "React", "Node.js", "Java", "Docker", "PostgreSQL", "Git"],
    firstJobs: ["Estágio em Engenharia de Software", "Trainee em Tecnologia", "Desenvolvedor(a) Júnior", "QA Júnior", "Analista de Requisitos Júnior"],
    roadmap: ["Aprender fundamentos de programação", "Praticar Git e versionamento", "Criar projetos com testes", "Entender arquitetura e deploy", "Documentar projetos como produto real"],
    marketContext:
      "Combina bem com quem gosta de programar, mas também quer entender qualidade, organização, entrega em equipe e manutenção de sistemas profissionais.",
    areaSlugs: ["backend", "frontend", "qa", "devops"],
  },
  [slugifyCourse("Sistemas de Informação")]: {
    summary:
      "Sistemas de Informação conecta tecnologia e negócio. A formação prepara para entender processos, dados, sistemas corporativos e como a TI resolve problemas reais dentro de empresas.",
    careerOptions: ["Analista de Sistemas", "Consultor(a) de TI", "Analista de Dados", "Product Owner", "Gestor(a) de TI"],
    salaryAreas: ["Dados", "Produto", "Back-end"],
    coreContents: ["Processos de negócio", "Banco de dados", "Desenvolvimento de sistemas", "Gestão de TI", "Análise de requisitos", "BI e tomada de decisão"],
    practicalProjects: ["Sistema para processo empresarial", "Dashboard de indicadores", "Mapeamento de requisitos", "Protótipo de produto interno"],
    technologies: ["SQL", "Python", "Power BI", "React", "PostgreSQL", "Figma", "Git"],
    firstJobs: ["Estágio em TI", "Trainee em Tecnologia", "Analista de Sistemas Júnior", "Analista de Dados Júnior", "Consultor(a) de TI Júnior"],
    roadmap: ["Entender lógica e banco de dados", "Aprender análise de requisitos", "Criar dashboards e sistemas simples", "Estudar produto e processos", "Registrar cases com problema, solução e resultado"],
    marketContext:
      "É uma boa opção para quem quer uma formação versátil e gosta de traduzir necessidade de negócio em solução tecnológica.",
    areaSlugs: ["dados", "produto", "backend"],
  },
};

export default function FaculdadeDetalhe() {
  const params = useParams<{ slug: string }>();
  const course = faculdades.cursos.find((item) => slugifyCourse(item.nome) === params.slug);
  const detail = params.slug ? courseDetails[params.slug] : undefined;

  if (!course || !detail) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="mb-4 text-5xl">🎓</p>
          <h1 className="font-display mb-2 text-2xl font-black text-slate-950">Curso não encontrado</h1>
          <p className="mb-6 text-slate-950">Esse curso não existe ou ainda não tem uma página detalhada.</p>
          <Link href="/faculdades" className={cn("inline-flex items-center gap-2 font-bold", ac.link, ac.linkHover)}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para faculdades
          </Link>
        </div>
      </Layout>
    );
  }

  const relatedTechnologies = technologies.filter((technology) => detail.technologies.includes(technology.name));
  const relatedCompanies = companies.filter((company) => company.areas.some((area) => detail.areaSlugs.includes(area))).slice(0, 4);
  const relatedSalaries = salaryRows.filter((row) => detail.salaryAreas.includes(String(row.area))).slice(0, 5);

  return (
    <Layout>
      <PageHero
        accent={accent}
        eyebrow={`${course.tipo} · ${course.duracao}`}
        title={course.nome}
        subtitle={course.perfilIndicado}
        topSlot={
          <Link href="/faculdades" className={cn("inline-flex items-center gap-2 text-sm font-bold", ac.link, ac.linkHover)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Todos os cursos superiores
          </Link>
        }
        titlePrefix={
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-white text-slate-900 shadow-[4px_4px_0_#0f172a]">
            <GraduationCap className="h-9 w-9" aria-hidden />
          </span>
        }
        actions={<FavoriteButton item={{ id: slugifyCourse(course.nome), type: "faculdade", title: course.nome, subtitle: course.tipo }} />}
      />

      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-3">
            <main className="space-y-8 lg:col-span-2">
            <section className="card-brutal rounded-xl bg-white p-6">
              <h2 className="font-display mb-3 text-xl font-black text-slate-950">O que é esse curso?</h2>
              <p className="leading-relaxed text-slate-700">{detail.summary}</p>
            </section>

            <section className="card-brutal rounded-xl bg-white p-6">
              <h2 className="font-display mb-4 text-xl font-black text-slate-950">Conteúdos que você deve estudar</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {detail.coreContents.map((content) => (
                  <div key={content} className="flex items-start gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700">
                    <CheckCircle className={cn("mt-0.5 h-4 w-4 shrink-0", ac.iconMuted)} aria-hidden />
                    {content}
                  </div>
                ))}
              </div>
            </section>

            <section className={cn("card-brutal rounded-xl border-2 p-6", ac.panelBorder, ac.panelSoft)}>
              <h2 className="font-display mb-3 text-xl font-black text-slate-950">Quem combina com esse curso?</h2>
              <p className="text-slate-700">{course.perfilIndicado}</p>
              <p className="mt-3 text-sm font-medium text-slate-600">{detail.marketContext}</p>
            </section>

            <section className="card-brutal rounded-xl bg-white p-6">
              <h2 className="font-display mb-4 text-xl font-black text-slate-950">Opções de carreira depois do curso</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {detail.careerOptions.map((career) => (
                  <div key={career} className={cn("rounded-xl border-2 p-4", ac.panelBorder, ac.panelSoft)}>
                    <Briefcase className={cn("mb-2 h-5 w-5", ac.iconMuted)} aria-hidden />
                    <p className={cn("font-bold", ac.tbodyAccentBold)}>{career}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card-brutal rounded-xl bg-white p-6">
              <h2 className="font-display mb-4 text-xl font-black text-slate-950">Projetos para provar conhecimento</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {detail.practicalProjects.map((project) => (
                  <div key={project} className={cn("rounded-xl border-2 p-4 text-sm font-bold text-slate-800", ac.panelBorder, ac.panelSoft)}>
                    {project}
                  </div>
                ))}
              </div>
              <Link href="/projetos" className={cn("mt-4 inline-flex items-center gap-1 text-sm font-bold", ac.link, ac.linkHover)}>
                Ver ideias de projetos <ExternalLink className="h-3 w-3" />
              </Link>
            </section>

            <section className="card-brutal rounded-xl bg-white p-6">
              <h2 className="font-display mb-4 text-xl font-black text-slate-950">Roadmap inicial</h2>
              <div className="space-y-3">
                {detail.roadmap.map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-black text-white", ac.tableBanner)}>{index + 1}</span>
                    <p className="pt-1 text-sm font-medium text-slate-700">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card-brutal rounded-xl bg-white p-6">
              <h2 className="font-display mb-4 text-xl font-black text-slate-950">Empresas relacionadas</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {relatedCompanies.map((company) => (
                  <Link key={company.slug} href={`/empresas/${company.slug}`} className={cn("rounded-xl border-2 border-slate-200 bg-slate-50 p-4 transition-colors", ac.cardHover)}>
                    <span className="font-display block font-black text-slate-950">{company.name}</span>
                    <span className="text-sm font-medium text-slate-600">{company.segment} · {company.city}</span>
                    <span className={cn("mt-2 block text-xs font-bold", ac.tbodyAccentBold)}>Júnior: {company.juniorSalary}</span>
                  </Link>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-5">
            <div className={cn("card-brutal rounded-xl border-2 bg-white p-6", ac.panelBorder, ac.panelSoft)}>
              <h3 className={cn("font-display mb-4 text-lg font-black", ac.tbodyAccentBold)}>Resumo rápido</h3>
              <div className="space-y-3 text-sm text-slate-900">
                <div>
                  <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>Duração</p>
                  <p className="font-bold">{course.duracao}</p>
                </div>
                <div>
                  <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>Tipo</p>
                  <p className="font-bold">{course.tipo}</p>
                </div>
                <div>
                  <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>Programação</p>
                  <p className="font-bold">{course.programacao}</p>
                </div>
                <div>
                  <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>Matemática</p>
                  <p className="font-bold">{course.matematica}</p>
                </div>
              </div>
            </div>

            <div className={cn("card-brutal rounded-xl border-2 bg-white p-5", ac.panelBorder)}>
              <h3 className="font-display mb-3 font-black text-slate-950">Salários médios relacionados</h3>
              <div className="space-y-3">
                {relatedSalaries.map((row) => (
                  <div key={`${row.area}-${row.level}-${row.city}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className={cn("text-xs font-black uppercase", ac.tbodyAccentBold)}>{String(row.area)} · {String(row.level)}</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">CLT: R$ {Number(row.clt).toLocaleString("pt-BR")}</p>
                    <p className="text-xs font-medium text-slate-600">PJ: R$ {Number(row.pj).toLocaleString("pt-BR")} · {String(row.city)}</p>
                  </div>
                ))}
              </div>
              <Link href="/salarios" className={cn("mt-3 inline-flex items-center gap-1 text-xs font-bold", ac.link, ac.linkHover)}>
                Ver tabela salarial <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className={cn("card-brutal rounded-xl border-2 bg-white p-5", ac.panelBorder)}>
              <h3 className="font-display mb-3 font-black text-slate-950">Tecnologias úteis</h3>
              <div className="flex flex-wrap gap-2">
                {relatedTechnologies.map((technology) => (
                  <Link key={technology.slug} href={`/tecnologias/${technology.slug}`} className={cn("rounded-full border-2 px-3 py-1.5 text-xs font-black", ac.panelBorder, ac.panelSoft, ac.tbodyAccentBold)}>
                    {technology.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className={cn("card-brutal rounded-xl border-2 bg-white p-5", ac.panelBorder)}>
              <h3 className="font-display mb-3 font-black text-slate-950">Primeiras vagas para mirar</h3>
              <ul className="space-y-2">
                {detail.firstJobs.map((job) => (
                  <li key={job} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className={cn("mt-0.5 h-4 w-4 shrink-0", ac.iconMuted)} aria-hidden />
                    {job}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-brutal rounded-xl border-red-200 bg-red-50 p-5">
              <h3 className="font-display mb-3 font-black text-slate-950">Pontos de atenção</h3>
              <ul className="space-y-2">
                {course.pontosAtencao.map((point) => (
                  <li key={point} className="text-sm font-medium text-slate-700">{point}</li>
                ))}
              </ul>
            </div>

            <div className={cn("card-brutal rounded-xl border-2 p-5", ac.panelBorder, ac.panelSoft)}>
              <div className="mb-3 flex items-center gap-3">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 text-white shadow-[2px_2px_0_#0f172a]", ac.tableBanner)}>
                  <Sparkles className="h-5 w-5 text-white" aria-hidden />
                </span>
                <p className="font-display text-sm font-bold text-slate-900">Quer comparar com outros caminhos?</p>
              </div>
              <Link href="/comparador" className="btn-brutal-accent block rounded-lg py-2.5 text-center text-sm font-black">
                Abrir comparador
              </Link>
            </div>
          </aside>
        </div>
      </div>
      </section>
    </Layout>
  );
}
