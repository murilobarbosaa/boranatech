-- Guarda o email resolvido de cada destinatario custom no momento do envio.
-- Ate agora notification_recipients so tinha (notification_id, user_id), entao
-- reabrir um draft custom pra editar vinha com o textarea vazio: os emails
-- originais nao eram recuperaveis, so a contagem. Passamos a persistir o email
-- (lowercased, como a resolucao ja normaliza) pra permitir editar/auditar a
-- lista depois.
--
-- Nullable de proposito: as linhas ja existentes (criadas antes desta coluna)
-- nao tem o email original e permanecem legadas. O backend e a UI tratam email
-- nulo como "lista original indisponivel" (mantem a contagem), sem quebrar.

alter table public.notification_recipients
  add column email text;

comment on column public.notification_recipients.email is
  'Email resolvido (lowercased) no momento do envio; nullable para as linhas anteriores a esta coluna.';
