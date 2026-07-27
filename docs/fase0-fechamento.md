# Fase 0 do Avaliador de LinkedIn: fechamento

Encerrada em 2026-07-26. Origem: `docs/auditoria-avaliador-linkedin.md` (rodada 1) e
`docs/auditoria-avaliador-linkedin-rodada2.md` (causa raiz).

Objetivo declarado da fase: **parar o sangramento**, sem tocar em nota, peso, limiar ou parser. Tudo isso ficou
para a Fase 1.

---

## O que mudou

**Os dois bugs de produção morreram.** O checklist de melhorias devolvia 500 no meio de um resultado que tinha
dado certo, porque a tabela `linkedin_improvement_progress` estava declarada no repositório e nunca havia sido
aplicada no banco. A migration foi aplicada manualmente no SQL Editor e a validação ponta a ponta passou nos 8
passos: marcar, recarregar, desmarcar, recarregar, remarcar três vezes sem violar a constraint, chip "N de M",
celebração, e análise antiga com checklist independente.

**Um resultado pago não vira mais tela de erro.** O refresh de histórico rodava dentro do `try` da análise: se
ele falhasse, o `catch` ligava o estado de erro e o resultado recém-gerado sumia da tela. Reproduzido sabotando
o `GET` e corrigido.

**A causa de erro parou de ser engolida.** Quatro rotas descartavam o `error.message` do Supabase. Era por isso
que o bug original era invisível: a string `Could not find the table` existia e ninguém a via.

**O custo saiu da ficção.** A régua era um par único de constantes que inflava 5,4x a 5,7x; sete ferramentas
registravam zero. Agora é preço por modelo, tokens exatos de `usage` quando disponíveis, modelos não-texto
excluídos explicitamente, e uma query fixa (`pnpm report:ai-usage`) para a medição ser comparável mês a mês.

**A leitura do que está persistido passou a ser versionada.** `readQualitative` e `readDeterministic` leem o
`jsonb` com `safeParse`, nunca lançam e degradam para render parcial. As 107 análises antigas continuam
abrindo, provado por teste com uma linha real anonimizada.

**Nasceu rede de segurança onde não havia nenhuma.** Golden files travando parse, 27 checks, score e faixa;
guard de migrations com asserção de contagem e de cobertura do parser; CI rodando os dois (o repositório não
tinha CI).

---

## Commits, em ordem

| # | Commit | O quê |
|---|---|---|
| 1 | `88071f8` | loga a causa do erro do Supabase nas rotas de progresso e de análises |
| 2 | `bd50977` | degradação elegante quando a tabela de progresso não existe |
| 3 | `1eb26da` | `pnpm check:migrations`, guard de migration não aplicada |
| 4 | `67e1388` | resultado permanece na tela quando o refresh de histórico falha |
| 5 | `7ebb1a2` | `costEstimate` passa a ser registrado |
| 6 | `9bc67a5` | `faixaUiOf`/`faixaWashOf` com fallback neutro |
| 7 | `d11cd4f` | resposta truncada vira erro próprio, sem gastar retry |
| 8 | `7c33532` | golden files do determinístico |
| 9 | `fdc877f` | prompt: lastro por experiência, métrica não muda de dono, válvula da regra dos fatos |
| 10 | `10d475f` | migration idempotente (`drop policy if exists`) |
| 11 | `4a3330a` | guard afirma contagem de tabelas e cobertura do parser |
| 12 | `60ab82c` | rubrica de fidelidade congelada |
| 13 | `598a7c0` | preço por modelo; `outputChars` do LinkedIn mede a saída do modelo |
| 14 | `89c7e87` | CI: qualidade e guard de migrations em push e PR |
| 15 | `f70f1b3` | `skillsSugeridas` separado em "adicionar agora" e "estudar" |
| 16 | `09c924d` | tokens exatos de `usage`; modelos não-texto fora da tabela de token |
| 17 | `d45b59a` | "adicionar agora" calculado em código e removido do modelo |
| 18 | `8ef2229` | query de uso e custo fixada em script |
| 19 | `4416948` | levantamentos: dívida de leitura, ensaio de restauração, custo do TTS |
| 20 | `0bfd075` | `readDeterministic` versionado no conjunto mínimo |
| 21 | `8eff8fd` | janela obrigatória para migration destrutiva |
| 22 | `a995b46` | corrige o comando de checagem de backup |

---

## Gate de fidelidade: 58 → 22 → 3 → 0

Rubrica congelada em `docs/rubrica-fidelidade.md`. Medição sempre igual: 10 execuções sobre 3 perfis
(4 real, 3 raso, 3 em transição), fixtures de `server/lib/__fixtures__/linkedin/`.

