# O denominador do rate limit: como medir e como decidir o `FATOR_TETO_IP`

**Por que este arquivo existe.** `FATOR_TETO_IP = 6` (teto de `180 * 6 = 1080` req/min por IP autenticado)
foi calibrado **por raciocínio, não por dado**. E o instrumento que mediria a calibragem era cego pela
metade: o log de escopo só falava quando **estourava**, e o silêncio dele é indistinguível de "está folgado"
e de "nunca chegou perto". Não é instrumento que mente, é instrumento que só tem numerador.

A amostragem abaixo é o denominador.

---

## Ligar e desligar (sem deploy)

Variável de ambiente no Railway. Default **0 = desligada**.

```
RATE_LIMIT_SAMPLE_N=20
```

`0` ou ausente desliga. Valor inválido cai em 0 com warn no boot. Ligue, deixe **uma semana**, colha, desligue.

### O N recomendado: **20**

O que N significa: emite **uma linha a cada N requisições da mesma chave, dentro da mesma janela de 1 minuto**.
Não é 1 a cada N requisições do servidor; é uma escada por chave (20, 40, 60...). Consequências:

- **IP que faz menos de N req/min não aparece.** É de propósito: quem faz 5 req/min está a 200x do teto e não
  informa nada sobre a calibragem. O que interessa é a cauda.
- **O volume de log é limitado por construção**: um IP no teto (1080) emite no máximo `1080/20 = 54` linhas por
  minuto, e um IP que estoura para de emitir amostra (vira linha de 429).

Por que 20 e não 100: o volume atual do produto é baixo (para dimensionar, o histórico inteiro do analisador
de LinkedIn tem 157 análises e `ai_usage_logs` tem 1204 linhas). Com N alto, uma semana inteira produziria
poucas amostras e a distribuição não fecharia. **Em volume baixo você quer mais amostras, não menos.** N
existe para segurar o log **se o tráfego crescer**, e é por isso que ele é configurável: se o log ficar
barulhento, suba para 50 e recolha.

---

## As duas linhas

```
[ratelimit] amostra escopo=ip alvo=227a139b contagem=18 limite=18
[ratelimit] 429     escopo=ip alvo=227a139b contagem=19 limite=18
```

**O `alvo` na linha de 429 existe desde 2026-08-29.** Antes disso ela saía sem o campo, e este
documento mostrava um `alvo=…` que o código nunca emitiu. A consequência não era cosmética: a última
linha da tabela de decisão manda "investigar o `alvo`" no caso de abuso, e a ação prescrita não era
executável, porque o campo não existia justamente na linha em que ele importava. Se você estiver lendo
log anterior a essa data, a linha de 429 não terá `alvo` e a correlação com a amostra precisa ser feita
por `escopo` e horário.

| campo | o que é |
|---|---|
| `escopo` | `usuario` (cota individual, ou IP sem token) ou `ip` (teto do IP autenticado) |
| `alvo` | prefixo de sha256 da chave. **Agrupa sem carregar o IP nem o `sub` para o log** |
| `contagem` | requisições **já acumuladas na janela de 1 minuto** daquela chave |
| `limite` | o teto vigente para aquele escopo |

`alvo` é hash porque a pergunta é de agrupamento ("quantas req/min um mesmo IP faz"), não de identificação. O
log do Railway fica retido sem política nossa, e o mesmo argumento do `textoHash` vale aqui.

**Saída real**, recapturada em 2026-08-29 depois de o campo `alvo` entrar na linha de 429. Servidor
local com `RATE_LIMIT_MAX_REQUESTS=3` (portanto teto de IP `3 * 6 = 18`) e `RATE_LIMIT_SAMPLE_N=2`, 25
requisições disparadas numa única janela com um `sub` diferente cada, para o balde por usuário não
estourar antes do balde do IP:

```
[ratelimit] amostra escopo=ip alvo=227a139b contagem=14 limite=18
[ratelimit] amostra escopo=ip alvo=227a139b contagem=16 limite=18
[ratelimit] amostra escopo=ip alvo=227a139b contagem=18 limite=18
[ratelimit] 429 escopo=ip alvo=227a139b contagem=19 limite=18
[ratelimit] 429 escopo=ip alvo=227a139b contagem=20 limite=18
```

O `alvo` é o mesmo nas duas famílias de linha porque as duas passam pelo mesmo `alvoDoEscopo` em
`server/app.ts`, e é isso que permite ligar "este IP vinha em 18" a "este IP estourou". Antes eram duas
expressões separadas, e a de 429 simplesmente não existia.

Para o escopo `usuario` a captura da mesma sessão foi:

```
[ratelimit] amostra escopo=usuario alvo=e7a71f9f contagem=2 limite=3
[ratelimit] 429 escopo=usuario alvo=e7a71f9f contagem=4 limite=3
```

---

## Como transformar as linhas na distribuição

Baixe os logs do período (Railway → Deployments → Logs → Download, ou `railway logs`) para `ratelimit.log`.

**O número que interessa é o MÁXIMO de `contagem` por (`alvo`, minuto), não a soma.** A escada 20/40/60 são
amostras da MESMA janela: somar contaria a mesma requisição várias vezes. O pico da escada é o total daquela
janela.

```bash
# pico por alvo em cada janela, e depois a distribuicao dos picos
grep 'ratelimit] amostra escopo=ip' ratelimit.log \
  | sed -E 's/.*alvo=([0-9a-f]+) contagem=([0-9]+).*/\1 \2/' \
  | sort -k1,1 -k2,2nr \
  | awk '!seen[$1]++ {print $2}' \
  | sort -n \
  | awk '{a[NR]=$1} END {
      print "amostras:", NR;
      print "p50:", a[int(NR*0.50)];
      print "p90:", a[int(NR*0.90)];
      print "p99:", a[int(NR*0.99)];
      print "max:", a[NR];
    }'
```

