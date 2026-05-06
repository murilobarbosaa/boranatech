/*
  BORA NA TECH? — SearchBar Component
  Style: Neo-Brutalism Suavizado
  - Global search across all content types
  - Results dropdown with categories
*/

import { useState, useRef, useEffect } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { apiUrl } from "@/lib/api";
import { areasTI, cursosGratuitos, roadmaps, plataformas, eventos, projetos } from "@/lib/data";

interface SearchResult {
  type: string;
  title: string;
  description: string;
  path: string;
}

const typeLabels: Record<string, string> = {
  area: "Área da TI",
  technology: "Tecnologia",
  course: "Curso Grátis",
  platform: "Plataforma",
  project: "Projeto",
  roadmap: "Roadmap",
};

function searchAll(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  areasTI.forEach((a) => {
    if (a.nome.toLowerCase().includes(q) || a.descricaoCurta.toLowerCase().includes(q)) {
      results.push({ type: "Área da TI", title: a.nome, description: a.descricaoCurta, path: `/areas/${a.slug}` });
    }
  });

  roadmaps.forEach((r) => {
    if (r.nome.toLowerCase().includes(q) || r.descricao.toLowerCase().includes(q)) {
      results.push({ type: "Roadmap", title: r.nome, description: r.descricao, path: `/roadmaps/${r.id}` });
    }
  });

  cursosGratuitos.forEach((c) => {
    if (c.titulo.toLowerCase().includes(q) || c.area.toLowerCase().includes(q)) {
      results.push({ type: "Curso Grátis", title: c.titulo, description: `${c.canal} · ${c.area}`, path: "/cursos" });
    }
  });

  plataformas.forEach((p) => {
    if (p.nome.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q)) {
      results.push({ type: "Plataforma", title: p.nome, description: p.descricao, path: "/plataformas" });
    }
  });

  eventos.forEach((e) => {
    if (e.nome.toLowerCase().includes(q) || e.area.toLowerCase().includes(q)) {
      results.push({ type: "Evento", title: e.nome, description: `${e.cidade} · ${e.area}`, path: "/eventos" });
    }
  });

  projetos.forEach((p) => {
    if (p.nome.toLowerCase().includes(q) || p.area.toLowerCase().includes(q)) {
      results.push({ type: "Projeto", title: p.nome, description: `${p.area} · ${p.nivel}`, path: "/projetos" });
    }
  });

  return results.slice(0, 8);
}

const typeColors: Record<string, string> = {
  "Área da TI": "bg-violet-100 text-violet-700",
  "Tecnologia": "bg-violet-100 text-violet-700",
  "Roadmap": "bg-amber-100 text-amber-700",
  "Curso Grátis": "bg-amber-100 text-amber-700",
  "Plataforma": "bg-blue-100 text-blue-700",
  "Evento": "bg-pink-100 text-pink-700",
  "Projeto": "bg-orange-100 text-orange-700",
};

export default function SearchBar({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch(apiUrl(`/api/search?q=${encodeURIComponent(trimmed)}&limit=10`), { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error("search failed");
          return res.json();
        })
        .then((json) => {
          const apiResults: SearchResult[] = (json.data || []).map((item: any) => ({
            type: typeLabels[item.resource_type] || item.resource_type,
            title: item.title,
            description: item.description || "",
            path: item.url || `/${item.resource_type}s/${item.resource_id}`,
          }));
          setResults(apiResults);
          setOpen(true);
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          setResults(searchAll(trimmed));
          setOpen(true);
        });
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: SearchResult) {
    navigate(result.path);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar áreas, cursos, roadmaps..."
          className="w-full pl-10 pr-10 py-2.5 border-2 border-slate-900 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-[2px_2px_0_#0f172a]"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-900 rounded-lg shadow-[4px_4px_0_#0f172a] z-50 overflow-hidden">
          {results.length > 0 ? (
            <ul>
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-violet-50 text-left transition-colors border-b border-slate-100 last:border-0"
                  >
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 shrink-0 ${typeColors[r.type] || "bg-slate-100 text-slate-600"}`}>
                      {r.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{r.title}</p>
                      <p className="text-xs text-slate-500 truncate">{r.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-slate-500">Nenhum resultado para "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Tente buscar por "front-end", "Python" ou "roadmap"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
