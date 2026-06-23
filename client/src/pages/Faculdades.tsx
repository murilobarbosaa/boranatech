/*
  BORA NA TECH? (Faculdades Page)
  Style: Neo-Brutalism Suavizado
*/

import { useState } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  X,
  Star,
  MapPin,
  GraduationCap,
  BookOpen,
  Award,
  ExternalLink,
  Building2,
  Sparkles,
  Code2,
  Database,
  Network,
  Shield,
  Briefcase,
  Gamepad2,
  CircleCheck,
  Layers,
  type LucideIcon,
} from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import AnimatedContent from "@/components/reactbits/AnimatedContent";
import MiniQuiz from "@/components/shared/MiniQuiz";
import { faculdades } from "@/lib/data";
import { brazilianStates, collegeSuggestions } from "@/lib/platformData";
import {
  faculdadesInstituicoes,
  EMEC_URL,
  type FaculdadeCurso,
} from "@/lib/faculdadesInstituicoes";
import {
  subareaDaInstituicao,
  SUBAREA_ORDER,
  type Subarea,
} from "@/lib/faculdadesSubareas";

const tipos = ["Todos", "Tecnólogo", "Bacharelado"];
const matNiveis = ["Todos", "Médio", "Alto", "Médio-Alto"];

const matematicaColor: Record<string, string> = {
  Médio: "bg-sky-100 text-sky-800",
  Alto: "bg-red-100 text-red-700",
  "Médio-Alto": "bg-orange-100 text-orange-700",
};

const progColor: Record<string, string> = {
  Médio: "bg-sky-100 text-sky-800",
  Alto: "bg-blue-100 text-blue-700",
  "Médio-Alto": "bg-blue-100 text-blue-700",
};

const criteriosFaculdade = [
  {
    titulo: "Reconhecimento no MEC",
    desc: "Confira se o curso é reconhecido e veja a nota dele no e-MEC antes de se inscrever.",
  },
  {
    titulo: "Modalidade que cabe na rotina",
    desc: "Presencial, EAD ou híbrido. Pense no tempo de deslocamento e na disciplina pra estudar por conta própria.",
  },
  {
    titulo: "Matriz curricular atualizada",
    desc: "Veja se as disciplinas acompanham o mercado, com projetos práticos, dados e nuvem.",
  },
  {
    titulo: "Corpo docente",
    desc: "Professores com experiência de mercado e boa titulação fazem diferença no aprendizado.",
  },
  {
    titulo: "Estágio e contato com empresas",
    desc: "Parcerias, feiras e apoio de carreira ajudam você a entrar mais rápido na área.",
  },
  {
    titulo: "Infraestrutura e prática",
    desc: "Laboratórios, projetos reais e atividades extras como ligas e hackathons valem mais que só teoria.",
  },
  {
    titulo: "Custo e formas de pagar",
    desc: "Compare mensalidade, bolsas e financiamento como ProUni, FIES, SISU e UAB antes de decidir.",
  },
  {
    titulo: "Localização e flexibilidade",
    desc: "Turno noturno, polo perto de casa ou EAD podem ser decisivos pra conciliar trabalho e estudo.",
  },
  {
    titulo: "Reputação e egressos",
    desc: "Converse com quem já estudou lá e veja onde os formados estão trabalhando hoje.",
  },
];

const caminhosFormacao = [
  {
    titulo: "Graduação",
    quando: "Base sólida e diploma reconhecido, bom pra crescimento de longo prazo e vagas que pedem diploma.",
    atencao: "Leva mais tempo que as outras opções.",
  },
  {
    titulo: "Curso técnico",
    quando: "Formação curta e prática, dá pra fazer junto ou logo após o ensino médio.",
    atencao: "Boa porta de entrada, mas costuma ir menos a fundo que a graduação.",
  },
  {
    titulo: "Bootcamp",
    quando: "Intensivo e focado em te colocar no mercado rápido.",
    atencao: "Exige dedicação alta em pouco tempo e a qualidade varia bastante.",
  },
  {
    titulo: "Cursos livres e estudo por conta",
    quando: "Flexível e barato, às vezes de graça, com um bom roadmap pra te guiar.",
    atencao: "Pede disciplina e um portfólio pra provar o que você sabe.",
  },
];

