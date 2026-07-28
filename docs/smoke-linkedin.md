# Smoke test do Analisador de LinkedIn

**Por que este arquivo existe.** A primeira versão desta lista morava só na conversa e foi perdida numa
compactação de contexto, no meio do deploy que ela existia para validar. Reconstruí-la de memória perdeu três
passos, e os três eram justamente os bugs que motivaram a Fase 1. Checklist de release é artefato crítico:
mora no repositório, versionado, ou não existe.

**Quando rodar.** Depois de todo deploy que toque `server/lib/linkedinAnalyze.ts`, `shared/linkedin/*`, ou
qualquer coisa em `client/src/pages/LinkedinAnalisar.tsx` e `client/src/components/linkedin/`.

**Pré-requisitos.** Conta Pro (ou admin, que enxerga como Pro), o PDF real de export do LinkedIn em mãos, e o
frontend confirmado servindo o build novo. Para conferir o build, uma requisição só:

```bash
curl -s https://boranatech.com.br/ | grep -oE 'index-[A-Za-z0-9_-]+\.js'
```

**ORDEM OBRIGATÓRIA, se a telemetria do browser ainda não estiver no ar.** `VITE_SENTRY_DSN` é lida em
build time pelo Vite (substituição textual no bundle), não em runtime. Cadastrar na Vercel **não** afeta o
bundle que já está publicado:

1. criar o projeto de browser no Sentry e pegar o DSN;
2. cadastrar `VITE_SENTRY_DSN` no escopo **Production** da Vercel;
3. **redeploy** (sem isto o passo 2 não tem efeito nenhum);
4. conferir que o hash do bundle mudou, com uma requisição;
5. só então rodar o smoke.

Rodar o smoke antes disso não é errado, mas o que ele não pegar **não fica registrado**, que é justamente a
diferença entre validação e amostra.

**NÃO rodar em preview da Vercel.** As env vars de Preview apontam para o Railway e o Supabase de produção:
uma análise rodada em preview grava linha real e consome cota de IA de verdade. Ver `CLAUDE.md`, seção
Política de Branch e Deploy.

**Nunca por polling.** Medir estado de produção com loop de requisições dispara a mitigação da Vercel
(`x-vercel-mitigated: challenge`) e cega a medição. Amostra única, sempre.

## Severidade

| Nível | Significa |
|---|---|
| **REVERSÃO** | Reverter o deploy. **Antes de reverter, ler a seção "Efeito colateral do rollback" no fim.** |
| **degradação** | Não reverte. Abrir issue e consertar no próximo deploy. |
| **cosmético** | Anotar e seguir. |

## Os passos

Os 11 primeiros são de navegador. O 12 provoca um erro de propósito, e o 13 e o 14 conferem a telemetria depois deles. Ordem de prioridade quando o tempo é curto: **1 e 2 primeiro** (atingem as 107 análises já gravadas,
imediatamente), depois **3 a 6** (a régua nova e os bugs da Fase 1), depois o resto.

### 1. Histórico logado, abrir uma análise v1 (REVERSÃO)

**Clicar:** entrar em `/linkedin/analisar` logado. Sem rodar análise nova, abrir o histórico e clicar em uma
análise antiga (qualquer uma anterior a 2026-07-26, que são as v1).

**Observar:**
- as 107 análises aparecem na lista, com nota, faixa e data;
- a análise antiga abre e renderiza inteira, sem tela branca;
- a decomposição da nota bate com a nota exibida no topo (somar as parcelas por categoria).

**Por que é reversão:** atinge todo mundo que já usou a ferramenta, sem precisar fazer nada. É o maior raio
de alcance da lista. As v1 não têm `deterministicVersion`, `checks`, `keywordsCampos` nem
`skillsParaEstudar`, então este passo é o teste real de `readDeterministic` e `readQualitative`.

### 2. Checklist de melhorias numa análise antiga (REVERSÃO)

**Clicar:** dentro da análise do passo 1, achar o checklist de melhorias aplicadas. Marcar um item,
desmarcar, e **marcar de novo** (as três operações, nessa ordem).

**Observar:**
- o estado persiste entre os cliques;
- recarregar a página mantém o que foi marcado;
- **nenhum banner vermelho** de erro em nenhum momento.

**Por que é reversão:** foi exatamente aqui que a `20260710120000_create_linkedin_improvement_progress.sql`
nasceu morta, com 500 em produção porque a migration ficou só no repositório. Remarcar depois de desmarcar é
de propósito: o caminho de UPDATE é diferente do de INSERT.

### 3. Análise nova ponta a ponta com o PDF real (REVERSÃO)

**Clicar:** colar o texto do PDF real de export, preencher área, nível, mercado e os campos autodeclarados
(foto, banner, Open to Work, conexões, atividade), e rodar.

**Observar:**
- a análise completa sem erro e sem timeout;
- o resultado renderiza **inteiro**, do topo até o modelo de mensagem para recrutador, sem tela branca;
- a página não fica presa em estado de carregando.

