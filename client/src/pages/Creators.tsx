import { useState } from "react";
import { ExternalLink, Instagram, UserPlus } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { creators, founders, type Creator } from "@/lib/creatorsData";

const ac = getPageAccentUi("violet");

// TODO(Ana): revisar a copy do hero, do bloco de fundadores e do convite.
const COPY = {
  seoTitle: "Creators · quem apoia o Bora na Tech",
  seoDescription:
    "Creators de conteúdo em tech que apoiam o Bora na Tech. Conheça cada um, a área de atuação e as redes antes de seguir.",
  heroEyebrow: "quem apoia",
  heroTitle: "Creators de conteúdo em tech",
  heroSubtitle:
    "Gente que cria conteúdo de tecnologia e apoia o projeto. Conheça cada um antes de seguir na rede.",
  bioFallback: "Autodeclaração em breve.",
  foundersTitle: "Fundadores",
  foundersSubtitle: "Quem está por trás do Bora na Tech.",
  joinTitle: "Você cria conteúdo de tech?",
  joinBody:
    "Novos creators entram por curadoria. A autodeclaração (quem é, área e redes) é escrita pelo próprio creator, pra manter tudo verdadeiro.",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

function CreatorAvatar({ creator }: { creator: Creator }) {
  const [failed, setFailed] = useState(false);
  const showImage = creator.photo && !failed;
  return (
    <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-slate-950 bg-violet-100 font-display text-lg font-black text-slate-950">
      {showImage ? (
        <img
          src={creator.photo}
          alt={`Foto de ${creator.name}`}
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden>{initials(creator.name)}</span>
      )}
    </span>
  );
}

function SocialLink({ label, url }: { label: string; url: string }) {
  const isInstagram = /instagram\.com/i.test(url);
  const Icon = isInstagram ? Instagram : ExternalLink;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-white px-3 py-1.5 text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[3px_3px_0_#0f172a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </a>
  );
}

function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border-2 border-slate-950 bg-white p-6 shadow-[4px_4px_0_#0f172a] transition-all duration-200 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[6px_6px_0_#c4b5fd]">
      <div className="flex items-center gap-4">
        <CreatorAvatar creator={creator} />
        <div className="min-w-0">
          <h3 className="font-display text-lg font-black leading-tight text-slate-950">
            {creator.name}
          </h3>
          {creator.handle ? (
            <p className="truncate text-sm font-bold text-violet-700">
              @{creator.handle}
            </p>
          ) : null}
        </div>
        {creator.founder ? (
          <span className="ml-auto shrink-0 rounded-full border-2 border-slate-950 bg-amber-300 px-2.5 py-0.5 text-[11px] font-black uppercase text-slate-950">
            Fundador
          </span>
        ) : null}
      </div>

      {creator.area ? (
        <span className="mt-4 inline-flex w-fit rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-700">
          {creator.area}
        </span>
      ) : null}

      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
        {creator.bio ? creator.bio : COPY.bioFallback}
      </p>

      {creator.instagram || creator.redes.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {creator.instagram ? (
            <SocialLink label="Instagram" url={creator.instagram} />
          ) : null}
          {creator.redes.map((rede) => (
            <SocialLink key={rede.url} label={rede.label} url={rede.url} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function Creators() {
  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title={COPY.seoTitle}
        description={COPY.seoDescription}
        url="/creators"
      />
      <PageHero
        accent="violet"
        eyebrow={COPY.heroEyebrow}
        title={COPY.heroTitle}
        subtitle={COPY.heroSubtitle}
      />

      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-12">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <li key={creator.handle}>
                <CreatorCard creator={creator} />
              </li>
            ))}
          </ul>

          <div>
            <h2 className="font-display text-2xl font-black text-slate-950">
              {COPY.foundersTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {COPY.foundersSubtitle}
            </p>
            <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {founders.map((founder) => (
                <li key={founder.name}>
                  <CreatorCard creator={founder} />
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6">
            <p className="inline-flex items-center gap-2 font-display text-lg font-black text-slate-950">
              <UserPlus className="h-5 w-5 text-violet-700" aria-hidden />
              {COPY.joinTitle}
            </p>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              {COPY.joinBody}
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
