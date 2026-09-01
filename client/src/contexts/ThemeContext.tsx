import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "bnt-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
const THEME_COLOR_LIGHT = "#FCC700";
const THEME_COLOR_DARK = "#1b1830";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage indisponivel; cai no sistema.
  }
  return "system";
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(DARK_QUERY).matches;
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") return systemPrefersDark() ? "dark" : "light";
  return preference;
}

function applyToDocument(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (meta) {
    meta.content = resolved === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(readStoredPreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolve(preference),
  );

  useEffect(() => {
    const next = resolve(preference);
    setResolvedTheme(next);
    applyToDocument(next);
    try {
      if (preference === "system") {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, preference);
      }
    } catch {
      // localStorage indisponivel; a preferencia vale so nesta sessao.
    }
  }, [preference]);

  useEffect(() => {
    if (preference !== "system" || !window.matchMedia) return;
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      const next = resolve("system");
      setResolvedTheme(next);
      applyToDocument(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [preference]);

  // Impressao sempre no claro: o Curriculo imprime papel branco e o CSS de
  // print nao consegue ignorar a classe .dark sozinho.
  useEffect(() => {
    const before = () => document.documentElement.classList.remove("dark");
    const after = () => applyToDocument(resolve(preference));
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferenceState((prev) => (resolve(prev) === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference, toggleTheme }),
    [preference, resolvedTheme, setPreference, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

const FALLBACK: ThemeContextType = {
  preference: "system",
  resolvedTheme: "light",
  setPreference: () => {},
  toggleTheme: () => {},
};

// Sem provider (arvores renderizadas isoladamente, por exemplo em testes de
// pagina) degrada para claro com acoes inertes. Tema e apresentacao: o
// fallback nunca produz dado errado, so ausencia visivel de troca.
export function useTheme(): ThemeContextType {
  return useContext(ThemeContext) ?? FALLBACK;
}
