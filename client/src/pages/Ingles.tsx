import { BookOpen, Bot, CheckCircle, MessageSquareText, PlayCircle, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import PageHero from "@/components/shared/PageHero";
import VideoEmbedDialog from "@/components/shared/VideoEmbedDialog";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { englishVocabulary } from "@/lib/careerToolsData";

const ac = getPageAccentUi("sky");

const englishByArea = [
  { area: "Front-end", level: "Básico para documentação", focus: "HTML, CSS, JavaScript, mensagens de erro, acessibilidade e documentação de bibliotecas." },
  { area: "Back-end", level: "Intermediário recomendado", focus: "APIs, banco de dados, autenticação, logs, documentação técnica e troubleshooting." },
  { area: "Dados / IA", level: "Intermediário recomendado", focus: "Artigos, notebooks, datasets, estatística, documentação de bibliotecas e papers simples." },
  { area: "DevOps / Cloud", level: "Intermediário forte", focus: "Documentação oficial, mensagens de terminal, incidentes, logs, cloud e segurança." },
  { area: "UX/UI e Produto", level: "Básico a intermediário", focus: "Research, usability, product discovery, métricas, benchmarks e apresentações." },
  { area: "QA / Testes", level: "Básico a intermediário", focus: "Bug reports, test cases, acceptance criteria, API testing e documentação de ferramentas." },
];

const cursorTips = [
  {
    title: "Peça explicações em inglês simples",
    prompt: "Explain this code in simple English, using short sentences and a glossary at the end.",
    desc: "Ajuda a praticar leitura técnica sem travar em frases longas.",
  },
  {
    title: "Transforme erro em aula",
    prompt: "Explain this error like I am learning English for tech. Highlight the key technical words.",
    desc: "Cole mensagens de erro e peça vocabulário, causa provável e próximos passos.",
  },
  {
    title: "Treine README bilíngue",
    prompt: "Rewrite this README section in clear beginner-friendly English, keeping the technical meaning.",
    desc: "Ótimo para portfólio, GitHub e candidaturas internacionais.",
  },
  {
    title: "Simule entrevista técnica",
    prompt: "Interview me in English for a junior front-end role. Ask one question at a time and correct my answer kindly.",
    desc: "Use para praticar respostas curtas sem decorar texto pronto.",
  },
  {
    title: "Crie flashcards do projeto",
    prompt: "Create 10 English flashcards from this codebase: term, meaning, example sentence.",
    desc: "Transforma o projeto atual em material de revisão.",
  },
  {
    title: "Corrija sem perder sua voz",
    prompt: "Correct my English, but keep my tone natural and explain the top 3 corrections.",
    desc: "Bom para posts, mensagens no LinkedIn, issues e pull requests.",
  },
];

const videoResources = [
  { title: "BBC Learning English", desc: "Aulas curtas de vocabulário, pronúncia e listening.", sampleId: "WHCsOQvDkeQ", url: "https://www.youtube.com/@bbclearningenglish" },
  { title: "English with Lucy", desc: "Pronúncia, frases úteis e inglês cotidiano com boa didática.", sampleId: "jrwglP9EQOU", url: "https://www.youtube.com/@EnglishwithLucy" },
  { title: "freeCodeCamp Talks", desc: "Vídeos longos de tecnologia para treinar listening técnico com legenda.", sampleId: "nLRL_NcnK-4", url: "https://www.youtube.com/@freecodecamp" },
  { title: "Google Cloud Tech", desc: "Tech talks e demos para cloud, dados, IA e infraestrutura.", sampleId: "kzKFuHk8ovk", url: "https://www.youtube.com/@googlecloudtech" },
  { title: "Fireship", desc: "Vídeos rápidos sobre tecnologias modernas, ótimo para vocabulário tech.", sampleId: "DHjqpvDnNGE", url: "https://www.youtube.com/@Fireship" },
  { title: "ThePrimeagen", desc: "Conteúdo dev em inglês natural, bom para quem já tem base.", sampleId: "3q67v12M31M", url: "https://www.youtube.com/@ThePrimeTimeagen" },
];

const studyMaterials = [
  { title: "MDN Web Docs", type: "Documentação", desc: "Leia uma página curta por semana e anote termos repetidos.", url: "https://developer.mozilla.org/" },
  { title: "GitHub Docs", type: "Documentação", desc: "Aprenda palavras de issues, pull requests, branches e colaboração.", url: "https://docs.github.com/" },
  { title: "Microsoft Learn", type: "Curso", desc: "Módulos guiados com vocabulário de cloud, dados e carreira.", url: "https://learn.microsoft.com/training/" },
  { title: "Kaggle Learn", type: "Curso", desc: "Ótimo para treinar inglês em Python, dados e machine learning.", url: "https://www.kaggle.com/learn" },
  { title: "roadmap.sh", type: "Mapa", desc: "Use os mapas para aprender nomes de conceitos em inglês.", url: "https://roadmap.sh/" },
  { title: "Dev.to", type: "Artigos", desc: "Leia relatos e tutoriais curtos escritos por devs do mundo todo.", url: "https://dev.to/" },
  { title: "Stack Overflow", type: "Comunidade", desc: "Leia perguntas e respostas para entender erros reais em inglês.", url: "https://stackoverflow.com/" },
  { title: "Write the Docs", type: "Escrita", desc: "Referência para escrever documentação clara e profissional.", url: "https://www.writethedocs.org/" },
];

const practicePlan = [
  { day: "Segunda", task: "Ler 1 página de documentação e grifar 10 termos." },
  { day: "Terça", task: "Assistir 1 vídeo curto com legenda em inglês." },
  { day: "Quarta", task: "Pedir à IA para explicar um erro ou trecho de código em inglês simples." },
  { day: "Quinta", task: "Escrever 5 frases sobre seu projeto usando vocabulário técnico." },
  { day: "Sexta", task: "Atualizar uma parte do README em inglês." },
  { day: "Sábado", task: "Simular 3 perguntas de entrevista técnica em inglês." },
  { day: "Domingo", task: "Revisar flashcards e separar dúvidas da semana." },
];

const usefulPhrases = [
  "I built this project to practice...",
  "The main challenge was...",
  "I fixed a bug related to...",
  "This function is responsible for...",
  "The next step is to improve...",
  "I am still learning, but I can explain my reasoning.",
  "Could you clarify the requirement?",
  "I tested this feature by...",
  "This pull request adds...",
  "I chose this approach because...",
];

export default function Ingles() {
  return (
    <Layout>
      <PageHero
        accent="sky"
        eyebrow="inglês no trabalho"
        title="Inglês para Tech"
        subtitle="Você não precisa ser fluente para começar. Precisa criar contato diário com documentação, erro, vídeo, README e conversa técnica."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card-brutal rounded-2xl bg-white p-6 lg:col-span-2">
              <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">comece pelo uso real</p>
              <h2 className="font-display text-3xl font-black text-slate-950">O inglês que mais aparece na tecnologia</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                O objetivo não é falar perfeito. É conseguir ler documentação, entender mensagens de erro, pesquisar dúvidas, explicar seu projeto e participar de processos seletivos com mais confiança.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {["Documentação", "Erros e terminal", "Portfólio e entrevista"].map((item) => (
                  <div key={item} className={cn("rounded-xl border-2 p-4", ac.panelBorder, ac.panelSoft)}>
                    <CheckCircle className={cn("mb-2 h-5 w-5", ac.iconMuted)} />
                    <p className="font-display text-lg font-black text-slate-950">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-brutal rounded-2xl bg-sky-100 p-6">
              <h3 className="font-display text-2xl font-black text-slate-950">Meta simples</h3>
              <p className="mt-3 text-sm font-bold text-slate-800">
                20 minutos por dia: 10 lendo, 5 ouvindo, 5 escrevendo uma frase sobre o que você estudou.
              </p>
              <p className={cn("mt-4 rounded-xl border-2 border-slate-900 bg-white p-3 text-xs font-black", ac.tbodyAccentBold)}>
                Inglês técnico cresce por repetição, não por maratona.
              </p>
            </div>
          </div>

          <div className="card-brutal overflow-hidden rounded-2xl bg-white">
            <div className={cn("border-b-2 border-slate-900 p-5", ac.tableBanner)}>
              <h2 className="font-display text-2xl font-black">Inglês mínimo por área</h2>
              <p className={cn("mt-1 text-sm", ac.tableBannerMuted)}>Use isso para priorizar o que estudar primeiro.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className={cn(ac.theadLight)}>
                  <tr>
                    <th className="p-3 text-left">Área</th>
                    <th className="p-3 text-left">Nível recomendado</th>
                    <th className="p-3 text-left">Onde focar</th>
                  </tr>
                </thead>
                <tbody>
                  {englishByArea.map((item) => (
                    <tr key={item.area} className="border-t border-slate-200">
                      <td className="p-3 font-black">{item.area}</td>
                      <td className={cn("p-3", ac.tbodyAccentBold)}>{item.level}</td>
                      <td className="p-3 text-slate-600">{item.focus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-brutal rounded-2xl bg-white p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className={cn("rounded-xl border-2 border-sky-700 bg-sky-100 p-3 text-slate-950", ac.brutalShadow)}>
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase", ac.iconMuted)}>dicas de IA</p>
                <h2 className="font-display text-3xl font-black text-slate-950">Use a IA como tutor de inglês técnico</h2>
                <p className="mt-1 text-sm text-slate-600">Aproveite seu próprio código, erros e README para estudar com contexto real.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cursorTips.map((tip) => (
                <article key={tip.title} className={cn("rounded-2xl border-2 border-slate-200 p-4", ac.panelSoft)}>
                  <Sparkles className={cn("mb-2 h-5 w-5", ac.iconMuted)} />
                  <h3 className="font-display text-lg font-black text-slate-950">{tip.title}</h3>
                  <p className="mt-2 text-xs text-slate-600">{tip.desc}</p>
                  <p className={cn("mt-3 rounded-xl border-2 bg-white p-3 font-mono text-[11px] leading-relaxed text-slate-700", ac.panelBorderInner)}>{tip.prompt}</p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">vídeos para praticar</p>
                <h2 className="font-display text-3xl font-black text-slate-950">Canais e vídeos úteis</h2>
              </div>
              <p className="hidden max-w-md text-sm text-slate-600 md:block">Comece com legenda em inglês. Depois reassista trechos curtos sem legenda.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {videoResources.map((item) => (
                <VideoEmbedDialog key={item.title} source={item.sampleId} title={item.title} href={item.url}>
                  <button type="button" className={cn("card-brutal block w-full rounded-2xl bg-white p-5 text-left transition-all hover:-translate-y-0.5", ac.liftShadow)}>
                    <PlayCircle className="mb-3 h-7 w-7 text-red-600" />
                    <h3 className="font-display text-xl font-black text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                    <span className={cn("mt-4 inline-flex items-center gap-1 text-xs font-black uppercase", ac.link)}>
                      Assistir amostra <PlayCircle className="h-3 w-3" />
                    </span>
                  </button>
                </VideoEmbedDialog>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-5">
              <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">materiais e referências</p>
              <h2 className="font-display text-3xl font-black text-slate-950">Onde estudar inglês com conteúdo tech</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {studyMaterials.map((item) => (
                <a key={item.title} href={item.url} target="_blank" rel="noopener noreferrer" className={cn("card-brutal rounded-2xl bg-white p-5 transition-all hover:-translate-y-0.5", ac.liftShadow)}>
                  <BookOpen className={cn("mb-3 h-6 w-6", ac.iconMuted)} />
                  <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-black uppercase", ac.panelSoft, ac.tbodyAccent)}>{item.type}</span>
                  <h3 className="mt-3 font-display text-xl font-black text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-brutal rounded-2xl bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText className={cn("h-6 w-6", ac.iconMuted)} />
                <h2 className="font-display text-2xl font-black text-slate-950">Frases prontas para tech</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {usefulPhrases.map((phrase) => (
                  <p key={phrase} className={cn("rounded-xl p-3 text-sm font-bold text-slate-700", ac.panelSoft)}>{phrase}</p>
                ))}
              </div>
            </div>

            <div className="card-brutal rounded-2xl bg-white p-6">
              <h2 className="font-display text-2xl font-black text-slate-950">Plano semanal de prática</h2>
              <div className="mt-4 space-y-3">
                {practicePlan.map((item) => (
                  <div key={item.day} className="flex gap-3 rounded-xl border-2 border-slate-100 bg-slate-50 p-3">
                    <span className={cn("w-20 shrink-0 font-display text-sm font-black", ac.link)}>{item.day}</span>
                    <p className="text-sm text-slate-700">{item.task}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">vocabulário essencial</p>
              <h2 className="font-display text-3xl font-black text-slate-950">Termos que aparecem em vagas, docs e projetos</h2>
            </div>
            {englishVocabulary.map((group) => (
              <DetailsChevronOnly key={group.area} className="card-brutal rounded-2xl bg-white p-5" title={<span className="font-display text-xl font-black">{group.area}</span>}>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.terms.map((term) => (
                    <span key={term} className={cn("rounded-full px-2 py-1 text-xs font-bold", ac.panelSoft, ac.tbodyAccent)}>{term}</span>
                  ))}
                </div>
              </DetailsChevronOnly>
            ))}
          </div>

          <div className={cn("card-brutal rounded-2xl p-6", ac.panelSoft)}>
            <h2 className="font-display text-2xl font-black">Checklist para evoluir sem travar</h2>
            <ul className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
              <li>• Deixe GitHub, Cursor e documentação em inglês.</li>
              <li>• Pesquise erros em inglês antes de traduzir.</li>
              <li>• Mantenha um glossário pessoal com exemplos do seu projeto.</li>
              <li>• Escreva commits simples em inglês: fix, add, update, remove.</li>
              <li>• Leia README de projetos open source parecidos com os seus.</li>
              <li>• Grave áudio de 1 minuto explicando o que você construiu.</li>
              <li>• Use legenda em inglês, não português, quando assistir tech talks.</li>
              <li>• Revise toda semana os termos que mais se repetiram.</li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
}
