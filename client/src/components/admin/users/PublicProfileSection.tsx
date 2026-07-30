import { Field } from "./UserFields";
import type { UserDetail } from "./types";
import { NAO_INFORMADO, fmtText, safeHttpUrl, semValor } from "./userFormat";

// Perfil publico: os seis campos que o usuario edita em /api/me e que o admin
// nunca via, porque um comentario obsoleto no endpoint de detalhe dizia que as
// colunas nao existiam.
//
// A secao inteira so RENDERIZA quando ha pelo menos um valor. Em 2026-07-29 os
// seis estao nulos em 100% dos perfis (0 de 3182), e seis linhas "Não
// informado" para todo mundo seriam ruido puro num modal que ja e longo.
// Assim que alguem preencher qualquer um, a secao aparece sozinha.
export function temPerfilPublico(detail: UserDetail): boolean {
  return [
    detail.headline,
    detail.city,
    detail.uf,
    detail.career_goal,
    detail.github_url,
    detail.linkedin_url,
    detail.website_url,
  ].some((valor) => !semValor(valor));
}

// Link so quando a URL valida como http(s). Caso contrario, texto cru: o valor
// vem do banco, escrito pelo usuario, e nao pode virar href sem checagem.
function UrlValue({ value }: { value: string | null | undefined }) {
  if (semValor(value)) return <>{NAO_INFORMADO}</>;
  const href = safeHttpUrl(value);
  if (!href) return <>{fmtText(value)}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="break-all text-violet-800 underline decoration-2 underline-offset-2 hover:bg-yellow-100"
    >
      {href}
    </a>
  );
}

function localidade(detail: UserDetail): string {
  const partes = [detail.city, detail.uf]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  return partes.length ? partes.join(" / ") : NAO_INFORMADO;
}

export function PublicProfileSection({ detail }: { detail: UserDetail }) {
  return (
    <div className="space-y-3 rounded-2xl border-2 border-slate-200 bg-white p-4">
      <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        <Field
          label="Headline"
          value={fmtText(detail.headline)}
          empty={semValor(detail.headline)}
        />
        <Field
          label="Cidade / UF"
          value={localidade(detail)}
          empty={semValor(detail.city) && semValor(detail.uf)}
        />
        <Field
          label="Meta de carreira"
          value={fmtText(detail.career_goal)}
          empty={semValor(detail.career_goal)}
        />
        <Field
          label="GitHub"
          value={<UrlValue value={detail.github_url} />}
          empty={semValor(detail.github_url)}
        />
        <Field
          label="LinkedIn"
          value={<UrlValue value={detail.linkedin_url} />}
          empty={semValor(detail.linkedin_url)}
        />
        <Field
          label="Site"
          value={<UrlValue value={detail.website_url} />}
          empty={semValor(detail.website_url)}
        />
      </div>
    </div>
  );
}
