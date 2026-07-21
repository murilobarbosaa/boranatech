import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type SyntheticEvent,
} from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckSquare,
  Code,
  Database,
  Keyboard,
  ListChecks,
  Palette,
  PlayCircle,
  Printer,
  RotateCcw,
  Search,
  Server,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import CopyButton from "@/components/shared/CopyButton";
import PageHero from "@/components/shared/PageHero";
import { BntSelect } from "@/components/shared/BntSelect";
import VideoEmbedDialog from "@/components/shared/VideoEmbedDialog";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn, youtubeEmbedUrl } from "@/lib/utils";
import { devTools, setupGuides } from "@/lib/careerToolsData";

const ac = getPageAccentUi("orange");

const CATEGORY_ORDER = [
  "IA",
  "Desenvolvimento",
  "Design",
  "Produtividade",
  "Banco de dados",
  "DevOps",
];

const NEED_ORDER = ["Obrigatório", "Importante", "Opcional"];

const NEED_RANK: Record<string, number> = {
  Obrigatório: 0,
  Importante: 1,
  Opcional: 2,
};

const NEED_BADGE: Record<string, string> = {
  Obrigatório: "border-rose-300 bg-rose-100 text-rose-700",
  Importante: "border-amber-300 bg-amber-100 text-amber-700",
  Opcional: "border-emerald-300 bg-emerald-100 text-emerald-700",
};

type CategoryMeta = { Icon: ComponentType<{ className?: string }>; tile: string };

const CATEGORY_META: Record<string, CategoryMeta> = {
  IA: { Icon: Sparkles, tile: "bg-violet-100 text-violet-700" },
  Desenvolvimento: { Icon: Code, tile: "bg-orange-100 text-orange-700" },
  Design: { Icon: Palette, tile: "bg-pink-100 text-pink-700" },
  Produtividade: { Icon: CheckSquare, tile: "bg-emerald-100 text-emerald-700" },
  "Banco de dados": { Icon: Database, tile: "bg-sky-100 text-sky-700" },
  DevOps: { Icon: Server, tile: "bg-slate-200 text-slate-700" },
};

function categoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? { Icon: Wrench, tile: "bg-slate-100 text-slate-700" };
}

const HERO_DOODLES = [
  { Icon: Terminal, pos: "left-[5%] top-[24%]", size: "h-10 w-10", rot: 7, dur: 7 },
  { Icon: Code, pos: "right-[8%] top-[18%]", size: "h-9 w-9", rot: -6, dur: 8 },
  { Icon: Wrench, pos: "right-[22%] bottom-[16%]", size: "h-8 w-8", rot: 6, dur: 9 },
  { Icon: Terminal, pos: "left-[26%] bottom-[12%]", size: "h-7 w-7", rot: -5, dur: 7.5 },
];

function HeroDoodles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {HERO_DOODLES.map((doodle) => {
        const Icon = doodle.Icon;
        return (
          <motion.span
            key={doodle.pos}
            aria-hidden
            className={cn("absolute text-orange-700", doodle.pos)}
            style={{ opacity: 0.1 }}
            animate={{ y: [0, -10, 0], rotate: [0, doodle.rot, 0] }}
            transition={{ duration: doodle.dur, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className={doodle.size} />
          </motion.span>
        );
      })}
    </div>
  );
}

type DevTool = (typeof devTools)[number];

function ToolLogo({ tool }: { tool: DevTool }) {
  const [errored, setErrored] = useState(false);
  const meta = categoryMeta(tool.category[0]);
  const FallbackIcon = meta.Icon;

  return (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 p-2",
        ac.brutalShadow,
        meta.tile,
      )}
    >
      {!tool.logoUrl || errored ? (
        <FallbackIcon className="h-7 w-7" />
      ) : (
        <img
          src={tool.logoUrl}
          alt={`Logo ${tool.name}`}
          className="h-9 w-9 object-contain"
          loading="lazy"
          onError={() => setErrored(true)}
          onLoad={(event: SyntheticEvent<HTMLImageElement>) => {
            if (event.currentTarget.naturalWidth === 0) setErrored(true);
          }}
        />
      )}
    </div>
  );
}

