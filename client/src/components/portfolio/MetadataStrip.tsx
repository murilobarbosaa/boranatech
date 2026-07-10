import type { ComponentType } from "react";
import {
  CalendarClock,
  CircleDot,
  Code2,
  FolderGit2,
  GitFork,
  Star,
  Users,
} from "lucide-react";
import { getPageAccentUi } from "@/lib/pageAccentUi";
import { cn } from "@/lib/utils";
import type {
  GithubAnalysisResponse,
  ProfileMetadata,
  RepoMetadata,
} from "@shared/github/schema";

const ac = getPageAccentUi("violet");

function formatDate(iso: string | null): string {
  if (!iso) return "sem data";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "sem data";
  return d.toLocaleDateString("pt-BR");
}

const RECENT_PUSH_MS = 90 * 24 * 60 * 60 * 1000;

// Push nos ultimos 90 dias = repo vivo: acende o icone do chip em emerald
// (sinal positivo discreto). Derivacao pura da mesma data do formatDate.
function isRecentPush(iso: string | null): boolean {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time < RECENT_PUSH_MS;
}

function Chip({
  icon: Icon,
  iconClass,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  /** Cor do icone; default slate-600 (chips neutros). */
  iconClass?: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-950 bg-white px-3 py-1 text-xs font-bold text-slate-800 shadow-[2px_2px_0_#0f172a]">
      <Icon className={cn("h-3.5 w-3.5", iconClass ?? "text-slate-600")} />
      {children}
    </span>
  );
}

interface MetadataProps {
  response: GithubAnalysisResponse;
}

/** Chips pequenos de metadados, pra encaixar no bloco de identidade. */
export function MetadataChips({ response }: MetadataProps) {
  if (response.mode === "repo") {
    const m = response.metadata as RepoMetadata;
    return (
      <div className="flex flex-wrap gap-2">
        <Chip icon={Code2}>
          {m.primaryLanguage ?? "linguagem nao informada"}
        </Chip>
        <Chip icon={Star}>{m.stars} estrelas</Chip>
        <Chip icon={GitFork}>{m.forks} forks</Chip>
        <Chip icon={CircleDot}>{m.openIssues} issues abertas</Chip>
        <Chip
          icon={CalendarClock}
          iconClass={
            isRecentPush(m.pushedAt) ? "text-emerald-600" : undefined
          }
        >
          último push em {formatDate(m.pushedAt)}
        </Chip>
      </div>
    );
  }

  const m = response.metadata as ProfileMetadata;
  return (
    <div className="flex flex-wrap gap-2">
      <Chip icon={FolderGit2}>{m.publicRepos} repositórios públicos</Chip>
      <Chip icon={Users}>{m.followers} seguidores</Chip>
    </div>
  );
}

/** Grid de repositórios em destaque, só no modo perfil. Seção própria.
 * compact: coluna unica (trilho lateral do resultado); default mantem o atual. */
export function TopRepos({
  response,
  compact = false,
}: MetadataProps & { compact?: boolean }) {
  if (response.mode !== "perfil") return null;

  const m = response.metadata as ProfileMetadata;
  if (m.topRepos.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-slate-600">
        Repositórios em destaque
      </p>
      <div
        className={cn(
          "grid grid-cols-1 gap-3",
          compact ? undefined : "md:grid-cols-2",
        )}
      >
        {m.topRepos.map((repo) => (
          <div
            key={repo.name}
            className={cn(
              "card-brutal rounded-2xl border-slate-950 bg-white p-4",
              ac.liftShadow,
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-display text-base font-black text-slate-950">
                {repo.name}
              </p>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-slate-600">
                <Star className="h-3.5 w-3.5" />
                {repo.stars}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {repo.primaryLanguage ?? "linguagem nao informada"}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {repo.description ?? "Sem descrição."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
