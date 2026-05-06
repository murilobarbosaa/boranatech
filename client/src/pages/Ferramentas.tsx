import { ExternalLink, Keyboard, PlayCircle, Terminal } from "lucide-react";
import Layout from "@/components/Layout";
import { DetailsChevronOnly } from "@/components/shared/DetailsChevronOnly";
import CopyButton from "@/components/shared/CopyButton";
import PageHero from "@/components/shared/PageHero";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import { devTools } from "@/lib/careerToolsData";

const ac = getPageAccentUi("orange");

type ShortcutItem = {
  label: string;
  type: "keys" | "terminal";
  description: string;
};

const shortcuts: ShortcutItem[] = [
  { label: "Ctrl+P", type: "keys", description: "Abrir arquivo rapidamente no editor." },
  { label: "Ctrl+Shift+P", type: "keys", description: "Abrir a paleta de comandos." },
  { label: "Ctrl+`", type: "keys", description: "Abrir ou fechar o terminal integrado." },
  { label: "Ctrl+S", type: "keys", description: "Salvar o arquivo atual." },
  { label: "Ctrl+/", type: "keys", description: "Comentar ou descomentar linha." },
  { label: "Alt+Shift+F", type: "keys", description: "Formatar o arquivo no VS Code/Cursor." },
  { label: "git status", type: "terminal", description: "Ver arquivos modificados e estado do repositório." },
  { label: "git add .", type: "terminal", description: "Adicionar mudanças ao próximo commit." },
  { label: "git commit -m \"mensagem\"", type: "terminal", description: "Criar um commit com mensagem." },
  { label: "npm install", type: "terminal", description: "Instalar dependências do projeto." },
  { label: "npm run dev", type: "terminal", description: "Rodar o servidor de desenvolvimento." },
  { label: "cd pasta", type: "terminal", description: "Entrar em uma pasta pelo terminal." },
  { label: "ls", type: "terminal", description: "Listar arquivos e pastas." },
  { label: "mkdir projeto", type: "terminal", description: "Criar uma nova pasta." },
];

const tutorialVideos: Record<string, { title: string; url: string }> = {
  "VS Code": {
    title: "Tutorial VS Code para iniciantes",
    url: "https://www.youtube.com/results?search_query=tutorial+vs+code+para+iniciantes+portugu%C3%AAs",
  },
  Cursor: {
    title: "Como usar Cursor com IA",
    url: "https://www.youtube.com/results?search_query=como+usar+cursor+ia+editor+codigo+portugu%C3%AAs",
  },
  Git: {
    title: "Git do zero para iniciantes",
    url: "https://www.youtube.com/results?search_query=git+do+zero+para+iniciantes+portugu%C3%AAs",
  },
  GitHub: {
    title: "GitHub para iniciantes",
    url: "https://www.youtube.com/results?search_query=github+para+iniciantes+portugu%C3%AAs",
  },
  Docker: {
    title: "Docker para iniciantes",
    url: "https://www.youtube.com/results?search_query=docker+para+iniciantes+portugu%C3%AAs",
  },
  Postman: {
    title: "Postman para testar APIs",
    url: "https://www.youtube.com/results?search_query=postman+para+testar+api+iniciantes+portugu%C3%AAs",
  },
  Figma: {
    title: "Figma para iniciantes",
    url: "https://www.youtube.com/results?search_query=figma+para+iniciantes+portugu%C3%AAs",
  },
  Jira: {
    title: "Jira para iniciantes",
    url: "https://www.youtube.com/results?search_query=jira+para+iniciantes+scrum+portugu%C3%AAs",
  },
  Slack: {
    title: "Slack para times e comunidades",
    url: "https://www.youtube.com/results?search_query=como+usar+slack+para+iniciantes+portugu%C3%AAs",
  },
  Notion: {
    title: "Notion para organizar estudos",
    url: "https://www.youtube.com/results?search_query=notion+para+organizar+estudos+portugu%C3%AAs",
  },
  Terminal: {
    title: "Terminal para iniciantes",
    url: "https://www.youtube.com/results?search_query=terminal+linux+comandos+b%C3%A1sicos+iniciantes+portugu%C3%AAs",
  },
  npm: {
    title: "npm para iniciantes",
    url: "https://www.youtube.com/results?search_query=npm+para+iniciantes+node+javascript+portugu%C3%AAs",
  },
  Yarn: {
    title: "Yarn para projetos JavaScript",
    url: "https://www.youtube.com/results?search_query=yarn+package+manager+tutorial+portugu%C3%AAs",
  },
  pnpm: {
    title: "pnpm para projetos JavaScript",
    url: "https://www.youtube.com/results?search_query=pnpm+tutorial+portugu%C3%AAs",
  },
  "Chrome DevTools": {
    title: "Chrome DevTools para iniciantes",
    url: "https://www.youtube.com/results?search_query=chrome+devtools+para+iniciantes+portugu%C3%AAs",
  },
};

