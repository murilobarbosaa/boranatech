import { Link } from "wouter";
import { Icon } from "@iconify/react";
import { Heart } from "lucide-react";
import Logo from "@/components/Logo";
import { FOOTER_COLUMNS, SOCIAL_LINKS } from "@/lib/footerData";

type SocialIconProps = {
  icon: string;
  href: string;
  label: string;
};

function SocialIcon({ icon, href, label }: SocialIconProps) {
  const isPlaceholder = !href;
  const baseClass =
    "inline-flex h-11 w-11 items-center justify-center rounded-lg border-2 border-slate-800 bg-slate-900 text-slate-400 transition-all duration-200";
  const stateClass = isPlaceholder
    ? "cursor-not-allowed opacity-60"
    : "hover:border-amber-400 hover:text-amber-400 hover:-translate-y-0.5";
  const className = `${baseClass} ${stateClass}`;

  if (isPlaceholder) {
    return (
      <span className={className} aria-label={`${label} (em breve)`} title={`${label} (em breve)`}>
        <Icon icon={icon} style={{ fontSize: "32px" }} aria-hidden="true" />
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={label}
      title={label}
    >
      <Icon icon={icon} style={{ fontSize: "20px" }} aria-hidden="true" />
    </a>
  );
}

const SOCIAL_ITEMS = [
  { key: "instagram", icon: "ph:instagram-logo-bold", href: SOCIAL_LINKS.instagram, label: "Instagram da BoraNaTech" },
  { key: "linkedin", icon: "ph:linkedin-logo-bold", href: SOCIAL_LINKS.linkedin, label: "LinkedIn da BoraNaTech" },
  { key: "tiktok", icon: "ph:tiktok-logo-bold", href: SOCIAL_LINKS.tiktok, label: "TikTok da BoraNaTech" },
  { key: "twitter", icon: "ph:x-logo-bold", href: SOCIAL_LINKS.twitter, label: "X da BoraNaTech" },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-300" role="contentinfo">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[200px] w-[600px] -translate-x-1/2"
        style={{
          background: "radial-gradient(ellipse at top, rgba(255,184,0,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />

      <div className="container relative z-10">
        <div className="flex flex-col gap-6 border-b-2 border-slate-800 pb-12 pt-16 md:flex-row md:items-end md:justify-between">
          <Link href="/" className="group inline-flex">
            <Logo variant="dark" size="lg" />
          </Link>
          <p className="max-w-sm text-base text-slate-400 md:text-right md:text-lg">
            Sua porta de entrada para o universo da tecnologia. Simples, organizado e feito pra quem está começando.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-3 md:grid-cols-4 md:gap-10 lg:grid-cols-[1fr_1fr_1fr_1fr_1.5fr]">
          {Object.values(FOOTER_COLUMNS).map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="mb-4 font-display text-xs font-black tracking-widest text-amber-400">
                {column.title}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-1">
            <h3 className="mb-4 font-display text-xs font-black tracking-widest text-amber-400">
              NEWSLETTER
            </h3>
            <p className="mb-4 text-sm text-slate-400">
              Novidades da tech direto no seu inbox. Em breve.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="seu@email.com"
                disabled
                aria-label="Email para newsletter (em breve)"
                className="min-w-0 flex-1 cursor-not-allowed rounded-lg border-2 border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-500 placeholder:text-slate-600"
              />
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg border-2 border-slate-800 bg-slate-800 px-4 py-2 font-display text-xs font-black text-slate-500"
              >
                Em breve
              </button>
            </div>
          </div>
        </div>

        <div className="border-y-2 border-slate-800 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <span className="text-center font-display text-xs font-black tracking-widest text-amber-400 md:text-left">
              VEM COM A GENTE
            </span>
            <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
              {SOCIAL_ITEMS.map((item) => (
                <SocialIcon key={item.key} icon={item.icon} href={item.href} label={item.label} />
              ))}
            </div>
          </div>
        </div>

        <div className="border-b-2 border-slate-800 py-6 text-center text-xs text-slate-500">
          Os conteúdos externos (cursos, plataformas, links) pertencem aos seus respectivos criadores. O{" "}
          <span className="font-bold text-amber-400">BORA NA TECH?</span> é um projeto de curadoria.
        </div>

        <div className="flex flex-col gap-3 py-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            © {year} BORA NA TECH? — Feito{" "}
            <Heart className="inline h-3.5 w-3.5 text-amber-400" aria-hidden="true" /> pra quem está começando.
          </div>
          <div>
            Conteúdo original sob{" "}
            <Link href="/licenca" className="text-slate-400 transition-colors hover:text-white">
              CC BY-NC-SA 4.0
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