type ShortcutContext = "Editor" | "Git" | "Terminal";

type ShortcutItem = {
  label: string;
  type: "keys" | "terminal";
  context: ShortcutContext;
  description: string;
  danger?: boolean;
};

const shortcuts: ShortcutItem[] = [
  { label: "Ctrl+P", type: "keys", context: "Editor", description: "Abrir um arquivo rapidamente pelo nome." },
  { label: "Ctrl+Shift+P", type: "keys", context: "Editor", description: "Abrir a paleta de comandos." },
  { label: "Ctrl+`", type: "keys", context: "Editor", description: "Abrir ou fechar o terminal integrado." },
  { label: "Ctrl+S", type: "keys", context: "Editor", description: "Salvar o arquivo atual." },
  { label: "Ctrl+/", type: "keys", context: "Editor", description: "Comentar ou descomentar a linha." },
  { label: "Ctrl+D", type: "keys", context: "Editor", description: "Selecionar a proxima ocorrencia (multi-cursor)." },
  { label: "Ctrl+G", type: "keys", context: "Editor", description: "Ir para uma linha especifica." },
  { label: "F2", type: "keys", context: "Editor", description: "Renomear o simbolo em todo o projeto." },
  { label: "Ctrl+F", type: "keys", context: "Editor", description: "Buscar no arquivo atual." },
  { label: "Ctrl+H", type: "keys", context: "Editor", description: "Substituir no arquivo atual." },
  { label: "Ctrl+Shift+F", type: "keys", context: "Editor", description: "Buscar em todos os arquivos do projeto." },
  { label: "Alt+Shift+F", type: "keys", context: "Editor", description: "Formatar o arquivo." },
  { label: "Alt+Up", type: "keys", context: "Editor", description: "Mover a linha para cima." },
  { label: "Alt+Down", type: "keys", context: "Editor", description: "Mover a linha para baixo." },
  { label: "git status", type: "terminal", context: "Git", description: "Ver arquivos modificados e o estado do repositorio." },
  { label: "git add .", type: "terminal", context: "Git", description: "Preparar todas as mudancas para o commit." },
  { label: 'git commit -m "mensagem"', type: "terminal", context: "Git", description: "Criar um commit com uma mensagem." },
  { label: "git log --oneline", type: "terminal", context: "Git", description: "Ver o historico de commits resumido." },
  { label: "git branch", type: "terminal", context: "Git", description: "Listar as branches do repositorio." },
  { label: "git checkout nome-da-branch", type: "terminal", context: "Git", description: "Trocar de branch." },
  { label: "git diff", type: "terminal", context: "Git", description: "Ver as diferencas ainda nao commitadas." },
  { label: "git pull", type: "terminal", context: "Git", description: "Trazer e mesclar mudancas do repositorio remoto." },
  { label: "git push", type: "terminal", context: "Git", description: "Enviar seus commits para o repositorio remoto." },
  { label: "git clone url", type: "terminal", context: "Git", description: "Clonar um repositorio para a sua maquina." },
  { label: "git stash", type: "terminal", context: "Git", description: "Guardar mudancas temporariamente sem commitar." },
  { label: "git reset --hard", type: "terminal", context: "Git", description: "Volta os arquivos ao ultimo commit.", danger: true },
  { label: "git clean -fd", type: "terminal", context: "Git", description: "Remove arquivos e pastas nao rastreados.", danger: true },
  { label: "npm install", type: "terminal", context: "Terminal", description: "Instalar as dependencias do projeto." },
  { label: "npm run dev", type: "terminal", context: "Terminal", description: "Rodar o servidor de desenvolvimento." },
  { label: "npm run build", type: "terminal", context: "Terminal", description: "Gerar a versao de producao." },
  { label: "node -v", type: "terminal", context: "Terminal", description: "Ver a versao do Node instalada." },
  { label: "npm -v", type: "terminal", context: "Terminal", description: "Ver a versao do npm instalada." },
  { label: "cd pasta", type: "terminal", context: "Terminal", description: "Entrar em uma pasta pelo terminal." },
  { label: "ls", type: "terminal", context: "Terminal", description: "Listar arquivos e pastas." },
  { label: "pwd", type: "terminal", context: "Terminal", description: "Mostrar o caminho da pasta atual." },
  { label: "mkdir projeto", type: "terminal", context: "Terminal", description: "Criar uma nova pasta." },
];

