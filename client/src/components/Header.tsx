/*
  BORA NA TECH? — Header Component
  Mega menu navigation for desktop and accordion drawer for mobile.
*/

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, LogOut, Menu, ShieldCheck, Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAdmin } from "@/hooks/useAdmin";
import Logo from "@/components/Logo";
import { ProInlineBadge, ProStarIcon } from "@/components/pro/ProStarIcon";
import {
  normalizeAvatarBg,
  normalizeAvatarBorder,
  normalizeAvatarIcon,
} from "@/constants/avatarOptions";
import UserAvatar from "@/components/UserAvatar";
type MenuItem = {
  label: string;
  description: string;
  path: string;
  isPro?: boolean;
};

type MenuColumn = {
  groupLabel?: string;
  items: MenuItem[];
};

type DropdownMenu = {
  id: string;
  label: string;
  headerDescription: string;
  accentColor: string;
  columns: MenuColumn[];
};

const menuData: DropdownMenu[] = [
  {
    id: "descobrir",
    label: "Descobrir",
    headerDescription: "Encontre seu caminho na tecnologia",
    accentColor: "#534AB7",
    columns: [
      {
        items: [
          { label: "Áreas da TI", description: "Conheça os caminhos da TI", path: "/areas" },
          { label: "Quiz de Área", description: "Descubra sua área com IA", path: "/quiz-carreira" },
          { label: "Tecnologias", description: "Linguagens e frameworks", path: "/tecnologias" },
          { label: "Mapa de Tecnologias", description: "Visualize o ecossistema tech", path: "/tecnologias/mapa" },
        ],
      },
      {
        items: [
          { label: "Ranking de Tecnologias", description: "As mais pedidas no mercado", path: "/tecnologias/ranking" },
          { label: "Faculdades", description: "Cursos superiores de TI", path: "/faculdades" },
        ],
      },
    ],
  },
  {
    id: "aprender",
    label: "Aprender",
    headerDescription: "Recursos para aprender do jeito certo",
    accentColor: "#3B6D11",
    columns: [
      {
        items: [
          { label: "Roadmaps", description: "Planos de estudo por área", path: "/roadmaps", isPro: true },
          { label: "Cursos", description: "Cursos gratuitos e pagos", path: "/cursos" },
          { label: "Plataformas", description: "Onde estudar com clareza", path: "/plataformas" },
        ],
      },
      {
        items: [
          { label: "Projetos", description: "Ideias para seu portfólio", path: "/projetos" },
          { label: "Dicionário", description: "Termos técnicos sem complicar", path: "/dicionario" },
          { label: "Inglês para Tech", description: "O inglês que o mercado usa", path: "/ingles" },
          { label: "Ferramentas do Dev", description: "Setup e ferramentas essenciais", path: "/ferramentas" },
        ],
      },
    ],
  },
  {
    id: "evoluir",
    label: "Evoluir",
    headerDescription: "Acompanhe seu progresso e cresça",
    accentColor: "#BA7517",
    columns: [
      {
        items: [
          { label: "Plano de Estudos", description: "Monte sua rotina personalizada", path: "/estudos", isPro: true },
          { label: "Portfólio", description: "Monte um portfólio que gera entrevistas", path: "/portfolio" },
          { label: "Analisador de GitHub", description: "Avalie e melhore seu perfil", path: "/portfolio/analisar", isPro: true },
          {
            label: "Analisador de currículo com IA",
            description: "Nota, lacunas, palavras-chave e melhorias por seção",
            path: "/curriculo/analisar",
            isPro: true,
          },
          {
            label: "Otimizador de LinkedIn com IA",
            description: "Headline, Sobre e visibilidade para recrutadores",
            path: "/curriculo/linkedin",
            isPro: true,
          },
          { label: "Evolução de Carreira", description: "De júnior a sênior e além", path: "/evolucao" },
        ],
      },
    ],
  },
  {
    id: "carreira",
    label: "Carreira",
    headerDescription: "Do estudo à primeira vaga",
    accentColor: "#0F6E56",
    columns: [
      {
        groupLabel: "ENCONTRAR EMPREGO",
        items: [
          { label: "Vagas, Estágio e Trainee", description: "Vagas, currículo e institutos", path: "/estagio" },
          { label: "Simulador de Carreira", description: "Quanto tempo até sua primeira vaga", path: "/simulador" },
          { label: "Empresas Tech", description: "Conheça quem contrata", path: "/empresas" },
          { label: "Salários", description: "Tabela salarial e calculadoras", path: "/salarios" },
          { label: "Empregabilidade", description: "Prontidão vaga × perfil e análise crítica do anúncio", path: "/empregabilidade", isPro: true },
        ],
      },
      {
        groupLabel: "PROCESSO SELETIVO",
        items: [
          { label: "Entrevistas", description: "Prepare-se para processos seletivos", path: "/entrevistas" },
          { label: "Currículo e LinkedIn", description: "Apareça para os recrutadores certos", path: "/curriculo" },
          {
            label: "Analisador de currículo com IA",
            description: "Nota, lacunas, palavras-chave e melhorias por seção",
            path: "/curriculo/analisar",
            isPro: true,
          },
          {
            label: "Otimizador de LinkedIn com IA",
            description: "Headline, Sobre e visibilidade para recrutadores",
            path: "/curriculo/linkedin",
            isPro: true,
          },
          { label: "Networking", description: "Conecte-se com as pessoas certas", path: "/networking", isPro: true },
          { label: "Freelance", description: "Como ganhar dinheiro com tech", path: "/freelance" },
        ],
      },
    ],
  },
  {
    id: "comunidade",
    label: "Comunidade",
    headerDescription: "Conteúdo, conexões e novidades",
    accentColor: "#993C1D",
    columns: [
      {
        items: [
          { label: "Últimas Notícias", description: "Novidades da área tech", path: "/noticias" },
          { label: "Eventos", description: "Encontros por cidade e formato", path: "/eventos" },
          { label: "Comunidades", description: "Grupos para aprender junto", path: "/comunidades" },
        ],
      },
      {
        items: [
          { label: "Dicas", description: "Rotina, mercado e portfólio", path: "/dicas" },
          { label: "Sobre", description: "Conheça o projeto", path: "/sobre" },
        ],
      },
    ],
  },
];

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isDropdownActive(menu: DropdownMenu, location: string) {
  return getActiveDropdownItemPath(menu, location) !== null;
}