**Por que é reversão:** é o caminho que o usuário aciona. Tela branca aqui significa que ele pagou a cota e
não recebeu nada. Foi o modo de falha da renomeação `skillsSugeridas` para `skillsParaEstudar`.

### 4. A headline extraída (REVERSÃO)

**Clicar:** no resultado do passo 3, ir até o bloco Headline.

**Observar (os quatro, todos):**
- a headline detectada termina em `| Node`, **completa**, não cortada no meio;
- **sem barra órfã**: nada de `React |` ou `| ` sobrando no fim;
- **não** aparece a crítica "não menciona tecnologias" para uma headline que menciona tecnologias;
- **não** aparecem Next.js nem Tailwind entre as sugestões, se eles não estiverem no perfil.

**Por que é reversão:** é o bug que abriu a Fase 1. O parser cortava a headline, o check `headline-stack`
reprovava por causa do próprio corte, e a IA então "sugeria" tecnologias que a pessoa já tinha. Um erro de
extração virando três sintomas visíveis, com conselho errado no fim.

### 5. "Seu atual" (degradação)

**Clicar:** nas seções do prontuário, a camada "seu atual" (`SectionReport.tsx:209`), especialmente em
Experiências.

**Observar (os quatro, todos):**
- cada experiência aparece como **cargo em empresa**, não como texto solto;
- **nenhuma descrição começa com o nome de uma cidade** (o `"Campinas, São Paulo, Brazil"` vazando para
  dentro da descrição);
- **nenhum rodapé de página do PDF** aparece como conteúdo;
- **nenhum bullet vazou** de uma experiência para a seguinte.

**Por que importa:** "seu atual" promete mostrar só o que foi detectado de fato. Lixo de parser aqui é a
ferramenta afirmando que leu uma coisa que não está no perfil, e a pessoa não tem como saber que é engano.

### 6. `exp-descricoes` (degradação)

**Clicar:** na seção Experiências, achar o check "Experiências com descrição".

**Observar:**
- se alguma experiência do perfil está sem descrição própria, o check **reprova**;
- e o detalhe **nomeia qual** experiência está sem descrição, não diz só "alguma".

**Por que importa:** o agregado antigo olhava a concatenação de todas as descrições, então uma experiência
vazia entre quatro cheias passava despercebida. Nomear é a diferença entre um veredito acionável e um número.

### 7. Bloco Competências (degradação)

**Clicar:** a seção Competências do resultado.

**Observar:**
- "adicionar agora" e "estudar" são **duas listas separadas**, com títulos distintos;
- a lista de **estudar não tem botão de colar** em competências;
- o que está em "adicionar agora" tem evidência no perfil.

**Por que importa:** um campo só carregava dois significados incompatíveis, e o resultado era a ferramenta
mandando um dev JavaScript anunciar Ruby e Elixir nas competências.

### 8. Hero da nota (degradação)

**Clicar:** o topo do resultado.

**Observar:**
- a decomposição por categoria aparece;
- **Sinais do perfil vem em âmbar**, visualmente separado das outras categorias;
- a soma das parcelas bate com a nota exibida.

**Por que importa:** os sinais autodeclarados não têm teto, de propósito. O que impede inflação é ficarem
**visíveis** como bloco separado. Se o âmbar sumir, o mecanismo de contenção sumiu junto.

### 9. Segunda análise do mesmo perfil (degradação)

**Clicar:** rodar de novo o mesmo perfil, sem mudar nada de substancial. Depois, rodar uma vez mudando **só**
um campo autodeclarado (marcar Open to Work, por exemplo).

**Observar:**
- na comparação entre duas análises da **mesma** régua, o delta aparece;
- comparando uma **v1 com uma v4**, aparece o aviso de que não são comparáveis, e **não** há confete;
- quando a única mudança foi autodeclaração, **não** aparece delta nem celebração.

**Por que importa:** celebrar melhoria que não houve treina a pessoa a marcar caixinha em vez de melhorar o
perfil. Todas as supressões moram em `decidirDelta` (`shared/linkedin/deltaFunil.ts`), com o motivo nomeado
(`regua-mudou`, `so-autodeclaracao`, `nota-igual`).

### 10. `ai_usage_logs` e Sentry (degradação)

**Não precisa de navegador.** Rodar:

```bash
set -a && . ./.env && set +a
curl -s -I "$VITE_SUPABASE_URL/rest/v1/ai_usage_logs?select=id&status=eq.reserved" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Range: 0-0" -H "Prefer: count=exact" | grep -i content-range
```

**Observar:**
- a linha `reserved` da análise do passo 3 virou `success`;
- **nenhuma linha `reserved` com mais de 10 minutos** (órfã de reserva que nunca fechou);
- **zero eventos `ai-quota-degraded`** no Sentry.

**Por que importa:** `reserve_ai_usage_slot` conta e insere na mesma seção crítica. Órfã significa que a cota
foi debitada de alguém que não recebeu resultado.

### 11. Headline e bullets gerados (cosmético)

**Clicar:** os textos sugeridos pela IA no resultado.

