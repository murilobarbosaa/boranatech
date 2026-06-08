import { useState, type FormEvent } from "react";
import { MailCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { z } from "zod";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";

const resetSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido.")
    .max(160, "Use um e-mail mais curto."),
});

export default function RecuperarSenha() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = resetSchema.safeParse({ email });

    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? "Informe um e-mail válido.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(parsed.data.email);
      setSentTo(parsed.data.email);
    } catch {
      toast.error(
        "Não foi possível enviar o link agora. Tenta novamente em alguns instantes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!sentTo) return;
    setIsSubmitting(true);
    try {
      await resetPassword(sentTo);
      toast.success("Reenviamos o link. Confira a caixa de entrada e o spam.");
    } catch {
      toast.error(
        "Não foi possível reenviar agora. Tenta novamente em alguns instantes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <Layout>
        <SEO
          title="Recuperar senha — Bora na Tech?"
          url="/recuperar-senha"
          noindex
        />
        <section className="hero-pattern py-16">
          <div className="container">
            <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8">
              <span
                aria-hidden
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slate-900 bg-emerald-100 text-emerald-700 shadow-[3px_3px_0_#0f172a]"
              >
                <MailCheck className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <h1 className="font-display text-3xl font-black text-slate-950">
                Link enviado.
              </h1>
              <p className="mt-2 text-sm text-slate-950">
                Se esse email tiver conta no BoraNaTech, você vai receber um
                link de recuperação em até 2 minutos. Confira também a pasta de
                spam.
              </p>
              <div className="mt-4 rounded-xl border-2 border-slate-300 bg-[#faf8f4] px-4 py-3">
                <span className="block text-xs font-black uppercase text-slate-600">
                  Enviado para
                </span>
                <span className="mt-0.5 block break-all text-sm font-bold text-slate-950">
                  {sentTo}
                </span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isSubmitting}
                  className="btn-brutal-accent inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Reenviando..." : "Reenviar link"}
                </button>
                <button
                  type="button"
                  onClick={() => setSentTo(null)}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-white px-5 py-2.5 text-sm font-black text-slate-950 shadow-[3px_3px_0_#0f172a]"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
                  Usar outro email
                </button>
              </div>
              <Link
                href="/login"
                className="mt-4 inline-block text-sm font-bold text-violet-700 hover:underline"
              >
                Voltar para o login
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title="Recuperar senha — Bora na Tech?"
        url="/recuperar-senha"
        noindex
      />
      <section className="hero-pattern py-16">
        <div className="container">
          <div className="card-brutal mx-auto max-w-lg rounded-3xl bg-white p-8">
            <p className="social-badge mb-4 inline-flex px-3 py-1 text-xs font-black uppercase">
              recuperar senha
            </p>
            <h1 className="font-display text-3xl font-black text-slate-950">
              Receba um link seguro no seu e-mail.
            </h1>
            <p className="mt-2 text-sm text-slate-950">
              Para proteger sua conta, a mensagem não confirma se o e-mail
              existe na plataforma.
            </p>
            <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
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
              <button
                className="btn-brutal-accent inline-flex w-full justify-center rounded-full px-5 py-3 font-black disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
            <div className="mt-6 space-y-2 text-center text-sm text-slate-600">
              <p>
                Lembrou a senha?{" "}
                <Link
                  href="/login"
                  className="font-bold text-slate-700 hover:text-slate-950 hover:underline"
                >
                  Entrar
                </Link>
              </p>
              <p>
                Não tem conta ainda?{" "}
                <Link
                  href="/cadastro"
                  className="font-bold text-slate-700 hover:text-slate-950 hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
