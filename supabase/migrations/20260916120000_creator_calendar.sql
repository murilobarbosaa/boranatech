-- Calendario compartilhado dos creators e pedidos de collab (lote 10).
--
-- 1. creator_calendar_events: um creator marca que vai publicar em tal dia, em
--    tal rede, com uma nota curta (o assunto). TODO creator ativo ve o
--    calendario inteiro: e assim que dois deles evitam falar do mesmo assunto
--    no mesmo dia, que e o problema que o calendario existe para resolver.
--
--    Marcar NAO e exclusivo: dois creators podem marcar o mesmo dia. O unique e
--    por (creator, dia, rede), entao o mesmo creator nao marca duas vezes o
--    mesmo dia na mesma rede, e nada impede o Instagram e o TikTok no mesmo dia.
--
-- 2. creator_collab_requests: um creator pede collab na marcacao de outro. O
--    dono aceita ou recusa, e a conversa em si acontece fora (Instagram). O
--    unique e por (evento, quem pediu): pedir duas vezes na mesma marcacao e a
--    mesma intencao, nao duas.
--
-- AS DUAS CONSTRAINTS TEM NOME de proposito: as rotas respondem 409 casando o
-- 23505 pelo NOME (o padrao de `isUniqueViolationOn` em server/lib/
-- certificates.ts, ja usado no lote 09), e nao por "qualquer 23505", que
-- confundiria uma colisao com outra da mesma escrita.
--
-- `event_date` e `date`, e nao timestamptz: o dia da publicacao e um dia civil,
-- nao um instante. Quem compara com "hoje" usa o dia civil de Brasilia
-- (shared/brasiliaDay.ts), e guardar instante aqui reintroduziria o fuso num
-- dado que nao tem hora.
--
-- RLS ligada e sem policy nem privilegio para anon e authenticated, igual as
-- tabelas dos lotes 08 e 09: so o servidor le e escreve, pelo service_role.
--
-- ON DELETE CASCADE em tudo: a exclusao de conta e o `auth.admin.deleteUser` de
-- DELETE /api/me, e apagar uma marcacao leva junto os pedidos dela (ninguem
-- responde collab de um dia que deixou de existir).
--
-- Puramente aditiva (duas tabelas novas e vazias): isenta da janela de
-- migration destrutiva. Rollback e o drop das duas.

BEGIN;

CREATE TABLE public.creator_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  network text NOT NULL CHECK (network IN ('instagram', 'tiktok')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creator_calendar_unico_por_dia
    UNIQUE (user_id, event_date, network)
);

-- A leitura e sempre "o mes inteiro, de todo mundo": o corte e por data, e nao
-- por dono.
CREATE INDEX creator_calendar_events_date_idx
  ON public.creator_calendar_events(event_date);

ALTER TABLE public.creator_calendar_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.creator_calendar_events
  FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.creator_calendar_events IS
  'Calendario compartilhado dos creators: um creator marca dia, rede e uma nota curta do assunto. Visivel a todo creator ativo; marcar nao e exclusivo. Escrito apenas pelo server.';

CREATE TABLE public.creator_collab_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.creator_calendar_events(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aceita', 'recusada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT creator_collab_unica_por_evento UNIQUE (event_id, requester_id)
);

-- O dono abre a lista dele filtrando por status (os pendentes primeiro); quem
-- pediu abre a propria lista inteira.
CREATE INDEX creator_collab_requests_owner_idx
  ON public.creator_collab_requests(owner_id, status);
CREATE INDEX creator_collab_requests_requester_idx
  ON public.creator_collab_requests(requester_id);

ALTER TABLE public.creator_collab_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.creator_collab_requests
  FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.creator_collab_requests IS
  'Pedidos de collab sobre uma marcacao do calendario: quem pediu, o dono da marcacao, a mensagem e a resposta. A conversa acontece fora da plataforma; aqui fica o pedido e o veredito. Escrito apenas pelo server.';

COMMIT;
