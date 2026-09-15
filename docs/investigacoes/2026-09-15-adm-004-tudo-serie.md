# ADM-004 — histórico “Tudo” e limite da série diária

Fato comprovado na base `9ed622e12aabf8b83531ea729af58b61fcc8f864`:
`MAX_FINANCE_HISTORY_DAYS` é **3.653 pontos diários**. O limite foi criado
para controlar o payload da série do contrato financeiro v1. Antes desta
correção, `resolveHonestFinanceAllPeriod` rejeitava o período acima desse
comprimento antes da leitura, `FinancePeriodSchema` rejeitava a janela e a
validação do contrato exigia série diária completa. Assim, o total histórico
ficava indisponível por uma restrição de detalhe, não por falta de fatos.

Agora “Tudo” começa no primeiro movimento financeiro local elegível localizado
por `finance_transactions.occurred_at` e termina no último dia civil completo
de `America/Sao_Paulo`. A consulta do ledger continua paginada, filtrada no
banco, com contagem exata e detecção de IDs repetidos; a classificação,
deduplicação e identificação de conflitos econômicos são feitas **uma vez**
sobre todas as linhas lidas. Nenhuma janela menor nem soma de subtotais de
partes substitui o histórico. Uma consulta incompleta continua falhando.

O contrato `honest-v1` conserva os campos e a semântica de cada valor e de cada
ponto diário já enviado. A extensão aditiva `cash.seriesDetail` distingue:

- `available / complete_daily`: `series` cobre todos os dias do intervalo;
- `unavailable / daily_limit_exceeded`: total calculado para todo o intervalo,
  mas `series: []` não representa série zero nem série truncada;
- `unavailable / series_build_failed`: só a construção do detalhe falhou após
  o agregado; `series: []` não altera a disponibilidade do valor.

`maxDailyPoints` declara o limite de 3.653 em todos os casos. Payloads v1
anteriores sem `seriesDetail` continuam válidos **somente** quando trazem a
série completa, como antes. Acima do limite, o validador exige indisponibilidade
explícita e não constrói um array de todos os dias. O cliente administrativo
atual consome os valores, não a série diária; a limitação fica visível nos
detalhes de qualidade do Financeiro. Consumidores futuros não devem inferir
zero de `series: []` quando `seriesDetail.status` é `unavailable`.

Limitações inalteradas: cobertura externa não coletada, ausência de snapshot
transacional, possibilidade de reembolsos externos fora do ledger e nenhuma
prova de receita contábil ou obrigação contratual. Esta alteração não consulta
Stripe/Asaas, não cria métrica contratual, migration ou efeito em dados reais.
