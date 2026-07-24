-- Novo segmento paying_pro: assinantes com pagamento vigente (status
-- active/trialing, plano pago, periodo valido), EXCLUINDO influencers de
-- cortesia. Existe pra campanhas/notificacoes de cobranca/renovacao nao
-- alcancarem quem tem Pro sem pagar. active_pro continua INCLUINDO influencers
-- (experiencia Pro completa); paying_pro e o subconjunto so-pagante. A logica
-- vive em server/lib/userSegments.ts (novo flag payingActive); aqui so
-- liberamos o valor nos checks que restringem segmento, pra o banco aceitar o
-- que USER_SEGMENTS agora valida.

-- notifications.audience: segmentos + 'custom' (lista fixa). Recriado com o
-- valor novo, mesmo padrao de 20260716150000.
alter table public.notifications
  drop constraint if exists notifications_audience_check;

alter table public.notifications
  add constraint notifications_audience_check
  check (audience in ('all', 'never_pro', 'active_pro', 'paying_pro', 'ex_pro', 'custom'));

-- email_campaign_batches.user_segment: a UI de email ainda NAO oferece
-- paying_pro (rodada separada), mas o backend valida contra USER_SEGMENTS (que
-- agora inclui paying_pro), entao o check precisa aceitar o mesmo conjunto pra
-- nao criar divergencia validacao/banco. Mudanca puramente permissiva.
alter table public.email_campaign_batches
  drop constraint if exists email_campaign_batches_user_segment_check;

alter table public.email_campaign_batches
  add constraint email_campaign_batches_user_segment_check
  check (user_segment is null or user_segment in ('all', 'never_pro', 'active_pro', 'paying_pro', 'ex_pro'));
