# Censo da Educação Superior 2024 (INEP/MEC) - recorte de tecnologia

Fonte: INEP/MEC, Microdados do Censo da Educação Superior 2024 (dados abertos
públicos, LAI 12.527/2011). Pacote original:
`https://download.inep.gov.br/microdados/microdados_censo_da_educacao_superior_2024.zip`
(~436 MB, fora do repo).

Estes dois CSVs são o recorte já filtrado para **tecnologia** usado pela
ingestão (`scripts/ingestFaculdadesCenso.mts`). Ficam versionados para que a
ingestão seja reproduzível e auditável sem acesso ao pacote de 436 MB.

Filtro aplicado sobre o cadastro de cursos:
`CO_CINE_AREA_GERAL = '06'` (Computação e Tecnologias da Informação e
Comunicação) `AND TP_DIMENSAO IN ('1','3')` (curso presencial + sede de EAD,
uma linha por curso; sem a explosão de polos de `TP_DIMENSAO='2'`).

| Arquivo | Linhas (sem header) | Conteúdo |
| --- | --- | --- |
| `tech_cursos.csv` | 3.540 | cadastro de cursos de tech (223 colunas originais) |
| `tech_ies.csv` | 943 | cadastro das IES que ofertam esses cursos (84 colunas) |

Encoding: ISO-8859-1 (Latin-1), delimitador `;`. Atribuição obrigatória na UI:
"Fonte: INEP/MEC - Censo da Educação Superior 2024".
