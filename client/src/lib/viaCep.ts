// Consulta de CEP no ViaCEP, para preencher o endereco fiscal.
//
// É SUGESTAO, NUNCA BARREIRA. Toda a UI que usa isto precisa continuar
// funcionando com a consulta falhando: CEP recem-criado nao esta na base, o
// servico cai, o CSP bloqueia, a pessoa esta offline. Em qualquer desses casos
// o formulario segue aceitando digitacao manual, e por isso esta funcao devolve
// `null` em vez de lancar. Um erro aqui viraria um modal travado por causa de um
// campo que e opcional.
//
// O host precisa estar no `connect-src` das DUAS copias do CSP (vercel.json e
// server/app.ts). Sem isso o navegador bloqueia o fetch e o efeito e
// indistinguivel de "CEP nao encontrado".

import { isValidCep, onlyDigits } from "@shared/fiscalIdentity";

export type ViaCepEndereco = {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  /** Codigo IBGE do municipio (7 digitos). */
  codigoMunicipio: string;
};

type ViaCepResposta = {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  ibge?: string;
  /** O ViaCEP responde 200 com { erro: true } para CEP inexistente. */
  erro?: boolean | string;
};

const TIMEOUT_MS = 6000;

export async function lookupCep(raw: string): Promise<ViaCepEndereco | null> {
  const cep = onlyDigits(raw);
  if (!isValidCep(cep)) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as ViaCepResposta;
    // CEP inexistente vem como 200 com `erro`, nao como 404. Tratar so o status
    // deixaria passar um objeto vazio e o formulario apagaria o que a pessoa ja
    // tinha digitado.
    if (json.erro) return null;
    if (!json.localidade || !json.uf) return null;

    return {
      logradouro: json.logradouro ?? "",
      bairro: json.bairro ?? "",
      cidade: json.localidade,
      uf: json.uf.toUpperCase(),
      codigoMunicipio: onlyDigits(json.ibge),
    };
  } catch {
    // Timeout, rede, CSP, JSON invalido: todos degradam para digitacao manual.
    return null;
  }
}
