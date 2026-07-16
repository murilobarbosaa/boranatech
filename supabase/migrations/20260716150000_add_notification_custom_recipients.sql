-- Audience 'custom' para notificacoes: lista FIXA de destinatarios,
-- materializada na criacao (admin informa emails, o server resolve para
-- user_id via profiles). Diferente das audiences por segmento (avaliadas na
-- leitura), a lista custom nao muda depois: quem nao tinha cadastro na hora
-- do envio fica de fora mesmo que se cadastre depois.

-- O check de audience era inline no create (nome gerado
-- notifications_audience_check); recriado com o valor novo.
alter table public.notifications
  drop constraint if exists notifications_audience_check;
alter table public.notifications
  add constraint notifications_audience_check
  check (audience in ('all', 'never_pro', 'active_pro', 'ex_pro', 'custom'));

create table if not exists public.notification_recipients (
  notification_id uuid not null references public.notifications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (notification_id, user_id)
);

-- O GET do usuario resolve "de quais notificacoes custom eu sou
-- destinatario" filtrando por user_id; sem este indice seria scan.
create index if not exists notification_recipients_user_id_idx
  on public.notification_recipients (user_id);

-- Integridade audience='custom' <-> linhas aqui e garantida pelo SERVER
-- (adminNotifications.ts cria/substitui a lista junto com a notificacao e o
-- publish exige pelo menos um destinatario), nao por trigger: padrao da casa,
-- escrita passa toda pelo service role num unico ponto.

alter table public.notification_recipients enable row level security;

-- SEM policies de proposito: nem select. A visibilidade de notificacao custom
-- e decidida pelo server (service role ignora RLS); expor select_own aqui nao
-- teria consumidor e vazaria a existencia de notificacoes fora do feed.
