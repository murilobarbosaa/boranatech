import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/contexts/AuthContext";
import { firstIssueMessage, passwordSchema } from "@/lib/authSchemas";
import { supabase } from "@/lib/supabase";
import { useRecoveryFlow } from "@/pages/redefinir-senha/useRecoveryFlow";

const redefinirSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme sua nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

export default function RedefinirSenha() {
  const [, setLocation] = useLocation();
  const { updatePassword } = useAuth();
  const recoveryState = useRecoveryFlow();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    if (recoveryState === "redirect-change-password") {
      setLocation("/trocar-senha", { replace: true });
    }
  }, [recoveryState, setLocation]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = redefinirSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      toast.error(firstIssueMessage(parsed.error));
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(parsed.data.password);
    } catch {
      toast.error("Não foi possível redefinir a senha. Abra o link mais recente e tente novamente.");
      setIsSubmitting(false);
      return;
    }

    if (supabase) {
      try {
        await supabase.auth.signOut({ scope: "others" });
      } catch (err) {
        console.warn("[RedefinirSenha] signOut others failed", err);
      }
    }

    toast.success("Senha redefinida. Você está logado.");
    setLocation("/perfil", { replace: true });
  }

  if (recoveryState === "checking" || recoveryState === "redirect-change-password") {
    return (
      <Layout>
        <SEO title="Redefinir senha — Bora na Tech?" url="/redefinir-senha" noindex />
        <section className="hero-pattern py-16">
          <div className="container">
            <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8 text-center">
              <p className="text-sm font-bold text-slate-600">Verificando link de recuperação…</p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (recoveryState === "expired") {
    return (
      <Layout>
        <SEO title="Redefinir senha — Bora na Tech?" url="/redefinir-senha" noindex />
        <section className="hero-pattern py-16">
          <div className="container">
            <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8">
              <span
                aria-hidden
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slate-900 bg-red-100 text-red-700 shadow-[3px_3px_0_#0f172a]"
              >
                <AlertCircle className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <h1 className="font-display text-2xl font-black text-slate-950">
                Link expirado ou inválido
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                O link de recuperação não funcionou. Pode ter expirado ou já ter sido usado.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/recuperar-senha"
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-[#FFB800] px-4 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
                >
                  Solicitar novo link
                </Link>
              </div>
              <Link
                href="/login"
                className="mt-4 inline-block text-sm font-bold text-slate-600 hover:text-slate-900 hover:underline"
              >
                Voltar ao login
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (recoveryState === "no-link") {
    return (
      <Layout>
        <SEO title="Redefinir senha — Bora na Tech?" url="/redefinir-senha" noindex />
        <section className="hero-pattern py-16">
          <div className="container">
            <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8">
              <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">
                link inválido
              </p>
              <h1 className="font-display text-2xl font-black text-slate-950">
                Acesse pelo link enviado por e-mail.
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Esta página só funciona quando aberta direto do link de recuperação. Solicite um novo link se o anterior expirou.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/recuperar-senha"
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-[#FFB800] px-4 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
                >
                  Pedir novo link
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
                >
                  Ir para login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Redefinir senha — Bora na Tech?" url="/redefinir-senha" noindex />
      <section className="hero-pattern py-16">
        <div className="container">
          <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8">
            <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">redefinir senha</p>
            <h1 className="font-display text-3xl font-black text-slate-950">Defina uma nova senha segura.</h1>
            <p className="mt-2 text-sm text-slate-600">
              Acesso autorizado pelo link de recuperação. Outras sessões serão encerradas após a troca.
            </p>

            <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase text-slate-600">Nova senha</span>
                <PasswordInput
                  autoComplete="new-password"
                  className="w-full rounded-xl border-2 border-slate-300 p-3 text-sm"
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Nova senha"
                  value={password}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase text-slate-600">Confirmar nova senha</span>
                <PasswordInput
                  autoComplete="new-password"
                  className="w-full rounded-xl border-2 border-slate-300 p-3 text-sm"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                />
              </label>
              <PasswordRequirements value={password} isFocused={passwordFocused} />
              <button
                className="btn-brutal-accent inline-flex w-full justify-center rounded-full px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
              </button>
            </form>

            <Link href="/login" className="mt-4 block text-center text-sm font-bold text-violet-700">
              Voltar para o login
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
