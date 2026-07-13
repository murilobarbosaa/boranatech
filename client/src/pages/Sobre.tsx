import { useState } from "react";
import { Link } from "wouter";
import { Icon } from "@iconify/react";
import {
  ArrowRight,
  Bot,
  Compass,
  HeartHandshake,
  Map,
  Newspaper,
  Target,
} from "lucide-react";

import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { creators } from "@/lib/creatorsData";

// TODO(Ana): TODA a copy desta pagina e rascunho. Revisar antes de publicar.
// As bios do time vem dos LinkedIns REAIS da Ana e do Murilo (fornecidas por
// eles). Nada de dado inventado sobre pessoas nem numeros de tracao. Onde cita
// mercado, a fonte fica visivel (Brasscom, 2023).

const HERO_LEAD =
  "Existe muita gente querendo entrar na tecnologia e se perdendo no caminho. A gente existe pra ser a bússola.";

// Dado de mercado FORNECIDO pela Ana, com fonte visivel na pagina.
// TODO(Ana): confirmar o numero e a fonte exata antes de publicar.
const PROBLEM_STAT =
  "No Brasil, de 1,8 milhão de vagas em cursos superiores de tecnologia em 2023, menos de 5% concluíram. O problema quase nunca é capacidade. É falta de direção.";
const PROBLEM_SOURCE = "Fonte: Brasscom, 2023.";

// Numeros de produto. "mais de 25 roadmaps" e verificavel (o app tem 30
// trilhas). TODO(Ana): confirmar "39 areas" antes de publicar: o dado estatico
// em client/src/lib/data.ts tem 23 areas; a pagina /areas mostra a contagem
// dinamica da base, que pode ser 39. Ajustar o numero conforme a fonte real.
const OFFERINGS_LEAD =
  "39 áreas mapeadas, mais de 25 roadmaps, cursos curados, projetos, carreira, comunidade e ferramentas de IA.";

// Os 3 tipos de pessoa (posicionamento). TODO(Ana): revisar a copy.
const personas = [
  {
    title: "Quem não sabe por onde começar",
    description:
      "Nunca teve contato com tech e não sabe quais áreas existem nem por onde ir.",
  },
  {
    title: "Quem sabe algo, mas está perdido",
    description:
      "Já estuda ou tentou, mas trava no meio de tanto conteúdo e opinião diferente.",
  },
  {
    title: "Quem já está na área e quer evoluir",
    description:
      "Já trabalha com tech e quer subir de nível com direção, não no escuro.",
  },
];

// O que fazemos. TODO(Ana): revisar a copy.
const offerings = [
  {
    icon: Map,
    title: "Áreas, roadmaps e cursos",
    description:
      "Áreas de tecnologia mapeadas, mais de 25 roadmaps por nível e cursos e plataformas curados.",
  },
  {
    icon: Target,
    title: "Projetos e carreira",
    description:
      "Projetos pra praticar, empresas, salários e o caminho até a primeira vaga.",
  },
  {
    icon: Bot,
    title: "Ferramentas de IA",
    description:
      "Análise de currículo, LinkedIn, portfólio e plano de carreira sob medida.",
  },
  {
    icon: Newspaper,
    title: "Conteúdo e comunidade",
    description:
      "Notícias, eventos, dicionário de TI e creators que apoiam a jornada.",
  },
];

// Valores. TODO(Ana): confirmar os eixos e escrever a versao final.
const values = [
  {
    title: "Acessibilidade",
    description: "Descobrir e se orientar é grátis. O Pro acelera, não trava.",
  },
  {
    title: "Honestidade",
    description: "Conteúdo curado e verificado. Sem número inventado, sem hype.",
  },
  {
    title: "Comunidade",
    description: "Creators reais que apoiam quem está começando.",
  },
];

type SocialKind = "linkedin" | "instagram" | "github";
type SocialLink = { kind: SocialKind; url: string };

const SOCIAL_META: Record<
  SocialKind,
  { icon: string; label: string; hover: string }
> = {
  linkedin: {
    icon: "ph:linkedin-logo-bold",
    label: "LinkedIn",
    hover: "hover:bg-[#0A66C2] hover:text-white",
  },
  instagram: {
    icon: "ph:instagram-logo-bold",
    label: "Instagram",
    hover: "hover:bg-[#E1306C] hover:text-white",
  },
  github: {
    icon: "ph:github-logo-bold",
    label: "GitHub",
    hover: "hover:bg-[#1a1a1a] hover:text-white",
  },
};

