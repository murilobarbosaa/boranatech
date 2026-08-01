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
[ratelimit] amostra escopo=ip alvo=3029bc94 contagem=18 limite=18
[ratelimit] 429     escopo=ip alvo=…        contagem=19 limite=18
```

| campo | o que é |
|---|---|
| `escopo` | `usuario` (cota individual, ou IP sem token) ou `ip` (teto do IP autenticado) |
| `alvo` | prefixo de sha256 da chave. **Agrupa sem carregar o IP nem o `sub` para o log** |
| `contagem` | requisições **já acumuladas na janela de 1 minuto** daquela chave |
| `limite` | o teto vigente para aquele escopo |

`alvo` é hash porque a pergunta é de agrupamento ("quantas req/min um mesmo IP faz"), não de identificação. O
log do Railway fica retido sem política nossa, e o mesmo argumento do `textoHash` vale aqui.

**Saída real** (servidor local, `RATE_LIMIT_MAX_REQUESTS=3`, portanto teto de IP 18, `SAMPLE_N=2`):

```
[ratelimit] amostra escopo=ip alvo=3029bc94 contagem=12 limite=18
[ratelimit] amostra escopo=ip alvo=3029bc94 contagem=14 limite=18
[ratelimit] amostra escopo=ip alvo=3029bc94 contagem=16 limite=18
[ratelimit] amostra escopo=ip alvo=3029bc94 contagem=18 limite=18
[ratelimit] 429 escopo=ip contagem=19 limite=18
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

## O critério de decisão

Com `limite = 1080` e os percentis acima:

| leitura | veredito | ação |
|---|---|---|
| `p99` abaixo de ~300 e **zero** `429 escopo=ip` | **folgado** | não mexer. O fator não é o gargalo. |
| `p99` entre ~500 e 1080, poucos `429 escopo=ip` | **no ponto** | não mexer, manter a amostragem mais uma semana |
| `p99` colado em 1080 **ou** `429 escopo=ip` recorrente com `contagem` perto de 1081 | **apertado** | subir `FATOR_TETO_IP` para `ceil(p99 * 2 / 180)` |
| `429 escopo=ip` com `contagem` muito acima do limite (ex.: 9000) | **abuso, não NAT** | não subir o fator. Investigar o `alvo`. |

A última linha é a que impede a leitura ingênua: **estouro alto não é sinal de teto apertado, é sinal de
ataque.** Foi para distinguir esses dois casos que a `contagem` entrou na linha de 429 — sem ela, "1081 contra
1080" e "9000 contra 1080" saíam como a mesma mensagem, e a conclusão "suba o fator" seria certa num caso e
exatamente errada no outro.

**Margem de 2x** na fórmula: o p99 medido é o comportamento observado, e o teto precisa caber o pico não
observado. Sem folga, a próxima semana atípica vira incidente.

---

## Encerramento

Depois de decidir, **desligue** (`RATE_LIMIT_SAMPLE_N=0`) e registre no commit que mexer no fator: o valor
medido, o período, o número de amostras e o percentil usado. O `FATOR_TETO_IP` deixa de ser um número
escolhido e passa a ser um número derivado, com a derivação escrita.
