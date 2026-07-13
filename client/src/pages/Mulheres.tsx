import { type ReactNode } from "react";
import {
  CheckCircle,
  ExternalLink,
  Flower2,
  Heart,
  HeartHandshake,
  Instagram,
  Mic,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { womenArea } from "@/lib/platformData";
import { getFaviconUrl, hideBrokenImage } from "@/lib/utils";

export default function Mulheres() {
  const reduce = useReducedMotion();
  const reveal = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-80px" },
        transition: { duration: 0.5, ease: "easeOut" as const },
      };
  const stepList = reduce
    ? {}
    : {
        initial: "hidden",
        whileInView: "show",
        viewport: { once: true, margin: "-80px" },
        variants: {
          hidden: {},
          show: { transition: { staggerChildren: 0.1 } },
        },
      };
  const stepItem = reduce
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 16 },
          show: { opacity: 1, y: 0 },
        },
      };

  return (
    <Layout>
      <SEO
        title="Mulheres na Tecnologia · Comunidades, oportunidades e carreira"
        description="Recursos, comunidades, oportunidades e caminhos para mulheres que querem começar ou evoluir na área de tecnologia."
        keywords={[
          "mulheres na tecnologia",
          "mulheres na ti",
          "diversidade tech",
          "programadoras brasil",
        ]}
        url="/mulheres"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden border-b-2 border-slate-900 bg-pink-100 py-12">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#db2777_1px,transparent_1px)] [background-size:18px_18px]" />
        <Flower2
          aria-hidden
          className="animate-gentle-float pointer-events-none absolute right-10 top-8 hidden h-20 w-20 rotate-12 text-pink-300 md:block"
          style={{ animationDelay: "0s" }}
        />
        <Flower2
          aria-hidden
          className="animate-gentle-float pointer-events-none absolute bottom-8 left-10 hidden h-14 w-14 -rotate-12 text-rose-300 md:block"
          style={{ animationDelay: "1.2s" }}
        />
        <Heart
          aria-hidden
          className="animate-gentle-float pointer-events-none absolute bottom-10 right-32 hidden h-10 w-10 text-pink-400 md:block"
          style={{ animationDelay: "0.6s" }}
        />
        <a
          href="https://www.instagram.com/ana.natech/"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white/90 px-3 py-1.5 text-xs font-black text-pink-800 shadow-[3px_3px_0_#0f172a] backdrop-blur transition-transform hover:scale-105 hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 sm:right-6 sm:top-6"
        >
          <Instagram className="h-3.5 w-3.5" />
          @ana.natech
          <Sparkles
            aria-hidden
            className="animate-twinkle h-3 w-3 text-pink-500"
            style={{ animationDelay: "0.4s", animationDuration: "2.2s" }}
          />
        </a>
        <div className="container">
          <motion.div {...reveal} className="relative max-w-3xl">
            <Sparkles
              aria-hidden
              className="animate-twinkle pointer-events-none absolute right-2 top-10 hidden h-5 w-5 text-pink-400 sm:block"
              style={{ animationDelay: "0s", animationDuration: "2.6s" }}
            />
            <Sparkles
              aria-hidden
              className="animate-twinkle pointer-events-none absolute left-1/2 top-1 hidden h-4 w-4 text-rose-400 md:block"
              style={{ animationDelay: "0.7s", animationDuration: "3s" }}
            />
            <Sparkles
              aria-hidden
              className="animate-twinkle pointer-events-none absolute right-24 bottom-6 hidden h-4 w-4 text-pink-300 lg:block"
              style={{ animationDelay: "1.2s", animationDuration: "2.2s" }}
            />
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-pink-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
              <Flower2 className="h-3.5 w-3.5" />
              área de mulheres
            </p>
            <h1 className="font-display text-4xl font-black text-slate-950">
              Comunidade, referências e oportunidades para mulheres em tech.
            </h1>
            <p className="mt-3 max-w-2xl text-slate-950">
              Um espaço acolhedor para encontrar redes seguras, criadoras de
              conteúdo, vídeos, bolsas e vagas afirmativas.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {["acolhimento", "rede segura", "comunidade", "visibilidade"].map(
                (item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-pink-800 shadow-[3px_3px_0_#f9a8d4]"
                  >
                    <Flower2 className="h-3.5 w-3.5" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-pink-50 via-white to-rose-50 py-12">
        <div className="container space-y-8">
          <motion.div
            {...reveal}
            className="relative max-w-2xl rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[5px_5px_0_#db2777] sm:p-5"
          >
            <Sparkles
              aria-hidden
              className="animate-twinkle pointer-events-none absolute right-3 top-3 h-4 w-4 text-pink-400"
              style={{ animationDelay: "0.3s", animationDuration: "2.4s" }}
            />
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {womenArea.founder.photoUrl ? (
                <img
                  src={womenArea.founder.photoUrl}
                  alt={`Foto de ${womenArea.founder.name}`}
                  className="h-16 w-16 shrink-0 rounded-full border-2 border-slate-900 object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-pink-300 font-display text-2xl font-black text-slate-950"
                >
                  {womenArea.founder.name.charAt(0)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-700">
                  Fundadora
                </p>
                <h2 className="font-display text-xl font-black text-slate-950">
                  {womenArea.founder.name}
                </h2>
                <p className="text-sm font-bold text-slate-700">
                  {womenArea.founder.role}
                </p>
                {womenArea.founder.message && (
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {womenArea.founder.message}
                  </p>
                )}
              </div>
              <a
                href={womenArea.founder.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border-2 border-slate-900 bg-pink-300 px-4 py-2 text-xs font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-0.5 hover:scale-105 hover:brightness-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
              >
                <Instagram className="h-4 w-4" />
                Seguir no Instagram {womenArea.founder.handle}
              </a>
            </div>
          </motion.div>

          <motion.div {...reveal} className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: <Flower2 className="h-6 w-6 text-pink-700" />,
                title: "Você não precisa provar tudo sozinha",
                desc: "Use comunidade para pedir revisão, indicação e apoio técnico.",
              },
              {
                icon: <Heart className="h-6 w-6 text-rose-700" />,
                title: "Pertencimento também é estratégia",
                desc: "Ambientes seguros ajudam a continuar quando a jornada pesa.",
              },
              {
                icon: <Sparkles className="h-6 w-6 text-pink-700" />,
                title: "Sua trajetória conta",
                desc: "Projetos, posts e aprendizados pequenos já são evidências reais.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[6px_6px_0_#f9a8d4]"
              >
                {item.icon}
                <h2 className="font-display mt-3 text-xl font-black text-slate-950">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.div
            {...reveal}
            className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_#f9a8d4]"
          >
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-700" />
              <h2 className="font-display text-2xl font-black text-slate-950">
                Você não está sozinha
              </h2>
            </div>
            <p className="mb-5 max-w-3xl text-sm font-semibold text-slate-600">
              {womenArea.reassurance.intro}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {womenArea.reassurance.fears.map((fear) => (
                <div
                  key={fear.title}
                  className="rounded-2xl border-2 border-slate-900 bg-rose-50 p-4 shadow-[4px_4px_0_#fb7185]"
                >
                  <h3 className="font-display font-black text-slate-950">
                    {fear.title}
                  </h3>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
                    {fear.desc}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={womenArea.reassurance.readingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-pink-300 px-4 py-2 text-xs font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
              >
                {womenArea.reassurance.readingLabel}{" "}
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="#comunidades"
                className="inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
              >
                Ver comunidades
              </a>
            </div>
          </motion.div>

          <motion.div
            {...reveal}
            className="rounded-3xl border-2 border-slate-900 bg-pink-100 p-6 shadow-[8px_8px_0_#0f172a]"
          >
            <div className="mb-5 flex items-center gap-2">
              <Sparkles
                aria-hidden
                className="animate-twinkle h-5 w-5 text-pink-800"
                style={{ animationDelay: "0.2s", animationDuration: "2.4s" }}
              />
              <h2 className="font-display text-2xl font-black text-slate-950">
                Trilha da iniciante
              </h2>
            </div>
            <motion.ol {...stepList} className="space-y-1">
              {womenArea.starterPath.map((step, index) => (
                <motion.li
                  {...stepItem}
                  key={step.title}
                  className="group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-pink-50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-900 bg-pink-300 text-xs font-black text-slate-950 transition-transform group-hover:-translate-y-0.5 group-hover:scale-110">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-display font-black text-slate-950 transition-colors group-hover:text-pink-800">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {step.desc}
                    </p>
                  </div>
                </motion.li>
              ))}
            </motion.ol>
          </motion.div>

          <motion.div {...reveal} className="grid gap-4 md:grid-cols-3">
            {womenArea.tips.map((tip) => (
              <div
                key={tip}
                className="card-invite rounded-2xl border-pink-200 bg-pink-50 p-5"
              >
                <HeartHandshake className="mb-3 h-6 w-6 text-pink-700" />
                <p className="text-sm font-semibold text-slate-800">{tip}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            {...reveal}
            className="rounded-3xl border-2 border-slate-900 bg-pink-200 p-6 shadow-[8px_8px_0_#0f172a]"
          >
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-800" />
              <h2 className="font-display text-2xl font-black text-slate-950">
                Trilhas de apoio para entrar com mais segurança
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {womenArea.supportTracks.map((track) => (
                <div
                  key={track.title}
                  className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#db2777]"
                >
                  <h3 className="font-display font-black text-slate-950">
                    {track.title}
                  </h3>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
                    {track.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...reveal}>
            <StatsSection stats={womenArea.stats} />
          </motion.div>
          <motion.div {...reveal} id="comunidades">
            <Section
              title="Comunidades indicadas"
              items={womenArea.communities}
            />
          </motion.div>
          <motion.div {...reveal}>
            <Section
              title="Cursos e formações gratuitas"
              items={womenArea.courses}
            />
          </motion.div>
          <motion.div {...reveal}>
            <Section
              title="Mentoria e acompanhamento"
              items={womenArea.mentorship}
            />
          </motion.div>
          <motion.div {...reveal}>
            <CreatorsSection creators={womenArea.creators} />
          </motion.div>
          <motion.div {...reveal}>
            <Section title="Leituras e listas" items={womenArea.articles} />
          </motion.div>
          <motion.div {...reveal}>
            <EbooksSection ebooks={womenArea.ebooks} />
          </motion.div>

          <motion.div {...reveal} className="grid gap-5 md:grid-cols-2">
            <ListCard
              title="Vídeos para começar"
              icon={<PlayCircle className="h-5 w-5 text-pink-700" />}
              items={womenArea.videos}
            />
            <ListCard
              title="Podcasts de mulheres em tech"
              icon={<Mic className="h-5 w-5 text-pink-700" />}
              items={womenArea.podcasts}
            />
            <ListCard
              title="Vagas afirmativas"
              icon={<ExternalLink className="h-5 w-5 text-pink-700" />}
              items={womenArea.affirmativeJobs}
              // TODO(Ana): revisar o aviso
              note="Programas afirmativos abrem em janelas específicas do ano. Acompanhe os canais oficiais; nem sempre há vaga aberta agora."
            />
            <ListCard
              title="Bolsas, editais e bootcamps"
              icon={<Sparkles className="h-5 w-5 text-pink-700" />}
              items={womenArea.scholarshipPrograms}
              // TODO(Ana): revisar o aviso
              note="Bootcamps e bolsas têm inscrições periódicas. Confirme as datas nos canais oficiais."
            />
            <div className="card-brutal rounded-2xl border-pink-200 bg-pink-50 p-6">
              <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-black text-slate-950">
                <ShieldCheck className="h-5 w-5 text-pink-700" />
                Checklist de espaço seguro
              </h2>
              <div className="space-y-3">
                {womenArea.safeSpaceChecklist.map((item) => (
                  <div
                    key={item}
                    className="flex gap-2 rounded-xl border-2 border-pink-200 bg-white p-3 text-sm font-bold text-slate-700"
                  >
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-pink-700" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {womenArea.support.channels.length > 0 && (
            <motion.div
              {...reveal}
              className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-[8px_8px_0_#f9a8d4]"
            >
              <div className="mb-2 flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-pink-700" />
                <h2 className="font-display text-2xl font-black text-slate-950">
                  Sofreu assédio ou discriminação? Você pode buscar apoio
                </h2>
              </div>
              <p className="mb-5 max-w-3xl text-sm font-semibold text-slate-600">
                {womenArea.support.intro}
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {womenArea.support.channels.map((channel) => (
                  <div
                    key={channel.label}
                    className="rounded-2xl border-2 border-slate-900 bg-pink-50 p-4 shadow-[4px_4px_0_#db2777]"
                  >
                    <p className="text-xs font-black uppercase tracking-wide text-pink-800">
                      {channel.label}
                    </p>
                    {channel.tel ? (
                      <a
                        href={`tel:${channel.tel}`}
                        className="font-display text-3xl font-black text-slate-950 hover:text-pink-700"
                      >
                        {channel.value}
                      </a>
                    ) : (
                      <p className="font-display text-3xl font-black text-slate-950">
                        {channel.value}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
                      {channel.desc}
                    </p>
                  </div>
                ))}
              </div>
              <a
                href={womenArea.support.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-pink-700 hover:text-pink-800"
              >
                {womenArea.support.sourceLabel}{" "}
                <ExternalLink className="h-3 w-3" />
              </a>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
}

function CreatorsSection({
  creators,
}: {
  creators: {
    name: string;
    handle: string;
    topic: string;
    url: string;
    avatarUrl: string;
    parceira?: boolean;
  }[];
}) {
  const initials = (fullName: string) =>
    fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();

  const cardStyles = [
    { accent: "bg-violet-500", shadow: "shadow-[5px_5px_0_#8b5cf6]" },
    { accent: "bg-[#FFB800]", shadow: "shadow-[5px_5px_0_#FFB800]" },
    { accent: "bg-fuchsia-500", shadow: "shadow-[5px_5px_0_#e879f9]" },
  ];

  return (
    <div>
      <p className="mb-2 inline-flex rounded-full border-2 border-slate-900 bg-violet-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[3px_3px_0_#0f172a]">
        Quem acompanhar
      </p>
      <h2 className="font-display mb-5 text-2xl font-black text-slate-950 sm:text-3xl">
        Criadoras e comunidades para acompanhar
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((creator, index) => {
          const favicon = getFaviconUrl(creator.url);
          const style = cardStyles[index % cardStyles.length];
          return (
            <a
              key={creator.name}
              href={creator.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex flex-col overflow-hidden rounded-2xl border-2 border-slate-900 bg-white p-5 ${style.shadow} transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1`}
            >
              <span
                aria-hidden
                className={`-mx-5 -mt-5 mb-4 h-2 ${style.accent}`}
              />
              <div className="flex gap-4">
                <Avatar className="size-14 shrink-0 border-2 border-slate-900 shadow-[3px_3px_0_#0f172a]">
                  <AvatarImage
                    src={creator.avatarUrl}
                    alt={`Foto de perfil de ${creator.name}`}
                  />
                  <AvatarFallback className="border-2 border-slate-900 bg-violet-200 text-sm font-black text-violet-900">
                    {initials(creator.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-black leading-tight text-slate-950">
                    {creator.name}
                  </h3>
                  {creator.parceira ? (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border-2 border-slate-900 bg-[#FFB800] px-2 py-0.5 text-[10px] font-black uppercase text-slate-950">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      Parceira BoraNaTech
                    </span>
                  ) : null}
                  {creator.handle ? (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-violet-700">
                      {favicon && (
                        <img
                          src={favicon}
                          alt=""
                          onError={hideBrokenImage}
                          className="h-4 w-4 shrink-0 rounded border border-slate-300"
                        />
                      )}
                      {creator.handle}
                    </p>
                  ) : null}
                </div>
              </div>
              {/* Descricao e autodeclaracao real; vazia por ora. TODO(Ana): nao inventar bio. */}
              {creator.topic ? (
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  {creator.topic}
                </p>
              ) : null}
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-violet-700">
                Conhecer
                <ExternalLink
                  className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function EbooksSection({
  ebooks,
}: {
  ebooks: {
    title: string;
    author: string;
    desc: string;
    url: string;
    free: boolean;
  }[];
}) {
  return (
    <div>
      <h2 className="font-display mb-4 text-2xl font-black text-slate-950">
        Leituras e ebooks
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {ebooks.map((ebook) => {
          const favicon = getFaviconUrl(ebook.url);
          return (
            <a
              key={ebook.url}
              href={ebook.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-invite flex flex-col rounded-2xl border-pink-100 bg-white p-5 hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2">
                {favicon && (
                  <img
                    src={favicon}
                    alt=""
                    onError={hideBrokenImage}
                    className="h-5 w-5 shrink-0 rounded border border-slate-300"
                  />
                )}
                <span
                  className={`inline-flex rounded-full border-2 border-slate-900 px-2 py-0.5 text-[10px] font-black uppercase ${
                    ebook.free
                      ? "bg-emerald-200 text-emerald-900"
                      : "bg-amber-200 text-amber-900"
                  }`}
                >
                  {ebook.free ? "Gratuito" : "Pago"}
                </span>
              </div>
              <h3 className="mt-3 font-display font-black text-slate-950">
                {ebook.title}
              </h3>
              <p className="mt-1 text-xs font-bold text-pink-700">
                {ebook.author}
              </p>
              <p className="mt-2 flex-1 text-sm text-slate-600">{ebook.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-pink-700">
                Ver <ExternalLink className="h-3 w-3" />
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: { name: string; desc: string; url: string }[];
}) {
  return (
    <div>
      <h2 className="font-display mb-4 text-2xl font-black text-slate-950">
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => {
          const favicon = getFaviconUrl(item.url);
          return (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-invite rounded-2xl border-pink-100 bg-white p-5 hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-2">
                {favicon && (
                  <img
                    src={favicon}
                    alt=""
                    onError={hideBrokenImage}
                    className="h-5 w-5 shrink-0 rounded border border-slate-300"
                  />
                )}
                <h3 className="font-display font-black text-slate-950">
                  {item.name}
                </h3>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-pink-700">
                Conhecer <ExternalLink className="h-3 w-3" />
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function StatsSection({
  stats,
}: {
  stats: { value: string; label: string; source: string; year: string }[];
}) {
  const shadows = [
    "shadow-[5px_5px_0_#8b5cf6]",
    "shadow-[5px_5px_0_#FFB800]",
    "shadow-[5px_5px_0_#e879f9]",
  ];
  return (
    <div>
      <p className="mb-2 inline-flex rounded-full border-2 border-slate-900 bg-violet-300 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[3px_3px_0_#0f172a]">
        O cenário
      </p>
      {/* TODO(Ana): confirmar os dados; cada card exibe a fonte e o ano. */}
      <h2 className="font-display mb-5 text-2xl font-black text-slate-950 sm:text-3xl">
        Por que essa área importa, em números
      </h2>
      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={stat.source}
            className={`flex flex-col rounded-2xl border-2 border-slate-900 bg-white p-6 ${shadows[index % shadows.length]}`}
          >
            <p className="font-display text-4xl font-black leading-none text-violet-700 sm:text-5xl">
              {stat.value}
            </p>
            <p className="mt-3 text-sm font-bold leading-relaxed text-slate-700">
              {stat.label}
            </p>
            <p className="mt-4 text-[0.7rem] font-black uppercase tracking-wide text-slate-500">
              Fonte: {stat.source}, {stat.year}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListCard({
  title,
  icon,
  items,
  note,
}: {
  title: string;
  icon: ReactNode;
  items: { title?: string; name?: string; url: string }[];
  note?: string;
}) {
  return (
    <div className="card-brutal rounded-2xl border-pink-200 bg-white p-6">
      <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-black text-slate-950">
        {icon}
        {title}
      </h2>
      {note ? (
        <p className="mb-4 rounded-lg border-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
          {note}
        </p>
      ) : null}
      <div className="space-y-3">
        {items.map((item) => {
          const favicon = getFaviconUrl(item.url);
          return (
            <a
              key={item.title || item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border-2 border-pink-100 bg-pink-50 p-3 text-sm font-bold text-slate-800 transition-transform hover:border-pink-400 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
            >
              {favicon && (
                <img
                  src={favicon}
                  alt=""
                  onError={hideBrokenImage}
                  className="h-5 w-5 shrink-0 rounded border border-slate-300"
                />
              )}
              <span>{item.title || item.name}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
