# Três blocos de bullets para seis experiências

Item de produto, **não implementado**. Registro do que foi observado, das duas saídas possíveis e da
recomendação.

## O que foi observado

Numa execução real de `analyzeLinkedin` com o perfil de fixture (6 experiências, 5 com descrição própria),
o modelo devolveu **3 blocos de `bulletsReescritos`**.

**Não é o truncamento de prompt.** Aquele foi consertado na Fase 2A: o orçamento subiu para 6.000
caracteres e passou a ser repartido entre as experiências, e a medição confirmou que o modelo recebe **6 de
6 cabeçalhos e 5 de 5 descrições inteiras**. O texto está lá; o modelo escolheu reescrever três.

Também não é a camada de lastro removendo blocos: a mesma execução registrou **zero violações**.

O resultado na tela é que três experiências ficam **sem texto pronto e sem explicação**. A pessoa vê bullets
para umas e nada para outras, e não há nada dizendo por quê.

## As duas saídas

### A. Schema pedindo cobertura

`LinkedinQualitativeSchema` passa a exigir um bloco de `bulletsReescritos` por experiência elegível (as que
têm descrição própria suficiente), e o `json_schema` estrito da OpenAI força o modelo a preencher.

- **A favor:** resolve na origem. A pessoa recebe texto pronto para tudo que dá.
- **Contra:** forçar preenchimento é exatamente o mecanismo que produziu a série de fabricação
  (58 → 22 → 3 → 0). Um modelo obrigado a escrever N blocos escreve N blocos, e a qualidade do enésimo é a
  do que ele inventa quando não tem o que dizer. A camada de lastro pegaria numeral e tecnologia sem
  lastro, mas **não pega** bullet fabricado sem número e sem stack, que é a cegueira 3 registrada em
  `docs/rubrica-fidelidade.md`. Trocaria um buraco visível por um preenchimento invisível.

### B. A UI dizendo por que só três

A tela passa a listar as experiências elegíveis que **não** receberam bullets, com o motivo honesto: o
modelo priorizou as com mais material, e a pessoa pode pedir de novo ou escrever a partir das outras.

- **A favor:** não mexe no prompt, não cria pressão de preenchimento, e fecha o buraco que é de fato o
  problema (ausência **sem explicação**). Custa uma consulta ao que já está calculado: as elegíveis vêm de
  `estadoDescricao`, e os blocos entregues vêm do `contexto` de cada um.
- **Contra:** não entrega o texto. A pessoa continua sem bullets para três experiências.

## Recomendação

**B, e medir antes de considerar A.**

O motivo é a assimetria de risco que essa auditoria inteira mediu: bullet ausente custa conveniência,
bullet fabricado custa a confiança no produto e vai para o LinkedIn de alguém. A série 58 → 0 foi
conquistada **tirando trabalho do modelo**, e A é a operação inversa.

E o número que decide A ainda não existe: uma execução com 3 de 5 é uma amostra de uma. Antes de mudar o
schema, o harness precisa responder **quantos blocos o modelo entrega, em média, sobre 30 execuções, e se
os que faltam são sempre as mesmas experiências** (as de descrição mais curta) ou variam. Se forem sempre
as mesmas, o problema é de material e A não resolve; se variarem, é escolha do modelo e A pode fazer
sentido, com o lastro reforçado antes.

Enquanto isso, B torna a ausência honesta, que é o mínimo devido.
