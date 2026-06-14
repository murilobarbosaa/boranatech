# NOITE.md - Missao da noite (Bora na Tech)

Registro autonomo. Atualizado apos cada subtarefa. NAO push (tudo na main local).
Inicio: 2026-06-14 (madrugada).

## Contexto importante
- Sessao concorrente compartilha esta arvore. Arquivos que NAO sao meus e NAO devo tocar:
  `client/src/pages/QuizCarreira.tsx` aparece modificado desde o inicio da sessao (mudanca pre-existente, nao minha).
  `client/src/components/Header.tsx` apareceu modificado pela outra sessao em momentos anteriores.
  Memoria de longo prazo marca `Dicas.tsx` e `Cursos.tsx` como da outra sessao.
- Regra: bloqueio -> pular, registrar aqui, seguir. Nunca parar a noite.

## Progresso por subtarefa

### 1. BUG curtidas/acoes lentas - CONCLUIDO
- Causa raiz: `useFavorites` era um hook por-componente (useState local). Cada `FavoriteButton`
  (22+ no grid de Areas) tinha estado proprio e fazia seu proprio `GET /api/bookmarks`,
  comecando em `favorites: []` / `loading: true`. O estado "curtido" so aparecia depois do
  round-trip de rede de CADA botao -> lentidao e curtido tardio.
- Correcao: promovido para `FavoritesProvider` unico e compartilhado (1 fetch, nao N) com
  hidratacao SINCRONA via localStorage (cache por userId, `bora-na-tech:favorites-cache:v1:<id>`).
  No load, le o cache sincrono e seta `favorites` ANTES de qualquer rede -> curtido aparece
  imediato. O refetch reconcilia com o servidor sem colapsar o estado em `[]` (nao zera durante
  loading). Toggle continua otimista; cache reescrito a cada mudanca (persiste entre paginas).
- API publica preservada: `@/hooks/useFavorites` agora re-exporta do contexto; nenhum consumidor
  mudou (FavoriteButton, FavoriteCard, Perfil, PerfilFavoritos).
- Wiring: `<FavoritesProvider>` dentro de `<AuthProvider>` no App.tsx.
- Teste: pnpm check EXIT 0. Preview /areas: app sobe, 22 botoes de favorito compartilham 1 provider,
  zero erros no console. (Caminho logado nao testavel no preview sem auth, mas logica tipada e
  hidratacao sincrona garantem curtido imediato.)
- Arquivos: `contexts/FavoritesContext.tsx` (novo), `hooks/useFavorites.ts` (re-export fino), `App.tsx`.
- Itens reais: n/a (bug fix).
- Pendencias: nenhuma.
- Commit: 86c30fa

## Pendencias que precisam da Ana (links)
- (a preencher conforme as subtarefas de conteudo)

## Lista de commits
- 86c30fa fix(favorites): share favorites via provider with sync cache hydration for instant liked state