function KeySequence({ value }: { value: string }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {value.split("+").map((key) => (
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

function TerminalCommand({ value, accentShadow }: { value: string; accentShadow: string }) {
  return (
    <span className={cn("inline-flex max-w-full items-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-950 px-3 py-2 text-white", accentShadow)}>
      <Terminal className="h-4 w-4 shrink-0 text-emerald-300" />
      <code className="overflow-x-auto whitespace-nowrap font-mono text-xs font-black">{value}</code>
    </span>
  );
}

export default function Ferramentas() {
  return (
    <Layout>
      <PageHero
        accent="orange"
        eyebrow="kit do dev"
        title="Ferramentas do Dev"
        subtitle="Configure seu ambiente e conheça o que todo dev usa."
      />
      <section className={cn(ac.contentBg, "py-12")}>
        <div className="container space-y-10">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {devTools.map((tool) => (
            <article key={tool.name} className="card-brutal rounded-2xl bg-white p-5">
              <div className="flex items-start gap-3">
                <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-slate-900 bg-white p-2", ac.brutalShadow)}>
                  <img src={tool.logoUrl} alt={`Logo ${tool.name}`} className="h-9 w-9 object-contain" loading="lazy" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-black">{tool.name}</h2>
                  <span className={cn("mt-1 inline-flex rounded-full px-2 py-1 text-xs font-black", ac.panelSoft, ac.tbodyAccent)}>{tool.need}</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">{tool.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tool.areas.map((area) => (
                  <span key={area} className={cn("rounded-full px-2 py-1 text-xs font-bold", ac.panelSoft, ac.tbodyAccent)}>{area}</span>
                ))}
              </div>
              <a href={tool.url} target="_blank" rel="noreferrer" className={cn("mt-4 inline-flex items-center gap-1 text-sm font-black hover:underline", ac.link)}>
                Site oficial <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={tutorialVideos[tool.name].url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 p-3 text-sm font-black text-red-700 transition-all hover:border-red-400 hover:bg-red-100"
              >
                <PlayCircle className="h-5 w-5 shrink-0" />
                <span>
                  Ver vídeo
                  <span className="block text-xs font-bold text-red-500">{tutorialVideos[tool.name].title}</span>
                </span>
              </a>
            </article>
          ))}
        </div>

        <div className="card-brutal rounded-2xl bg-white p-6">
          <h2 className="font-display text-2xl font-black">Guia de setup por área</h2>
          {["Front-end", "Back-end", "Dados", "DevOps", "UX/UI"].map((area) => (
            <DetailsChevronOnly key={area} className="mt-3 rounded-xl border-2 border-slate-900 p-4" title={<span className="font-black">{area}</span>}>
              <p className="mt-2 text-sm text-slate-600">Instale navegador, VS Code ou Cursor, Git, ferramenta principal da área, configure conta no GitHub e faça um projeto mínimo.</p>
            </DetailsChevronOnly>
          ))}
        </div>

        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="social-badge mb-3 inline-flex px-3 py-1 text-xs font-black uppercase">atalhos e terminal</p>
              <h2 className="font-display text-3xl font-black text-slate-950">Teclas e comandos essenciais</h2>
            </div>
            <p className="hidden max-w-md text-sm text-slate-600 md:block">
              Atalhos aparecem como teclas. Comandos de terminal aparecem com ícone e fundo escuro.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.label} className="card-brutal rounded-2xl bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black uppercase text-slate-700">
                      {shortcut.type === "keys" ? <Keyboard className="h-3 w-3" /> : <Terminal className="h-3 w-3" />}
                      {shortcut.type === "keys" ? "Tecla / atalho" : "Terminal"}
                    </div>
                    {shortcut.type === "keys" ? <KeySequence value={shortcut.label} /> : <TerminalCommand accentShadow={ac.brutalShadow} value={shortcut.label} />}
                    <p className="mt-3 text-sm text-slate-600">{shortcut.description}</p>
                  </div>
                  <CopyButton text={shortcut.label} />
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </section>
    </Layout>
  );
}
