import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import { GenderSelect } from "@/components/auth/GenderSelect";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthErrorMessage, type FriendlyError } from "@/lib/authErrors";
import {
  firstIssueMessage,
  loginSchema,
  signupSchema,
} from "@/lib/authSchemas";
import { savePendingIntent, type PendingIntent } from "@/lib/pendingIntent";
import { cn } from "@/lib/utils";
import { getMyProfile } from "@/services/profileService";
import type { Gender } from "@shared/gender";
import { greet } from "@shared/greeting";

type Tab = "signin" | "signup";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated?: () => void;
  defaultTab?: Tab;
  title?: ReactNode;
  description?: ReactNode;
  pendingIntent?: PendingIntent;
}

export default function AuthModal({
  open,
  onOpenChange,
  onAuthenticated,
  defaultTab = "signin",
  title = "Faça login pra continuar",
  description = "Crie sua conta ou entre pra salvar seu progresso.",
  pendingIntent,
}: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setError(null);
    }
  }, [open, defaultTab]);

  useEffect(() => {
    setError(null);
  }, [name, email, password, gender, tab]);

  const isSignup = tab === "signup";

  function persistIntentForOAuth() {
    if (pendingIntent) {
      savePendingIntent(pendingIntent);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const parsed = signupSchema.safeParse({
          name,
          email,
          password,
          gender,
        });
        if (!parsed.success) {
          toast.error(firstIssueMessage(parsed.error));
          return;
        }

        await signUp(parsed.data);
        localStorage.setItem("bnt_signup_completed", "true");
        getMyProfile().catch((triggerErr) => {
          console.warn(
            "[AuthModal] failed to trigger welcome email:",
            triggerErr,
          );
        });
        toast.success(
          `Cadastro criado com segurança. ${greet(parsed.data.gender)} à plataforma!`,
        );
      } else {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(firstIssueMessage(parsed.error));
          return;
        }

        await signIn(parsed.data);
        toast.success("Login realizado com sucesso.");
      }

      onAuthenticated?.();
      onOpenChange(false);
    } catch (err) {
      console.error("[AuthModal] handleSubmit failed", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-2 overflow-y-auto rounded-xl border-2 border-slate-950 bg-white p-4 shadow-[6px_6px_0_#0f172a] sm:max-w-md sm:gap-4 sm:p-6">
        <DialogHeader className="mt-2 mb-3 gap-3">
          <DialogTitle className="px-8 text-center font-display text-lg font-black leading-tight text-slate-950 sm:text-2xl">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-slate-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center">
          <div className="inline-flex rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab("signin")}
              aria-pressed={!isSignup}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide transition-all sm:px-4 sm:py-1.5",
                !isSignup
                  ? "bg-[#FFB800] text-[#1a1a1a] shadow-[2px_2px_0_#0f172a]"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              aria-pressed={isSignup}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide transition-all sm:px-4 sm:py-1.5",
                isSignup
                  ? "bg-[#FFB800] text-[#1a1a1a] shadow-[2px_2px_0_#0f172a]"
                  : "text-slate-600 hover:text-slate-900",
              )}
            >
              Criar conta
            </button>
          </div>
        </div>

        <SocialAuthButtons
          mode={isSignup ? "cadastro" : "login"}
          onBeforeOAuth={persistIntentForOAuth}
          showDivider={false}
          redirectTo={
            typeof window !== "undefined"
              ? `${window.location.origin}${window.location.pathname}${window.location.search}`
              : undefined
          }
        />

        {error && (
          <div
            role="alert"
            className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm shadow-[3px_3px_0_#fca5a5]"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="font-black text-red-900">{error.message}</p>
                {error.hint && (
                  <p className="mt-1 font-bold text-red-700">{error.hint}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <form className="space-y-2 sm:space-y-3" onSubmit={handleSubmit}>
          {isSignup && (
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase text-slate-600">
                Nome
              </span>
              <input
                autoComplete="name"
                className="w-full rounded-xl border-2 border-slate-300 p-3 text-sm"
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
                value={name}
              />
            </label>
          )}
          {isSignup && (
            <div className="block">
              <label
                htmlFor="auth-modal-gender"
                className="mb-2 block text-xs font-black uppercase text-slate-600"
              >
                Como você se identifica?
              </label>
              <GenderSelect
                id="auth-modal-gender"
                value={gender || undefined}
                onChange={(value) => setGender(value as Gender)}
              />
            </div>
          )}
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase text-slate-600">
              E-mail
            </span>
            <input
              autoComplete="email"
              className="w-full rounded-xl border-2 border-slate-300 p-3 text-sm"
              inputMode="email"
              maxLength={160}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              type="email"
              value={email}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase text-slate-600">
              Senha
            </span>
            <PasswordInput
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="w-full rounded-xl border-2 border-slate-300 p-3 text-sm"
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              placeholder="Sua senha"
              value={password}
            />
          </label>
          {isSignup && (
            <PasswordRequirements
              value={password}
              isFocused={passwordFocused}
            />
          )}
          <button
            className="btn-brutal-accent inline-flex w-full justify-center rounded-full px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Processando..."
              : isSignup
                ? "Criar conta"
                : "Entrar"}
          </button>
        </form>
        {!isSignup && (
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              setLocation("/recuperar-senha");
            }}
            className="mt-1 block w-full text-center text-sm font-bold text-slate-600 hover:text-slate-900 hover:underline"
          >
            Esqueci minha senha
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
