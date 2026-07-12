Voce esta trabalhando nas trilhas v2 no padrao editorial calibrado nas fases 3b (frontend) e 4 (prova de trilha). shared/roadmapV2/content/frontend.ts e a referencia de qualidade; este guia vale tanto pra construir trilha nova quanto pra upgrade de trilha existente. Nada vai pra producao sem revisao; NUNCA rode git push.

## 1. Estrutura: o curriculo real decide

- O curriculo REAL da area decide o numero de secoes: de 5 a 12. O template fixo de 6 a 8 secoes esta REVOGADO. Secao existe porque o assunto existe na profissao, nunca pra preencher molde; secao de uma folha so e sinal de divisao artificial (funda ou expanda).
- Cada secao tem `level` (iniciante, intermediario, avancado) e os levels progridem ao longo da trilha.
- Grupos intermediarios (nos com children dentro da secao) tem NO MAXIMO um nivel de profundidade e so existem onde ajudam a leitura (ex: "Git e GitHub" agrupando 3 passos). Nunca grupo dentro de grupo.
- Seletor de linguagem (`languages` + folhas `byLanguage`): apenas quando a area se divide por stack de verdade (mobile, cloud, gamedev, backend). Na duvida, sem seletor. Variante byLanguage tem o mesmo padrao de qualidade do tronco comum, nao e resumo.

## 2. Anatomia da folha

Todo `content` segue esta intencao, nesta ordem (como guia de escrita, nao formulario rigido):

1. O que E, em UMA frase concreta, sem rodeio.
2. Por que existe: o problema que resolve.
3. Modelo mental: a imagem que faz o conceito assentar.
4. Habito pratico ou exemplo real de uso.
5. Fecho conectando ao proximo passo ou a um passo adiante da trilha.

- Faixa de 120 a 250 palavras, com a densidade nascendo do conceito. NAO inflar folha magra pra bater faixa; conceito pequeno merece texto pequeno.
- Criterio de dominio: onde houver habilidade verificavel, fechar com a ideia "Voce domina este passo quando..." em formulacao VARIADA, nunca formula repetida. Exercicio proposto ou mapa mental sao fechos igualmente validos; escolha o que serve ao conceito.

## 3. Disciplina de blocos de codigo

O renderer estiliza: paragrafo, negrito, `codigo inline`, listas com hifen (ul), links e bloco cercado (pre). NAO estiliza headings, listas numeradas (ol) nem blockquote; nao use o que o renderer nao estiliza.

- Bloco cercado APENAS quando a forma do codigo e a licao (quando VER a sintaxe ensina mais que le-la descrita).
- Ate 8 linhas de ~45 caracteres cada; maximo 1 bloco por folha, salvo justificativa explicita no relatorio.
- A MAIORIA das folhas nao tem bloco nenhum.

## 4. Voz e conexoes

- PT-BR direto, registro do backend.ts: proximo, concreto, sem infantilizar.
- Conexoes NOMINAIS entre secoes: promessas feitas cedo e fechadas adiante (no frontend, primeirosite.publicar promete o que ferramentas.git.basico cumpre). Toda trilha deve ter algumas, com nome de passo real.
- Jargao interno PROIBIDO em qualquer string visivel: "folha" e "no" viram "passo"; "trilha" e o termo do produto.
- ZERO travessao e ZERO en-dash em qualquer texto, codigo ou copy. Hifen comum so em palavra composta legitima.

## 5. resources

- De 0 a 3 por folha, APENAS canonicos: MDN em pt-BR, web.dev, documentacao oficial da ferramenta ou orgao (ex: postgresql.org, kubernetes.io, scrumguides.org).
- NUNCA inventar URL; na duvida, omitir o resource. Regra irma: NUNCA inventar dado (estatistica, preco, nome, data); inverificavel vira linguagem qualitativa ou sai.

## 6. Projeto da trilha

- Toda trilha tem UM no de projeto, resolvendo num id REAL de shared/projects/catalog.ts.
- Projeto de trilha e sempre gratuito: NUNCA aponte pra projeto com `pro: true`.

## 7. Registro triplo de trilha nova

1. shared/roadmapV2/content/index.ts: adicionar ao agregado roadmapsV2.
2. client/src/lib/roadmapV2/loaders.ts: adicionar o import lazy do slug.
3. pnpm gen:roadmap-meta: regenerar meta.generated.ts e projectLinks.generated.ts.

O --check do pnpm check acusa qualquer omissao dos tres; rode pnpm check antes de considerar pronto.

## 8. Pool de quiz (prova da trilha)

- Com o conteudo pronto e revisado, gerar o pool: pnpm gen:quiz-pool <slug>.
- Registrar o pool novo em server/data/roadmapQuizzes/index.ts (o pnpm check acusa a omissao).
- O pool contem o GABARITO e e server-only: NUNCA pode ser importado de client/src, direto ou indireto. Qualquer vazamento e bug critico.
- Ids de pergunta sao ESTAVEIS depois de gerados: tentativas de usuarios os referenciam; regenerar com --force troca ids e invalida tentativas ativas.

## 9. Ids estaveis

- Ids de no em dot-path (secao.grupo.folha), estaveis. O progresso do usuario e chaveado por slug:nodeId: renomear id apaga progresso na pratica e e decisao consciente, sinalizada no relatorio, nunca efeito colateral.

## 10. Revisao editorial

- Todo arquivo de conteudo novo ou reescrito abre com cabecalho TODO(Ana) pedindo revisao editorial completa.

## Fechamento de qualquer lote

- pnpm check com exit 0.
- Grep de travessao e en-dash vazio em todos os arquivos tocados.
- Staging explicito por arquivo (NUNCA git add . nem -A); git diff --cached conferido limpo imediatamente antes do commit.
- Commit de uma linha, em ingles, no formato tipo(escopo): descricao. Sem push.
- Relatorio: o que mudou por trilha, conexoes nominais criadas, blocos de codigo justificados, URLs adicionadas e decisoes fora do padrao.
