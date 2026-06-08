export const GENDER_VALUES = [
  "masculino",
  "feminino",
  "outro",
  "prefiro_nao_dizer",
] as const;

export type Gender = (typeof GENDER_VALUES)[number];
