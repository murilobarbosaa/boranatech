import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import { GenderSelect } from "@/components/auth/GenderSelect";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeReturnTo } from "@/components/auth/RequireAuth";
import { getAuthErrorMessage, type FriendlyError } from "@/lib/authErrors";
import {
  firstIssueMessage,
  loginSchema,
  signupSchema,
} from "@/lib/authSchemas";
import { getMyProfile } from "@/services/profileService";
import type { Gender } from "@shared/gender";
import { greet } from "@shared/greeting";

export default function Auth({
  mode,
  signupBanner,
}: {
  mode: "login" | "cadastro";
  signupBanner?: ReactNode;
}) {
  const isSignup = mode === "cadastro";
  const [, setLocation] = useLocation();
  const { signIn, signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    setError(null);
  }, [name, email, password, gender]);

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
          console.warn("[Auth] failed to trigger welcome email:", triggerErr);
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

      const returnTo = sanitizeReturnTo(
        new URLSearchParams(window.location.search).get("returnTo"),
      );
      setLocation(returnTo ?? (isSignup ? "/planos" : "/perfil"), {
        replace: true,
      });
    } catch (err) {
      console.error("[Auth] handleSubmit failed", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Layout>
      <SEO
        title={isSignup ? "Cadastro · Bora na Tech?" : "Login · Bora na Tech?"}
        description={
          isSignup
            ? "Crie sua conta gratuita no Bora na Tech? e salve seus caminhos de carreira em tecnologia."
            : "Acesse sua conta no Bora na Tech?."
        }
        url={isSignup ? "/cadastro" : "/login"}
        noindex={!isSignup}
      />
      <section className="hero-pattern py-16">
        <div className="container">
          <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8">
            <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">
              {isSignup ? "cadastro" : "login"}
            </p>
            <h1 className="font-display text-3xl font-black text-slate-950">
              {isSignup ? "Crie seu perfil inicial." : "Entre no seu perfil."}
            </h1>
            <p className="mt-2 text-sm text-slate-950">
              {isSignup
                ? "Cadastre-se com validação segura e entre automaticamente na sua bússola."
                : "Acesse sua conta para recuperar seus caminhos, cursos e favoritos."}
            </p>
            {isSignup && signupBanner ? (
              <div className="mt-5">{signupBanner}</div>
            ) : null}
            <SocialAuthButtons mode={mode} />
            {error && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-sm shadow-[3px_3px_0_#fca5a5]"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <div className="flex-1">
                    <p className="font-black text-red-900">{error.message}</p>
                    {error.hint && (
                      <p className="mt-1 font-bold text-red-700">
                        {error.hint}
                      </p>
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
            <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
              {isSignup && (
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase text-slate-600">
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
                    htmlFor="auth-gender"
                    className="mb-1 block text-xs font-black uppercase text-slate-600"
                  >
                    Como você se identifica?
                  </label>
                  <GenderSelect
                    id="auth-gender"
                    value={gender || undefined}
                    onChange={(value) => setGender(value as Gender)}
                  />
                </div>
              )}
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase text-slate-600">
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
                <span className="mb-1 block text-xs font-black uppercase text-slate-600">
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
                    ? "Cadastrar e ver perfil"
                    : "Entrar"}
              </button>
            </form>
            {!isSignup && (
              <Link
                href="/recuperar-senha"
                className="mt-3 block text-center text-sm font-bold text-slate-600"
              >
                Esqueci minha senha
              </Link>
            )}
            <Link
              href={isSignup ? "/login" : "/cadastro"}
              className="mt-4 block text-center text-sm font-bold text-violet-700"
            >
              {isSignup ? "Já tenho conta" : "Quero me cadastrar"}
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
