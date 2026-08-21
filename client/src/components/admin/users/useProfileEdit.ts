import { useCallback, useMemo, useState } from "react";

import {
  ADMIN_EDITABLE_PROFILE_FIELDS,
  PROFILE_TEXT_LIMITS,
  PROFILE_URL_MAX,
  isProfileUrlField,
  validateProfileTextValue,
  validateProfileUrlValue,
} from "@shared/profileFields";

import type { UserDetail } from "./types";

// Estado do formulario de edicao de perfil.
//
// Hook proprio, e nao mais um punhado de useState no modal, por dois motivos:
// `dirty` precisa ser confiavel (a guarda de fechamento depende dele) e a
// validacao precisa sair da MESMA fonte do servidor
// (shared/profileFields.ts), nao de uma copia no cliente.

/** "" e null sao a mesma ausencia: e como o servidor tambem compara. */
function normalizar(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function snapshotDe(detail: UserDetail | null): Record<string, string> {
  const base: Record<string, string> = {};
  for (const campo of ADMIN_EDITABLE_PROFILE_FIELDS) {
    base[campo] = normalizar(
      (detail as unknown as Record<string, string | null>)?.[campo],
    );
  }
  return base;
}

/** Rotulos em portugues para a mensagem de erro nao citar o nome da coluna. */
const ROTULOS: Record<string, string> = {
  name: "Nome",
  full_name: "Nome completo",
  gender: "Gênero",
  bio: "Bio",
  area_interesse: "Área de interesse",
  nivel_atual: "Nível atual",
  objetivo: "Objetivo",
  headline: "Headline",
  city: "Cidade",
  uf: "UF",
  career_goal: "Meta de carreira",
  github_url: "GitHub",
  linkedin_url: "LinkedIn",
  website_url: "Site",
};

export function useProfileEdit(detail: UserDetail | null) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const snapshot = useMemo(() => snapshotDe(detail), [detail]);

  const start = useCallback(() => {
    setForm(snapshotDe(detail));
    setErrors({});
    setEditing(true);
  }, [detail]);

  const cancel = useCallback(() => {
    setEditing(false);
    setForm({});
    setErrors({});
  }, []);

  const change = useCallback((name: string, value: string) => {
    setForm((atual) => ({ ...atual, [name]: value }));
    // O erro some assim que a pessoa mexe no campo: manter a mensagem antiga
    // enquanto o valor ja mudou e mentir sobre o estado atual.
    setErrors((atual) => {
      if (!(name in atual)) return atual;
      const proximo = { ...atual };
      delete proximo[name];
      return proximo;
    });
  }, []);

  // Comparacao com o snapshot carregado. Nao vem de biblioteca de propósito:
  // e a pergunta exata que a guarda de fechamento faz, e um `isDirty` de
  // terceiro depende de defaultValues e do momento do reset.
  const dirty = useMemo(() => {
    if (!editing) return false;
    return ADMIN_EDITABLE_PROFILE_FIELDS.some(
      (campo) => (form[campo] ?? "") !== (snapshot[campo] ?? ""),
    );
  }, [editing, form, snapshot]);

  /** Campos que mudaram, prontos para o corpo do PATCH. */
  const changedFields = useMemo(() => {
    const saida: Record<string, string> = {};
    for (const campo of ADMIN_EDITABLE_PROFILE_FIELDS) {
      if ((form[campo] ?? "") !== (snapshot[campo] ?? "")) {
        saida[campo] = form[campo] ?? "";
      }
    }
    return saida;
  }, [form, snapshot]);

  /**
   * Valida com a MESMA regra do servidor antes de enviar. Nao substitui a
   * validacao do servidor: adianta o erro para o campo certo, em vez de
   * devolver um toast generico depois da ida e volta.
   */
  const validate = useCallback((): boolean => {
    const achados: Record<string, string> = {};
    for (const campo of ADMIN_EDITABLE_PROFILE_FIELDS) {
      if (campo === "gender") continue;
      const valor = form[campo] ?? "";
      const erro = isProfileUrlField(campo)
        ? validateProfileUrlValue(campo, valor)
        : validateProfileTextValue(campo, valor);
      if (erro) achados[campo] = mensagemAmigavel(campo, erro.message);
    }
    setErrors(achados);
    return Object.keys(achados).length === 0;
  }, [form]);

  return {
    editing,
    form,
    errors,
    saving,
    dirty,
    changedFields,
    start,
    cancel,
    change,
    validate,
    setSaving,
    setErrors,
  };
}

// Traduz a mensagem tecnica do modulo compartilhado (que fala em nome de
// coluna) para o rotulo que a pessoa ve na tela.
function mensagemAmigavel(campo: string, original: string): string {
  const rotulo = ROTULOS[campo] ?? campo;
  if (original.includes("tamanho máximo")) {
    // O limite vem do modulo compartilhado, nao de um regex sobre a mensagem:
    // a mensagem original nao traz o numero, e extrai-lo de la seria um parser
    // que passa a mentir no dia em que o texto mudar.
    const limite = isProfileUrlField(campo)
      ? PROFILE_URL_MAX
      : PROFILE_TEXT_LIMITS[campo];
    return limite
      ? `${rotulo} precisa ter no máximo ${limite} caracteres.`
      : `${rotulo} está longo demais.`;
  }
  if (original.includes("URL")) {
    return `${rotulo} precisa começar com http:// ou https://.`;
  }
  return original;
}
