import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import SocialAuthButtons from "@/components/SocialAuthButtons";
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
  GENDER_OPTIONS,
  firstIssueMessage,
  loginSchema,
  signupSchema,
} from "@/lib/authSchemas";
import {
  savePendingIntent,
  type PendingIntentContext,
} from "@/lib/pendingIntent";
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
  title?: string;
  description?: string;
  pendingIntent?: { context: PendingIntentContext; itemKey: string };
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
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setError(null);
    }
  }, [open, defaultTab]);

  useEffect(() => {
    setError(null);
  }, [name, email, password, gender, tab]);

  const passwordChecks = useMemo(
    () => [
      { label: "8+ caracteres", valid: password.length >= 8 },
      { label: "letra maiúscula", valid: /[A-Z]/.test(password) },
      { label: "letra minúscula", valid: /[a-z]/.test(password) },
      { label: "número", valid: /[0-9]/.test(password) },
      { label: "caractere especial", valid: /[^A-Za-z0-9]/.test(password) },
    ],
    [password],
  );

  const isSignup = tab === "signup";

  function persistIntentForOAuth() {
    if (pendingIntent) {
      savePendingIntent(pendingIntent.context, pendingIntent.itemKey);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const parsed = signupSchema.safeParse({ name, email, password, gender });
        if (!parsed.success) {
          toast.error(firstIssueMessage(parsed.error));
          return;
        }

        await signUp(parsed.data);
        localStorage.setItem("bnt_signup_completed", "true");
        getMyProfile().catch((triggerErr) => {
          console.warn("[AuthModal] failed to trigger welcome email:", triggerErr);
        });
        toast.success(`Cadastro criado com segurança. ${greet(parsed.data.gender)} à plataforma!`);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-black text-slate-950">{title}</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">{description}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 inline-flex rounded-full border-2 border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTab("signin")}
            aria-pressed={!isSignup}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wide transition-all",
              !isSignup ? "bg-slate-950 text-white shadow-[2px_2px_0_#FFB800]" : "text-slate-600 hover:text-slate-900",
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setTab("signup")}
            aria-pressed={isSignup}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wide transition-all",
              isSignup ? "bg-slate-950 text-white shadow-[2px_2px_0_#FFB800]" : "text-slate-600 hover:text-slate-900",
            )}
          >
            Criar conta
          </button>
        </div>

        <SocialAuthButtons mode={isSignup ? "cadastro" : "login"} onBeforeOAuth={persistIntentForOAuth} />

        {error && (
          <div
            role="alert"
            className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm shadow-[3px_3px_0_#fca5a5]"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="font-black text-red-900">{error.message}</p>
                {error.hint && <p className="mt-1 font-bold text-red-700">{error.hint}</p>}
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

        <form className="space-y-3" onSubmit={handleSubmit}>
          {isSignup && (
            <label className="block">
              <span className="mb-1 block text-xs font-black uppercase text-slate-600">Nome</span>
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
            <fieldset className="block">
              <legend className="mb-1 block text-xs font-black uppercase text-slate-600">
                Como você se identifica?
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((option) => {
                  const selected = gender === option.value;
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold transition",
                        selected
                          ? "border-slate-950 bg-[#FFB800] text-slate-950 shadow-[3px_3px_0_#0f172a]"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                      )}
                    >
                      <input
                        type="radio"
                        name="auth-modal-gender"
                        value={option.value}
                        checked={selected}
                        onChange={() => setGender(option.value)}
                        className="sr-only"
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-black uppercase text-slate-600">E-mail</span>
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
            <span className="mb-1 block text-xs font-black uppercase text-slate-600">Senha</span>
            <PasswordInput
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="w-full rounded-xl border-2 border-slate-300 p-3 text-sm"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              value={password}
            />
          </label>
          {isSignup && (
            <div className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
              <p className="mb-2 text-slate-800">Sua senha precisa ter:</p>
              <div className="flex flex-wrap gap-2">
                {passwordChecks.map((check) => (
                  <span
                    className={cn(
                      "rounded-full px-2 py-1",
                      check.valid ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-500",
                    )}
                    key={check.label}
                  >
                    {check.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button
            className="btn-brutal-accent inline-flex w-full justify-center rounded-full px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Processando..." : isSignup ? "Criar conta" : "Entrar"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
