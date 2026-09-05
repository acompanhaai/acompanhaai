-- Lets handle_new_user() join a specific company directly (via
-- auth.admin.inviteUserByEmail's raw_user_meta_data), instead of only ever
-- resolving a company by tax_id or creating a new one. Needed so an operator
-- inviting a driver puts them in the OPERATOR's company, not a new one.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  invited_company_id uuid := NULLIF(NEW.raw_user_meta_data->>'company_id', '')::uuid;
  signup_tax_id text := NEW.raw_user_meta_data->>'tax_id';
  signup_company text := COALESCE(NEW.raw_user_meta_data->>'company', '');
  resolved_company_id uuid;
BEGIN
  IF invited_company_id IS NOT NULL THEN
    resolved_company_id := invited_company_id;
  ELSE
    IF signup_tax_id IS NOT NULL AND signup_tax_id <> '' THEN
      SELECT id INTO resolved_company_id FROM public.companies WHERE tax_id = signup_tax_id LIMIT 1;
    END IF;

    IF resolved_company_id IS NULL THEN
      INSERT INTO public.companies (name, tax_id)
      VALUES (NULLIF(signup_company, ''), NULLIF(signup_tax_id, ''))
      RETURNING id INTO resolved_company_id;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, name, email, phone, company, tax_id, company_id)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.email, ''),
          NEW.raw_user_meta_data->>'phone',
          NULLIF(signup_company, ''),
          NULLIF(signup_tax_id, ''),
          resolved_company_id)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'operator'))
  ON CONFLICT DO NOTHING;

  -- Link an invited driver's auth account back to the drivers row the
  -- operator already created (matched by CPF, set on invite below).
  IF NEW.raw_user_meta_data->>'role' = 'driver' AND NEW.raw_user_meta_data->>'driver_cpf' IS NOT NULL THEN
    UPDATE public.drivers
    SET user_id = NEW.id
    WHERE cpf = NEW.raw_user_meta_data->>'driver_cpf'
      AND company_id = resolved_company_id
      AND user_id IS NULL;
  END IF;

  RETURN NEW;
END; $$;
