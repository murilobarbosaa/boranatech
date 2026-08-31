// Constantes de UF usadas por filtros de eventos e de comunidades. O array de
// eventos que morava aqui foi para o banco (ver nota no fim do arquivo).

/** Todos os estados + DF (sigla IBGE), para filtros e cadastro de eventos */
export const estadosBrasil: { sigla: string; nome: string }[] = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

/** Eventos online nacionais, itinerantes ou globais voltados ao público BR, use no campo `estado` */
export const EVENTO_UF_NACIONAL = "NA" as const;

// O array `eventos` foi removido em 2026-08-24: a pagina /eventos e as secoes
// da home passaram a ler de public.external_events pela rota
// /api/content/eventos. Este arquivo continua existindo porque `estadosBrasil` e
// `EVENTO_UF_NACIONAL` sao consumidos por eventFilters e, atraves dele, pela
// pagina de Comunidades, que nao tem nada a ver com eventos.
