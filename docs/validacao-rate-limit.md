# Validação manual do rate limit por usuário

**Por que este arquivo existe.** A mudança em `server/app.ts` + `server/lib/rateLimitKey.ts` é controle de
acesso, e o `CLAUDE.md` exige validação manual antes de subir. Roteiro em conversa some numa compactação de
contexto: já aconteceu com o smoke do LinkedIn, no meio do deploy que ele existia para validar. Artefato de
release mora em arquivo versionado.

**O que mudou.** O limiter contava por `req.ip`. Em NAT de operadora, escola ou empresa, dezenas de pessoas
dividem o mesmo IP e portanto o mesmo balde de 180/min, e quando estoura todo mundo daquele IP leva 429
junto. Foi o que o Sentry mediu: 28 dos 29 `profile_fetch_exhausted` eram HTTP 429 em `GET /api/me`, em 6
cidades distintas. Agora requisição **com token** conta no balde do próprio usuário (`u:<sub>`), e requisição
**sem token** continua contando por IP (`ip:<ip>`), como antes.

**Todos os comandos abaixo foram executados de verdade em 2026-07-30**, contra o servidor local, e a saída
registrada aqui é a saída real, não a esperada.

---

## Pré-requisitos

**Rode contra o servidor LOCAL, nunca contra produção.** O teste precisa estourar cota de propósito, e fazer
isso em produção derrubaria gente de verdade. Além disso, um loop de requisições contra `boranatech.com.br`
dispara a mitigação da Vercel (`x-vercel-mitigated: challenge`), que cega exatamente a medição que o loop
existe para fazer. Ver `CLAUDE.md`, "Medir estado de produção por endpoint que DECLARA o estado".

O que precisa estar de pé: **só o servidor**. Não precisa do Vite, não precisa de Redis, não precisa de conta
nova.

```bash
cd /caminho/do/worktree
RATE_LIMIT_MAX_REQUESTS=5 PORT=3199 pnpm dev:server
```

`RATE_LIMIT_MAX_REQUESTS=5` existe justamente para teste de carga (documentado em `server/lib/env.ts`) e
deixa o roteiro rápido: com 5, o teto por IP vira `5 * FATOR_TETO_IP` = **30**, em vez de 1080. Produção
**não** seta essa variável e fica no default 180.

