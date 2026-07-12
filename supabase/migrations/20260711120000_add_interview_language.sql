-- Entrevista simulada, fase E1:
--
--  (a) idioma por sessao: a pessoa escolhe treinar em portugues ou em ingles
--      no intake; o server condiciona TODO o prompt do entrevistador (perguntas,
--      avaliacoes, dicas e veredito) pelo idioma salvo, inclusive na retomada.
--
--  (b) tipo de turno em interview_turns: 'answer' e o comportamento historico
--      (pergunta, resposta ou turno avaliado), 'hint' e a dica pedida pelo
--      candidato (nunca avaliada, nunca conta nos criterios de preparo) e
--      'closing' marca o turno de fechamento de forma ESTRUTURADA, matando a
--      deduplicacao por igualdade de string que o client fazia ate aqui.

alter table public.interview_sessions
  add column if not exists language text not null default 'pt'
    check (language in ('pt', 'en'));

alter table public.interview_turns
  add column if not exists kind text not null default 'answer'
    check (kind in ('answer', 'hint', 'closing'));

-- Backfill dos fechamentos ja persistidos: eram identificaveis apenas por
-- igualdade de conteudo com verdict->>'closing' (a heuristica antiga do
-- client). Marca uma unica vez aqui para que TODO turno de fechamento,
-- antigo ou novo, carregue kind = 'closing'.
update public.interview_turns t
set kind = 'closing'
from public.interview_sessions s
where t.session_id = s.id
  and s.status = 'completed'
  and t.role = 'assistant'
  and t.evaluation is null
  and s.verdict->>'closing' = t.content;