const caminhoQuizPerguntas = [
  {
    id: "tempo",
    pergunta: "Quanto tempo você quer investir na formação?",
    opcoes: [
      {
        rotulo: "O quanto for preciso, penso no longo prazo",
        pontosPara: ["graduacao"],
      },
      { rotulo: "Pouco, quero entrar rápido", pontosPara: ["bootcamp", "tecnico"] },
      { rotulo: "No meu ritmo, sem prazo fixo", pontosPara: ["livres"] },
    ],
  },
  {
    id: "estrutura",
    pergunta: "Você aprende melhor com...",
    opcoes: [
      {
        rotulo: "Uma grade organizada e diploma no fim",
        pontosPara: ["graduacao", "tecnico"],
      },
      { rotulo: "Um intensivo focado em prática", pontosPara: ["bootcamp"] },
      {
        rotulo: "Liberdade pra montar meu próprio caminho",
        pontosPara: ["livres"],
      },
    ],
  },
  {
    id: "objetivo",
    pergunta: "Seu objetivo agora é...",
    opcoes: [
      {
        rotulo: "Base sólida pra crescer na carreira",
        pontosPara: ["graduacao"],
      },
      { rotulo: "Um primeiro passo acessível na área", pontosPara: ["tecnico"] },
      {
        rotulo: "Conseguir um emprego o mais rápido possível",
        pontosPara: ["bootcamp"],
      },
      { rotulo: "Testar a área gastando pouco", pontosPara: ["livres"] },
    ],
  },
];

const caminhoQuizResultados = {
  graduacao: {
    titulo: "Graduação",
    descricao:
      "Base sólida e diploma reconhecido, boa pra crescimento de longo prazo e vagas que pedem diploma.",
  },
  tecnico: {
    titulo: "Curso técnico",
    descricao:
      "Formação curta e prática, ótima porta de entrada pra começar logo na área.",
  },
  bootcamp: {
    titulo: "Bootcamp",
    descricao:
      "Intensivo e focado em te colocar no mercado rápido, exige dedicação alta em pouco tempo.",
  },
  livres: {
    titulo: "Cursos livres e estudo por conta",
    descricao:
      "Flexível e barato, funciona com disciplina e um bom roadmap pra te guiar.",
  },
};

const GRAU_INFO = [
  {
    grau: "Técnico",
    nivel: "Nível médio (não é superior)",
    duracao: "1 a 2 anos",
    foco: "Bem prático, dá pra fazer junto com o ensino médio. Porta de entrada rápida.",
    acesso: "Entrada rápida no mercado, mas sozinho não dá acesso à pós-graduação.",
    exemplos: "Desenvolvimento de Sistemas, Informática, Redes.",
    Icon: BookOpen,
    style: "border-emerald-300 bg-emerald-50",
    badge: "bg-emerald-200 text-emerald-900",
  },
  {
    grau: "Tecnólogo",
    nivel: "Graduação de nível superior",
    duracao: "2 a 3 anos",
    foco: "Prática e focada numa área específica. Vai direto ao ponto.",
    acesso: "Mesmo peso de diploma que o bacharelado e dá acesso à pós.",
    exemplos:
      "Análise e Desenvolvimento de Sistemas, Segurança Cibernética, Banco de Dados, Redes, Jogos Digitais, Sistemas para Internet, Gestão da TI.",
    Icon: GraduationCap,
    style: "border-sky-300 bg-sky-50",
    badge: "bg-sky-200 text-sky-900",
  },
  {
    grau: "Bacharelado",
    nivel: "Graduação de nível superior",
    duracao: "4 a 5 anos",
    foco: "Mais teórica e generalista, com base sólida e caminho acadêmico.",
    acesso: "Diploma de nível superior, dá acesso à pós e à carreira de pesquisa.",
    exemplos:
      "Ciência da Computação, Engenharia de Software, Engenharia de Computação, Sistemas de Informação, Ciência de Dados.",
    Icon: Award,
    style: "border-violet-300 bg-violet-50",
    badge: "bg-violet-200 text-violet-900",
  },
];

