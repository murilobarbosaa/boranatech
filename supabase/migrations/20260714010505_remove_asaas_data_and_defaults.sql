-- Remove o provider Asaas do banco (dados de TESTE) e troca os defaults p/ 'stripe'.
-- Espera deletar EXATAMENTE: subscription_cancellations=2, billing_events=20, subscriptions=4.
-- Se o SQL Editor reportar OUTRO numero em qualquer DELETE, PARE e rode `rollback;`.
--
-- GUARDA: todo DELETE filtra explicitamente por provider='asaas' (direto ou via
-- subquery guardada por provider='asaas'). Nenhum DELETE sem WHERE. Nada com
-- provider='stripe' pode ser tocado. Roda dentro de uma transacao ABERTA: os
-- numeros aparecem, e so entao voce decide `commit;` ou `rollback;` (ver o fim).

begin;

-- (a) Cancelamentos agendados ligados as subscriptions Asaas, por
--     provider_subscription_id. A subquery e guardada por provider='asaas', entao
--     nenhuma cancellation de Stripe entra. ESPERA: 2 linhas.
delete from public.subscription_cancellations
where provider_subscription_id in (
  select provider_subscription_id
  from public.subscriptions
  where provider = 'asaas'
    and provider_subscription_id is not null
);

-- (b) Eventos de billing do Asaas. Filtro explicito por provider. ESPERA: 20 linhas.
delete from public.billing_events
where provider = 'asaas';

-- (c) As subscriptions de teste do Asaas. Filtro explicito por provider. ESPERA: 4 linhas.
delete from public.subscriptions
where provider = 'asaas';

-- (d) Daqui pra frente toda linha nova nasce como Stripe.
alter table public.subscriptions alter column provider set default 'stripe';
alter table public.billing_events alter column provider set default 'stripe';

-- (e) A coluna `provider` NAO e dropada (mantida para auditoria futura).

-- CONFERENCIA (Murilo): os tres DELETEs acima devem reportar, nesta ordem,
--   subscription_cancellations = 2
--   billing_events            = 20
--   subscriptions             = 4
-- Se TODOS baterem, rode:   commit;
-- Se QUALQUER um divergir, rode: rollback;