const SHORTCUT_TABS: ShortcutContext[] = ["Editor", "Git", "Terminal"];

const tutorialVideos: Record<string, { title: string; url: string }> = {
  "VS Code": {
    title: "Como baixar e configurar o VS Code para iniciantes",
    url: "https://www.youtube.com/watch?v=aQXVGHLXJew",
  },
  Cursor: {
    title: "Cursor: o editor de código com IA que escreve código pra você",
    url: "https://www.youtube.com/watch?v=hmu3viVmk7A",
  },
  Git: {
    title: "Git e GitHub: tutorial completo para iniciantes (DevSuperior)",
    url: "https://www.youtube.com/watch?v=_hZf1teRFNg",
  },
  GitHub: {
    title: "Tutorial GitHub para iniciantes: como usar o GitHub",
    url: "https://www.youtube.com/watch?v=BUGZZaChiYw",
  },
  Docker: {
    title: "Aprenda Docker do zero: tutorial completo (Fernanda Kipper)",
    url: "https://www.youtube.com/watch?v=DdoncfOdru8",
  },
  Postman: {
    title: "Postman: a melhor forma de gerenciar e testar APIs",
    url: "https://www.youtube.com/watch?v=H5pKa1A73ak",
  },
  Figma: {
    title: "Como usar o Figma: tutorial completo para iniciantes",
    url: "https://www.youtube.com/watch?v=oE_08KTRA9w",
  },
  Jira: {
    title: "Como usar o Jira: guia completo para iniciantes",
    url: "https://www.youtube.com/watch?v=k_zcOLQOII8",
  },
  Slack: {
    title: "O que é Slack e como usar em 14 minutos",
    url: "https://www.youtube.com/watch?v=fWfL9E9ChSA",
  },
  Notion: {
    title: "Como usar o Notion: aula completa para iniciantes",
    url: "https://www.youtube.com/watch?v=h6OhnMdELDM",
  },
  Terminal: {
    title: "Comandos básicos do Linux: guia para iniciantes",
    url: "https://www.youtube.com/watch?v=CnYraL0J_hM",
  },
  npm: {
    title: "npm: o gerenciador de pacotes do Node.js",
    url: "https://www.youtube.com/watch?v=tFqsmNrWW0M",
  },
  Yarn: {
    title: "Yarn: o gerenciador de pacotes JavaScript (Código Fonte TV)",
    url: "https://www.youtube.com/watch?v=aKzN6sQqDrQ",
  },
  pnpm: {
    title: "npm, Yarn ou pnpm: qual o gerenciador mais rápido?",
    url: "https://www.youtube.com/watch?v=K2E5Fu-F_9I",
  },
  "Chrome DevTools": {
    title: "Aprenda Chrome DevTools em 10 minutos (Danki Code)",
    url: "https://www.youtube.com/watch?v=2lBJVEYDwlM",
  },
};

const STEP_COMMAND =
  /\b(?:node -v|npm(?: [\w.:-]+){1,2}|pnpm(?: [\w.:-]+){1,2}|npx [\w.:-]+|git [\w.:-]+|yarn(?: [\w.:-]+)?)\b/;

function extractCommand(step: string): string | null {
  const match = step.match(STEP_COMMAND);
  return match ? match[0] : null;
}

function KeySequence({ value, mac }: { value: string; mac: boolean }) {
  const normalized = mac ? value.replace(/Ctrl/g, "Cmd") : value;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {normalized.split("+").map((key) => (
        <kbd
          key={key}
          className="rounded-lg border-2 border-slate-900 bg-slate-50 px-2 py-1 font-mono text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

function TerminalCommand({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-950 px-3 py-2 text-white",
        ac.brutalShadow,
      )}
    >
      <Terminal className="h-4 w-4 shrink-0 text-emerald-300" />
      <code className="overflow-x-auto whitespace-nowrap font-mono text-xs font-black">
        {value}
      </code>
    </span>
  );
}

function parseList(raw: string | null, allowed: string[]): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => allowed.includes(value));
}

