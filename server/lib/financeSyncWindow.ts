// ALCANCE do sync financeiro, e o corte do guard que cobre o resto.
//
// Os dois numeros vivem no MESMO arquivo porque existe uma invariante entre
// eles, e invariante entre constantes espalhadas por dois modulos e invariante
// que ninguem verifica: o corte do guard tem que ser MAIOR que a janela do
// sync. Se for menor, o guard acusa uma linha que o cron ainda vai resolver
// sozinho na proxima passada, e alarme que grita com problema que se cura e
// alarme que alguem desliga.
//
// O caso que dimensionou os dois (medido em 2026-08-01): a correcao que resolve
// o dono de cobranca de BOLETO subiu em 30/07, SEIS DIAS depois de uma cobranca
// de 24/07 ter sido ingerida sem dono. O upsert do sync reescreve `user_id`,
// entao toda linha revisitada depois da correcao se conserta sozinha, e foi o
// que aconteceu com os tres boletos de 29/07. O de 24/07 ja estava fora de toda
// janela de 72h: ficou orfao para sempre, R$ 90,30 invisiveis no extrato do
// proprio cliente, e nada acusou por 8 dias.

/**
 * Janela do cron `sync-finance`.
 *
 * CUSTO MEDIDO contra a conta real em 2026-08-01: 72h = 19 balance transactions
 * (16 upserts); 7 dias = 27 (21 upserts); 14 dias = 59 (40 upserts). UMA pagina
 * da API nos tres casos (o limite e 100), listagem em 691-881ms. Sair de 72h
 * para 7 dias custa 5 upserts a mais por rodada diaria.
 *
 * Sete dias, e nao catorze: cobre a retentativa de webhook da Stripe (~3 dias)
 * com folga e o intervalo observado entre ingestao e correcao (6 dias), sem
 * dobrar a escrita para perseguir um atraso que o guard abaixo ja acusa.
 *
 * NAO CONVERGE com os 2 dias do webhook (`server/providers/stripe.ts`) nem com
 * os das rotas de reembolso, e a diferenca e de proposito: aqueles reagem a um
 * evento que acabou de acontecer, existem para trazer UMA linha conhecida
 * rapido, e rodam dentro de um request que alguem esta esperando. Alcance ali
 * seria latencia pura. Este roda uma vez por dia sem ninguem esperando, e
 * alcance e exatamente o que ele vende.
 */
export const SYNC_FINANCE_WINDOW_DAYS = 7;

/**
 * Idade a partir da qual uma cobranca sem dono vira problema declarado.
 *
 * A REGRA: so acusa o que o sync JA NAO ALCANCA MAIS. Abaixo desta idade a
 * linha ainda esta na janela do cron e pode se resolver sozinha na proxima
 * passada, exatamente como aconteceu com a cobranca de cartao de 01/08, orfa
 * por uma corrida de 5 segundos entre a ingestao e a criacao da assinatura.
 *
 * O valor e derivado da janela, nao escolhido a parte: um dia de folga sobre
 * ela, para uma linha ingerida no limite ainda ter uma rodada diaria inteira de
 * chance antes de virar alarme.
 */
export const CHARGE_SEM_DONO_CORTE_DIAS = SYNC_FINANCE_WINDOW_DAYS + 1;
