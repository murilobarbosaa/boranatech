import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { z } from "zod";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";

const resetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(160, "Use um e-mail mais curto."),
});

export default function RecuperarSenha() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = resetSchema.safeParse({ email });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Informe um e-mail válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(parsed.data.email);
      toast.success("Se esse e-mail estiver cadastrado, enviaremos um link seguro para redefinir sua senha.");
      setEmail("");
    } catch {
      toast.error("Não foi possível enviar o link agora. Tente novamente em instantes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Layout>
      <SEO title="Recuperar senha — Bora na Tech?" url="/recuperar-senha" noindex />
      <section className="hero-pattern py-16">
        <div className="container">
          <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8">
            <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">recuperar senha</p>
            <h1 className="font-display text-3xl font-black text-slate-950">Receba um link seguro no seu e-mail.</h1>
            <p className="mt-2 text-sm text-slate-950">
              Para proteger sua conta, a mensagem não confirma se o e-mail existe na plataforma.
            </p>
            <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
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
              <button
                className="btn-brutal-accent inline-flex w-full justify-center rounded-full px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
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
