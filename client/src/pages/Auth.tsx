import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

const passwordSchema = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .regex(/[a-z]/, "Inclua uma letra minúscula.")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
  .regex(/[0-9]/, "Inclua um número.")
  .regex(/[^A-Za-z0-9]/, "Inclua um caractere especial.");

const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80, "Use um nome mais curto."),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(160, "Use um e-mail mais curto."),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(160, "Use um e-mail mais curto."),
  password: z.string().min(1, "Informe sua senha."),
});

function firstIssueMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Revise os dados informados.";
}

export default function Auth({ mode }: { mode: "login" | "cadastro" }) {
  const isSignup = mode === "cadastro";
  const [, setLocation] = useLocation();
  const { signIn, signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = useMemo(
    () => [
      { label: "8+ caracteres", valid: password.length >= 8 },
      { label: "letra maiúscula", valid: /[A-Z]/.test(password) },
      { label: "letra minúscula", valid: /[a-z]/.test(password) },
      { label: "número", valid: /[0-9]/.test(password) },
      { label: "caractere especial", valid: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const parsed = signupSchema.safeParse({ name, email, password });
        if (!parsed.success) {
          toast.error(firstIssueMessage(parsed.error));
          return;
        }

        await signUp(parsed.data);
        toast.success("Cadastro criado com segurança. Bem-vinda à plataforma!");
      } else {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(firstIssueMessage(parsed.error));
          return;
        }

        await signIn(parsed.data);
        toast.success("Login realizado com sucesso.");
      }

      setLocation("/perfil", { replace: true });
    } catch (error) {
      console.error("[Auth] handleSubmit failed", error);
      toast.error(
        isSignup
          ? "Não foi possível concluir o cadastro. Verifique os dados e tente novamente."
          : "Não foi possível entrar. Verifique suas credenciais e tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Layout>
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
            <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
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
                <input
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className="w-full rounded-xl border-2 border-slate-300 p-3 text-sm"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Sua senha"
                  type="password"
                  value={password}
                />
              </label>
              {isSignup && (
                <div className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
                  <p className="mb-2 text-slate-800">Sua senha precisa ter:</p>
                  <div className="flex flex-wrap gap-2">
                    {passwordChecks.map((check) => (
                      <span
                        className={`rounded-full px-2 py-1 ${
                          check.valid ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-500"
                        }`}
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
                {isSubmitting ? "Processando..." : isSignup ? "Cadastrar e ver perfil" : "Entrar"}
              </button>
            </form>
            {!isSignup && (
              <Link href="/recuperar-senha" className="mt-3 block text-center text-sm font-bold text-slate-600">
                Esqueci minha senha
              </Link>
            )}
            <Link href={isSignup ? "/login" : "/cadastro"} className="mt-4 block text-center text-sm font-bold text-violet-700">
              {isSignup ? "Já tenho conta" : "Quero me cadastrar"}
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
