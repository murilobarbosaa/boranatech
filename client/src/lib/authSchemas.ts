import { z } from "zod";
import { validateEmailForSending } from "@shared/emailValidation";
import { GENDER_VALUES, type Gender } from "@shared/gender";

export const passwordSchema = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .regex(/[a-z]/, "Inclua uma letra minúscula.")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
  .regex(/[0-9]/, "Inclua um número.")
  .regex(/[^A-Za-z0-9]/, "Inclua um caractere especial.");

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome.")
    .max(80, "Use um nome mais curto."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido.")
    .max(160, "Use um e-mail mais curto.")
    // UX apenas, NAO e gate de seguranca: o cadastro e client.auth.signUp direto
    // no Supabase, bypassavel por quem chama a API sem passar por este schema. O
    // bloqueio autoritativo de dominio reservado precisa de trigger/Auth Hook no
    // Supabase (proposta separada). Aqui so evita probe/typo (example.com, .test)
    // pelo formulario.
    .refine((value) => validateEmailForSending(value).ok, {
      message: "Use um e-mail de um domínio real (evite example.com, .test).",
    }),
  password: passwordSchema,
  gender: z.enum(GENDER_VALUES).optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Informe um e-mail válido.")
    .max(160, "Use um e-mail mais curto."),
  password: z.string().min(1, "Informe sua senha."),
});

export const GENDER_OPTIONS: Array<{ value: Gender; label: string }> = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "outro", label: "Outro" },
  { value: "prefiro_nao_dizer", label: "Prefiro não dizer" },
];

export function firstIssueMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Revise os dados informados.";
}