// Time. Nomes, papeis, redes e BIOS sao REAIS (bios vindas dos LinkedIns da
// Ana e do Murilo, fornecidas por eles). As fotos ficam em client/public/sobre/
// (adicionar os arquivos ana.jpg, murilo.jpg e fundadores-juntos.jpg); ate la,
// o fallback mostra as iniciais.
type TeamMember = {
  name: string;
  role: string;
  photo: string;
  initials: string;
  bio: string;
  links: SocialLink[];
};

const team: TeamMember[] = [
  {
    name: "Ana Julia Moura",
    role: "CEO e cofundadora",
    photo: "/sobre/ana.jpg",
    initials: "AJ",
    // TODO(Ana): revisar a voz. Texto do LinkedIn real, nao acrescentar nada.
    bio: "Estudante de tecnologia no UniCEUB e creator (@ana.natech). Embaixadora da IBM Z, AWS, Alura e ElevenLabs. Representante discente no Colegiado de TI do UniCEUB e diretora de tecnologia e inovação do DCE. Já liderou projetos de software de ponta a ponta como gestora de projetos e designer de UX/UI. Criou o Bora na Tech porque viu de perto quanta gente talentosa desiste da tecnologia por falta de direção, não de capacidade.",
    links: [
      { kind: "linkedin", url: "https://www.linkedin.com/in/anajuliamoura/" },
      { kind: "instagram", url: "https://www.instagram.com/ana.natech/" },
    ],
  },
  {
    name: "Murilo Cardoso",
    role: "CTO e cofundador",
    photo: "/sobre/murilo.jpg",
    initials: "MC",
    // TODO(Murilo): revisar. Texto do LinkedIn real, nao acrescentar nada.
    bio: "Engenheiro de software e especialista em agentes de IA. Cursa Ciência da Computação no UniCEUB. Já construiu mais de 20 agentes de IA para empresas. No Bora na Tech, é quem constrói o cérebro do produto: as ferramentas de inteligência artificial que analisam seu currículo e seu LinkedIn, montam seu plano de carreira e simulam entrevistas. Também ensina sobre currículo, LinkedIn e IA.",
    links: [
      {
        kind: "linkedin",
        url: "https://www.linkedin.com/in/murilocardoso-dev/",
      },
      { kind: "github", url: "https://github.com/murilobarbosaa" },
    ],
  },
];

// Foto de destaque do time (hackathon). TODO(Ana): adicionar o arquivo
// client/public/sobre/fundadores-juntos.jpg; ate la, cai no fallback.
const TEAM_PHOTO = "/sobre/fundadores-juntos.jpg";

// TODO(Ana): confirmar um e-mail de contato ativo. Sem e-mail confirmado,
// deixamos so o Instagram do projeto (real) como canal.
const CONTACT_INSTAGRAM = "https://www.instagram.com/boranatech/";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 inline-flex rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-4 py-1 text-xs font-black uppercase tracking-wide text-[#1a1a1a] shadow-[3px_3px_0_#0f172a]">
      {children}
    </p>
  );
}

function SocialButton({ link, personName }: { link: SocialLink; personName: string }) {
  const meta = SOCIAL_META[link.kind];
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${meta.label} de ${personName}`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[2px_2px_0_#0f172a] transition-all duration-200 motion-safe:hover:-translate-y-0.5 ${meta.hover}`}
    >
      <Icon icon={meta.icon} style={{ fontSize: "20px" }} aria-hidden="true" />
    </a>
  );
}

