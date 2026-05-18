-- Adiciona coluna gender em profiles + atualiza trigger handle_new_user
-- pra propagar valor de raw_user_meta_data.
--
-- Valores aceitos: masculino, feminino, outro, prefiro_nao_dizer
-- NULL é permitido (usuários existentes não têm valor; novos cadastros
-- obrigam preenchimento via UI).

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_gender_check'
      AND constraint_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_gender_check
      CHECK (gender IS NULL OR gender IN ('masculino', 'feminino', 'outro', 'prefiro_nao_dizer'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (user_id, email, name, avatar_url, gender)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'gender'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$function$;

COMMIT;