> O `awk '!seen[$1]++'` guarda o maior valor por `alvo` porque a lista já vem ordenada por contagem
> decrescente. Para separar por minuto (e não por alvo no período inteiro), inclua o timestamp do log no
> `sed` e agrupe por `alvo+minuto`.

Contagem de estouros reais no mesmo período, para comparar:

```bash
grep -c 'ratelimit] 429 escopo=ip' ratelimit.log       # IP inteiro estourou
grep -c 'ratelimit] 429 escopo=usuario' ratelimit.log  # uma pessoa estourou a propria cota
```

---

## Réplicas, e quando o teto vira múltiplo

Isto muda a leitura de todos os números acima, então precisa vir antes do critério.

O backend roda com **2 réplicas** no Railway (registrado em 2026-08-29). Se a contagem fosse por
processo, cada réplica teria o próprio balde e o teto efetivo seria o dobro do configurado: 360 por
usuário e 2160 por IP, em vez de 180 e 1080. A conta de percentis continuaria certa e o veredito sairia
errado, porque o `limite` impresso na linha de log não seria o teto que a pessoa de fato encontra.

**Hoje a contagem é GLOBAL, e o teto efetivo é o configurado.** O caminho primário é `INCR` mais
`EXPIRE` num `multi` do Redis (`server/app.ts`, `redisRateLimitCount`), com a chave carregando o início
da janela no nome, o que é exatamente o que permite duas réplicas incrementarem o mesmo balde. A prova
de que o Redis está configurado em produção vem do próprio `/api/health`: ele usa a **mesma**
`cacheConnection` do limiter (`server/lib/redis.ts`) e distingue três estados, `ok` (respondeu PONG),
`degraded` (não respondeu) e `not_configured` (sem `REDIS_URL`). Medido em produção em 2026-08-29, o
campo veio `ok`, o que exclui o terceiro estado.

**Quando o múltiplo volta a valer:** se o Redis cair ou a `REDIS_URL` sumir, o limiter passa a contar
num `Map` do processo (fail-open deliberado, ver o comentário em `server/app.ts`), e aí o teto efetivo
passa a ser `teto configurado * número de réplicas`. Os dois casos avisam, e avisam diferente:

```
[ratelimit] Redis indisponível. Contagem local por instância (fail-open).
[ratelimit] REDIS_URL ausente em producao: a contagem e por processo, nao compartilhada. ...
```

A primeira é transição e volta a aparecer quando o Redis retorna. A segunda sai uma vez por processo e
também vai para o Sentry (`ratelimit_sem_redis`, fingerprint `ratelimit-sem-redis`), porque é defeito de
configuração permanente e log de Railway não é lido por ninguém. Até 2026-08-29 esse segundo caso era
**silencioso**: a guarda exigia uma conexão existente para avisar, então "esqueceram a variável" e "está
tudo bem" produziam o mesmo nada.

Se você for interpretar amostras colhidas durante um desses períodos, **divida o veredito pelo número de
réplicas antes de concluir qualquer coisa sobre o `FATOR_TETO_IP`**: o `limite` da linha é o configurado,
não o efetivo.

---

## O critério de decisão

Com `limite = 1080` e os percentis acima:

| leitura | veredito | ação |
|---|---|---|
| `p99` abaixo de ~300 e **zero** `429 escopo=ip` | **folgado** | não mexer. O fator não é o gargalo. |
| `p99` entre ~500 e 1080, poucos `429 escopo=ip` | **no ponto** | não mexer, manter a amostragem mais uma semana |
| `p99` colado em 1080 **ou** `429 escopo=ip` recorrente com `contagem` perto de 1081 | **apertado** | subir `FATOR_TETO_IP` para `ceil(p99 * 2 / RATE_LIMIT_MAX_REQUESTS)` |
| `429 escopo=ip` com `contagem` muito acima do limite (ex.: 9000) | **abuso, não NAT** | não subir o fator. Investigar o `alvo`. |

A última linha é a que impede a leitura ingênua: **estouro alto não é sinal de teto apertado, é sinal de
ataque.** Foi para distinguir esses dois casos que a `contagem` entrou na linha de 429, e sem ela, "1081 contra
1080" e "9000 contra 1080" saíam como a mesma mensagem, e a conclusão "suba o fator" seria certa num caso e
exatamente errada no outro.

**Margem de 2x** na fórmula: o p99 medido é o comportamento observado, e o teto precisa caber o pico não
observado. Sem folga, a próxima semana atípica vira incidente.

**O divisor é `RATE_LIMIT_MAX_REQUESTS`, não a constante 180.** Em produção dá no mesmo, porque a env
não é setada lá e o default de `server/lib/env.ts` é 180. Mas ela existe justamente para staging e teste
de carga com k6, que é onde alguém tem chance de rodar esta conta, e ali o valor pode ser outro: com a
env em 3, por exemplo, dividir por 180 daria um fator perto de zero. Confira o valor vigente antes de
aplicar a fórmula.

---

## Encerramento

Depois de decidir, **desligue** (`RATE_LIMIT_SAMPLE_N=0`) e registre no commit que mexer no fator: o valor
medido, o período, o número de amostras e o percentil usado. O `FATOR_TETO_IP` deixa de ser um número
escolhido e passa a ser um número derivado, com a derivação escrita.