function isNavItemActive(currentPath: string, href: string) {
  if (!href || href === "#") return false;

  const [pathWithoutHash] = currentPath.split("#");
  const [pathname] = pathWithoutHash.split("?");

  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isPathActive(path: string, location: string) {
  return isNavItemActive(location, path);
}

function getActiveDropdownItemPath(menu: DropdownMenu, location: string) {
  return menu.columns
    .flatMap((column) => column.items)
    .filter((item) => isNavItemActive(location, item.path))
    .sort((a, b) => {
      const pathA = a.path.replace(/\/+$/, "") || "/";
      const pathB = b.path.replace(/\/+$/, "") || "/";
      return pathB.length - pathA.length;
    })[0]?.path ?? null;
}

function ProStarBadge() {
  return <ProStarIcon className="ml-1.5 mt-[1px]" />;
}

function dropdownItemClass({ isActive, isPro }: { isActive: boolean; isPro?: boolean }) {
  const base =
    "block rounded-xl border px-3 py-2.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200";

  if (isActive && isPro) {
    return `${base} pro-glare border-violet-700 bg-violet-50 shadow-[2px_2px_0_#6d28d9] hover:border-violet-700 hover:bg-violet-100`;
  }

  if (isActive) {
    return `${base} border-violet-700 bg-violet-50 shadow-[2px_2px_0_#6d28d9] hover:bg-violet-100`;
  }

  if (isPro) {
    return `${base} pro-glare border-yellow-300/90 bg-yellow-50/85 shadow-[2px_2px_0_rgba(250,204,21,0.55)] hover:border-yellow-400 hover:bg-yellow-100/80 hover:shadow-[3px_3px_0_rgba(250,204,21,0.7)]`;
  }

  return `${base} border-transparent hover:border-slate-200 hover:bg-[var(--menu-hover)] hover:shadow-[2px_2px_0_rgba(15,23,42,0.1)]`;
}

function ActiveRouteDot() {
  return (
    <span className="ml-1.5 mt-[5px] inline-flex h-2 w-2 shrink-0 rounded-full border border-slate-900 bg-violet-700 shadow-[1px_1px_0_#0f172a]" aria-hidden="true" />
  );
}

function DropdownItemTitle({
  active,
  isPro,
  label,
}: {
  active: boolean;
  isPro?: boolean;
  label: string;
}) {
  return (
    <span className={`relative z-10 flex items-start text-sm leading-snug text-slate-900 ${isPro || active ? "font-bold" : "font-medium"}`}>
      <span>{label}</span>
      {isPro ? <ProStarBadge /> : null}
      {active ? <ActiveRouteDot /> : null}
    </span>
  );
}

function DesktopMenuItem({
  menu,
  location,
  openMenu,
  setOpenMenu,
}: {
  menu: DropdownMenu;
  location: string;
  openMenu: string | null;
  setOpenMenu: (id: string | null) => void;
}) {
  const isOpen = openMenu === menu.id;
  const isActive = isDropdownActive(menu, location);
  const activeItemPath = getActiveDropdownItemPath(menu, location);
  const hasGroupedColumns = menu.columns.some((column) => column.groupLabel);
  const cssVars = {
    "--menu-accent": menu.accentColor,
    "--menu-hover": hexToRgba(menu.accentColor, 0.08),
  } as CSSProperties;

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpenMenu(isOpen ? null : menu.id);
    }

    if (event.key === "Escape") {
      setOpenMenu(null);
    }
  }

  return (
    <div
      className="relative"
      style={cssVars}
      onMouseEnter={() => setOpenMenu(menu.id)}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setOpenMenu(menu.id)}
        className={`nav-pill flex cursor-default items-center gap-1 px-3 py-1.5 text-sm font-bold ${
          isActive || isOpen ? "nav-pill-active text-slate-900" : "text-slate-700"
        }`}
      >
        {menu.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      <div
        onMouseEnter={() => setOpenMenu(menu.id)}
        className={`absolute left-0 top-full z-[1001] min-w-[480px] max-w-[calc(100vw-2rem)] pt-3 transition-all duration-150 ${
          isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`overflow-hidden rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-[6px_6px_0_#0f172a]`}
        >
        <div className="mb-4">
          <p className="text-[13px] font-black text-slate-900">{menu.label}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{menu.headerDescription}</p>
        </div>
        <div className="mb-4 h-px bg-slate-200" />

        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${menu.columns.length}, minmax(0, 1fr))` }}
        >
          {menu.columns.map((column, columnIndex) => (
            <div
              key={`${menu.id}-${columnIndex}`}
              className={`${hasGroupedColumns && columnIndex > 0 ? "border-l border-slate-200 pl-4" : ""}`}
            >
              {column.groupLabel ? (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {column.groupLabel}
                </p>
              ) : null}

              <div className={menu.columns.length === 1 ? "space-y-2" : "space-y-1"}>
                {column.items.map((item) => {
                  const itemActive = item.path === activeItemPath;

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setOpenMenu(null)}
                      aria-current={itemActive ? "page" : undefined}
                      className={dropdownItemClass({ isActive: itemActive, isPro: item.isPro })}
                    >
                      <DropdownItemTitle active={itemActive} isPro={item.isPro} label={item.label} />
                      <span className={`relative z-10 mt-0.5 block text-xs leading-snug ${itemActive ? "text-slate-700" : "text-slate-500"}`}>
                        {item.description}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3 text-right text-[11px] font-bold text-[#BA7517]">
          <span className="inline-flex items-center gap-1.5">
            <ProStarIcon />
            funcionalidade Pro
          </span>
        </div>
        </div>
      </div>
    </div>
  );
}

function DesktopNav({ location }: { location: string }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { profile } = useAuth();
  const showWomenSection = profile != null && profile.gender !== "masculino";

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <nav className="hidden flex-1 items-center justify-center gap-1 2xl:flex" aria-label="Navegação principal">
      {menuData.map((menu) => (
        <DesktopMenuItem
          key={menu.id}
          menu={menu}
          location={location}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
        />
      ))}
      <Link
        href="/comparador"
        aria-current={isPathActive("/comparador", location) ? "page" : undefined}
        className={`nav-pill inline-flex items-center gap-1 px-3 py-1.5 text-sm font-bold ${
          isPathActive("/comparador", location) ? "nav-pill-active text-slate-900" : "text-slate-700"
        }`}
      >
        Comparador
        <ProStarBadge />
      </Link>
      <Link
        href="/mentorias"
        aria-current={isPathActive("/mentorias", location) ? "page" : undefined}
        className={`nav-pill rounded-full border-2 px-3 py-1.5 text-sm font-black shadow-[2px_2px_0_#0f172a] ${
          isPathActive("/mentorias", location)
            ? "border-slate-900 bg-amber-300 text-slate-950"
            : "border-amber-400 bg-amber-100 text-amber-950 hover:bg-amber-200"
        }`}
      >
        Mentorias
      </Link>
      {showWomenSection && (
        <Link
          href="/mulheres"
          aria-current={isPathActive("/mulheres", location) ? "page" : undefined}
          className={`nav-pill rounded-full border-2 px-3 py-1.5 text-sm font-black shadow-[2px_2px_0_#0f172a] ${
            isPathActive("/mulheres", location)
              ? "border-slate-900 bg-pink-300 text-slate-950"
              : "border-pink-300 bg-pink-100 text-pink-800 hover:bg-pink-200"
          }`}
        >
          Mulheres
        </Link>
      )}
    </nav>
  );
}

function MobileAccordion({
  menu,
  location,
  openId,
  setOpenId,
  closeDrawer,
}: {
  menu: DropdownMenu;
  location: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  closeDrawer: () => void;
}) {
  const isOpen = openId === menu.id;
  const isActive = isDropdownActive(menu, location);
  const activeItemPath = getActiveDropdownItemPath(menu, location);

  return (
    <div className="border-b border-slate-200">
      <button
        type="button"
        onClick={() => setOpenId(isOpen ? null : menu.id)}
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold ${
          isActive ? "text-slate-950" : "text-slate-700"
        }`}
        style={{ borderLeft: isActive ? `3px solid ${menu.accentColor}` : "3px solid transparent" }}
      >
        {menu.label}
        <ChevronDown className={`h-4 w-4 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div className="pb-3">
          {menu.columns.map((column, columnIndex) => (
            <div key={`${menu.id}-mobile-${columnIndex}`} className="px-4">
              {column.groupLabel ? (
                <p className="mt-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {column.groupLabel}
                </p>
              ) : null}

              {column.items.map((item) => {
                const itemActive = item.path === activeItemPath;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={closeDrawer}
                    aria-current={itemActive ? "page" : undefined}
                    className={`${dropdownItemClass({ isActive: itemActive, isPro: item.isPro })} my-1 px-2`}
                  >
                    <DropdownItemTitle active={itemActive} isPro={item.isPro} label={item.label} />
                    <span className={`relative z-10 block text-xs ${itemActive ? "text-slate-700" : "text-slate-500"}`}>{item.description}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const [location] = useLocation();
  const { loading: authLoading, profile, signOut, user } = useAuth();
  const showWomenSection = profile != null && profile.gender !== "masculino";
  const { isAdmin } = useAdmin();
  const { isPro, loading: subscriptionLoading } = useSubscription();
  const userName = profile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Perfil";
  const avatarLoading = Boolean(user && (authLoading || !profile));
  const avatarBorder = normalizeAvatarBorder(profile?.avatar_border);
  const avatarIcon = normalizeAvatarIcon(profile?.avatar_icon);
  const avatarBg = normalizeAvatarBg(profile?.avatar_bg);

  function closeMobileDrawer() {
    setMobileOpen(false);
    setOpenMobileGroup(null);
  }

  async function handleSignOut() {
    await signOut();
    closeMobileDrawer();
  }

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-[1000] border-b-2 border-slate-900 bg-[#f6f0df]/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="group">
            <Logo variant="light" size="sm" showTagline />
          </Link>

          <DesktopNav location={location} />

          <div className="hidden items-center gap-2 2xl:flex">
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a]"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="btn-brutal-accent inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black"
                >
                  Cadastre-se agora
                  <Sparkles className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/perfil"
                  className="inline-flex"
                  aria-label="Abrir perfil"
                >
                  <UserAvatar name={userName} border={avatarBorder} icon={avatarIcon} bg={avatarBg} size="sm" loading={avatarLoading} />
                </Link>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-violet-800 bg-violet-50 px-3 py-2 text-sm font-black text-violet-900 shadow-[2px_2px_0_#0f172a] transition-all hover:bg-violet-100 hover:shadow-[3px_3px_0_#0f172a]"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Link>
                ) : null}
                {!isPro && !subscriptionLoading ? (
                <Link
                  href="/planos"
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-[#FFB800] px-3 py-2 text-sm font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a]"
                >
                  <ProInlineBadge label="Assinar Pro" />
                </Link>
                ) : null}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a]"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </>
            )}
          </div>

          <button
            className="rounded-md border-2 border-slate-900 p-2 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] 2xl:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {mobileOpen ? <div className="fixed inset-0 z-[1001] bg-black/50 2xl:hidden" onClick={closeMobileDrawer} /> : null}

      <div
        className={`fixed right-0 top-0 z-[1002] h-full w-[280px] border-l-2 border-slate-900 bg-white transition-transform duration-300 2xl:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b-2 border-slate-900 p-4">
          <span className="font-display font-bold text-lg">
            BORA NA TECH<span className="text-yellow-500">?</span>
          </span>
          <button
            onClick={closeMobileDrawer}
            className="rounded-md border-2 border-slate-900 p-2 shadow-[2px_2px_0_#0f172a]"
            aria-label="Fechar menu"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="h-[calc(100%-64px)] overflow-y-auto pb-24" aria-label="Navegação principal mobile">
          {!user ? (
            <Link
              href="/login"
              onClick={closeMobileDrawer}
              className="mx-4 my-3 block rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-center text-sm font-black text-slate-900 shadow-[2px_2px_0_#0f172a]"
            >
              Entrar
            </Link>
          ) : (
            <div className="m-4 rounded-2xl border-2 border-slate-900 bg-violet-50 p-3">
              <Link
                href="/perfil"
                onClick={closeMobileDrawer}
                className="flex items-center gap-3 text-sm font-black text-slate-950"
              >
                <UserAvatar name={userName} border={avatarBorder} icon={avatarIcon} bg={avatarBg} size="sm" loading={avatarLoading} />
                <span>{userName}</span>
              </Link>
              <div className="mt-3 flex gap-2">
                {isAdmin ? (
                  <Link
                    href="/admin"
                    onClick={closeMobileDrawer}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-violet-800 bg-violet-50 px-3 py-2 text-xs font-black text-violet-900 shadow-[2px_2px_0_#0f172a]"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Link>
                ) : null}
                {!isPro && !subscriptionLoading ? (
                  <Link
                    href="/planos"
                    onClick={closeMobileDrawer}
                    className="inline-flex flex-1 items-center justify-center rounded-full border-2 border-slate-900 bg-[#FFB800] px-3 py-2 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a]"
                  >
                    <ProInlineBadge label="Pro" />
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-3 py-2 text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a]"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>
          )}

          {menuData.map((menu) => (
            <MobileAccordion
              key={menu.id}
              menu={menu}
              location={location}
              openId={openMobileGroup}
              setOpenId={setOpenMobileGroup}
              closeDrawer={closeMobileDrawer}
            />
          ))}
          <Link
            href="/comparador"
            onClick={closeMobileDrawer}
            aria-current={isPathActive("/comparador", location) ? "page" : undefined}
            className={`mx-4 mt-3 flex items-center justify-center gap-1 rounded-full border-2 px-4 py-3 text-center text-sm font-black shadow-[2px_2px_0_#0f172a] ${
              isPathActive("/comparador", location)
                ? "border-slate-900 bg-white text-slate-950"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            Comparador
            <ProStarBadge />
          </Link>
          <Link
            href="/mentorias"
            onClick={closeMobileDrawer}
            aria-current={isPathActive("/mentorias", location) ? "page" : undefined}
            className={`mx-4 mt-3 block rounded-full border-2 px-4 py-3 text-center text-sm font-black shadow-[2px_2px_0_#0f172a] ${
              isPathActive("/mentorias", location)
                ? "border-slate-900 bg-amber-300 text-slate-950"
                : "border-amber-400 bg-amber-100 text-amber-950 hover:bg-amber-200"
            }`}
          >
            Mentorias
          </Link>
          {showWomenSection && (
            <Link
              href="/mulheres"
              onClick={closeMobileDrawer}
              aria-current={isPathActive("/mulheres", location) ? "page" : undefined}
              className={`mx-4 mt-3 block rounded-full border-2 px-4 py-3 text-center text-sm font-black shadow-[2px_2px_0_#0f172a] ${
                isPathActive("/mulheres", location)
                  ? "border-slate-900 bg-pink-300 text-slate-950"
                  : "border-pink-300 bg-pink-100 text-pink-800"
              }`}
            >
              Mulheres
            </Link>
          )}
        </nav>

        {!user ? (
          <div className="absolute bottom-0 left-0 right-0 border-t-2 border-slate-900 bg-white p-4">
            <Link
              href="/cadastro"
              onClick={closeMobileDrawer}
              className="btn-brutal-accent flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black"
            >
              Cadastre-se agora
              <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>

      <div className="h-16" />
    </>
  );
}
