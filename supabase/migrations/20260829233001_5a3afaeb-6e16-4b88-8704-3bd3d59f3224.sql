ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_id text;
CREATE INDEX IF NOT EXISTS profiles_tax_id_idx ON public.profiles (tax_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, company, tax_id)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.email, ''),
          NEW.raw_user_meta_data->>'phone',
          NEW.raw_user_meta_data->>'company',
          NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'tax_id',''), '\D', '', 'g'), ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'operator'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $function$;