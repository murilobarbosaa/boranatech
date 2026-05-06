/*
  BORA NA TECH? — Header Component
  Mega menu navigation for desktop and accordion drawer for mobile.
*/

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Compass, LogOut, Menu, ShieldCheck, Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
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
          { label: "Quiz de Área", description: "Descubra sua área com IA", path: "/quiz-carreira", isPro: true },
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
          { label: "Salários", description: "Tabela salarial e calculadoras", path: "/salarios", isPro: true },
          { label: "Empregabilidade", description: "Prontidão vaga × perfil e análise crítica do anúncio", path: "/empregabilidade", isPro: true },
        ],
      },
      {
        groupLabel: "PROCESSO SELETIVO",
        items: [
          { label: "Entrevistas", description: "Prepare-se para processos seletivos", path: "/entrevistas", isPro: true },
          { label: "Currículo e LinkedIn", description: "Apareça para os recrutadores certos", path: "/curriculo", isPro: true },
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
          { label: "Notícias", description: "Novidades da área tech", path: "/noticias", isPro: true },
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

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function isDropdownActive(menu: DropdownMenu, location: string) {
  return menu.columns.some((column) =>
    column.items.some((item) => location === item.path || location.startsWith(`${item.path}/`)),
  );
}

function isPathActive(path: string, location: string) {
  return location === path || location.startsWith(`${path}/`);
}

function ProStarBadge() {
  return (
    <span className="ml-1.5 inline-flex h-4 w-4 align-middle items-center justify-center rounded-full border border-slate-900 bg-[#FAC775] text-[9px] font-black leading-none text-[#412402] shadow-[1px_1px_0_#0f172a]">
      ★
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
          isActive ? "nav-pill-active text-slate-900" : "text-slate-700"
        }`}
      >
        {menu.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      <div
        onMouseEnter={() => setOpenMenu(menu.id)}
        className={`absolute left-0 top-full z-[1001] mt-3 min-w-[520px] overflow-hidden rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-[6px_6px_0_#0f172a] transition-all duration-150 ${
          isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0"
        }`}
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
                {column.items.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setOpenMenu(null)}
                    className={`block rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--menu-hover)] ${
                      item.isPro
                        ? "border border-yellow-300/80 bg-yellow-50/80 shadow-[2px_2px_0_rgba(15,23,42,0.12)]"
                        : ""
                    }`}
                  >
                    <span className={`block text-sm leading-snug text-slate-900 ${item.isPro ? "font-bold" : "font-medium"}`}>
                      {item.label}
                      {item.isPro ? <ProStarBadge /> : null}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500">{item.description}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3 text-right text-[11px] font-bold text-[#BA7517]">
          ★ funcionalidade Pro
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
    <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
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
        className={`nav-pill inline-flex items-center gap-1 px-3 py-1.5 text-sm font-bold ${
          isPathActive("/comparador", location) ? "nav-pill-active text-slate-900" : "text-slate-700"
        }`}
      >
        Comparador
        <ProStarBadge />
      </Link>
      <Link
        href="/mentorias"
        className={`rounded-full border border-amber-400/80 bg-amber-100/60 px-3 py-1.5 text-sm font-semibold text-amber-950 transition-colors duration-200 hover:bg-amber-200/70 hover:border-amber-500 ${
          isPathActive("/mentorias", location) ? "border-amber-500 bg-amber-200 text-amber-950 shadow-[1px_1px_0_#0f172a]" : ""
        }`}
      >
        Mentorias
      </Link>
      <Link
        href="/mulheres"
        className={`nav-pill rounded-full border-2 px-3 py-1.5 text-sm font-black shadow-[2px_2px_0_#0f172a] ${
          isPathActive("/mulheres", location)
            ? "border-slate-900 bg-pink-300 text-slate-950"
            : "border-pink-300 bg-pink-100 text-pink-800 hover:bg-pink-200"
        }`}
      >
        Mulheres
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

              {column.items.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={closeDrawer}
                  className={`block rounded-lg px-2 py-2.5 hover:bg-violet-50 ${
                    item.isPro
                      ? "my-1 border border-yellow-300/80 bg-yellow-50/80 shadow-[2px_2px_0_rgba(15,23,42,0.12)]"
                      : ""
                  }`}
                >
                  <span className={`block text-sm text-slate-900 ${item.isPro ? "font-bold" : "font-medium"}`}>
                    {item.label}
                    {item.isPro ? <ProStarBadge /> : null}
                  </span>
                  <span className="block text-xs text-slate-500">{item.description}</span>
                </Link>
              ))}
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
  const { signOut, user } = useAuth();
  const { isAdmin } = useAdmin();
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Perfil";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initials = getInitials(userName) || "BT";

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
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-yellow-400 shadow-[2px_2px_0_#0f172a] transition-all group-hover:shadow-[4px_4px_0_#0f172a]">
              <Compass className="h-5 w-5 text-slate-950" />
            </div>
            <span className="font-display font-black text-sm text-slate-900 leading-tight uppercase">
              BORA NA TECH?
              <span className="block text-xs font-bold tracking-normal normal-case text-slate-500">Sua Bússola na TI</span>
            </span>
          </Link>

          <DesktopNav location={location} />

          <div className="hidden items-center gap-2 lg:flex">
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
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-slate-900 bg-white text-xs font-black text-slate-900 shadow-[2px_2px_0_#0f172a]"
                  aria-label="Abrir perfil"
                >
                  {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <span>{initials}</span>}
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
            className="rounded-md border-2 border-slate-900 p-2 shadow-[2px_2px_0_#0f172a] transition-all hover:shadow-[3px_3px_0_#0f172a] lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {mobileOpen ? <div className="fixed inset-0 z-[1001] bg-black/50 lg:hidden" onClick={closeMobileDrawer} /> : null}

      <div
        className={`fixed right-0 top-0 z-[1002] h-full w-[280px] border-l-2 border-slate-900 bg-white transition-transform duration-300 lg:hidden ${
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

        <nav className="h-[calc(100%-64px)] overflow-y-auto pb-24">
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
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-slate-900 bg-white text-xs">
                  {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
                </span>
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
            className={`mx-4 mt-3 block rounded-full border px-4 py-3 text-center text-sm font-semibold transition-colors ${
              isPathActive("/mentorias", location)
                ? "border-amber-500 bg-amber-200 text-amber-950"
                : "border-amber-400/80 bg-amber-100/50 text-amber-950 hover:bg-amber-200/60"
            }`}
          >
            Mentorias
          </Link>
          <Link
            href="/mulheres"
            onClick={closeMobileDrawer}
            className={`mx-4 mt-3 block rounded-full border-2 px-4 py-3 text-center text-sm font-black shadow-[2px_2px_0_#0f172a] ${
              isPathActive("/mulheres", location)
                ? "border-slate-900 bg-pink-300 text-slate-950"
                : "border-pink-300 bg-pink-100 text-pink-800"
            }`}
          >
            Mulheres
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
