/*
  BORA NA TECH? — Header Component
  Mega menu navigation for desktop and accordion drawer for mobile.
*/

import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
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
  description?: string;
  path: string;
  isPro?: boolean;
  isWomen?: boolean;
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
    id: "iniciante",
    label: "Não sei nada",
    headerDescription:
      "Pra quem está começando do zero e quer descobrir o universo de TI",
    accentColor: "#534AB7",
    columns: [
      {
        groupLabel: "EXPLORAR A ÁREA",
        items: [
          {
            label: "Áreas de TI",
            description: "Conheça os caminhos da TI",
            path: "/areas",
          },
          {
            label: "Quiz carreira",
            description: "Descubra sua área ideal",
            path: "/quiz-carreira",
          },
          {
            label: "Faculdades",
            description: "Cursos superiores de TI",
            path: "/faculdades",
          },
        ],
      },
      {
        groupLabel: "CONHECER TECNOLOGIAS",
        items: [
          {
            label: "Tecnologias",
            description: "Linguagens e frameworks",
            path: "/tecnologias",
          },
          {
            label: "Mapa de tecnologias",
            description: "Visualize o ecossistema tech",
            path: "/tecnologias/por-area",
          },
          {
            label: "Ranking de tecnologias",
            description: "As mais pedidas no mercado",
            path: "/tecnologias/ranking",
          },
          {
            label: "Dicionário",
            description: "Termos técnicos sem complicar",
            path: "/dicionario",
          },
        ],
      },
    ],
  },
  {
    id: "medio",
    label: "Sei, mas e agora?",
    headerDescription: "Pra quem já tem direção e quer aprofundar com método",
    accentColor: "#3B6D11",
    columns: [
      {
        groupLabel: "ESTUDAR",
        items: [
          {
            label: "Roadmaps",
            description: "Planos de estudo por área",
            path: "/roadmaps",
            isPro: true,
          },
          {
            label: "Plano de Estudos",
            description: "Monte sua rotina personalizada",
            path: "/estudos",
            isPro: true,
          },
          {
            label: "Cursos",
            description: "Cursos gratuitos e pagos",
            path: "/cursos",
          },
          {
            label: "Plataformas",
            description: "Onde estudar com clareza",
            path: "/plataformas",
          },
        ],
      },
      {
        groupLabel: "PRATICAR",
        items: [
          {
            label: "Projetos",
            description: "Ideias para seu portfólio",
            path: "/projetos",
          },
          {
            label: "Inglês",
            description: "O inglês que o mercado usa",
            path: "/ingles",
          },
          {
            label: "Ferramentas",
            description: "Setup e ferramentas essenciais",
            path: "/ferramentas",
          },
          {
            label: "Guia de IA",
            description: "Quais IAs usar e como",
            path: "/ia",
          },
        ],
      },
    ],
  },
  {
    id: "avancado",
    label: "Já estou na área!",
    headerDescription: "Pra quem já está no mercado ou prestes a entrar",
    accentColor: "#BA7517",
    columns: [
      {
        groupLabel: "ENCONTRAR EMPREGO",
        items: [
          {
            label: "Vagas, estágio e trainee",
            description: "Vagas, currículo e institutos",
            path: "/estagio",
          },
          {
            label: "Empresas Tech",
            description: "Conheça quem contrata",
            path: "/empresas",
          },
          {
            label: "Freelance",
            description: "Como ganhar dinheiro com tech",
            path: "/freelance",
          },
          {
            label: "Simulador de carreira",
            description: "Quanto tempo até sua primeira vaga",
            path: "/simulador",
          },
        ],
      },
      {
        groupLabel: "PROCESSO SELETIVO",
        items: [
          {
            label: "Entrevista",
            description: "Prepare-se para processos seletivos",
            path: "/entrevistas",
          },
          {
            label: "Currículo",
            description: "Apareça para os recrutadores certos",
            path: "/curriculo",
          },
          {
            label: "Networking",
            description: "Conecte-se com as pessoas certas",
            path: "/networking",
            isPro: true,
          },
          {
            label: "Portfólio",
            description: "Monte um portfólio que gera entrevistas",
            path: "/portfolio",
          },
        ],
      },
      {
        groupLabel: "AVALIADORES IA",
        items: [
          {
            label: "Avaliador Currículo",
            description: "Nota, lacunas, palavras-chave e melhorias por seção",
            path: "/curriculo/analisar",
            isPro: true,
          },
          {
            label: "Avaliador LinkedIn",
            description: "Headline, Sobre e visibilidade para recrutadores",
            path: "/curriculo/linkedin",
            isPro: true,
          },
          {
            label: "Avaliador GitHub",
            description: "Avalie e melhore seu perfil",
            path: "/portfolio/analisar",
            isPro: true,
          },
          {
            label: "Evolução de Carreira",
            description: "De júnior a sênior e além",
            path: "/evolucao",
          },
        ],
      },
    ],
  },
  {
    id: "comunidade",
    label: "Comunidade",
    headerDescription: "Conteúdo, conexões e referências do mercado",
    accentColor: "#993C1D",
    columns: [
      {
        groupLabel: "MERCADO",
        items: [
          {
            label: "Salários",
            description: "Tabela salarial e calculadoras",
            path: "/salarios",
          },
          {
            label: "Empregabilidade",
            description: "Prontidão vaga × perfil e análise crítica do anúncio",
            path: "/empregabilidade",
            isPro: true,
          },
          {
            label: "Ranking",
            description: "Empresas com mais vagas para júnior",
            path: "/empresas/ranking-junior",
          },
        ],
      },
      {
        groupLabel: "CONTEÚDO",
        items: [
          {
            label: "Notícias",
            description: "Novidades da área tech",
            path: "/noticias",
          },
          {
            label: "Eventos",
            description: "Encontros por cidade e formato",
            path: "/eventos",
          },
          {
            label: "Dicas",
            description: "Rotina, mercado e portfólio",
            path: "/dicas",
          },
        ],
      },
      {
        groupLabel: "CONEXÕES",
        items: [
          {
            label: "Comunidades",
            description: "Grupos para aprender junto",
            path: "/comunidades",
          },
          {
            label: "Mentorias",
            description: "Sessões com quem já está na área",
            path: "/mentorias",
          },
          { label: "Mulheres", path: "/mulheres", isWomen: true },
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
  return (
    menu.columns
      .flatMap((column) => column.items)
      .filter((item) => isNavItemActive(location, item.path))
      .sort((a, b) => {
        const pathA = a.path.replace(/\/+$/, "") || "/";
        const pathB = b.path.replace(/\/+$/, "") || "/";
        return pathB.length - pathA.length;
      })[0]?.path ?? null
  );
}

function ProStarBadge() {
  return <ProStarIcon className="ml-1.5 mt-[1px]" />;
}

function dropdownItemClass({
  isActive,
  isPro,
  isWomen,
}: {
  isActive: boolean;
  isPro?: boolean;
  isWomen?: boolean;
}) {
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

  if (isWomen) {
    return `${base} border-pink-300 bg-pink-100 hover:border-pink-400 hover:bg-pink-200 shadow-[2px_2px_0_rgba(244,114,182,0.45)] hover:shadow-[3px_3px_0_rgba(244,114,182,0.6)]`;
  }

  return `${base} border-transparent hover:border-slate-200 hover:bg-[var(--menu-hover)] hover:shadow-[2px_2px_0_rgba(15,23,42,0.1)]`;
}

function ActiveRouteDot() {
  return (
    <span
      className="ml-1.5 mt-[5px] inline-flex h-2 w-2 shrink-0 rounded-full border border-slate-900 bg-violet-700 shadow-[1px_1px_0_#0f172a]"
      aria-hidden="true"
    />
  );
}

function DropdownItemTitle({
  active,
  isPro,
  isWomen,
  label,
}: {
  active: boolean;
  isPro?: boolean;
  isWomen?: boolean;
  label: string;
}) {
  if (isWomen) {
    return (
      <span className="relative z-10 flex w-full items-center justify-between gap-2 text-sm leading-snug text-slate-900">
        <Sparkles
          className="h-3.5 w-3.5 shrink-0 text-pink-600"
          aria-hidden="true"
        />
        <span className="flex-1 text-center font-medium">{label}</span>
        <Heart
          className="h-3.5 w-3.5 shrink-0 text-pink-600"
          aria-hidden="true"
        />
      </span>
    );
  }

  return (
    <span
      className={`relative z-10 flex items-start text-sm leading-snug text-slate-900 ${isPro || active ? "font-bold" : "font-medium"}`}
    >
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  const cssVars = {
    "--menu-accent": menu.accentColor,
    "--menu-hover": hexToRgba(menu.accentColor, 0.08),
  } as CSSProperties;

  useLayoutEffect(() => {
    if (!isOpen) return;

    function reposition() {
      const wrapper = wrapperRef.current;
      const panel = panelRef.current;
      if (!wrapper || !panel) return;

      const margin = 16;
      const naturalLeft = wrapper.getBoundingClientRect().left;
      const naturalRight = naturalLeft + panel.offsetWidth;
      const overflow = naturalRight - (window.innerWidth - margin);
      const maxShift = Math.max(0, naturalLeft - margin);
      setShift(overflow > 0 ? Math.min(overflow, maxShift) : 0);
    }

    reposition();
    window.addEventListener("resize", reposition);
    return () => window.removeEventListener("resize", reposition);
  }, [isOpen]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpenMenu(null);
    }
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
      style={cssVars}
      onMouseEnter={() => setOpenMenu(menu.id)}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-controls={`menu-panel-${menu.id}`}
        aria-expanded={isOpen}
        onClick={() => setOpenMenu(isOpen ? null : menu.id)}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setOpenMenu(menu.id)}
        className={`nav-pill flex cursor-default items-center gap-1 px-3 py-1.5 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200 ${
          isActive || isOpen
            ? "nav-pill-active text-slate-900"
            : "text-slate-700"
        }`}
      >
        {menu.label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id={`menu-panel-${menu.id}`}
        ref={panelRef}
        onMouseEnter={() => setOpenMenu(menu.id)}
        style={{
          transform: `translateX(${-shift}px) translateY(${isOpen ? "0" : "-0.375rem"})`,
        }}
        className={`absolute left-0 top-full z-[1001] w-[min(42rem,calc(100vw-2rem))] pt-2 transition-all duration-150 ${
          isOpen
            ? "visible opacity-100"
            : "invisible opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`overflow-hidden rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-[6px_6px_0_#0f172a]`}
        >
          <div className="mb-4">
            <p className="text-[13px] font-black text-slate-900">
              {menu.label}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {menu.headerDescription}
            </p>
          </div>
          <div className="mb-4 h-px bg-slate-200" />

          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))" }}
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

                <div
                  className={
                    menu.columns.length === 1 ? "space-y-2" : "space-y-1"
                  }
                >
                  {column.items.map((item) => {
                    const itemActive = item.path === activeItemPath;

                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setOpenMenu(null)}
                        aria-current={itemActive ? "page" : undefined}
                        className={dropdownItemClass({
                          isActive: itemActive,
                          isPro: item.isPro,
                          isWomen: item.isWomen,
                        })}
                      >
                        <DropdownItemTitle
                          active={itemActive}
                          isPro={item.isPro}
                          isWomen={item.isWomen}
                          label={item.label}
                        />
                        {item.description ? (
                          <span
                            className={`relative z-10 mt-0.5 block text-xs leading-snug ${itemActive ? "text-slate-700" : "text-slate-500"}`}
                          >
                            {item.description}
                          </span>
                        ) : null}
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

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <nav
      className="hidden flex-1 items-center justify-center gap-0.5 2xl:flex 2xl:gap-1"
      aria-label="Navegação principal"
    >
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
        aria-current={
          isPathActive("/comparador", location) ? "page" : undefined
        }
        className={`nav-pill inline-flex items-center gap-1 px-3 py-1.5 text-sm font-bold ${
          isPathActive("/comparador", location)
            ? "nav-pill-active text-slate-900"
            : "text-slate-700"
        }`}
      >
        Comparador
        <ProStarBadge />
      </Link>
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
        style={{
          borderLeft: isActive
            ? `3px solid ${menu.accentColor}`
            : "3px solid transparent",
        }}
      >
        {menu.label}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
        />
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
                    className={`${dropdownItemClass({ isActive: itemActive, isPro: item.isPro, isWomen: item.isWomen })} my-1 px-2`}
                  >
                    <DropdownItemTitle
                      active={itemActive}
                      isPro={item.isPro}
                      isWomen={item.isWomen}
                      label={item.label}
                    />
                    {item.description ? (
                      <span
                        className={`relative z-10 block text-xs ${itemActive ? "text-slate-700" : "text-slate-500"}`}
                      >
                        {item.description}
                      </span>
                    ) : null}
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
  const {
    loading: authLoading,
    profile,
    profileStatus,
    signOut,
    user,
  } = useAuth();
  const { isAdmin } = useAdmin();
  const { isPro, loading: subscriptionLoading } = useSubscription();
  const userName =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Perfil";
  // Skeleton só quando user existe mas perfil ainda não chegou E estamos
  // genuinamente carregando. Em status='error' sem perfil, cai no fallback
  // (UserAvatar com iniciais + cores padrão) em vez de girar para sempre.
  const avatarLoading = Boolean(
    user && !profile && (authLoading || profileStatus === "loading"),
  );
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
        <div className="mx-auto flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:max-w-[1280px] lg:px-8 2xl:max-w-[1440px]">
          <Link href="/" className="group shrink-0">
            <Logo variant="light" size="sm" showTagline />
          </Link>

          <DesktopNav location={location} />

          <div className="hidden items-center gap-1.5 2xl:flex 2xl:gap-2">
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
                  <UserAvatar
                    name={userName}
                    border={avatarBorder}
                    icon={avatarIcon}
                    bg={avatarBg}
                    size="sm"
                    loading={avatarLoading}
                  />
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
                    className="inline-flex items-center rounded-full border-2 border-slate-900 bg-[#FFB800] px-2.5 py-2 text-xs font-black text-slate-950 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a]"
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

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-[1001] bg-black/50 2xl:hidden"
          onClick={closeMobileDrawer}
        />
      ) : null}

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

        <nav
          className="h-[calc(100%-64px)] overflow-y-auto pb-24"
          aria-label="Navegação principal mobile"
        >
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
                <UserAvatar
                  name={userName}
                  border={avatarBorder}
                  icon={avatarIcon}
                  bg={avatarBg}
                  size="sm"
                  loading={avatarLoading}
                />
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
            aria-current={
              isPathActive("/comparador", location) ? "page" : undefined
            }
            className={`mx-4 mt-3 flex items-center justify-center gap-1 rounded-full border-2 px-4 py-3 text-center text-sm font-black shadow-[2px_2px_0_#0f172a] ${
              isPathActive("/comparador", location)
                ? "border-slate-900 bg-white text-slate-950"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            Comparador
            <ProStarBadge />
          </Link>
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
