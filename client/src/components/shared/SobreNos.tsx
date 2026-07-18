import { useState } from "react";
import { Link } from "wouter";
import { Icon } from "@iconify/react";
import { ArrowRight, Compass } from "lucide-react";

import { creators } from "@/lib/creatorsData";
import { CONTACT_EMAIL } from "@/lib/footerData";

// Secao "Sobre Nos": conteudo da pagina propria /sobre (pages/Sobre.tsx),
// acessada pelo item "Sobre nos" do menu Comunidade (grupo CONEXOES).
// Estrutura de NARRATIVA (gancho -> virada -> pra quem -> quem somos -> o que
// construimos -> quem apoia -> fecho), nao lista de blocos soltos. As bios e
// credenciais vem dos LinkedIns REAIS da Ana e do Murilo (fornecidos por eles):
// nada acrescentado. Dado de mercado com fonte visivel (Brasscom, 2023). Fotos
// em client/public/sobre/ (fallback nas iniciais ate os arquivos existirem).
// TODO(Ana): revisar TODA a copy nova desta secao antes de publicar.

// 1. Gancho. Dado FORNECIDO pela Ana. TODO(Ana): confirmar antes de publicar.
const HOOK_PHRASE =
  "é o tanto de gente que termina um curso de tecnologia no Brasil.";
const HOOK_SUBLINE =
  "O problema quase nunca é capacidade. É falta de direção.";
const HOOK_SOURCE = "Fonte: Brasscom, 2023.";

// 2. A virada. TODO(Ana): revisar.
const TURN_PHRASE =
  "Foi por isso que criamos o Bora na Tech: a bússola que a gente queria ter tido.";

// 3. As 3 portas, na primeira pessoa. Cada uma com cor propria. TODO(Ana): revisar.
const portas = [
  {
    numero: "01",
    fala: "Não sei nada sobre tech, mas quero entrar.",
    bg: "bg-violet-600",
  },
  {
    numero: "02",
    fala: "Já sei alguma coisa, mas não sei pra onde ir.",
    bg: "bg-sky-600",
  },
  {
    numero: "03",
    fala: "Já estou na área e quero evoluir.",
    bg: "bg-emerald-600",
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

type TeamMember = {
  name: string;
  role: string;
  photo: string;
  initials: string;
  // Credenciais que impressionam viram CHIPS escaneaveis, nao texto corrido.
  chips: string[];
  bio: string;
  links: SocialLink[];
};

// Nomes, papeis, redes, BIOS e CREDENCIAIS sao REAIS (LinkedIns da Ana e do Murilo).
const team: TeamMember[] = [
  {
    name: "Ana Julia Moura",
    role: "CEO e cofundadora",
    // Foto do hackathon em client/public/sobre/ana.jpg (fallback nas iniciais).
    photo: "/sobre/ana.jpg",
    initials: "AJ",
    chips: [
      "IBM Z Ambassador",
      "AWS Ambassador",
      "Embaixadora Alura",
      "Embaixadora ElevenLabs",
      "UniCEUB",
    ],
    // TODO(Ana): revisar a voz. Texto do LinkedIn real, nao acrescentar nada.
    bio: "Estudante de tecnologia no UniCEUB e creator (@ana.natech). Representante discente no Colegiado de TI do UniCEUB e diretora de tecnologia e inovação do DCE. Já liderou projetos de software de ponta a ponta como gestora de projetos e designer de UX/UI.",
    links: [
      { kind: "linkedin", url: "https://www.linkedin.com/in/anajulia-moura/" },
      { kind: "instagram", url: "https://www.instagram.com/ana.natech/" },
    ],
  },
  {
    name: "Murilo Cardoso",
    role: "CTO e cofundador",
    // Foto do hackathon em client/public/sobre/murilo.jpg (fallback nas iniciais).
    photo: "/sobre/murilo.jpg",
    initials: "MC",
    chips: ["Engenheiro de IA", "20+ agentes de IA", "Ciência da Computação · UniCEUB"],
    // TODO(Murilo): revisar. Texto do LinkedIn real, nao acrescentar nada.
    bio: "Engenheiro de software e especialista em agentes de IA. Cursa Ciência da Computação no UniCEUB. No Bora na Tech, constrói as ferramentas de IA que analisam seu currículo e seu LinkedIn, montam seu plano de carreira e simulam entrevistas.",
    links: [
      {
        kind: "linkedin",
        url: "https://www.linkedin.com/in/murilocardoso-dev/",
      },
      { kind: "github", url: "https://github.com/murilobarbosaa" },
    ],
  },
];

// 5. O que construimos: so numeros VERIFICAVEIS no proprio catalogo.
// tecnologias=200 (technologyData) e roadmaps=30 (roadmapV2) sao contados no
// codigo. TODO(Ana): "39 areas" vem da contagem dinamica da base (o dado
// estatico em data.ts tem 23); confirmar o numero antes de publicar.
const stats = [
  { value: "39", label: "áreas mapeadas" },
  { value: "30", label: "roadmaps" },
  { value: "200", label: "tecnologias" },
  { value: "IA", label: "ferramentas de análise" },
];

// 7. Fale conosco. CONTACT_EMAIL vem da fonte unica do rodape (footerData).
const CONTACT_INSTAGRAM = "https://www.instagram.com/boranatech/";

function SocialButton({
  link,
  personName,
}: {
  link: SocialLink;
  personName: string;
}) {
  const meta = SOCIAL_META[link.kind];
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${meta.label} de ${personName}`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all duration-200 motion-safe:hover:-translate-y-0.5 ${meta.hover}`}
    >
      <Icon icon={meta.icon} style={{ fontSize: "20px" }} aria-hidden="true" />
    </a>
  );
}