const TIP_CHIPS = [
  { id: "mec", label: "O que é cada nota do MEC" },
  { id: "escolher", label: "Como escolher uma boa faculdade" },
  { id: "obrigatoria", label: "Faculdade é obrigatória?" },
  { id: "onde", label: "Onde buscar faculdades gratuitas e com bolsa" },
];

const NOTAS_MEC = [
  {
    sigla: "Enade",
    nome: "Exame Nacional de Desempenho dos Estudantes",
    desc: "Avalia o desempenho dos alunos numa prova nacional.",
  },
  {
    sigla: "CPC",
    nome: "Conceito Preliminar de Curso",
    desc: "Qualidade do curso, calculada com Enade, corpo docente e infraestrutura.",
  },
  {
    sigla: "CC",
    nome: "Conceito de Curso",
    desc: "Nota da visita presencial dos avaliadores ao curso.",
  },
  {
    sigla: "IGC",
    nome: "Índice Geral de Cursos",
    desc: "Qualidade da instituição como um todo.",
  },
];

const GRAU_STYLE: Record<
  string,
  { badge: string; soft: string; shadow: string }
> = {
  Técnico: {
    badge: "bg-emerald-200 text-emerald-900",
    soft: "bg-emerald-50",
    shadow: "shadow-[5px_5px_0_#6ee7b7]",
  },
  Tecnólogo: {
    badge: "bg-sky-200 text-sky-900",
    soft: "bg-sky-50",
    shadow: "shadow-[5px_5px_0_#7dd3fc]",
  },
  Bacharelado: {
    badge: "bg-violet-200 text-violet-900",
    soft: "bg-violet-50",
    shadow: "shadow-[5px_5px_0_#c4b5fd]",
  },
};

const FAC_DOODLES = [
  { Icon: GraduationCap, cls: "left-[4%] top-[16%] text-violet-500", size: "h-12 w-12" },
  { Icon: BookOpen, cls: "right-[7%] top-[12%] text-sky-500", size: "h-10 w-10" },
  { Icon: Award, cls: "right-[20%] top-[70%] text-fuchsia-500", size: "h-9 w-9" },
  { Icon: Sparkles, cls: "left-[14%] top-[72%] text-violet-400", size: "h-8 w-8" },
];

function FaculdadesDoodles() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {FAC_DOODLES.map((doodle, index) => {
        const Icon = doodle.Icon;
        return (
          <span
            key={index}
            className={`animate-gentle-float absolute opacity-[0.16] ${doodle.cls}`}
            style={{ animationDelay: `${index * 0.6}s` }}
          >
            <Icon className={doodle.size} aria-hidden />
          </span>
        );
      })}
    </div>
  );
}

const GRAUS_FILTRO = ["Todos", "Bacharelado", "Tecnólogo", "Técnico"];
const REDES_FILTRO = ["Todas", "Pública", "Privada"];

const SUBAREA_ICON: Record<Subarea, LucideIcon> = {
  Desenvolvimento: Code2,
  "Dados e IA": Database,
  "Infra e Redes": Network,
  Segurança: Shield,
  "Gestão e Produto": Briefcase,
  Jogos: Gamepad2,
  QA: CircleCheck,
  Outros: Layers,
};

// TODO(Ana): revisar a copy deste guia rapido de grau antes de publicar.
const GUIA_GRAU =
  "Quer entrar rápido? Técnico ou Tecnólogo (2 a 3 anos, bem prático). Quer base sólida e acesso à pós? Bacharelado (4 a 5 anos).";

