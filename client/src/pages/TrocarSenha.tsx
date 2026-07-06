import { useEffect, useState, type FormEvent } from "react";
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

const trocarSenhaSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme sua nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.password !== data.currentPassword, {
    message: "A nova senha precisa ser diferente da atual.",
    path: ["password"],
  });

type ChangeOutcome = "form" | "success" | "partial";

export default function TrocarSenha() {
  const [, setLocation] = useLocation();
  const { user, loading, signIn, updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetryingOthers, setIsRetryingOthers] = useState(false);
  const [outcome, setOutcome] = useState<ChangeOutcome>("form");
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login", { replace: true });
    }
  }, [loading, user, setLocation]);

  // Encerra apenas as OUTRAS sessoes, mantendo o dispositivo atual logado. Mesma
  // forma usada em RedefinirSenha.tsx. signOut retorna { error: AuthError | null };
  // tratamos erro retornado e excecao inesperada como "nao confirmado".
  async function endOtherSessions(): Promise<boolean> {
    if (!supabase) {
      return false;
    }
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) {
        console.warn("[TrocarSenha] signOut others failed", error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn("[TrocarSenha] signOut others threw", err);
      return false;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.email) {
      toast.error("Sessão sem e-mail válido. Faça login novamente.");
      return;
    }

    const parsed = trocarSenhaSchema.safeParse({
      currentPassword,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      toast.error(firstIssueMessage(parsed.error));
      return;
    }

    setIsSubmitting(true);

    // a) reauth falhou: nada foi alterado.
    try {
      await signIn({
        email: user.email,
        password: parsed.data.currentPassword,
      });
    } catch {
      toast.error("Senha atual incorreta.");
      setIsSubmitting(false);
      return;
    }

    // b) updatePassword falhou: a senha NAO foi alterada.
    try {
      await updatePassword(parsed.data.password);
    } catch {
      toast.error("Não foi possível atualizar a senha. Tente novamente.");
      setIsSubmitting(false);
      return;
    }

    // c) senha alterada, mas as outras sessoes nao foram confirmadas como
    // encerradas -> estado parcial. d) tudo ok -> sucesso. Nunca redireciona pro
    // login: o dispositivo atual segue logado.
    const othersEnded = await endOtherSessions();
    setIsSubmitting(false);
    setOutcome(othersEnded ? "success" : "partial");
  }

  // Re-executa SOMENTE o encerramento das outras sessoes, nunca o updatePassword.
  async function handleRetryEndOthers() {
    setIsRetryingOthers(true);
    const othersEnded = await endOtherSessions();
    setIsRetryingOthers(false);
    if (othersEnded) {
      setOutcome("success");
    }
  }

  if (loading || !user) {
    return (
      <Layout>
        <SEO title="Trocar senha · Bora na Tech?" url="/trocar-senha" noindex />
        <section className="hero-pattern py-16">
          <div className="container">
            <p className="text-sm text-slate-500">Carregando…</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (outcome === "success") {
    return (
      <Layout>
        <SEO title="Trocar senha · Bora na Tech?" url="/trocar-senha" noindex />
        <section className="hero-pattern py-16">
          <div className="container">
            <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8">
              {/* TODO(Ana): copy provisoria do estado de sucesso */}
              <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">
                tudo certo
              </p>
              {/* TODO(Ana): copy provisoria */}
              <h1 className="font-display text-3xl font-black text-slate-950">
                Senha alterada.
              </h1>
              {/* TODO(Ana): copy provisoria */}
              <p className="mt-2 text-sm text-slate-600">
                Sua senha foi alterada e as outras sessões foram encerradas. Você
                continua conectado neste dispositivo.
              </p>
              {/* TODO(Ana): copy provisoria do link */}
              <Link
                href="/perfil"
                className="mt-6 block text-center text-sm font-bold text-violet-700"
              >
                Voltar para o perfil
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (outcome === "partial") {
    return (
      <Layout>
        <SEO title="Trocar senha · Bora na Tech?" url="/trocar-senha" noindex />
        <section className="hero-pattern py-16">
          <div className="container">
            <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8">
              {/* TODO(Ana): copy provisoria do estado parcial */}
              <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">
                quase la
              </p>
              {/* TODO(Ana): copy provisoria */}
              <h1 className="font-display text-3xl font-black text-slate-950">
                Senha alterada.
              </h1>
              {/* TODO(Ana): copy provisoria */}
              <p className="mt-2 text-sm text-slate-600">
                Sua senha foi alterada, mas não foi possível encerrar as outras
                sessões agora. Você continua conectado neste dispositivo.
              </p>
              {/* TODO(Ana): copy provisoria do botao de retry */}
              <button
                className="btn-brutal-accent mt-6 inline-flex w-full justify-center rounded-full px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRetryingOthers}
                onClick={handleRetryEndOthers}
                type="button"
              >
                {isRetryingOthers
                  ? "Encerrando..."
                  : "Tentar encerrar outras sessões"}
              </button>
              {/* TODO(Ana): copy provisoria do link */}
              <Link
                href="/perfil"
                className="mt-4 block text-center text-sm font-bold text-violet-700"
              >
                Voltar para o perfil
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Trocar senha · Bora na Tech?" url="/trocar-senha" noindex />
      <section className="hero-pattern py-16">
        <div className="container">
          <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8">
            <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">
              trocar senha
            </p>
            <h1 className="font-display text-3xl font-black text-slate-950">
              Defina uma nova senha segura.
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Pra sua segurança, confirme a senha atual antes de trocar. Outras
              sessões serão encerradas.
            </p>

            <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase text-slate-600">
                  Senha atual
                </span>
                <PasswordInput
                  autoComplete="current-password"
                  className="w-full rounded-xl border-2 border-slate-300 p-3 text-sm"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Sua senha atual"
                  value={currentPassword}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase text-slate-600">
                  Nova senha
                </span>
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
                <span className="mb-1 block text-xs font-black uppercase text-slate-600">
                  Confirmar nova senha
                </span>
                <PasswordInput
                  autoComplete="new-password"
                  className="w-full rounded-xl border-2 border-slate-300 p-3 text-sm"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                />
              </label>
              <PasswordRequirements
                value={password}
                isFocused={passwordFocused}
              />
              <button
                className="btn-brutal-accent inline-flex w-full justify-center rounded-full px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Trocando..." : "Trocar senha"}
              </button>
            </form>

            <Link
              href="/perfil"
              className="mt-4 block text-center text-sm font-bold text-violet-700"
            >
              Voltar para o perfil
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