| Etapa | Inventadas | Distorcidas |
|---|---|---|
| Antes da Fase 0 | 58 | 3 |
| Lastro por experiência no prompt | 22 | 0 |
| Campo separado em "adicionar agora" e "estudar" | 3 | 0 |
| "Adicionar agora" calculado em código | **0** | **0** |

**A leitura que importa: as três reduções vieram de tirar trabalho do modelo, não de pedir melhor.** Nenhuma
exigiu trocar de modelo, e a autorização de troca (dada de antemão na última rodada) não precisou ser usada.

1. **58 → 22**: instruções de lastro. Eliminou 100% da invenção de stack em bullets e 100% das métricas
   reatribuídas. O que restou não era o modelo desobedecendo, era o dado de entrada empurrando para o erro.
2. **22 → 3**: um campo carregava dois significados incompatíveis ("adicione hoje" e "estude"). Separar
   resolveu quase tudo; o resíduo ficou só onde a lista legítima era vazia e o modelo preenchia para não deixar
   vazio.
3. **3 → 0**: o campo era subtração de conjuntos. Aritmética virou código; o modelo ficou com a curadoria
   (`skillsParaEstudar`, escolhida de uma lista de origem fechada) e com a prosa.

Corolário para as outras ferramentas de IA da plataforma: antes de trocar de modelo ou reescrever prompt,
verifique se o que você está pedindo é **cálculo** disfarçado de julgamento. Se for, tire do modelo.

---

## Dívida documentada e ainda aberta

| Item | Onde | Estado |
|---|---|---|
| 17 acessos diretos a `result.deterministic.*` no LinkedIn | `docs/divida-leitura-persistida.md` | aberto, baixo risco (degradam, não lançam) |
| 13 acessos em `PortfolioAnalisar.tsx` e 4 em `CurriculoAnalisar.tsx` | idem | aberto, fora do escopo da Fase 1 |
| 5 rotas ainda estimam custo por caractere | `resumeAnalysis`, `careerPlan`, `aiRoadmap`, `github`, `interview` | aberto; total de 30 dias ainda é piso, não valor |
| `CHARS_PER_TOKEN = 4` subestima entrada (~1,9 chars/token medido) | `server/lib/aiTools.ts` | mitigado onde há `usage`; aberto nas 5 rotas acima |
| TTS ElevenLabs fora do painel | `docs/custo-tts-elevenlabs.md` | consciente; gatilho é o fim da parceria |
| PITR desabilitado, RPO de 24h | `docs/ambiente-backup-restauracao.md` | consciente; gatilho é a primeira dezena de assinantes |
| Ensaio de restauração nunca executado | idem | procedimento escrito, execução pendente |
| ~30 marcadores `TODO(Ana)` de copy | feature inteira | aberto |

---

## O que a Fase 1 pode assumir como verdade

1. **A tabela de progresso existe e a feature funciona.** Marcar, desmarcar e remarcar estão validados contra o
   banco real, incluindo a constraint única.
2. **Mudar o formato de `deterministic` ou de `qualitative` não derruba o histórico.** As três leituras que
   lançavam passam por `readDeterministic`; o `qualitative` inteiro passa por `readQualitative`. Ambos são
   versionados e estampados na escrita (`deterministicVersion`, `qualitativeVersion`).
3. **Mexer no parser tem rede.** Os golden files travam parse de headline, competências, experiências, os 27
   checks, o score e a faixa, sobre 6 fixtures, incluindo o PDF real anonimizado. Cada valor errado está
   marcado com `BUG CONHECIDO` e a referência ao relatório: quando a Fase 1 corrigir, o teste quebra de
   propósito e atualizar o esperado é a documentação da correção.
4. **Migration não aplicada é detectada** por `pnpm check:migrations`, local e no CI, com asserção de contagem
   e de cobertura do parser de `create table`.
5. **A medição de fidelidade é reproduzível e comparável**, com rubrica congelada e unidade de contagem fixa.
   Qualquer mudança de prompt na Fase 1 pode ser medida contra a linha de base zero.
6. **O custo por análise é conhecido**: cerca de US$ 0,0013 com tokens exatos. O total da plataforma em 30 dias
   é US$ 0,71. Custo não é argumento contra trocar de modelo.
7. **Migration aditiva pode rodar a qualquer hora; migration destrutiva tem janela obrigatória** entre 05h e
   09h de Brasília, com verificação de backup antes.

### O que a Fase 1 NÃO pode assumir

- Que o parser está certo. Ele não está: nove bugs conhecidos estão travados nos golden files, incluindo
  headline truncada por line-wrap, empresa colada no cargo, formato agrupado não suportado e rodapé de
  paginação virando métrica.
- Que a nota mede o que promete. Os checks de cobertura continuam inatingíveis e o teto real é 85 a 87.
- Que `level` influencia alguma coisa. Não influencia nenhum check.