function slugifyCourse(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeCurso(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type CursoGenerico = (typeof faculdades.cursos)[number];
const cursoExplicacaoPorNome = new Map<string, CursoGenerico>();
for (const cursoGenerico of faculdades.cursos) {
  cursoExplicacaoPorNome.set(normalizeCurso(cursoGenerico.nome), cursoGenerico);
}

export default function Faculdades() {
  const [tipo, setTipo] = useState("Todos");
  const [mat, setMat] = useState("Todos");
  const [selectedUf, setSelectedUf] = useState("");
  const [grauInst, setGrauInst] = useState("Todos");
  const [redeInst, setRedeInst] = useState("Todas");
  const [openTips, setOpenTips] = useState<Record<string, boolean>>({});
  const reduce = useReducedMotion();

  const filtered = faculdades.cursos.filter((c) => {
    const matchTipo = tipo === "Todos" || c.tipo === tipo;
    const matchMat = mat === "Todos" || c.matematica === mat;
    return matchTipo && matchMat;
  });

  const instituicoesFiltradas: FaculdadeCurso[] = faculdadesInstituicoes.filter(
    (item) => {
      const matchGrau = grauInst === "Todos" || item.grau === grauInst;
      const matchRede = redeInst === "Todas" || item.rede === redeInst;
      const matchUf =
        selectedUf === "" ||
        (selectedUf === "__ead__"
          ? item.uf === "Nacional"
          : item.uf === selectedUf);
      return matchGrau && matchRede && matchUf;
    },
  );

  const subareasRender: { subarea: Subarea; itens: FaculdadeCurso[] }[] =
    SUBAREA_ORDER.map((subarea) => ({
      subarea,
      itens: instituicoesFiltradas.filter(
        (item) => subareaDaInstituicao(item) === subarea,
      ),
    })).filter((grupo) => grupo.itens.length > 0);

  const nearby = collegeSuggestions.filter((item) => {
    if (!selectedUf) return true;
    if (item.nacional) return true;
    return item.uf === selectedUf;
  });

  return (
    <Layout>
      <SEO
        title="Faculdades de TI · Cursos superiores em tecnologia no Brasil"
        description="Conheça cursos superiores em tecnologia no Brasil, diferenças entre formações e caminhos para iniciar uma carreira em TI."
        keywords={[
          "faculdade de ti",
          "graduação tecnologia",
          "engenharia de software",
          "ciência da computação",
          "análise de sistemas",
        ]}
        url="/faculdades"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden bg-violet-100 py-12 border-b-2 border-slate-900">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="container relative">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border-2 border-slate-900 bg-violet-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
              faculdade sem confusão
            </p>
            <h1 className="font-display font-bold text-4xl text-slate-950 mb-3">
              Cursos Superiores de TI
            </h1>
            <p className="text-slate-950 text-lg">
              Compare os principais cursos de graduação em tecnologia e descubra
              qual faz mais sentido para você.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-slate-900 bg-white py-12">
        <div className="container space-y-4">
          <h2 className="font-display text-2xl font-black text-slate-950">
            Técnico, Tecnólogo e Bacharelado
          </h2>
          <p className="max-w-2xl text-sm text-slate-700">
            Três caminhos diferentes pra entrar na TI. Veja o tempo, o foco e
            onde cada um te leva.
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {GRAU_INFO.map((g, i) => {
              const Icon = g.Icon;
              return (
                <AnimatedContent
                  key={g.grau}
                  distance={16}
                  duration={0.4}
                  delay={i * 0.1}
                  className="h-full"
                >
                  <div
                    className={`flex h-full flex-col gap-2 rounded-2xl border-2 border-slate-900 p-5 shadow-[4px_4px_0_#0f172a] ${g.style}`}
                  >
                    <div className="flex items-center gap-2">
                      <motion.span
                        animate={reduce ? undefined : { y: [0, -3, 0] }}
                        transition={
                          reduce
                            ? undefined
                            : {
                                duration: 2.6 + i * 0.3,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }
                        }
                      >
                        <Icon className="h-7 w-7 text-slate-900" aria-hidden />
                      </motion.span>
                      <h3 className="font-display text-xl font-black text-slate-950">
                        {g.grau}
                      </h3>
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-[0.65rem] font-black uppercase ${g.badge}`}
                      >
                        {g.duracao}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{g.nivel}</p>
                    <p className="text-sm text-slate-700">{g.foco}</p>
                    <p className="text-sm text-slate-700">
                      <strong className="text-slate-900">Acesso:</strong>{" "}
                      {g.acesso}
                    </p>
                    <p className="mt-auto text-xs text-slate-600">
                      <strong className="text-slate-900">Exemplos:</strong>{" "}
                      {g.exemplos}
                    </p>
                  </div>
                </AnimatedContent>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b-2 border-slate-900 bg-white py-8">
        <div className="container space-y-4">
          <div className="flex flex-wrap gap-2">
            {TIP_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                aria-pressed={Boolean(openTips[chip.id])}
                onClick={() =>
                  setOpenTips((prev) => ({
                    ...prev,
                    [chip.id]: !prev[chip.id],
                  }))
                }
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-black transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${
                  openTips[chip.id]
                    ? "border-slate-900 bg-violet-600 text-white shadow-[2px_2px_0_#0f172a]"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-violet-50"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {openTips.mec ? (
            <div className="rounded-2xl border-2 border-slate-900 bg-amber-50 p-5">
              <p className="max-w-2xl text-sm text-slate-700">
                As notas vão de 1 a 5 e são consideradas satisfatórias a partir
                de 3. A nota muda com o tempo, então confira a atual de cada
                curso no e-MEC.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {NOTAS_MEC.map((n) => (
                  <div
                    key={n.sigla}
                    className="flex h-full flex-col gap-1 rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#fcd34d]"
                  >
                    <span className="font-display text-2xl font-black text-amber-700">
                      {n.sigla}
                    </span>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-700">
                      {n.nome}
                    </p>
                    <p className="text-sm text-slate-700">{n.desc}</p>
                  </div>
                ))}
              </div>
              <a
                href={EMEC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
              >
                Consultar notas no e-MEC
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </div>
          ) : null}

          {openTips.escolher ? (
            <div className="rounded-xl border-2 border-violet-200 bg-white p-6">
              <h3 className="font-display text-2xl font-black text-slate-950">
                Como escolher uma boa faculdade
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Não existe faculdade perfeita pra todo mundo. Veja os pontos que
                mais importam na hora de comparar e decidir.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {criteriosFaculdade.map((item) => (
                  <div
                    key={item.titulo}
                    className="rounded-xl border-2 border-slate-200 bg-violet-50/60 p-4"
                  >
                    <div className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {item.titulo}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-slate-600">
                Liste o que é inegociável pra você e use esses pontos pra
                comparar cada opção antes de bater o martelo.
              </p>
            </div>
          ) : null}

          {openTips.obrigatoria ? (
            <div className="rounded-xl border-2 border-violet-200 bg-violet-50 p-5">
              <div className="flex items-start gap-3">
                <Star className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <div>
                  <h3 className="mb-2 font-display font-semibold text-slate-900">
                    Faculdade é obrigatória?
                  </h3>
                  <p className="text-sm text-slate-600">
                    Não! A faculdade não é obrigatória para entrar em TI, mas
                    pode abrir portas em algumas empresas. Se quiser entrar
                    rápido no mercado, cursos técnicos e bootcamps podem ser mais
                    eficientes. Se quiser uma base sólida e crescimento de longo
                    prazo, considere a graduação.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {openTips.onde ? (
            <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-3 font-display font-semibold text-slate-900">
                Onde buscar faculdades gratuitas e com bolsa
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {[
                  {
                    nome: "ProUni",
                    desc: "Bolsas em faculdades privadas via ENEM",
                    link: "https://prouni.mec.gov.br",
                  },
                  {
                    nome: "FIES",
                    desc: "Financiamento estudantil para faculdades privadas",
                    link: "https://fies.mec.gov.br",
                  },
                  {
                    nome: "SISU",
                    desc: "Acesso a universidades federais via ENEM",
                    link: "https://sisu.mec.gov.br",
                  },
                  {
                    nome: "EAD Gratuito",
                    desc: "UAB: Universidade Aberta do Brasil",
                    link: "https://uab.capes.gov.br",
                  },
                ].map((item) => (
                  <a
                    key={item.nome}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border-2 border-slate-200 bg-white p-3 transition-colors hover:border-violet-400"
                  >
                    <p className="mb-1 text-sm font-semibold text-slate-900">
                      {item.nome}
                    </p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-b-2 border-slate-900 bg-white py-6">
        <div className="container space-y-4">
          <p className="text-sm font-bold text-slate-700">{GUIA_GRAU}</p>
          <nav
            aria-label="Atalhos por subárea"
            className="flex flex-wrap gap-2"
          >
            {subareasRender.map(({ subarea, itens }) => {
              const SubIcon = SUBAREA_ICON[subarea];
              return (
                <a
                  key={subarea}
                  href={`#subarea-${slugifyCourse(subarea)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition-transform hover:border-slate-900 motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
                >
                  <SubIcon className="h-3.5 w-3.5" aria-hidden />
                  {subarea}
                  <span className="text-slate-500">({itens.length})</span>
                </a>
              );
            })}
          </nav>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filtrar faculdades por grau, rede e estado"
          >
            {GRAUS_FILTRO.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrauInst(g)}
                aria-pressed={grauInst === g}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-black transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${
                  grauInst === g
                    ? "border-slate-900 bg-violet-600 text-white shadow-[2px_2px_0_#0f172a]"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-violet-50"
                }`}
              >
                {g}
              </button>
            ))}
            <span className="mx-1 hidden h-5 w-px self-center bg-slate-300 sm:block" />
            {REDES_FILTRO.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRedeInst(r)}
                aria-pressed={redeInst === r}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-black transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${
                  redeInst === r
                    ? "border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0_#0f172a]"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {r}
              </button>
            ))}
            <span className="mx-1 hidden h-5 w-px self-center bg-slate-300 sm:block" />
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <select
                aria-label="Filtrar por estado"
                value={selectedUf}
                onChange={(event) => setSelectedUf(event.target.value)}
                className="cursor-pointer appearance-none rounded-full border-2 border-slate-300 bg-white py-1.5 pl-9 pr-8 text-xs font-black text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
              >
                <option value="">Todos os estados</option>
                <option value="__ead__">EAD / Nacional</option>
                {brazilianStates.map(({ uf, name }) => (
                  <option key={uf} value={uf}>
                    {name} ({uf})
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b-2 border-slate-900 bg-violet-50 py-12">
        <FaculdadesDoodles />
        <div className="container relative">
          <div className="mb-6 flex items-start gap-3">
            <span className="rounded-xl border-2 border-slate-900 bg-sky-300 p-3 text-slate-950 shadow-[3px_3px_0_#0f172a]">
              <Building2 className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-sky-700">
                faculdades reais
              </p>
              <h2 className="font-display text-3xl font-black text-slate-950">
                Onde estudar TI no Brasil
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-700">
                {faculdadesInstituicoes.length} cursos reais de instituições
                públicas e privadas. A nota de cada curso muda com o tempo, então
                confira sempre a atual no e-MEC.
              </p>
            </div>
          </div>

          <p className="mb-4 text-sm text-slate-500">
            {instituicoesFiltradas.length} curso
            {instituicoesFiltradas.length !== 1 ? "s" : ""}
          </p>

          {subareasRender.map(({ subarea, itens }) => {
            const SubIcon = SUBAREA_ICON[subarea];
            return (
              <div
                key={subarea}
                id={`subarea-${slugifyCourse(subarea)}`}
                className="mb-10 scroll-mt-24"
              >
                <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-black text-slate-950">
                  <SubIcon className="h-5 w-5 text-slate-700" aria-hidden />
                  {subarea}
                  <span className="text-sm font-bold text-slate-500">
                    ({itens.length})
                  </span>
                </h3>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {itens.map((item, i) => {
                    const st = GRAU_STYLE[item.grau];
                    const exp = cursoExplicacaoPorNome.get(
                      normalizeCurso(item.curso),
                    );
                    return (
                <AnimatedContent
                  key={`${item.sigla}-${item.curso}`}
                  distance={16}
                  duration={0.4}
                  delay={Math.min(i * 0.04, 0.4)}
                  className="h-full"
                >
                  <div
                    className={`group flex h-full flex-col rounded-2xl border-2 border-slate-950 p-5 transition-transform duration-200 ease-out motion-safe:hover:-translate-y-1 ${st.soft} ${st.shadow}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="font-display text-sm font-black uppercase tracking-wide text-slate-700">
                        {item.sigla}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase ${st.badge}`}
                      >
                        {item.grau}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-black leading-tight text-slate-950">
                      {item.curso}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-slate-600">
                      {item.instituicao}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1 text-[0.6rem] font-black uppercase tracking-wide">
                      <span className="rounded-full bg-white px-2 py-0.5 text-slate-700 ring-1 ring-slate-300">
                        {item.duracao}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-slate-700 ring-1 ring-slate-300">
                        {item.modalidade}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-slate-700 ring-1 ring-slate-300">
                        {item.uf}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-slate-700 ring-1 ring-slate-300">
                        {item.rede}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">
                      {item.reputacao}
                    </p>
                    <div className="mt-3">
                      <p className="text-[0.6rem] font-black uppercase tracking-wide text-slate-500">
                        leva pra
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.areasLeva.map((a) => (
                          <span
                            key={a}
                            className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                    {exp ? (
                      <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white/70 p-3">
                        <p className="text-xs text-slate-700">
                          {exp.oQueEstuda}
                        </p>
                        <div>
                          <p className="text-[0.6rem] font-black uppercase tracking-wide text-blue-700">
                            Pontos positivos
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {exp.pontoPositivos.slice(0, 3).map((p) => (
                              <li
                                key={p}
                                className="flex items-start gap-1 text-[0.7rem] text-slate-600"
                              >
                                <Check
                                  className="mt-0.5 h-3 w-3 shrink-0 text-blue-500"
                                  aria-hidden
                                />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[0.6rem] font-black uppercase tracking-wide text-red-600">
                            Pontos de atenção
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {exp.pontosAtencao.slice(0, 3).map((p) => (
                              <li
                                key={p}
                                className="flex items-start gap-1 text-[0.7rem] text-slate-600"
                              >
                                <X
                                  className="mt-0.5 h-3 w-3 shrink-0 text-red-400"
                                  aria-hidden
                                />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
                      >
                        Ver curso
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                      <a
                        href={EMEC_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border-2 border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-600 transition-colors hover:border-slate-900 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
                      >
                        Nota no e-MEC
                      </a>
                    </div>
                  </div>
                </AnimatedContent>
                      );
                    })}
                </div>
              </div>
            );
          })}

          {instituicoesFiltradas.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-bold text-slate-600">
                Nenhuma faculdade com esses filtros.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-violet-50 border-b-2 border-violet-200 py-4 sticky top-16 z-40">
        <div className="container">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {tipos.map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                    tipo === t
                      ? "bg-violet-700 text-white border-slate-900 shadow-[2px_2px_0_#0f172a]"
                      : "bg-white text-slate-700 border-slate-300 hover:border-violet-400"
                  }`}
                >
                  {t === "Todos" ? "Todos os tipos" : t}
                </button>
              ))}
            </div>
            <div className="w-px h-5 bg-slate-200" />
            <select
              value={mat}
              onChange={(e) => setMat(e.target.value)}
              className="px-3 py-2 border-2 border-violet-200 rounded-lg text-sm focus:outline-none focus:border-violet-500 bg-white"
            >
              {matNiveis.map((m) => (
                <option key={m}>
                  {m === "Todos" ? "Nível de Matemática" : `Matemática: ${m}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-violet-50 py-12">
        <div className="container">
          <div className="card-brutal mb-8 rounded-2xl bg-white p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <h2 className="font-display text-2xl font-black text-slate-950">
                  Encontre faculdades perto de você
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Estas sugestões mudam conforme o estado que você escolher no
                  filtro de instituições acima. Confira sempre cursos e conceitos
                  no{" "}
                  <a
                    href="https://emec.mec.gov.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-violet-700 underline"
                  >
                    e-MEC oficial
                  </a>
                  .
                </p>
                {selectedUf &&
                selectedUf !== "__ead__" &&
                nearby.every((item) => item.nacional) ? (
                  <p className="mt-3 rounded-lg border-2 border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                    Ainda não temos instituições mapeadas nesse estado. As
                    opções nacionais (EAD) valem pra qualquer UF.
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {nearby.map((item) => (
                  <div
                    key={`${item.city}-${item.name}`}
                    className="rounded-xl border-2 border-violet-100 bg-violet-50/80 p-4"
                  >
                    <p className="text-xs font-bold uppercase text-violet-700">
                      {item.nacional
                        ? `${item.city} · nacional (EAD)`
                        : `${item.city} · ${item.uf}`}
                    </p>
                    <h3 className="font-display font-black text-slate-950">
                      {item.name}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600">
                      {item.advantages.join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map((curso, i) => (
              <div
                key={i}
                className="card-brutal relative flex flex-col rounded-xl bg-white p-6 transition-colors hover:bg-violet-50/60"
              >
                <Link
                  href={`/faculdades/${slugifyCourse(curso.nome)}`}
                  className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
                  aria-label={`Ver detalhes de ${curso.nome}`}
                />
                <div className="mb-3 flex items-start justify-between">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      curso.tipo === "Tecnólogo"
                        ? "bg-violet-100 text-violet-800 border-violet-200"
                        : "bg-violet-200 text-violet-900 border-violet-400"
                    }`}
                  >
                    {curso.tipo} · {curso.duracao}
                  </span>
                  <div className="relative z-20">
                    <FavoriteButton
                      compact
                      item={{
                        id: slugifyCourse(curso.nome),
                        type: "faculdade",
                        title: curso.nome,
                        subtitle: curso.tipo,
                      }}
                    />
                  </div>
                </div>

                <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
                  {curso.nome}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {curso.oQueEstuda}
                </p>

                <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50/90 p-3">
                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900">Para quem é:</strong>{" "}
                    {curso.perfilIndicado}
                  </p>
                </div>

                <div className="flex gap-2 mb-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${matematicaColor[curso.matematica] || "bg-slate-100 text-slate-600"}`}
                  >
                    Matemática: {curso.matematica}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${progColor[curso.programacao] || "bg-slate-100 text-slate-600"}`}
                  >
                    Programação: {curso.programacao}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Áreas de atuação
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {curso.areasAtuacao.map((a) => (
                      <span
                        key={a}
                        className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-1.5">
                      Pontos positivos
                    </p>
                    <ul className="space-y-1">
                      {curso.pontoPositivos.map((p) => (
                        <li
                          key={p}
                          className="flex items-start gap-1 text-xs text-slate-600"
                        >
                          <Check className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-1.5">
                      Pontos de atenção
                    </p>
                    <ul className="space-y-1">
                      {curso.pontosAtencao.map((p) => (
                        <li
                          key={p}
                          className="flex items-start gap-1 text-xs text-slate-600"
                        >
                          <X className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 mt-auto">
                  <p className="text-xs text-slate-600">
                    <strong>Diferença dos outros cursos:</strong>{" "}
                    {curso.diferencas}
                  </p>
                </div>

                <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-violet-700">
                  Ver carreira, salários e conteúdos{" "}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🎓</p>
              <p className="text-slate-600 font-medium">
                Nenhum curso encontrado.
              </p>
              <button
                onClick={() => {
                  setTipo("Todos");
                  setMat("Todos");
                }}
                className="mt-4 text-violet-700 text-sm font-medium hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}

          <div className="mt-6 rounded-xl border-2 border-violet-200 bg-white p-6">
            <h3 className="font-display text-2xl font-black text-slate-950">
              Outros caminhos de formação
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              A graduação é um caminho, não o único. Conheça as opções e veja
              qual combina com o seu momento. Dá pra misturar mais de uma.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {caminhosFormacao.map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-xl border-2 border-slate-200 bg-violet-50/60 p-4"
                >
                  <p className="font-display font-bold text-slate-900">
                    {item.titulo}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    <strong className="text-slate-900">
                      Quando faz sentido:
                    </strong>{" "}
                    {item.quando}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    <strong className="text-slate-900">Fique de olho:</strong>{" "}
                    {item.atencao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <MiniQuiz
              titulo="Qual caminho de formação combina com você?"
              subtitulo="Responda 3 perguntas rápidas."
              perguntas={caminhoQuizPerguntas}
              resultados={caminhoQuizResultados}
            />
          </div>

        </div>
      </section>
    </Layout>
  );
}