**Observar:**
- nenhuma tecnologia que não esteja em `keywordsEncontradas` (ou seja, sem lastro no perfil);
- nenhum numeral inventado ("reduzi em 97%") que não apareça no texto daquela experiência.

**Por que é só cosmético:** a camada de lastro (`shared/linkedin/lastro.ts`) já saneia antes de responder e
reporta `ai_lastro_violado` no Sentry. Este passo confere se a camada agiu, não se o dado saiu errado para o
usuário. Um evento `ai_lastro_violado` no Sentry é a camada **funcionando**, não falhando.

### 12. Erro de render provocado, ponta a ponta (REVERSÃO se o fallback não aparecer)

Este é o único passo que exercita a telemetria em vez de confiar nela. Provoca o erro de propósito.

**Clicar:** com o resultado de uma análise na tela, abrir o console do navegador e quebrar o render à força.
O jeito mais direto sem tocar em código é remover do DOM um nó que o React ainda vai atualizar:

```js
document.querySelector('.area-rise')?.remove()
```

Se isso não derrubar, sirva de alternativa recarregar com a rede em modo offline no meio do carregamento de
um chunk, que produz o mesmo caminho (`lazyWithRetry` esgota a retentativa e propaga para o boundary).

**Observar, em três lugares:**

1. **Na tela:** aparece "Não foi possível montar este resultado", em português, com os botões "Recarregar a
   página" e "Fazer nova análise". **Nenhum stack trace visível.** O código curto de 8 caracteres aparece.
   O resto da página (cabeçalho, rodapé) continua de pé, porque o boundary é estreito.
2. **No Sentry, projeto `boranatech-front`:** o evento chega com tag `origem: error-boundary` e
   `escopo: linkedin-resultado`, e o `event_id` começa com os 8 caracteres que a tela mostrou. **O stack é
   legível**, com nome de arquivo e linha do fonte, não `index-B_vsFLFC.js:1:48213`. Stack ilegível aqui
   significa que o source map não subiu, e é o único jeito de descobrir isso.
3. **Nos breadcrumbs desse evento:** nenhum breadcrumb de `console`, e nenhuma URL com query string. **O
   texto do perfil não pode aparecer em lugar nenhum do evento.**

**Por que é reversão:** se o fallback não aparecer, ou aparecer com stack, o usuário está vendo o que aquela
pessoa das 23:35 viu.

### 13. O mesmo evento no painel de admin (degradação)

**Clicar:** abrir `Bugs & Erros` no admin.

**Observar:**
- o evento do passo 12 aparece na lista, com `shortId` prefixado por `BORANATECH-FRONT-`;
- e os erros de servidor continuam aparecendo, com prefixo `NODE-EXPRESS-`.

**Por que existe:** o painel consultava **um** projeto por slug fixo. Com o projeto de browser criado, ele
passaria a mostrar metade dos erros sem dar erro e sem avisar. Agora consulta a organização inteira
(`project=-1`), então este passo confirma que os dois projetos chegam juntos. **Ver só um dos prefixos é
falha**, mesmo que a lista pareça cheia.

### 14. Projeto de browser no Sentry, depois de tudo (degradação)

**Não precisa de navegador.** Depois de terminar os 11 passos, abrir o projeto de browser no Sentry e olhar
os eventos da janela em que você rodou o smoke.

**Observar:**
- **nenhum evento com `origem: error-boundary` ALÉM do que você provocou no passo 12**;
- se houver algum, a tag `escopo` diz onde: `linkedin-resultado` é o boundary estreito do resultado, `app` é
  o boundary de fora, e `app` significa que algo escapou de todos os boundaries de domínio.

**Por que este passo existe, e por que a ausência é o resultado esperado:** os 11 passos anteriores são olho
humano em navegador, que é amostra, não prova. Este passo é o único que responde "o que eu NÃO vi?". Um
boundary que disparou sem você perceber (porque o fallback é discreto, ou porque você olhou para outra parte
da tela) só aparece aqui.

**Atenção à leitura:** ausência de evento só vale se a telemetria estiver de fato no ar. Se `VITE_SENTRY_DSN`
não estava cadastrada, ou se o bundle publicado é anterior ao cadastro, zero eventos é o comportamento de um
instrumento desligado, não a prova de que nada quebrou. Confira o hash do bundle antes de concluir qualquer
coisa deste passo. É a mesma armadilha do `env -i`: instrumento que não estava medindo devolve silêncio, e
silêncio parece sucesso.

## Efeito colateral do rollback

**Ler antes de reverter, sempre.**

Análise v4 já gravada **convive** com v1 no banco. O código antigo não tem a supressão de delta por régua
diferente, então, depois de um rollback, ele compara uma nota v4 com uma nota v1 e **mostra delta falso**,
com celebração, para uma "melhoria" que é só a régua ter mudado.

Ou seja: reverter não devolve o estado anterior, cria um terceiro estado, pior que os dois. Por isso
`REVERSÃO` na tabela acima quer dizer "pare e decida com contexto", não "reverta automaticamente".