export default function Ferramentas() {
  const searchString = useSearch();
  const [, navigate] = useLocation();

  const categories = useMemo(() => {
    const present = new Set(devTools.flatMap((tool) => tool.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, []);
  const areaOptions = useMemo(() => {
    const present = new Set(devTools.flatMap((tool) => tool.areas));
    return Array.from(present).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, []);
  const needOptions = useMemo(() => {
    const present = new Set(devTools.map((tool) => tool.need));
    return NEED_ORDER.filter((n) => present.has(n));
  }, []);

  const initial = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return {
      q: params.get("q") ?? "",
      categorias: parseList(params.get("categoria"), categories),
      area: areaOptions.includes(params.get("area") ?? "")
        ? (params.get("area") as string)
        : "Todas",
      need: needOptions.includes(params.get("need") ?? "")
        ? (params.get("need") as string)
        : "Todas",
      sort: params.get("sort") === "need" ? "need" : "az",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [searchInput, setSearchInput] = useState(initial.q);
  const [query, setQuery] = useState(initial.q);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initial.categorias,
  );
  const [area, setArea] = useState(initial.area);
  const [need, setNeed] = useState(initial.need);
  const [sort, setSort] = useState<"az" | "need">(initial.sort as "az" | "need");

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(searchInput), 250);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedCategories.length) params.set("categoria", selectedCategories.join(","));
    if (area !== "Todas") params.set("area", area);
    if (need !== "Todas") params.set("need", need);
    if (sort !== "az") params.set("sort", sort);
    const qs = params.toString();
    navigate(qs ? `/ferramentas?${qs}` : "/ferramentas", { replace: true });
  }, [query, selectedCategories, area, need, sort, navigate]);

  const hasActiveFilters =
    query.trim() !== "" ||
    selectedCategories.length > 0 ||
    area !== "Todas" ||
    need !== "Todas" ||
    sort !== "az";

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = devTools.filter((tool) => {
      const matchesQuery =
        normalizedQuery === "" ||
        tool.name.toLowerCase().includes(normalizedQuery) ||
        tool.description.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((c) => tool.category.includes(c));
      const matchesArea = area === "Todas" || tool.areas.includes(area);
      const matchesNeed = need === "Todas" || tool.need === need;
      return matchesQuery && matchesCategory && matchesArea && matchesNeed;
    });
    return [...result].sort((a, b) => {
      if (sort === "need") {
        const rank = (NEED_RANK[a.need] ?? 99) - (NEED_RANK[b.need] ?? 99);
        if (rank !== 0) return rank;
      }
      return a.name.localeCompare(b.name, "pt-BR");
    });
  }, [query, selectedCategories, area, need, sort]);

  const [done, setDone] = useState<Record<string, boolean>>({});
  const [cheatOs, setCheatOs] = useState<"win" | "mac">("win");
  const [cheatTab, setCheatTab] = useState<ShortcutContext>("Editor");
  const [cheatSearch, setCheatSearch] = useState("");

  function toggleCategory(value: string) {
    setSelectedCategories((current) =>
      current.includes(value)
        ? current.filter((c) => c !== value)
        : [...current, value],
    );
  }

  function clearFilters() {
    setSearchInput("");
    setQuery("");
    setSelectedCategories([]);
    setArea("Todas");
    setNeed("Todas");
    setSort("az");
  }

  function toggleStep(key: string) {
    setDone((current) => ({ ...current, [key]: !current[key] }));
  }

  function focusDirectory() {
    const node = document.getElementById("diretorio-ferramentas");
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const cheatItems = useMemo(() => {
    const normalized = cheatSearch.trim().toLowerCase();
    return shortcuts.filter(
      (item) =>
        item.context === cheatTab &&
        (normalized === "" ||
          item.label.toLowerCase().includes(normalized) ||
          item.description.toLowerCase().includes(normalized)),
    );
  }, [cheatTab, cheatSearch]);

  return (
    <Layout>
      {/* TODO(Ana): validar title e description */}
      <SEO
        title="Ferramentas que todo dev usa"
        description="Monte seu ambiente de desenvolvimento: descubra o que cada ferramenta faz e tenha os atalhos e comandos essenciais sempre à mão para o dia a dia."
        url="/ferramentas"
        schemaType="CollectionPage"
      />
      <div className="print:hidden">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <PageHero
            accent="orange"
            eyebrow="ambiente do dev"
            title="As ferramentas que todo dev usa"
            subtitle="Monte seu ambiente, descubra o que cada ferramenta faz e tenha os atalhos e comandos essenciais sempre à mão."
            backgroundSlot={<HeroDoodles />}
          />
        </motion.div>
      </div>

      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-12">
          <div id="diretorio-ferramentas" className="print:hidden">
            <div className="card-brutal rounded-2xl bg-white p-4">
              <div className="mb-4">
                <label
                  htmlFor="ferramentas-busca"
                  className="mb-1 block text-[11px] font-black uppercase tracking-wide text-orange-800"
                >
                  Buscar ferramenta
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="ferramentas-busca"
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Nome ou descrição (ex: editor, banco, deploy)"
                    className="w-full rounded-xl border-2 border-slate-900 bg-white py-3 pl-10 pr-4 text-sm font-bold shadow-[3px_3px_0_#0f172a] outline-none"
                  />
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2 font-display text-sm font-black text-slate-900">
                <SlidersHorizontal className="h-4 w-4 text-orange-700" />
                Categorias
              </div>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filtrar por categoria"
              >
                {categories.map((c) => {
                  const activeCat = selectedCategories.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={activeCat}
                      onClick={() => toggleCategory(c)}
                      className={cn(
                        "rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-all",
                        activeCat ? ac.filterActive : ac.filterInactive,
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="ferramentas-area"
                    className="text-[11px] font-black uppercase tracking-wide text-orange-800"
                  >
                    Área
                  </label>
                  <BntSelect
                    accent="orange"
                    id="ferramentas-area"
                    fullWidth={false}
                    value={area}
                    onValueChange={setArea}
                    options={[
                      { value: "Todas", label: "Todas as áreas" },
                      ...areaOptions.map((option) => ({
                        value: option,
                        label: option,
                      })),
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="ferramentas-need"
                    className="text-[11px] font-black uppercase tracking-wide text-orange-800"
                  >
                    Necessidade
                  </label>
                  <BntSelect
                    accent="orange"
                    id="ferramentas-need"
                    fullWidth={false}
                    value={need}
                    onValueChange={setNeed}
                    options={[
                      { value: "Todas", label: "Toda necessidade" },
                      ...needOptions.map((option) => ({
                        value: option,
                        label: option,
                      })),
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="ferramentas-sort"
                    className="text-[11px] font-black uppercase tracking-wide text-orange-800"
                  >
                    Ordenar
                  </label>
                  <BntSelect
                    accent="orange"
                    id="ferramentas-sort"
                    fullWidth={false}
                    value={sort}
                    onValueChange={(v) => setSort(v === "need" ? "need" : "az")}
                    options={[
                      { value: "az", label: "Nome (A-Z)" },
                      { value: "need", label: "Necessidade" },
                    ]}
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-500">
                  {filtered.length} ferramenta{filtered.length === 1 ? "" : "s"}
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Limpar filtros
                  </button>
                )}
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3">
                <Link
                  href="/ia"
                  className={cn(
                    "inline-flex items-center gap-1 text-sm font-bold",
                    ac.link,
                  )}
                >
                  Novo: Guia de IA, pra que serve cada uma{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="card-brutal mt-6 rounded-2xl border-dashed bg-white p-10 text-center">
                <p className="font-display text-xl font-black text-slate-950">
                  Nenhuma ferramenta encontrada
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                  Tente outra busca ou limpe os filtros.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn-brutal-primary mt-5 rounded-full bg-white px-5 py-2 text-sm font-black"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((tool, index) => {
                  const video = tutorialVideos[tool.name];
                  return (
                    <motion.article
                      key={tool.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(index * 0.03, 0.3),
                      }}
                      whileHover={{ scale: 1.02 }}
                      className="card-brutal flex h-full flex-col rounded-2xl bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <ToolLogo tool={tool} />
                          <div className="min-w-0">
                            <h2 className="font-display text-xl font-black text-slate-950">
                              {tool.name}
                            </h2>
                            <span
                              className={cn(
                                "mt-1 inline-flex rounded-full border-2 px-2 py-0.5 text-[11px] font-black",
                                NEED_BADGE[tool.need] ??
                                  "border-slate-300 bg-slate-100 text-slate-600",
                              )}
                            >
                              {tool.need}
                            </span>
                          </div>
                        </div>
                        {video ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-red-300 bg-red-50 px-2 py-1 text-[10px] font-black uppercase text-red-700">
                            <PlayCircle className="h-3 w-3" />
                            Tutorial
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-4 text-sm text-slate-600">
                        {tool.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {tool.areas.map((areaName) => (
                          <span
                            key={areaName}
                            className={cn(
                              "rounded-full px-2 py-1 text-xs font-bold",
                              ac.panelSoft,
                              ac.tbodyAccent,
                            )}
                          >
                            {areaName}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex-1" />

                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1 text-sm font-black hover:underline",
                          ac.link,
                        )}
                      >
                        Acessar <ArrowUpRight className="h-4 w-4" />
                      </a>

                      {video &&
                        (youtubeEmbedUrl(video.url) ? (
                          <VideoEmbedDialog
                            source={video.url}
                            title={video.title}
                            href={video.url}
                          >
                            <button
                              type="button"
                              className="mt-3 flex w-full items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-3 text-left text-sm font-black text-red-700 transition-all hover:border-red-400 hover:bg-red-100"
                            >
                              <PlayCircle className="h-5 w-5 shrink-0" />
                              <span>
                                Assistir aqui
                                <span className="block text-xs font-bold text-red-500">
                                  {video.title}
                                </span>
                              </span>
                            </button>
                          </VideoEmbedDialog>
                        ) : (
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-3 text-sm font-black text-red-700 transition-all hover:border-red-400 hover:bg-red-100"
                          >
                            <PlayCircle className="h-5 w-5 shrink-0" />
                            <span>
                              Ver vídeo
                              <span className="block text-xs font-bold text-red-500">
                                {video.title}
                              </span>
                            </span>
                          </a>
                        ))}
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card-brutal rounded-2xl bg-white p-6 print:hidden">
            <div className="flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-orange-700" />
              <h2 className="font-display text-2xl font-black">
                Guia de setup por área
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Marque cada passo conforme for configurando. O progresso fica
              salvo enquanto a página estiver aberta.
            </p>
            {setupGuides.map((guide) => {
              const completed = guide.steps.filter(
                (_, index) => done[`${guide.area}::${index}`],
              ).length;
              return (
                <DetailsChevronOnly
                  key={guide.area}
                  className="mt-3 rounded-xl border-2 border-slate-900 p-4"
                  title={
                    <span className="flex w-full items-center justify-between gap-3 pr-2">
                      <span className="font-black">{guide.area}</span>
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-black text-orange-700">
                        {completed}/{guide.steps.length}
                      </span>
                    </span>
                  }
                >
                  <div className="mt-2 flex flex-wrap gap-2">
                    {guide.stack.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={focusDirectory}
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-bold transition-all hover:underline",
                          ac.panelSoft,
                          ac.tbodyAccent,
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <ul className="mt-3 space-y-2">
                    {guide.steps.map((step, index) => {
                      const key = `${guide.area}::${index}`;
                      const checked = Boolean(done[key]);
                      const command = extractCommand(step);
                      return (
                        <li key={key}>
                          <button
                            type="button"
                            aria-pressed={checked}
                            onClick={() => toggleStep(key)}
                            className="flex w-full items-start gap-3 rounded-xl border-2 border-slate-200 bg-white p-3 text-left transition-all hover:border-orange-300"
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-900",
                                checked ? "bg-emerald-500 text-white" : "bg-white",
                              )}
                            >
                              {checked ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <span
                              className={cn(
                                "text-sm",
                                checked
                                  ? "text-slate-400 line-through"
                                  : "text-slate-700",
                              )}
                            >
                              {step}
                            </span>
                          </button>
                          {command ? (
                            <div className="mt-2 flex items-center gap-2 pl-8">
                              <TerminalCommand value={command} />
                              <CopyButton text={command} />
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </DetailsChevronOnly>
              );
            })}
          </div>

          <div>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">
                  atalhos e terminal
                </p>
                <h2 className="font-display text-3xl font-black text-slate-950">
                  Cheatsheet de atalhos e comandos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#0f172a] print:hidden"
              >
                <Printer className="h-4 w-4" />
                Imprimir cheatsheet
              </button>
            </div>

            <div className="card-brutal rounded-2xl bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div
                  className="inline-flex rounded-full border-2 border-slate-900 p-1"
                  role="group"
                  aria-label="Sistema operacional"
                >
                  <button
                    type="button"
                    aria-pressed={cheatOs === "win"}
                    onClick={() => setCheatOs("win")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-black transition-all",
                      cheatOs === "win"
                        ? "bg-slate-900 text-white"
                        : "text-slate-700",
                    )}
                  >
                    Windows / Linux
                  </button>
                  <button
                    type="button"
                    aria-pressed={cheatOs === "mac"}
                    onClick={() => setCheatOs("mac")}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-black transition-all",
                      cheatOs === "mac"
                        ? "bg-slate-900 text-white"
                        : "text-slate-700",
                    )}
                  >
                    Mac
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <label htmlFor="cheat-busca" className="sr-only">
                    Buscar no cheatsheet
                  </label>
                  <input
                    id="cheat-busca"
                    type="text"
                    value={cheatSearch}
                    onChange={(event) => setCheatSearch(event.target.value)}
                    placeholder="Buscar atalho ou comando"
                    className="rounded-xl border-2 border-slate-300 bg-white py-2 pl-9 pr-3 text-sm font-bold outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div
                className="mt-4 flex flex-wrap gap-2 print:hidden"
                role="tablist"
                aria-label="Contexto do atalho"
              >
                {SHORTCUT_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={cheatTab === tab}
                    onClick={() => setCheatTab(tab)}
                    className={cn(
                      "rounded-full border-2 px-4 py-1.5 text-xs font-black transition-all",
                      cheatTab === tab ? ac.filterActive : ac.filterInactive,
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div
                role="tabpanel"
                className="mt-5 grid gap-4 md:grid-cols-2"
              >
                {cheatItems.map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-[3px_3px_0_#0f172a]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black uppercase text-slate-700">
                          {shortcut.type === "keys" ? (
                            <Keyboard className="h-3 w-3" />
                          ) : (
                            <Terminal className="h-3 w-3" />
                          )}
                          {shortcut.type === "keys" ? "Atalho" : "Terminal"}
                        </div>
                        {shortcut.type === "keys" ? (
                          <KeySequence
                            value={shortcut.label}
                            mac={cheatOs === "mac"}
                          />
                        ) : (
                          <TerminalCommand value={shortcut.label} />
                        )}
                        <p className="mt-3 text-sm text-slate-600">
                          {shortcut.description}
                        </p>
                        {shortcut.danger ? (
                          <p className="mt-2 rounded-lg border-2 border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">
                            Ação destrutiva: apaga trabalho sem volta. Confira o
                            que vai perder antes de rodar.
                          </p>
                        ) : null}
                      </div>
                      <CopyButton text={shortcut.label} />
                    </div>
                  </div>
                ))}
                {cheatItems.length === 0 ? (
                  <p className="text-sm font-bold text-slate-500">
                    Nada encontrado nesse contexto.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
