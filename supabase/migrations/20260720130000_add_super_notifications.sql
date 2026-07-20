-- Notificacoes SUPER: uma notificacao com destaque que aparece como modal
-- interstitial (alem de aparecer no sino). Modelagem com colunas dedicadas na
-- propria tabela notifications (colunas, NAO jsonb): uma super pode tambem ser
-- cupom e/ou agendada, na mesma linha, sem tabela extra de conteudo.
--
-- Semantica de supressao do interstitial: dismiss != read.
--   - read (notification_reads): tira do badge/sino, como qualquer notificacao.
--   - dismiss (notification_super_dismissals): tira do INTERSTITIAL (cross-device)
--     mas mantem a super no sino ate ser lida de verdade.
-- QUALQUER um dos dois (dismiss OU read) suprime o interstitial; so read some do
-- sino. O unread_count segue contando so por notification_reads, entao uma super
-- dispensada mas nao lida continua nao-lida no sino.
--
-- Uma super so vira "ativa" (interstitial) quando published: scheduled, draft e
-- archived NUNCA sao super ativa, herdado do filtro status='published' da
-- visibleQuery (server/lib/notificationAudience.ts). O indice parcial abaixo
-- cobre exatamente esse recorte (supers publicadas, mais recente primeiro).

BEGIN;

-- 1) Colunas dedicadas da super. is_super default false: notificacao comum nao
-- muda de comportamento. Campos super_* sao o conteudo do modal grande.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS is_super boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS super_eyebrow text,
  ADD COLUMN IF NOT EXISTS super_title text,
  ADD COLUMN IF NOT EXISTS super_subtitle text,
  ADD COLUMN IF NOT EXISTS super_cta_label text,
  ADD COLUMN IF NOT EXISTS super_cta_url text;

-- Minimo pro modal renderizar: titulo + CTA (label e url). eyebrow/subtitle sao
-- opcionais. Espelhado no zod do admin pra dar mensagem clara antes do constraint.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_super_requires_fields;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_super_requires_fields
  CHECK (
    is_super = false
    OR (
      super_title IS NOT NULL
      AND super_cta_label IS NOT NULL
      AND super_cta_url IS NOT NULL
    )
  );

-- 2) Indice parcial da query da super ativa (getActiveSuperForUser): so as
-- supers publicadas, ordenadas por published_at desc pra pegar a mais recente.
CREATE INDEX IF NOT EXISTS notifications_active_super_idx
  ON public.notifications (published_at DESC)
  WHERE is_super = true AND status = 'published';

-- 3) Dispensas do interstitial por usuario. Molde IDENTICO a notification_reads:
-- broadcast sem fan-out, linha criada so quando o usuario dispensa. dismissed_at
-- != read_at (ver comentario do topo): dispensar tira do interstitial, nao do sino.
CREATE TABLE IF NOT EXISTS public.notification_super_dismissals (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  notification_id uuid NOT NULL REFERENCES public.notifications (id) ON DELETE CASCADE,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS notification_super_dismissals_user_idx
  ON public.notification_super_dismissals (user_id);

ALTER TABLE public.notification_super_dismissals ENABLE ROW LEVEL SECURITY;

-- Usuario ve apenas as proprias dispensas. Sem policy de insert/update/delete de
-- proposito: nenhum papel autenticado ou anonimo grava direto; so o service role
-- do servidor registra a dispensa (POST /api/me/super/:id/dismiss), identico ao
-- padrao de notification_reads/user_consents.
DROP POLICY IF EXISTS "notification_super_dismissals_select_own" ON public.notification_super_dismissals;
CREATE POLICY "notification_super_dismissals_select_own"
  ON public.notification_super_dismissals
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

COMMENT ON TABLE public.notification_super_dismissals IS
  'Dispensa do modal interstitial de uma super por usuario (cross-device). dismiss != read: dispensar tira do interstitial mas mantem a super no sino ate ser lida. So o service role grava.';

COMMIT;
