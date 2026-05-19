import { Brain, Code2, Newspaper, Rocket, Shield, type LucideIcon } from "lucide-react";
import type { NewsKeyword } from "@/services/contentService";

type Variant = { Icon: LucideIcon; gradient: string };

const VARIANTS: Record<NewsKeyword, Variant> = {
  "artificial intelligence": { Icon: Brain, gradient: "from-violet-500 to-violet-700" },
  "software engineering": { Icon: Code2, gradient: "from-blue-500 to-blue-700" },
  cybersecurity: { Icon: Shield, gradient: "from-rose-500 to-rose-700" },
  "tech startup": { Icon: Rocket, gradient: "from-amber-500 to-amber-700" },
};

const FALLBACK: Variant = { Icon: Newspaper, gradient: "from-slate-500 to-slate-700" };

export default function NewsImagePlaceholder({ keyword }: { keyword: NewsKeyword | null }) {
  const { Icon, gradient } = keyword ? VARIANTS[keyword] : FALLBACK;
  return (
    <div
      aria-hidden
      className={`w-full h-40 flex items-center justify-center bg-gradient-to-br ${gradient}`}
    >
      <Icon className="w-16 h-16 text-white opacity-90" strokeWidth={1.75} />
    </div>
  );
}
