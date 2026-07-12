# Pools de quiz das trilhas (server-only)

Cada arquivo `<slug>.ts` desta pasta e o pool de perguntas de quiz da trilha
v2 de mesmo slug, com `export default` de um `QuizPool`
(`shared/roadmapQuiz/types.ts`).

## Invariante de seguranca

**Estes arquivos contem o GABARITO (`correta` e `explicacao`). Nenhum codigo
de `client/src` pode importar esta pasta, direta ou indiretamente.** O client
so recebe perguntas no shape `PublicQuizQuestion` (sem gabarito) via API.
Qualquer import a partir do client e bug critico; o `pnpm check` falha se
encontrar referencia textual a `roadmapQuizzes` em `client/src`.

## Ids estaveis

Os ids das perguntas seguem `<slug>-<ini|int|av>-<NN>` e sao gerados pelo
script, nunca pela IA. Tentativas de quiz registradas referenciam esses ids:
**nao renomeie nem reordene ids manualmente**.

## Como gerar ou regenerar

```bash
pnpm gen:quiz-pool <slug>          # falha se o pool ja existe
pnpm gen:quiz-pool <slug> --force  # sobrescreve o pool existente
```

Regenerar com `--force` troca os ids e portanto **invalida tentativas ja
registradas** daquela trilha. Ajustes editoriais pontuais (texto de pergunta,
alternativa ou explicacao) podem ser feitos direto no arquivo, mantendo os
ids; o `pnpm check` revalida o pool.
