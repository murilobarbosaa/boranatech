import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const INGLES_NAV = [
  { href: "/ingles", label: "Comece aqui" },
  { href: "/ingles/onde-estudar", label: "Onde estudar" },
  { href: "/ingles/no-trabalho", label: "No trabalho" },
  { href: "/ingles/entrevista", label: "Entrevista" },
  { href: "/ingles/vocabulario", label: "Vocabulário" },
];

export default function InglesSubNav() {
  const [location] = useLocation();

  return (
    <nav className="border-b-2 border-slate-900 bg-sky-50">
      <div className="container flex flex-wrap gap-2 py-4">
        {INGLES_NAV.map((item) => {
          const active = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "social-badge inline-flex px-3 py-1 text-xs font-black uppercase transition-transform hover:-translate-y-0.5",
                active ? "bg-sky-600 text-white" : "bg-white text-slate-950",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
