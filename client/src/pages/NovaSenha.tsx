import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/contexts/AuthContext";

const passwordSchema = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .regex(/[a-z]/, "Inclua uma letra minúscula.")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
  .regex(/[0-9]/, "Inclua um número.")
  .regex(/[^A-Za-z0-9]/, "Inclua um caractere especial.");

const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

export default function NovaSenha() {
  const [, setLocation] = useLocation();
  const { updatePassword, user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = updatePasswordSchema.safeParse({ password, confirmPassword });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revise a nova senha.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(parsed.data.password);
      toast.success("Senha atualizada com sucesso.");
      setLocation("/perfil", { replace: true });
    } catch {
      toast.error("Não foi possível atualizar a senha. Abra o link mais recente e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Layout>
      <SEO title="Nova senha — Bora na Tech?" url="/nova-senha" noindex />
      <section className="hero-pattern py-16">
        <div className="container">
          <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8">
            <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">nova senha</p>
            <h1 className="font-display text-3xl font-black text-slate-950">Defina uma nova senha segura.</h1>
            <p className="mt-2 text-sm text-slate-950">
              Use o link enviado pelo Supabase para liberar esta troca com segurança.
            </p>
            {!loading && !user && (
              <div className="mt-5 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                O link de recuperação precisa estar válido para atualizar a senha.
              </div>
            )}
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
                <span className="mb-1 block text-xs font-black uppercase text-slate-600">Confirmar senha</span>
                <PasswordInput
                  autoComplete="new-password"
                  className="w-full rounded-xl border-2 border-slate-300 p-3 text-sm"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                />
              </label>
              <PasswordRequirements value={password} isFocused={passwordFocused} />
              <button
                className="btn-brutal-accent inline-flex w-full justify-center rounded-full px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting || loading || !user}
                type="submit"
              >
                {isSubmitting ? "Atualizando..." : "Atualizar senha"}
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
