import {
  Bot,
  Briefcase,
  CalendarCheck,
  Code2,
  FilePlus2,
  FileText,
  Github,
  Linkedin,
  Map,
  Mic,
  Palette,
  Scale,
  type LucideIcon,
} from "lucide-react";

// Fonte UNICA do icone de cada ferramenta/beneficio Pro. /bem-vindo e /planos
// leem daqui pra iconografia nunca divergir entre as paginas.
export const PRO_TOOL_ICONS = {
  comparador: Scale,
  iaPessoal: Bot,
  roadmapIA: Map,
  planoCarreira: CalendarCheck,
  projetosPortfolio: Code2,
  simuladorEntrevistas: Mic,
  geradorCurriculo: FilePlus2,
  avaliadorCurriculo: FileText,
  avaliadorLinkedin: Linkedin,
  avaliadorGithub: Github,
  feedVagas: Briefcase,
  personalizacao: Palette,
} as const satisfies Record<string, LucideIcon>;
