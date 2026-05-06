import type { PageHeroAccent } from "@/components/shared/PageHero";

/**
 * Classes Tailwind alinhadas ao `accent` do PageHero para manter coerência visual nas páginas.
 */
export type PageAccentUi = {
  contentBg: string;
  stickyBar: string;
  input: string;
  link: string;
  linkHover: string;
  /** Pill com borda + fundo suave + texto */
  tag: string;
  cardHover: string;
  cardFocusRing: string;
  logoTint: string;
  /** Faixa escura de título de card/tabela */
  tableBanner: string;
  tableBannerMuted: string;
  theadLight: string;
  tbodyAccent: string;
  tbodyAccentBold: string;
  panelSoft: string;
  panelBorder: string;
  panelBorderInner: string;
  iconMuted: string;
  filterActive: string;
  filterInactive: string;
  progressFill: string;
  progressLabel: string;
  /** Sombra brutal alinhada ao accent (ex.: ícone ou comando) */
  brutalShadow: string;
  /** Sombra colorida em hover (cards que levantam) */
  liftShadow: string;
};

export const pageAccentUi: Record<PageHeroAccent, PageAccentUi> = {
  violet: {
    contentBg: "bg-violet-50",
    stickyBar:
      "border-violet-200 bg-violet-50/95 supports-[backdrop-filter]:bg-violet-50/90",
    input: "border-violet-200 focus:border-violet-500",
    link: "text-violet-700",
    linkHover: "hover:text-violet-800",
    tag: "border border-violet-200 bg-violet-50 text-violet-700",
    cardHover: "hover:bg-violet-50/60",
    cardFocusRing: "focus-visible:ring-violet-200",
    logoTint: "bg-violet-50",
    tableBanner: "bg-violet-700 text-white",
    tableBannerMuted: "text-violet-100",
    theadLight: "bg-violet-100 text-slate-950",
    tbodyAccent: "text-violet-700",
    tbodyAccentBold: "font-bold text-violet-700",
    panelSoft: "bg-violet-50",
    panelBorder: "border-violet-200",
    panelBorderInner: "border-violet-200",
    iconMuted: "text-violet-700",
    filterActive:
      "border-slate-900 bg-violet-600 text-white shadow-[2px_2px_0_#0f172a]",
    filterInactive:
      "border-slate-300 bg-white text-slate-700 hover:border-violet-400 hover:bg-violet-50",
    progressFill: "bg-violet-600",
    progressLabel: "text-violet-700",
    brutalShadow: "shadow-[3px_3px_0_#7c3aed]",
    liftShadow: "hover:shadow-[6px_6px_0_#7c3aed]",
  },
  sky: {
    contentBg: "bg-sky-50",
    stickyBar: "border-sky-200 bg-sky-50/95 supports-[backdrop-filter]:bg-sky-50/90",
    input: "border-sky-200 focus:border-sky-500",
    link: "text-sky-700",
    linkHover: "hover:text-sky-800",
    tag: "border border-sky-200 bg-sky-50 text-sky-800",
    cardHover: "hover:bg-sky-50/80",
    cardFocusRing: "focus-visible:ring-sky-200",
    logoTint: "bg-sky-50",
    tableBanner: "bg-sky-600 text-white",
    tableBannerMuted: "text-sky-100",
    theadLight: "bg-sky-100 text-slate-950",
    tbodyAccent: "text-sky-700",
    tbodyAccentBold: "font-bold text-sky-700",
    panelSoft: "bg-sky-50",
    panelBorder: "border-sky-200",
    panelBorderInner: "border-sky-200",
    iconMuted: "text-sky-700",
    filterActive:
      "border-slate-900 bg-sky-600 text-white shadow-[2px_2px_0_#0f172a]",
    filterInactive:
      "border-slate-300 bg-white text-slate-700 hover:border-sky-400 hover:bg-sky-50",
    progressFill: "bg-sky-600",
    progressLabel: "text-sky-700",
    brutalShadow: "shadow-[3px_3px_0_#0284c7]",
    liftShadow: "hover:shadow-[6px_6px_0_#0284c7]",
  },
  amber: {
    contentBg: "bg-amber-50",
    stickyBar:
      "border-amber-200 bg-amber-50/95 supports-[backdrop-filter]:bg-amber-50/90",
    input: "border-amber-200 focus:border-amber-500",
    link: "text-amber-800",
    linkHover: "hover:text-amber-900",
    tag: "border border-amber-200 bg-amber-50 text-amber-900",
    cardHover: "hover:bg-amber-50/90",
    cardFocusRing: "focus-visible:ring-amber-200",
    logoTint: "bg-amber-50",
    tableBanner: "bg-amber-600 text-white",
    tableBannerMuted: "text-amber-100",
    theadLight: "bg-amber-100 text-slate-950",
    tbodyAccent: "text-amber-800",
    tbodyAccentBold: "font-bold text-amber-800",
    panelSoft: "bg-amber-50",
    panelBorder: "border-amber-200",
    panelBorderInner: "border-amber-200",
    iconMuted: "text-amber-700",
    filterActive:
      "border-slate-900 bg-amber-600 text-white shadow-[2px_2px_0_#0f172a]",
    filterInactive:
      "border-slate-300 bg-white text-slate-700 hover:border-amber-400 hover:bg-amber-50",
    progressFill: "bg-amber-600",
    progressLabel: "text-amber-800",
    brutalShadow: "shadow-[3px_3px_0_#d97706]",
    liftShadow: "hover:shadow-[6px_6px_0_#d97706]",
  },
  emerald: {
    contentBg: "bg-emerald-50",
    stickyBar:
      "border-emerald-200 bg-emerald-50/95 supports-[backdrop-filter]:bg-emerald-50/90",
    input: "border-emerald-200 focus:border-emerald-500",
    link: "text-emerald-700",
    linkHover: "hover:text-emerald-800",
    tag: "border border-emerald-200 bg-emerald-50 text-emerald-800",
    cardHover: "hover:bg-emerald-50/80",
    cardFocusRing: "focus-visible:ring-emerald-200",
    logoTint: "bg-emerald-50",
    tableBanner: "bg-emerald-600 text-white",
    tableBannerMuted: "text-emerald-100",
    theadLight: "bg-emerald-100 text-slate-950",
    tbodyAccent: "text-emerald-700",
    tbodyAccentBold: "font-bold text-emerald-700",
    panelSoft: "bg-emerald-50",
    panelBorder: "border-emerald-200",
    panelBorderInner: "border-emerald-200",
    iconMuted: "text-emerald-700",
    filterActive:
      "border-slate-900 bg-emerald-600 text-white shadow-[2px_2px_0_#0f172a]",
    filterInactive:
      "border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50",
    progressFill: "bg-emerald-600",
    progressLabel: "text-emerald-700",
    brutalShadow: "shadow-[3px_3px_0_#059669]",
    liftShadow: "hover:shadow-[6px_6px_0_#059669]",
  },
  blue: {
    contentBg: "bg-blue-50",
    stickyBar: "border-blue-200 bg-blue-50/95 supports-[backdrop-filter]:bg-blue-50/90",
    input: "border-blue-200 focus:border-blue-500",
    link: "text-blue-700",
    linkHover: "hover:text-blue-800",
    tag: "border border-blue-200 bg-blue-50 text-blue-800",
    cardHover: "hover:bg-blue-50/80",
    cardFocusRing: "focus-visible:ring-blue-200",
    logoTint: "bg-blue-50",
    tableBanner: "bg-blue-600 text-white",
    tableBannerMuted: "text-blue-100",
    theadLight: "bg-blue-100 text-slate-950",
    tbodyAccent: "text-blue-700",
    tbodyAccentBold: "font-bold text-blue-700",
    panelSoft: "bg-blue-50",
    panelBorder: "border-blue-200",
    panelBorderInner: "border-blue-200",
    iconMuted: "text-blue-700",
    filterActive:
      "border-slate-900 bg-blue-600 text-white shadow-[2px_2px_0_#0f172a]",
    filterInactive:
      "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50",
    progressFill: "bg-blue-600",
    progressLabel: "text-blue-700",
    brutalShadow: "shadow-[3px_3px_0_#2563eb]",
    liftShadow: "hover:shadow-[6px_6px_0_#2563eb]",
  },
  fuchsia: {
    contentBg: "bg-fuchsia-50",
    stickyBar:
      "border-fuchsia-200 bg-fuchsia-50/95 supports-[backdrop-filter]:bg-fuchsia-50/90",
    input: "border-fuchsia-200 focus:border-fuchsia-500",
    link: "text-fuchsia-700",
    linkHover: "hover:text-fuchsia-800",
    tag: "border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
    cardHover: "hover:bg-fuchsia-50/80",
    cardFocusRing: "focus-visible:ring-fuchsia-200",
    logoTint: "bg-fuchsia-50",
    tableBanner: "bg-fuchsia-600 text-white",
    tableBannerMuted: "text-fuchsia-100",
    theadLight: "bg-fuchsia-100 text-slate-950",
    tbodyAccent: "text-fuchsia-700",
    tbodyAccentBold: "font-bold text-fuchsia-700",
    panelSoft: "bg-fuchsia-50",
    panelBorder: "border-fuchsia-200",
    panelBorderInner: "border-fuchsia-200",
    iconMuted: "text-fuchsia-700",
    filterActive:
      "border-slate-900 bg-fuchsia-600 text-white shadow-[2px_2px_0_#0f172a]",
    filterInactive:
      "border-slate-300 bg-white text-slate-700 hover:border-fuchsia-400 hover:bg-fuchsia-50",
    progressFill: "bg-fuchsia-600",
    progressLabel: "text-fuchsia-700",
    brutalShadow: "shadow-[3px_3px_0_#c026d3]",
    liftShadow: "hover:shadow-[6px_6px_0_#c026d3]",
  },
  orange: {
    contentBg: "bg-orange-50",
    stickyBar:
      "border-orange-200 bg-orange-50/95 supports-[backdrop-filter]:bg-orange-50/90",
    input: "border-orange-200 focus:border-orange-500",
    link: "text-orange-700",
    linkHover: "hover:text-orange-800",
    tag: "border border-orange-200 bg-orange-50 text-orange-900",
    cardHover: "hover:bg-orange-50/80",
    cardFocusRing: "focus-visible:ring-orange-200",
    logoTint: "bg-orange-50",
    tableBanner: "bg-orange-600 text-white",
    tableBannerMuted: "text-orange-100",
    theadLight: "bg-orange-100 text-slate-950",
    tbodyAccent: "text-orange-800",
    tbodyAccentBold: "font-bold text-orange-800",
    panelSoft: "bg-orange-50",
    panelBorder: "border-orange-200",
    panelBorderInner: "border-orange-200",
    iconMuted: "text-orange-700",
    filterActive:
      "border-slate-900 bg-orange-600 text-white shadow-[2px_2px_0_#0f172a]",
    filterInactive:
      "border-slate-300 bg-white text-slate-700 hover:border-orange-400 hover:bg-orange-50",
    progressFill: "bg-orange-600",
    progressLabel: "text-orange-800",
    brutalShadow: "shadow-[3px_3px_0_#ea580c]",
    liftShadow: "hover:shadow-[6px_6px_0_#ea580c]",
  },
  rose: {
    contentBg: "bg-rose-50",
    stickyBar: "border-rose-200 bg-rose-50/95 supports-[backdrop-filter]:bg-rose-50/90",
    input: "border-rose-200 focus:border-rose-500",
    link: "text-rose-700",
    linkHover: "hover:text-rose-800",
    tag: "border border-rose-200 bg-rose-50 text-rose-800",
    cardHover: "hover:bg-rose-50/80",
    cardFocusRing: "focus-visible:ring-rose-200",
    logoTint: "bg-rose-50",
    tableBanner: "bg-rose-600 text-white",
    tableBannerMuted: "text-rose-100",
    theadLight: "bg-rose-100 text-slate-950",
    tbodyAccent: "text-rose-700",
    tbodyAccentBold: "font-bold text-rose-700",
    panelSoft: "bg-rose-50",
    panelBorder: "border-rose-200",
    panelBorderInner: "border-rose-200",
    iconMuted: "text-rose-700",
    filterActive:
      "border-slate-900 bg-rose-600 text-white shadow-[2px_2px_0_#0f172a]",
    filterInactive:
      "border-slate-300 bg-white text-slate-700 hover:border-rose-400 hover:bg-rose-50",
    progressFill: "bg-rose-600",
    progressLabel: "text-rose-700",
    brutalShadow: "shadow-[3px_3px_0_#e11d48]",
    liftShadow: "hover:shadow-[6px_6px_0_#e11d48]",
  },
  cyan: {
    contentBg: "bg-cyan-50",
    stickyBar: "border-cyan-200 bg-cyan-50/95 supports-[backdrop-filter]:bg-cyan-50/90",
    input: "border-cyan-200 focus:border-cyan-500",
    link: "text-cyan-700",
    linkHover: "hover:text-cyan-800",
    tag: "border border-cyan-200 bg-cyan-50 text-cyan-900",
    cardHover: "hover:bg-cyan-50/80",
    cardFocusRing: "focus-visible:ring-cyan-200",
    logoTint: "bg-cyan-50",
    tableBanner: "bg-cyan-600 text-white",
    tableBannerMuted: "text-cyan-100",
    theadLight: "bg-cyan-100 text-slate-950",
    tbodyAccent: "text-cyan-800",
    tbodyAccentBold: "font-bold text-cyan-800",
    panelSoft: "bg-cyan-50",
    panelBorder: "border-cyan-200",
    panelBorderInner: "border-cyan-200",
    iconMuted: "text-cyan-700",
    filterActive:
      "border-slate-900 bg-cyan-600 text-white shadow-[2px_2px_0_#0f172a]",
    filterInactive:
      "border-slate-300 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50",
    progressFill: "bg-cyan-600",
    progressLabel: "text-cyan-700",
    brutalShadow: "shadow-[3px_3px_0_#0891b2]",
    liftShadow: "hover:shadow-[6px_6px_0_#0891b2]",
  },
  teal: {
    contentBg: "bg-teal-50",
    stickyBar: "border-teal-200 bg-teal-50/95 supports-[backdrop-filter]:bg-teal-50/90",
    input: "border-teal-200 focus:border-teal-500",
    link: "text-teal-700",
    linkHover: "hover:text-teal-800",
    tag: "border border-teal-200 bg-teal-50 text-teal-900",
    cardHover: "hover:bg-teal-50/80",
    cardFocusRing: "focus-visible:ring-teal-200",
    logoTint: "bg-teal-50",
    tableBanner: "bg-teal-600 text-white",
    tableBannerMuted: "text-teal-100",
    theadLight: "bg-teal-100 text-slate-950",
    tbodyAccent: "text-teal-700",
    tbodyAccentBold: "font-bold text-teal-700",
    panelSoft: "bg-teal-50",
    panelBorder: "border-teal-200",
    panelBorderInner: "border-teal-200",
    iconMuted: "text-teal-700",
    filterActive:
      "border-slate-900 bg-teal-600 text-white shadow-[2px_2px_0_#0f172a]",
    filterInactive:
      "border-slate-300 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50",
    progressFill: "bg-teal-600",
    progressLabel: "text-teal-700",
    brutalShadow: "shadow-[3px_3px_0_#0d9488]",
    liftShadow: "hover:shadow-[6px_6px_0_#0d9488]",
  },
};

export function getPageAccentUi(accent: PageHeroAccent): PageAccentUi {
  return pageAccentUi[accent];
}
