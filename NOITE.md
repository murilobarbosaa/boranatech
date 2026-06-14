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

### 2. AREAS DA TI: texto mais rapido + selos de Embaixadora - CONCLUIDO
- Texto que passa: CurvedLoop speed 0.5 -> 0.8 (um pouco mais rapido). curveAmount segue 0 (reto).
- `EmbaixadoraBadge` generalizado: props `program` (default "IBM Z Xplore") e `href` opcional
  (slot de link). Sem href -> <span> (sem link). Com href -> <a target=_blank rel=noopener> com
  icone de link externo, foco visivel. Texto agora "Ana e Embaixadora {program}" (mostra que e a
  Ana pelo nome). Backward compatible: AreaDetalhe e Plataformas usam o default (IBM).
- Selos na pagina Areas: nova faixa "Programas que a Ana representa" logo apos o loop, com dois
  selos: IBM Z Xplore (por nome, SEM link, regra 5) e Claude (com slot de link PRONTO). O card de
  area Mainframe mantem seu selo IBM contextual.
- Decisao: nao existe "area de TI" chamada Claude e inventar uma viola a regra 1. Entao o "card
  Claude com selo" foi realizado como selo de Embaixadora na faixa (honesto, sem inventar area).
- Teste: pnpm check EXIT 0. Preview /areas: faixa presente, dois selos com texto correto, Claude
  como slot pronto (vira <a> assim que a URL for setada), sem scroll horizontal.
- Itens reais: n/a (estrutura/selos).
- Commit: (abaixo)

## Pendencias que precisam da Ana (links)
- LINK Claude Embaixadora: `CLAUDE_EMBAIXADORA_URL` em `client/src/pages/Areas.tsx` esta `undefined`.
  Assim que a Ana der o link publico do programa Claude, basta preencher essa const e o selo vira
  link automaticamente. (regra 5: sem link, fica TODO)
- LINK Alura Embaixadora e AWS SkillBuilder: slots a preparar nas subtarefas 9 (Plataformas).

## Lista de commits
- 86c30fa fix(favorites): share favorites via provider with sync cache hydration for instant liked state
