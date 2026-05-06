/*
  BORA NA TECH? — Estágio e Carreira Page
  Style: Neo-Brutalism Suavizado
*/

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, Briefcase, Linkedin, FileText, Code2, Github, Lightbulb, Rocket, Sparkles, CheckCircle2, Target } from "lucide-react";
import Layout from "@/components/Layout";
import { vagasInfo, linkedinDicas } from "@/lib/data";
import { careerInstitutes } from "@/lib/platformData";
import { getJobs } from "@/services/contentService";

const tabs = ["Vagas, Estágio e Trainee", "LinkedIn e Carreira", "Portifólio", "Institutos"];

const portfolioPillars = [
  {
    title: "Mostre o problema",
    desc: "Explique para quem o projeto foi feito e qual dor ele resolve. Isso mostra pensamento de produto, não só código.",
    icon: <Lightbulb className="h-5 w-5" />,
    bg: "bg-yellow-200",
  },
  {
    title: "Conte seu processo",
    desc: "Inclua decisões, aprendizados, dificuldades e próximos passos. Recrutadores valorizam clareza de raciocínio.",
    icon: <Sparkles className="h-5 w-5" />,
    bg: "bg-violet-200",
  },
  {
    title: "Facilite o teste",
    desc: "Publique demo, prints, repositório e instruções simples para qualquer pessoa conseguir entender seu trabalho.",
    icon: <Rocket className="h-5 w-5" />,
    bg: "bg-emerald-200",
  },
];

const portfolioLevels = [
  {
    level: "Nível 1",
    title: "Portifólio de início",
    goal: "Provar que você está estudando com consistência e sabe finalizar uma entrega simples.",
    deliverable: "1 projeto pequeno publicado, README básico, prints da tela e um post curto contando o aprendizado.",
    done: "A pessoa consegue abrir o link, entender o objetivo em menos de 1 minuto e ver o projeto funcionando.",
    color: "bg-emerald-200 text-emerald-900 border-emerald-300",
  },
  {
    level: "Nível 2",
    title: "Portifólio de aplicação",
    goal: "Mostrar domínio inicial de ferramentas, organização e resolução de problemas reais.",
    deliverable: "2 a 3 projetos com demo, README completo, decisões técnicas e melhorias planejadas.",
    done: "Cada projeto explica problema, solução, tecnologias, como rodar e o que você faria na próxima versão.",
    color: "bg-amber-200 text-amber-900 border-amber-300",
  },
  {
    level: "Nível 3",
    title: "Portifólio para vaga",
    goal: "Conectar seus projetos à vaga desejada e facilitar a avaliação de recrutadores e pessoas técnicas.",
    deliverable: "Página pessoal ou GitHub fixado com projetos alinhados à área, currículo e LinkedIn conectados.",
    done: "Seu perfil responde: quem você é, que tipo de vaga busca, o que já construiu e como entrar em contato.",
    color: "bg-violet-200 text-violet-900 border-violet-300",
  },
];

const portfolioChecklist = [
  "Nome claro do projeto e uma frase explicando o objetivo.",
  "Link da demo online, vídeo curto ou imagens da aplicação funcionando.",
  "README com tecnologias, como rodar, principais telas e aprendizados.",
  "Código organizado, sem arquivos desnecessários e com commits legíveis.",
  "Descrição do seu papel: o que você fez, decidiu, pesquisou ou melhorou.",
  "Próximos passos realistas para mostrar evolução contínua.",
];

const portfolioProjectIdeas = [
  {
    title: "Landing page responsiva",
    desc: "Uma página para ONG, evento, curso ou negócio local com boa hierarquia visual.",
    tag: "Frontend",
  },
  {
    title: "Dashboard simples",
    desc: "Consuma dados públicos e mostre cards, filtros e gráficos fáceis de ler.",
    tag: "Dados",
  },
  {
    title: "API de catálogo",
    desc: "Crie endpoints para listar, criar, editar e remover itens com documentação básica.",
    tag: "Backend",
  },
  {
    title: "Estudo de UX",
    desc: "Redesenhe uma tela real explicando problema, pesquisa, wireframe e solução.",
    tag: "Produto",
  },
];

const readmeSections = ["Contexto", "Funcionalidades", "Tecnologias", "Como rodar", "Prints ou demo", "Aprendizados", "Próximos passos"];

type EstagioProps = {
  initialTab?: number;
};

type ExternalJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  seniority: string;
  url: string;
  areaSlug: string;
  publishedAt: string | null;
};

