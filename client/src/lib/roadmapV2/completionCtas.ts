import type { RoadmapV2 } from "@/lib/roadmapV2/types";
import { areasTI } from "@/lib/data";

// CTAs mostradas no modal e no card de conclusao de roadmap. Os kinds "quiz"
// e "final-project" sao slots reservados pras proximas fases (quiz de
// validacao e projeto final); ainda nao ha builder que os produza.
export type CompletionCta = {
  id: string;
  label: string;
  href: string;
  variant: "primary" | "secondary";
  kind: "next-trail" | "projects" | "share" | "quiz" | "final-project";
};

// Mesmo valor de siteUrl em client/src/components/SEO.tsx (const privada la).
const SITE_URL = "https://boranatech.com.br";

// TODO(Ana): revisar todo este mapa de "proxima trilha" (a sugestao de
// sequencia entre areas e editorial, nao tecnica).
const NEXT_TRAIL_BY_SLUG: Partial<Record<string, string>> = {
  frontend: "fullstack",
  backend: "fullstack",
  fullstack: "devops",
  dados: "engenharia-dados",
  "analise-dados": "dados",
  uxui: "produto",
  devops: "sre",
  cloud: "devops",
  mobile: "frontend",
  qa: "devops",
};

export function buildCompletionCtas(roadmap: RoadmapV2): CompletionCta[] {
  const ctas: CompletionCta[] = [];

  if (roadmap.slug === "comecar-do-zero") {
    ctas.push({
      id: "quiz-carreira",
      // TODO(Ana): copy da CTA pos-conclusao da trilha comecar-do-zero
      label: "Descobrir minha área ideal",
      href: "/quiz-carreira",
      variant: "primary",
      kind: "next-trail",
    });
  } else if (roadmap.slug === "linkedin") {
    ctas.push({
      id: "linkedin-analisar",
      // TODO(Ana): copy da CTA pos-conclusao da trilha de LinkedIn
      label: "Analisar meu perfil com IA",
      href: "/linkedin/analisar",
      variant: "primary",
      kind: "next-trail",
    });
  } else {
    const nextSlug = NEXT_TRAIL_BY_SLUG[roadmap.slug];
    if (nextSlug) {
      ctas.push({
        id: `next-${nextSlug}`,
        // TODO(Ana): copy da CTA de proxima trilha
        label: "Começar a próxima trilha",
        href: `/roadmaps/${nextSlug}`,
        variant: "primary",
        kind: "next-trail",
      });
    } else {
      ctas.push({
        id: "next-roadmaps",
        // TODO(Ana): copy da CTA fallback de proxima trilha
        label: "Explorar outras trilhas",
        href: "/roadmaps",
        variant: "primary",
        kind: "next-trail",
      });
    }
  }

  const area = areasTI.find((a) => a.slug === roadmap.area);
  if (area) {
    ctas.push({
      id: "projects",
      // TODO(Ana): copy da CTA de projetos da area
      label: "Praticar com projetos da área",
      href: `/projetos?area=${roadmap.area}`,
      variant: "secondary",
      kind: "projects",
    });
  }

  // TODO(Ana): copy do texto compartilhado no LinkedIn
  const shareText = `Acabei de concluir a trilha ${roadmap.title} na Bora na Tech! ${SITE_URL}/roadmaps/${roadmap.slug}`;
  ctas.push({
    id: "share",
    // TODO(Ana): copy da CTA de compartilhar
    label: "Compartilhar no LinkedIn",
    href: `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`,
    variant: "secondary",
    kind: "share",
  });

  return ctas;
}
