import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type SocialAuthButtonsProps = {
  mode: "login" | "cadastro";
};

type SocialProvider = "google";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

const providers: Array<{
  id: SocialProvider;
  label: string;
  icon: React.ReactNode;
  enabled: () => boolean;
}> = [
  {
    id: "google",
    label: "Google",
    icon: <GoogleIcon />,
    enabled: () => import.meta.env.VITE_AUTH_GOOGLE_ENABLED !== "false",
  },
];

export default function SocialAuthButtons({ mode }: SocialAuthButtonsProps) {
  const { signInWithOAuth } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const enabledProviders = useMemo(() => providers.filter((provider) => provider.enabled()), []);

  if (enabledProviders.length === 0) return null;

  async function handleProviderClick(provider: SocialProvider) {
    setLoadingProvider(provider);

    try {
      if (mode === "cadastro") {
        localStorage.setItem("bnt_social_signup_pending", "true");
      }
      await signInWithOAuth(provider);
    } catch (error) {
      console.error("[SocialAuthButtons] OAuth failed", error);
      setLoadingProvider(null);
      toast.error("Não foi possível iniciar o login social. Verifique a configuração do provedor.");
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] font-black uppercase text-slate-500">
          {mode === "cadastro" ? "cadastro rápido" : "entrada rápida"}
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mt-4 grid gap-3">
        {enabledProviders.map((provider) => {
          const isLoading = loadingProvider === provider.id;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleProviderClick(provider.id)}
              disabled={loadingProvider !== null}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={`${mode === "cadastro" ? "Cadastrar" : "Entrar"} com ${provider.label}`}
            >
              {provider.icon}
              {isLoading ? "Redirecionando..." : `${mode === "cadastro" ? "Cadastrar" : "Entrar"} com ${provider.label}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
