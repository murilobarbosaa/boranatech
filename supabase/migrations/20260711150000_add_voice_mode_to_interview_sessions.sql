-- Voz do Natechinho nas entrevistas (E5): sessoes com modo voz ligado recebem
-- cada pergunta tambem como audio (TTS server-side sob demanda, gerado no
-- primeiro play). A escolha e feita no intake e fica gravada na sessao; o
-- default false preserva todas as sessoes existentes como texto puro e
-- mantem o comportamento atual quando o toggle nao for tocado.

alter table public.interview_sessions
  add column if not exists voice_mode boolean not null default false;