export default function Estagio({ initialTab = 0 }: EstagioProps) {
  const [tab, setTab] = useState(initialTab);
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  useEffect(() => {
    getJobs({ limit: 30 })
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setJobsLoading(false));
  }, []);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-amber-100 py-12 border-b-2 border-slate-900">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#d97706_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">primeira oportunidade</p>
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">Estágio, Trainee e Carreira em TI</h1>
            <p className="text-slate-950 text-lg">
              Onde buscar sua primeira vaga, como montar um LinkedIn e dicas para se destacar no mercado.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-amber-50 border-b-2 border-amber-200 sticky top-16 z-40">
        <div className="container">
          <div className="flex">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  tab === i
                    ? "border-amber-500 text-amber-700"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffbeb] py-12">
        <div className="container">
          <div className="mb-10 grid gap-5 md:grid-cols-2">
            <Link href="/empregabilidade" className="card-brutal block rounded-2xl border-violet-300 bg-violet-50 p-5">
              <span className="mb-2 inline-flex rounded-full bg-violet-700 px-2 py-1 text-xs font-black text-white">Plano Pro</span>
              <h2 className="font-display text-xl font-black text-slate-950">Analisador de Vaga</h2>
              <p className="mt-2 text-sm text-slate-600">Cole uma vaga e descubra se vale aplicar agora e o que estudar nos próximos 7 dias.</p>
            </Link>
            <Link href="/empregabilidade" className="card-brutal block rounded-2xl border-violet-300 bg-white p-5">
              <span className="mb-2 inline-flex rounded-full bg-violet-700 px-2 py-1 text-xs font-black text-white">Plano Pro</span>
              <h2 className="font-display text-xl font-black text-slate-950">Calculadora de Prontidão</h2>
              <p className="mt-2 text-sm text-slate-600">Veja o que você já tem, o que falta e um plano de ação para chegar à primeira vaga.</p>
            </Link>
          </div>

          {/* Tab 0: Vagas */}
          {tab === 0 && (
            <div>
              {/* Tipos de vaga */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {vagasInfo.diferencas.map((d) => (
                  <div key={d.tipo} className="card-brutal bg-white rounded-xl p-5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border mb-3 inline-block ${
                      d.tipo === "Estágio" ? "bg-amber-100 text-amber-700 border-amber-200" :
                      d.tipo === "Trainee" ? "bg-blue-100 text-blue-700 border-blue-200" :
                      d.tipo === "Júnior" ? "bg-violet-100 text-violet-700 border-violet-200" :
                      "bg-blue-100 text-blue-700 border-blue-200"
                    }`}>
                      {d.tipo}
                    </span>
                    <p className="text-sm text-slate-700">{d.descricao}</p>
                  </div>
                ))}
              </div>

              {/* Plataformas de vagas */}
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-6">Onde buscar vagas</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {vagasInfo.plataformas.map((plat) => (
                  <a
                    key={plat.nome}
                    href={plat.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-brutal bg-white rounded-xl p-5 flex flex-col group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{plat.nome}</h3>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <p className="text-sm text-slate-600 flex-1">{plat.descricao}</p>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-amber-600 font-medium">Buscar vagas →</span>
                    </div>
                  </a>
                ))}
              </div>

              <div className="mb-10">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-slate-900">Vagas tech sincronizadas</h2>
                    <p className="mt-1 text-sm text-slate-600">Lista alimentada pela API de vagas quando a integração estiver configurada.</p>
                  </div>
                  {jobsLoading && <span className="text-xs font-bold text-amber-700">Carregando vagas...</span>}
                </div>

                {jobs.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.slice(0, 6).map((job) => (
                      <a key={job.id} href={job.url} target="_blank" rel="noopener noreferrer" className="card-brutal bg-white rounded-xl p-5">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{job.seniority}</span>
                          {job.remote && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">remoto</span>}
                        </div>
                        <h3 className="font-display font-bold text-slate-900">{job.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{job.company} · {job.location}</p>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-amber-700">
                          Ver vaga <ExternalLink className="h-3 w-3" />
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-amber-200 bg-white p-5 text-sm font-semibold text-slate-600">
                    Nenhuma vaga externa sincronizada ainda. Use as plataformas acima enquanto a integração Jooble não tiver uma chave configurada.
                  </div>
                )}
              </div>

              {/* Palavras-chave */}
              <div className="card-brutal bg-amber-50 rounded-xl p-6 border-amber-200 mb-8">
                <h3 className="font-display font-bold text-lg text-slate-900 mb-3">Palavras-chave para buscar</h3>
                <div className="flex flex-wrap gap-2">
                  {vagasInfo.palavrasChave.map((p) => (
                    <span key={p} className="px-3 py-1.5 bg-amber-100 border-2 border-amber-300 rounded-lg text-sm font-medium text-amber-800 font-mono">
                      "{p}"
                    </span>
                  ))}
                </div>
              </div>

              {/* Dicas currículo e portfólio */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card-brutal bg-white rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <h3 className="font-display font-bold text-lg text-slate-900">Dicas de currículo</h3>
                  </div>
                  <ul className="space-y-2">
                    {vagasInfo.dicasCurriculo.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card-brutal bg-white rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-violet-600" />
                    <h3 className="font-display font-bold text-lg text-slate-900">Dicas de portfólio</h3>
                  </div>
                  <ul className="space-y-2">
                    {vagasInfo.dicasPortfolio.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: LinkedIn */}
          {tab === 1 && (
            <div className="max-w-3xl">
              <div className="card-brutal bg-blue-700 rounded-xl p-6 text-white mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Linkedin className="w-6 h-6" />
                  <h2 className="font-display font-bold text-xl">LinkedIn para quem está começando</h2>
                </div>
                <p className="text-blue-100">
                  O LinkedIn é a principal rede profissional de tecnologia. Mesmo sem experiência, um perfil bem feito pode abrir portas para estágios, trainees e primeiras oportunidades.
                </p>
              </div>

              {/* Título */}
              <div className="card-brutal bg-white rounded-xl p-6 mb-5">
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">Título profissional</h3>
                <p className="text-sm text-slate-600 mb-3">{linkedinDicas.titulo.dicas}</p>
                <div className="space-y-2">
                  {linkedinDicas.titulo.exemplos.map((ex, i) => (
                    <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800 italic">
                      "{ex}"
                    </div>
                  ))}
                </div>
              </div>

              {/* Sobre */}
              <div className="card-brutal bg-white rounded-xl p-6 mb-5">
                <h3 className="font-display font-bold text-lg text-slate-900 mb-2">Seção "Sobre"</h3>
                <p className="text-sm text-slate-600 mb-3">{linkedinDicas.sobre.dicas}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 italic">
                  "{linkedinDicas.sobre.exemplo}"
                </div>
              </div>

              {/* Erros comuns */}
              <div className="card-brutal bg-red-50 rounded-xl p-6 border-red-200 mb-5">
                <h3 className="font-display font-bold text-lg text-slate-900 mb-3">❌ Erros comuns a evitar</h3>
                <ul className="space-y-2">
                  {linkedinDicas.errosComuns.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ideias de posts */}
              <div className="card-brutal bg-amber-50 rounded-xl p-6 border-amber-200">
                <h3 className="font-display font-bold text-lg text-slate-900 mb-3">💡 Ideias de posts para iniciantes</h3>
                <div className="space-y-2">
                  {linkedinDicas.ideasPosts.map((post, i) => (
                    <div key={i} className="bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm text-slate-700 italic">
                      "{post}"
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 2 && (
            <div>
              <div className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
                <div className="card-brutal rounded-2xl bg-violet-700 p-7 text-white">
                  <p className="mb-4 inline-flex rounded-full border-2 border-white bg-yellow-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">prova do seu aprendizado</p>
                  <h2 className="font-display text-3xl font-black">Portifólio para começar em tecnologia</h2>
                  <p className="mt-3 text-sm leading-relaxed text-violet-100">
                    Seu portifólio não precisa parecer de pessoa sênior. Ele precisa mostrar que você aprende, termina entregas pequenas e sabe explicar o que construiu.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["GitHub organizado", "Demo publicada", "README caprichado", "Aprendizados visíveis"].map((item) => (
                      <span key={item} className="rounded-full border-2 border-white bg-white/15 px-3 py-1 text-xs font-black text-white">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="card-brutal rounded-2xl bg-amber-300 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Github className="h-6 w-6 text-slate-950" />
                    <h3 className="font-display text-xl font-black text-slate-950">Regra simples</h3>
                  </div>
                  <p className="text-sm font-semibold leading-relaxed text-slate-800">
                    Prefira 3 projetos pequenos, bem explicados e publicados a 10 repositórios incompletos. O objetivo é provar consistência, curiosidade e comunicação.
                  </p>
                </div>
              </div>

              <div className="mb-10">
                <div className="mb-5 max-w-2xl">
                  <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">evolua por etapas</p>
                  <h3 className="font-display text-2xl font-black text-slate-950">Níveis e objetivos do portifólio</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Use os níveis como um mapa: comece provando constância, depois melhore apresentação e, por fim, conecte seus projetos à vaga que você quer.
                  </p>
                </div>
                <div className="grid gap-5 lg:grid-cols-3">
                  {portfolioLevels.map((item) => (
                    <div key={item.level} className="card-brutal rounded-2xl bg-white p-6">
                      <span className={`mb-4 inline-flex rounded-full border-2 px-3 py-1 text-xs font-black uppercase ${item.color}`}>
                        {item.level}
                      </span>
                      <h4 className="font-display text-xl font-black text-slate-950">{item.title}</h4>
                      <div className="mt-4 space-y-4">
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-sm font-black text-slate-950">
                            <Target className="h-4 w-4 text-violet-700" />
                            Objetivo
                          </div>
                          <p className="text-sm text-slate-600">{item.goal}</p>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-sm font-black text-slate-950">
                            <Rocket className="h-4 w-4 text-amber-700" />
                            Entrega
                          </div>
                          <p className="text-sm text-slate-600">{item.deliverable}</p>
                        </div>
                        <div className="rounded-xl border-2 border-slate-100 bg-slate-50 p-3">
                          <div className="mb-1 flex items-center gap-2 text-sm font-black text-slate-950">
                            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                            Concluído quando
                          </div>
                          <p className="text-sm text-slate-600">{item.done}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-10 grid gap-4 md:grid-cols-3">
                {portfolioPillars.map((pillar) => (
                  <div key={pillar.title} className="card-brutal rounded-xl bg-white p-5">
                    <div className={`mb-4 inline-flex rounded-xl border-2 border-slate-900 p-2 text-slate-950 ${pillar.bg}`}>
                      {pillar.icon}
                    </div>
                    <h3 className="font-display text-lg font-black text-slate-950">{pillar.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{pillar.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mb-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="card-brutal rounded-xl bg-white p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-display text-xl font-black text-slate-950">Checklist antes de divulgar</h3>
                  </div>
                  <ul className="space-y-3">
                    {portfolioChecklist.map((item, i) => (
                      <li key={item} className="flex gap-3 text-sm text-slate-700">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">{i + 1}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-display mb-4 text-2xl font-black text-slate-950">Ideias de projetos publicáveis</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {portfolioProjectIdeas.map((idea) => (
                      <div key={idea.title} className="card-invite rounded-xl bg-white p-5">
                        <span className="mb-3 inline-flex rounded-full border-2 border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700">{idea.tag}</span>
                        <h4 className="font-display text-lg font-black text-slate-950">{idea.title}</h4>
                        <p className="mt-2 text-sm text-slate-600">{idea.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card-brutal rounded-xl bg-amber-50 p-6 border-amber-200">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-700" />
                    <h3 className="font-display text-xl font-black text-slate-950">Estrutura de README</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {readmeSections.map((section) => (
                      <span key={section} className="rounded-lg border-2 border-amber-300 bg-white px-3 py-1.5 text-sm font-bold text-amber-800">
                        {section}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card-brutal rounded-xl bg-white p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-violet-700" />
                    <h3 className="font-display text-xl font-black text-slate-950">Como apresentar no LinkedIn</h3>
                  </div>
                  <p className="text-sm text-slate-600">
                    Publique com contexto, uma imagem ou vídeo curto, o link do projeto e uma frase sobre o que você aprendeu. Termine pedindo feedback específico, como acessibilidade, código ou design.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 3 && (
            <div>
              <div className="mb-8 max-w-2xl">
                <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">participar também abre portas</p>
                <h2 className="font-display text-3xl font-black text-slate-950">Institutos e organizações para acompanhar</h2>
                <p className="mt-2 text-sm text-slate-600">Entrar em comunidades profissionais ajuda a conhecer eventos, mentorias, certificações e oportunidades.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {careerInstitutes.map((institute) => (
                  <a key={institute.name} href={institute.url} target="_blank" rel="noopener noreferrer" className="card-invite rounded-2xl bg-white p-6">
                    <h3 className="font-display text-xl font-black text-slate-950">{institute.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{institute.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-amber-700">
                      Conhecer instituto <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