function PersonPhoto({ member }: { member: TeamMember }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(member.photo) && !failed;
  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-slate-900 bg-violet-300 font-display text-xl font-black text-slate-950">
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

function CreatorAvatar({
  photo,
  handle,
}: {
  photo: string;
  handle: string;
}) {
  const [failed, setFailed] = useState(false);
  const initial = handle.replace(/[^a-zA-Z]/g, "").charAt(0).toUpperCase() || "@";
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-slate-900 bg-white font-display text-[0.7rem] font-black text-slate-950">
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

export default function SobreNos() {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="scroll-mt-24"
    >
      <h2 id="sobre-titulo" className="sr-only">
        Sobre o Bora na Tech
      </h2>

      {/* 1. GANCHO: numero gigante */}
      <div className="border-t-2 border-slate-900 bg-[#faf8f4] py-20">
        <div className="container">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">
            Sobre nós
          </p>
          {/* TODO(Ana): o numero e o heroi visual. */}
          <p className="mt-4 font-display text-6xl font-black leading-[0.95] text-slate-950 sm:text-7xl lg:text-8xl">
            menos de <span className="text-violet-700">5%</span>
          </p>
          <p className="mt-6 max-w-2xl font-display text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
            {HOOK_PHRASE}
          </p>
          <p className="mt-4 max-w-xl text-base font-bold leading-relaxed text-slate-600">
            {HOOK_SUBLINE}
          </p>
          <p className="mt-6 text-[0.7rem] font-black uppercase tracking-[0.16em] text-slate-400">
            {HOOK_SOURCE}
          </p>
        </div>
      </div>

      {/* 2. A VIRADA */}
      <div className="border-t-2 border-slate-900 bg-[#6b1fc9] py-16 text-white">
        <div className="container">
          <Compass
            className="mb-5 h-10 w-10 text-amber-300"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          {/* TODO(Ana): revisar a frase da virada */}
          <p className="max-w-3xl font-display text-2xl font-black leading-tight sm:text-4xl">
            {TURN_PHRASE}
          </p>
        </div>
      </div>

      {/* 3. AS 3 PORTAS */}
      <div className="border-t-2 border-slate-900 bg-[#faf8f4] py-16">
        <div className="container">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">
            Pra quem é
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {portas.map((porta) => (
              <div
                key={porta.numero}
                className={`flex flex-col rounded-2xl border-2 border-slate-900 ${porta.bg} p-6 text-white shadow-[6px_6px_0_#0f172a]`}
              >
                <span
                  className="font-display text-5xl font-black leading-none text-white/85"
                  aria-hidden="true"
                >
                  {porta.numero}
                </span>
                {/* TODO(Ana): revisar as falas */}
                <p className="mt-5 font-display text-xl font-black leading-tight">
                  {porta.fala}
                </p>
              </div>
            ))}
          </div>
          {/* TODO(Ana): revisar */}
          <p className="mt-8 font-display text-2xl font-black text-slate-950 sm:text-3xl">
            A gente atende os três.
          </p>
        </div>
      </div>

      {/* 4. QUEM ESTA POR TRAS */}
      <div className="border-t-2 border-slate-900 bg-white py-16">
        <div className="container">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">
            Quem está por trás
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {team.map((person) => (
              <div
                key={person.name}
                className="flex flex-col rounded-2xl border-2 border-slate-900 bg-violet-50 p-6 shadow-[6px_6px_0_#c4b5fd]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <PersonPhoto member={person} />
                    <div>
                      <h3 className="font-display text-xl font-black text-slate-950">
                        {person.name}
                      </h3>
                      <p className="mt-0.5 font-bold text-slate-600">
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

                {/* Credenciais como chips escaneaveis, nao texto corrido */}
                <ul className="mt-4 flex flex-wrap gap-2">
                  {person.chips.map((chip) => (
                    <li
                      key={chip}
                      className="inline-flex rounded-full border-2 border-slate-900 bg-[#FFB800] px-3 py-1 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]"
                    >
                      {chip}
                    </li>
                  ))}
                </ul>

                {/* Bio real (LinkedIn). TODO(Ana/Murilo): revisar a voz. */}
                <p className="mt-4 font-bold leading-relaxed text-slate-700">
                  {person.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. O QUE CONSTRUIMOS (numeros verificaveis) */}
      <div className="border-t-2 border-slate-900 bg-[#6b1fc9] py-16 text-white">
        <div className="container">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
            O que construímos
          </p>
          {/* TODO(Ana): confirmar "39 areas" (estatico=23; base mostra a contagem real) */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border-2 border-slate-900 bg-white p-6 text-slate-950 shadow-[5px_5px_0_#0f172a]"
              >
                <p className="font-display text-4xl font-black leading-none text-violet-700 sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-black uppercase tracking-wide text-slate-600">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. QUEM APOIA (reuso do dado de creatorsData) */}
      <div className="border-t-2 border-slate-900 bg-[#faf8f4] py-16">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">
                Quem apoia
              </p>
              {/* TODO(Ana): revisar a frase */}
              <h3 className="mt-2 font-display text-2xl font-black text-slate-950 sm:text-3xl">
                Creators que acreditam no projeto.
              </h3>
            </div>
            <Link
              href="/creators"
              className="inline-flex items-center gap-1 font-black text-violet-800 hover:underline"
            >
              Ver todos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-3">
            {creators.map((creator) => (
              <li key={creator.handle}>
                <a
                  href={creator.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Instagram de @${creator.handle}`}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white py-1 pl-1 pr-3 font-display text-sm font-bold shadow-[3px_3px_0_#0f172a] transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
                >
                  <CreatorAvatar photo={creator.photo} handle={creator.handle} />
                  <span>@{creator.handle}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 7. FALE CONOSCO (fecho) */}
      <div className="border-t-2 border-slate-900 bg-white py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-2xl border-2 border-slate-900 bg-[image:linear-gradient(160deg,#6b1fc9,#3f1185)] p-8 text-center text-white shadow-[8px_8px_0_#FFB800] sm:p-10">
            <p className="mb-3 inline-flex rounded-full border-2 border-slate-900 bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950">
              {/* TODO(Ana): titulo da secao */}
              Fale conosco
            </p>
            {/* TODO(Ana): revisar a frase de convite */}
            <h3 className="font-display text-2xl font-black leading-tight sm:text-3xl">
              Dúvida, parceria, sugestão ou só quer trocar ideia? A gente
              responde.
            </h3>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                aria-label={`Enviar email para ${CONTACT_EMAIL}`}
                className="inline-flex max-w-full items-center gap-2 rounded-full border-2 border-slate-900 bg-amber-300 px-6 py-3 font-black text-slate-950 shadow-[4px_4px_0_#1a1a1a] transition-transform motion-safe:hover:-translate-y-0.5"
              >
                <Icon
                  icon="ph:envelope-simple-bold"
                  style={{ fontSize: "20px" }}
                  aria-hidden="true"
                />
                <span className="truncate">{CONTACT_EMAIL}</span>
              </a>
              <a
                href={CONTACT_INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-6 py-3 font-black text-slate-950 shadow-[4px_4px_0_#1a1a1a] transition-transform motion-safe:hover:-translate-y-0.5"
              >
                <Icon
                  icon="ph:instagram-logo-bold"
                  style={{ fontSize: "20px" }}
                  aria-hidden="true"
                />
                @boranatech
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