function PersonPhoto({ member }: { member: TeamMember }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(member.photo) && !failed;
  return (
    <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] font-display text-2xl font-black">
      {showImage ? (
        <img
          src={member.photo}
          alt={`Foto de ${member.name}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{member.initials}</span>
      )}
    </div>
  );
}

function TeamPhoto() {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    return (
      <img
        src={TEAM_PHOTO}
        alt="Ana Julia Moura e Murilo Cardoso, fundadores do Bora na Tech, num hackathon"
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  // Fallback enquanto a foto nao foi adicionada: iniciais do time, sem inventar.
  return (
    <div className="flex h-full w-full items-center justify-center gap-3 bg-[image:linear-gradient(160deg,#6b1fc9,#3f1185)]">
      {team.map((member) => (
        <span
          key={member.name}
          className="grid h-16 w-16 place-items-center rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] font-display text-xl font-black text-[#1a1a1a]"
          aria-hidden="true"
        >
          {member.initials}
        </span>
      ))}
    </div>
  );
}

function CreatorAvatar({ photo, name }: { photo: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "@";
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[#1a1a1a] bg-violet-100 font-display text-sm font-black text-[#1a1a1a]">
      {photo && !failed ? (
        <img
          src={photo}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}

export default function Sobre() {
  const { user } = useAuth();
  const bandCreators = creators.slice(0, 10);

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Sobre nós · Bora na Tech?"
        description="Quem somos e por que existimos: o Bora na Tech? é a bússola de quem quer começar em tecnologia, com curadoria, ferramentas de IA e clareza."
        url="/sobre"
      />
      <main className="bg-[#faf8f4] text-[#1a1a1a]">
        {/* 1. HERO */}
        <section className="border-b-2 border-[#1a1a1a] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>SOBRE NÓS</Eyebrow>
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                {/* TODO(Ana): revisar a headline do hero */}
                <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                  {HERO_LEAD}
                </h1>
              </div>
              <div className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]">
                <Compass
                  className="mb-5 h-12 w-12 text-[#FFB800]"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                {/* TODO(Ana): revisar a frase de apoio do hero */}
                <p className="text-lg font-black leading-snug">
                  Direção clara pra escolher uma área, estudar com foco e dar os
                  primeiros passos na carreira.
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={user ? "/perfil" : "/cadastro"}
                className="rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-6 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-0.5"
              >
                {user ? "Ir para o painel" : "Começar agora"}
              </Link>
              <Link
                href="/planos"
                className="rounded-full border-2 border-[#1a1a1a] bg-white px-6 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-0.5"
              >
                Ver planos
              </Link>
            </div>
          </div>
        </section>

        {/* 2. O PROBLEMA QUE NOS MOVE (dado com fonte visivel) */}
        <section className="px-4 py-16 sm:px-6 lg:px-8" id="missao">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="rounded-3xl border-2 border-[#1a1a1a] bg-[#6b1fc9] p-8 text-white shadow-[4px_4px_0_#0f172a]">
              <Target
                className="mb-5 h-10 w-10 text-[#FFB800]"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              {/* TODO(Ana): confirmar o dado e a fonte antes de publicar */}
              <p className="font-display text-2xl font-black leading-tight sm:text-3xl">
                {PROBLEM_STAT}
              </p>
              <p className="mt-4 text-xs font-black uppercase tracking-wide text-violet-200">
                {PROBLEM_SOURCE}
              </p>
            </div>
            <div>
              <Eyebrow>O PROBLEMA QUE NOS MOVE</Eyebrow>
              {/* TODO(Ana): revisar a copy desta secao */}
              <h2 className="font-display text-4xl font-black leading-tight sm:text-5xl">
                O gargalo raramente é capacidade.
              </h2>
              <p className="mt-5 text-lg font-bold leading-relaxed text-slate-700">
                São dezenas de áreas, centenas de cursos e mil opiniões
                diferentes, e nenhuma bússola. A gente organiza essa jornada pra
                a pessoa não desistir antes de começar.
              </p>
            </div>
          </div>
        </section>

        {/* 3. AS 3 PORTAS (posicionamento) */}
        <section className="border-y-2 border-[#1a1a1a] bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>AS 3 PORTAS</Eyebrow>
            {/* TODO(Ana): revisar a copy dos 3 perfis */}
            <h2 className="max-w-3xl font-display text-4xl font-black leading-tight sm:text-5xl">
              Existem três tipos de pessoa na tech. A gente atende os três.
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {personas.map((item, index) => (
                <div
                  key={item.title}
                  className="flex flex-col rounded-3xl border-2 border-[#1a1a1a] bg-[#faf8f4] p-6 shadow-[4px_4px_0_#0f172a]"
                >
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] font-display font-black">
                    {index + 1}
                  </span>
                  <h3 className="font-display text-xl font-black leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-bold leading-relaxed text-slate-700">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. O QUE FAZEMOS */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>O QUE FAZEMOS</Eyebrow>
            {/* TODO(Ana): revisar a copy desta secao */}
            <h2 className="max-w-3xl font-display text-4xl font-black leading-tight sm:text-5xl">
              Tudo pra começar com direção. Grátis pra se orientar, Pro pra
              acelerar.
            </h2>
            {/* TODO(Ana): confirmar "39 areas" (estatico=23; app mostra a base) */}
            <p className="mt-5 max-w-3xl text-lg font-bold leading-relaxed text-slate-700">
              {OFFERINGS_LEAD}
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {offerings.map((item) => {
                const OfferingIcon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#1a1a1a] bg-[#FFB800]">
                      <OfferingIcon
                        className="h-6 w-6"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="font-display text-2xl font-black">
                      {item.title}
                    </h3>
                    <p className="mt-3 font-bold leading-relaxed text-slate-700">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. QUEM SOMOS (time) */}
        <section className="border-y-2 border-[#1a1a1a] bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>QUEM SOMOS</Eyebrow>
            <h2 className="font-display text-4xl font-black leading-tight sm:text-5xl">
              O time por trás da bússola.
            </h2>

            {/* Foto de destaque do time. TODO(Ana): adicionar fundadores-juntos.jpg */}
            <div className="mt-8 aspect-[16/9] w-full overflow-hidden rounded-3xl border-2 border-[#1a1a1a] shadow-[6px_6px_0_#FFB800] sm:aspect-[21/9]">
              <TeamPhoto />
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {team.map((person) => (
                <div
                  key={person.name}
                  className="flex flex-col rounded-3xl border-2 border-[#1a1a1a] bg-[#faf8f4] p-6 shadow-[4px_4px_0_#0f172a]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <PersonPhoto member={person} />
                      <div>
                        <h3 className="font-display text-2xl font-black">
                          {person.name}
                        </h3>
                        <p className="mt-1 font-bold text-slate-600">
                          {person.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {person.links.map((link) => (
                        <SocialButton
                          key={link.kind}
                          link={link}
                          personName={person.name}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Bio real (LinkedIn). TODO(Ana/Murilo): revisar a voz. */}
                  <p className="mt-4 font-bold leading-relaxed text-slate-700">
                    {person.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. NOSSOS VALORES */}
        <section className="bg-[#FFB800] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Eyebrow>COMO PENSAMOS</Eyebrow>
            <div className="mt-2 grid gap-5 md:grid-cols-3">
              {values.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border-2 border-[#1a1a1a] bg-white p-6 shadow-[4px_4px_0_#0f172a]"
                >
                  <HeartHandshake
                    className="mb-5 h-8 w-8"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                  {/* TODO(Ana): revisar os valores e a copy */}
                  <h3 className="font-display text-xl font-black leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 font-bold leading-relaxed text-slate-700">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. CREATORS QUE APOIAM (reuso do dado real) */}
        <section className="border-y-2 border-[#1a1a1a] bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>QUEM APOIA</Eyebrow>
                <h2 className="font-display text-4xl font-black leading-tight sm:text-5xl">
                  Creators de conteúdo em tech.
                </h2>
              </div>
              <Link
                href="/creators"
                className="inline-flex items-center gap-1 font-black text-violet-800 hover:underline"
              >
                Ver todos
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-3">
              {bandCreators.map((creator) => (
                <li key={creator.handle}>
                  <a
                    href={creator.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Instagram de @${creator.handle}`}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-white py-1 pl-1 pr-3 font-display text-sm font-bold shadow-[3px_3px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
                  >
                    <CreatorAvatar photo={creator.photo} name={creator.name} />
                    <span>@{creator.handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 8. CONTATO */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-3xl border-2 border-[#1a1a1a] bg-[image:linear-gradient(160deg,#6b1fc9,#3f1185)] p-8 text-center text-white shadow-[6px_6px_0_#FFB800] sm:p-12">
            <Icon
              icon="ph:chats-circle-bold"
              className="mx-auto mb-5 text-[#FFB800]"
              style={{ fontSize: "48px" }}
              aria-hidden="true"
            />
            <Eyebrow>FALE COM A GENTE</Eyebrow>
            {/* TODO(Ana): confirmar canal e o e-mail ativo (nao inventado) */}
            <h2 className="font-display text-3xl font-black leading-tight sm:text-4xl">
              Tem ideia, dúvida ou parceria?
            </h2>
            <p className="mt-4 text-lg font-bold leading-relaxed text-slate-200">
              A gente responde no Instagram do projeto.
              {/* TODO(Ana): adicionar e-mail de contato quando confirmado. */}
            </p>
            <a
              href={CONTACT_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-[#1a1a1a] bg-[#FFB800] px-6 py-3 font-black text-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] transition-transform motion-safe:hover:-translate-y-0.5"
            >
              <Icon
                icon="ph:instagram-logo-bold"
                style={{ fontSize: "20px" }}
                aria-hidden="true"
              />
              @boranatech
            </a>
          </div>
        </section>
      </main>
    </Layout>
  );
}
