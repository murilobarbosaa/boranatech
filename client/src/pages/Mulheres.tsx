import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { CheckCircle, ExternalLink, Flower2, Heart, HeartHandshake, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { womenArea } from "@/lib/platformData";

export default function Mulheres() {
  const [, setLocation] = useLocation();
  const { loading, profile } = useAuth();
  const allowed = profile != null && profile.gender !== "masculino";

  useEffect(() => {
    if (loading) return;
    if (!allowed) {
      toast.info("Esta seção é exclusiva para perfis femininos e diversidade.");
      setLocation("/", { replace: true });
    }
  }, [loading, allowed, setLocation]);

  if (loading || !allowed) return null;

  return (
    <Layout>
      <SEO
        title="Mulheres na Tecnologia — Comunidades, oportunidades e carreira"
        description="Recursos, comunidades, oportunidades e caminhos para mulheres que querem começar ou evoluir na área de tecnologia."
        keywords={["mulheres na tecnologia", "mulheres na ti", "diversidade tech", "programadoras brasil"]}
        url="/mulheres"
        schemaType="CollectionPage"
      />
      <section className="relative overflow-hidden border-b-2 border-slate-900 bg-pink-100 py-12">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(#db2777_1px,transparent_1px)] [background-size:18px_18px]" />
        <Flower2 className="pointer-events-none absolute right-10 top-8 hidden h-20 w-20 rotate-12 text-pink-300 md:block" />
        <Flower2 className="pointer-events-none absolute bottom-8 left-10 hidden h-14 w-14 -rotate-12 text-rose-300 md:block" />
        <Heart className="pointer-events-none absolute bottom-10 right-32 hidden h-10 w-10 text-pink-400 md:block" />
        <div className="container">
          <div className="relative max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-pink-300 px-3 py-1 text-xs font-black uppercase text-slate-950 shadow-[3px_3px_0_#0f172a]">
              <Flower2 className="h-3.5 w-3.5" />
              área de mulheres
            </p>
            <h1 className="font-display text-4xl font-black text-slate-950">Comunidade, referências e oportunidades para mulheres em tech.</h1>
            <p className="mt-3 max-w-2xl text-slate-950">Um espaço acolhedor para encontrar redes seguras, criadoras de conteúdo, vídeos, bolsas e vagas afirmativas.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {["acolhimento", "rede segura", "comunidade", "visibilidade"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-3 py-1.5 text-xs font-black text-pink-800 shadow-[3px_3px_0_#f9a8d4]">
                  <Flower2 className="h-3.5 w-3.5" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-pink-50 via-white to-rose-50 py-12">
        <div className="container space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: <Flower2 className="h-6 w-6 text-pink-700" />, title: "Você não precisa provar tudo sozinha", desc: "Use comunidade para pedir revisão, indicação e apoio técnico." },
              { icon: <Heart className="h-6 w-6 text-rose-700" />, title: "Pertencimento também é estratégia", desc: "Ambientes seguros ajudam a continuar quando a jornada pesa." },
              { icon: <Sparkles className="h-6 w-6 text-pink-700" />, title: "Sua trajetória conta", desc: "Projetos, posts e aprendizados pequenos já são evidências reais." },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border-2 border-slate-900 bg-white p-5 shadow-[6px_6px_0_#f9a8d4]">
                {item.icon}
                <h2 className="font-display mt-3 text-xl font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {womenArea.tips.map((tip) => (
              <div key={tip} className="card-invite rounded-2xl border-pink-200 bg-pink-50 p-5">
                <HeartHandshake className="mb-3 h-6 w-6 text-pink-700" />
                <p className="text-sm font-semibold text-slate-800">{tip}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border-2 border-slate-900 bg-pink-200 p-6 shadow-[8px_8px_0_#0f172a]">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-800" />
              <h2 className="font-display text-2xl font-black text-slate-950">Trilhas de apoio para entrar com mais segurança</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {womenArea.supportTracks.map((track) => (
                <div key={track.title} className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[4px_4px_0_#db2777]">
                  <h3 className="font-display font-black text-slate-950">{track.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">{track.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <Section title="Comunidades indicadas" items={womenArea.communities} />
          <CreatorsSection creators={womenArea.creators} />

          <div className="grid gap-5 md:grid-cols-2">
            <ListCard title="Vídeos para começar" icon={<PlayCircle className="h-5 w-5 text-pink-700" />} items={womenArea.videos} />
            <ListCard title="Vagas afirmativas" icon={<ExternalLink className="h-5 w-5 text-pink-700" />} items={womenArea.affirmativeJobs} />
            <ListCard title="Bolsas, editais e bootcamps" icon={<Sparkles className="h-5 w-5 text-pink-700" />} items={womenArea.scholarshipPrograms} />
            <div className="card-brutal rounded-2xl border-pink-200 bg-pink-50 p-6">
              <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-black text-slate-950">
                <ShieldCheck className="h-5 w-5 text-pink-700" />
                Checklist de espaço seguro
              </h2>
              <div className="space-y-3">
                {womenArea.safeSpaceChecklist.map((item) => (
                  <div key={item} className="flex gap-2 rounded-xl border-2 border-pink-200 bg-white p-3 text-sm font-bold text-slate-700">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-pink-700" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function CreatorsSection({
  creators,
}: {
  creators: { name: string; handle: string; topic: string; url: string; avatarUrl: string }[];
}) {
  const initials = (fullName: string) =>
    fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();

  return (
    <div>
      <h2 className="font-display mb-4 text-2xl font-black text-slate-950">Criadoras para acompanhar</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {creators.map((creator) => (
          <a
            key={creator.name}
            href={creator.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-invite flex gap-4 rounded-2xl border-pink-100 bg-white p-5 hover:bg-pink-50"
          >
            <Avatar className="size-14 shrink-0 border-2 border-slate-900 shadow-[3px_3px_0_#f472b6]">
              <AvatarImage src={creator.avatarUrl} alt={`Foto de perfil de ${creator.name}`} />
              <AvatarFallback className="border-2 border-pink-200 bg-pink-100 text-xs font-black text-pink-900">{initials(creator.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-black text-slate-950">{creator.name}</h3>
              <p className="text-xs font-semibold text-pink-700">{creator.handle}</p>
              <p className="mt-2 text-sm text-slate-600">{creator.topic}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-pink-700">Conhecer <ExternalLink className="h-3 w-3" /></span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: { name: string; desc: string; url: string }[] }) {
  return (
    <div>
      <h2 className="font-display mb-4 text-2xl font-black text-slate-950">{title}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer" className="card-invite rounded-2xl border-pink-100 bg-white p-5 hover:bg-pink-50">
            <h3 className="font-display font-black text-slate-950">{item.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-pink-700">Conhecer <ExternalLink className="h-3 w-3" /></span>
          </a>
        ))}
      </div>
    </div>
  );
}

function ListCard({ title, icon, items }: { title: string; icon: ReactNode; items: { title?: string; name?: string; url: string }[] }) {
  return (
    <div className="card-brutal rounded-2xl border-pink-200 bg-white p-6">
      <h2 className="font-display mb-4 flex items-center gap-2 text-xl font-black text-slate-950">{icon}{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <a key={item.title || item.name} href={item.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border-2 border-pink-100 bg-pink-50 p-3 text-sm font-bold text-slate-800 hover:border-pink-400">
            {item.title || item.name}
          </a>
        ))}
      </div>
    </div>
  );
}