Confirme que subiu:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3199/api/health   # 200
```

### Os dois tokens, sem criar conta nova

**Não precisa de conta.** O balde é escolhido pelo `sub` lido do JWT **sem verificar assinatura** (de
propósito: ele não autoriza nada, só escolhe balde). Então um JWT forjado exercita o limiter exatamente como
um real. O `requireAuth` vem **depois** e responde 401, o que é irrelevante aqui: o que se mede é 401 (passou
pelo limiter) contra 429 (barrado pelo limiter).

```bash
jwt() { python3 -c "
import base64,json,sys
def b(o): return base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip('=')
print(b({'alg':'HS256','typ':'JWT'})+'.'+b({'sub':sys.argv[1]})+'.assinatura-falsa')
" "$1"; }
```

### A janela é fixa e alinhada ao minuto

`windowStart = now - (now % 60000)`. Comece cada prova numa janela limpa, senão a contagem anterior vaza:

```bash
python3 -c "import time; s=60-(time.time()%60); time.sleep(s+0.3); print(f'janela limpa apos {s:.1f}s')"
```

---

## Prova 1 — o limite por usuário dispara

```bash
A=$(jwt 11111111-1111-1111-1111-111111111111)
for i in $(seq 1 8); do
  printf "req %s -> %s\n" "$i" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $A" http://127.0.0.1:3199/api/me)"
done
```

**Saída real:** `401 401 401 401 401 429 429 429` — passa 5, barra da 6ª em diante.

## Prova 2 — dois usuários no MESMO IP não se derrubam (é o bug)

```bash
A=$(jwt aaaaaaaa-0000-0000-0000-000000000001)
B=$(jwt bbbbbbbb-0000-0000-0000-000000000002)
printf "A: "; for i in $(seq 1 7); do printf "%s " "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $A" http://127.0.0.1:3199/api/me)"; done; echo
printf "B: "; for i in $(seq 1 5); do printf "%s " "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $B" http://127.0.0.1:3199/api/me)"; done; echo
```

**Saída real:**

```
A: 401 401 401 401 401 429 429
B: 401 401 401 401 401
```

**É esta a prova que importa.** O A esgotou a cota e o B, no mesmo IP, continua passando. Antes da mudança o
B levaria 429 junto, sem ter feito nada. Se o B mostrar 429, a correção não está ativa.

## Prova 3 — o teto por IP dispara, com `escopo=ip` no log

Manda 35 requisições, cada uma com um `sub` **diferente**. Nenhuma estoura a cota individual; o que estoura é
o teto por IP (30 com `MAX=5`).

```bash
for i in $(seq 1 35); do
  T=$(jwt "cccccccc-0000-0000-0000-$(printf '%012d' $i)")
  C=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $T" http://127.0.0.1:3199/api/me)
  [ "$i" -ge 28 ] && printf "req %s (sub novo) -> %s\n" "$i" "$C"
done
```

**Saída real:** 401 até a 30, `429` da 31 em diante. É o teto que impede `sub` forjado em série de escapar da
cota gerando balde novo a cada chamada.

## Prova 4 — sem token, nada mudou

```bash
for i in $(seq 1 8); do printf "%s " "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3199/api/me)"; done; echo
```

**Saída real:** `401 401 401 401 401 429 429 429` — idêntico ao comportamento anterior. Tráfego público conta
por IP, no mesmo limite, e **não paga o segundo check** (o IP já é a chave principal).

## Prova 5 — token torto não rende cota nova

```bash
for i in $(seq 1 3); do printf "%s " "$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer nao-e-jwt" http://127.0.0.1:3199/api/me)"; done; echo
```

Header ilegível degrada para contagem por IP, não para balde próprio. Rodando logo depois da prova 4 (mesma
janela, IP já estourado), sai `429 429 429`: lixo no header não compra cota.

---

## Onde ver o log do escopo, e a linha exata

No **stdout do servidor** (local: o terminal do `pnpm dev:server`; produção: logs do Railway). Duas linhas
possíveis, e só estas:

```
[ratelimit] 429 escopo=usuario
[ratelimit] 429 escopo=ip
```

`escopo=usuario` é uma pessoa (ou um IP sem token) estourando a própria cota: esperado, é o limiter
funcionando. **`escopo=ip` é o sinal a vigiar**: significa que o teto de `180 * 6 = 1080/min` de um IP
autenticado estourou, ou seja, ou é abuso, ou é um NAT grande demais para o `FATOR_TETO_IP` atual. Se aparecer
em produção com IP de operadora, é o fator que precisa subir, e aí será com dado.

Filtro rápido no local:

```bash
pnpm dev:server 2>&1 | grep --line-buffered ratelimit
```

---

## Redis fora (o caminho do `contarLocal`)

**Não precisa derrubar nada, e não encosta em produção: localmente esse já é o caminho padrão.** O `.env` tem
`REDIS_URL=` vazio, então `cacheConnection` é `null`, `redisRateLimitCount` devolve `null` na hora e o limiter
cai no store em memória. **As cinco provas acima já rodaram todas pelo `contarLocal`.**

Quer exercitar o caminho *com* Redis? Suba um local e aponte só para esta sessão, sem tocar em produção:

```bash
docker run -d --name bnt-redis-teste -p 6399:6379 redis:7-alpine
REDIS_URL=redis://127.0.0.1:6399 RATE_LIMIT_MAX_REQUESTS=5 PORT=3199 pnpm dev:server
# ... repetir as provas 1 a 5 ...
docker rm -f bnt-redis-teste
```

A diferença entre os dois caminhos é só onde a contagem mora (Redis compartilhado entre réplicas contra Map
local por instância); a decisão é a mesma, e os dois tetos valem nos dois. O caminho local é o que roda quando
o Redis cai, e é fail-open por decisão consciente (rate limit é proteção de abuso, não entitlement).

---

## Critério de reversão

Reverter o deploy se, depois de subir:

1. a prova 2 falhar em produção (dois usuários no mesmo IP se derrubando) — significa que a chave por usuário
   não está ativa;
2. aparecer `escopo=ip` em volume para IPs de operadora — o teto está apertado demais para NAT real;
3. o 429 em `/api/me` **não** cair no Sentry em 24h — a correção não atacou a causa e a hipótese estava errada.

O item 3 é a única prova de que a mudança funcionou, e ela só existe depois do deploy.
