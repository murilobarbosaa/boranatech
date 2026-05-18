import type { Gender } from "./gender";

export function greet(gender: Gender | null | undefined): string {
  if (gender === "feminino") return "Bem-vinda";
  if (gender === "masculino") return "Bem-vindo";
  return "Olá";
}

export function greetWithName(gender: Gender | null | undefined, name: string): string {
  return `${greet(gender)}, ${name}!`;
}
