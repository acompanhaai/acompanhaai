-- Multi-tenant isolation.
--
-- Every operational table (drivers, protocols, insureds, and the tables
-- that hang off a protocol/driver) was previously readable and writable by
-- *any* authenticated user via `USING (true)` policies. There was no
-- `companies` table and no `company_id` anywhere, so two different
-- companies signed up on AcompanhaAí shared one global pool of drivers,
-- protocols, client PII, messages and location history. This migration
-- introduces a real tenant boundary and rewrites RLS to enforce it.

-- 1) The tenant itself.
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

-- 2) Link every user to one company.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- Backfill: group existing profiles that share a (tax_id, company name) pair
-- into one company, so accounts that already exist keep access to their own
-- data instead of losing it when company_id becomes required. This mirrors
-- the signup form's own "empresas já cadastradas com este documento"
-- suggestion, which already nudged matching tax_id + company name together.
DO $$
DECLARE
  r record;
  new_company_id uuid;
BEGIN
  FOR r IN
    SELECT DISTINCT tax_id, company FROM public.profiles WHERE company_id IS NULL
  LOOP
    INSERT INTO public.companies (name, tax_id)
    VALUES (COALESCE(NULLIF(r.company, ''), 'Empresa sem nome'), r.tax_id)
    RETURNING id INTO new_company_id;

    UPDATE public.profiles
    SET company_id = new_company_id
    WHERE company_id IS NULL
      AND coalesce(tax_id, '') = coalesce(r.tax_id, '')
      AND coalesce(company, '') = coalesce(r.company, '');
  END LOOP;
END $$;

ALTER TABLE public.profiles ALTER COLUMN company_id SET NOT NULL;

CREATE POLICY "own company read" ON public.companies FOR SELECT TO authenticated
  USING (id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Helper used by every other policy below, same pattern as the existing
-- has_role()/current_driver_id() functions in this schema.
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- New accounts: create (or reuse, by exact tax_id match) a company at signup
-- and link the profile to it, instead of leaving company as free text.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  signup_tax_id text := NEW.raw_user_meta_data->>'tax_id';
  signup_company text := COALESCE(NEW.raw_user_meta_data->>'company', '');
  resolved_company_id uuid;
BEGIN
  IF signup_tax_id IS NOT NULL AND signup_tax_id <> '' THEN
    SELECT id INTO resolved_company_id FROM public.companies WHERE tax_id = signup_tax_id LIMIT 1;
  END IF;

  IF resolved_company_id IS NULL THEN
    INSERT INTO public.companies (name, tax_id)
    VALUES (NULLIF(signup_company, ''), NULLIF(signup_tax_id, ''))
    RETURNING id INTO resolved_company_id;
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
  RETURN NEW;
END; $$;

-- 3) company_id on the root tenant tables.
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.insureds ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.protocols ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- Backfill existing rows to the creator's company where we can tell who
-- created them; anything left over goes to a single fallback company so no
-- row is orphaned (RLS would otherwise hide it from everyone, including its
-- rightful owner).
INSERT INTO public.companies (name)
SELECT 'Dados anteriores ao multi-tenant'
WHERE EXISTS (SELECT 1 FROM public.drivers WHERE company_id IS NULL)
   OR EXISTS (SELECT 1 FROM public.protocols WHERE company_id IS NULL);

UPDATE public.protocols p
SET company_id = COALESCE(
  (SELECT company_id FROM public.profiles WHERE id = p.created_by),
  (SELECT id FROM public.companies WHERE name = 'Dados anteriores ao multi-tenant')
)
WHERE company_id IS NULL;

UPDATE public.drivers d
SET company_id = COALESCE(
  (SELECT p.company_id FROM public.protocols p WHERE p.driver_id = d.id AND p.company_id IS NOT NULL LIMIT 1),
  (SELECT id FROM public.companies WHERE name = 'Dados anteriores ao multi-tenant')
)
WHERE company_id IS NULL;

ALTER TABLE public.drivers ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.protocols ALTER COLUMN company_id SET NOT NULL;
-- insureds stays nullable: the table has no writer in the app today, so
-- there's nothing to backfill against.

-- 4) company_id on the tables that hang off a protocol or driver, kept in
-- sync automatically so none of the existing insert call sites (which don't
-- know about companies at all) need to change.
ALTER TABLE public.protocol_events ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.location_history ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

UPDATE public.protocol_events e SET company_id = p.company_id
FROM public.protocols p WHERE p.id = e.protocol_id AND e.company_id IS NULL;
UPDATE public.messages m SET company_id = p.company_id
FROM public.protocols p WHERE p.id = m.protocol_id AND m.company_id IS NULL;
UPDATE public.location_history l SET company_id = COALESCE(p.company_id, dr.company_id)
FROM public.protocols p FULL JOIN public.drivers dr ON dr.id = l.driver_id
WHERE (p.id = l.protocol_id OR l.protocol_id IS NULL) AND l.company_id IS NULL;

CREATE OR REPLACE FUNCTION public.set_company_id_from_protocol()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.protocols WHERE id = NEW.protocol_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER protocol_events_set_company BEFORE INSERT ON public.protocol_events
FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_protocol();
CREATE TRIGGER messages_set_company BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_protocol();

CREATE OR REPLACE FUNCTION public.set_location_company_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    IF NEW.protocol_id IS NOT NULL THEN
      SELECT company_id INTO NEW.company_id FROM public.protocols WHERE id = NEW.protocol_id;
    END IF;
    IF NEW.company_id IS NULL AND NEW.driver_id IS NOT NULL THEN
      SELECT company_id INTO NEW.company_id FROM public.drivers WHERE id = NEW.driver_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER location_history_set_company BEFORE INSERT ON public.location_history
FOR EACH ROW EXECUTE FUNCTION public.set_location_company_id();

-- audit_logs: derive from the actor's own company (falls back to NULL for
-- system/service-role actions with no human actor, which is fine — those
-- aren't shown through the authenticated-only read policy anyway).
CREATE OR REPLACE FUNCTION public.set_audit_log_company_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.company_id IS NULL AND NEW.actor_id IS NOT NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.profiles WHERE id = NEW.actor_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER audit_logs_set_company BEFORE INSERT ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.set_audit_log_company_id();

-- 5) Replace every "USING (true)" policy with company-scoped isolation.
DROP POLICY IF EXISTS "drivers auth all" ON public.drivers;
CREATE POLICY "drivers company isolation" ON public.drivers FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS "insureds auth all" ON public.insureds;
CREATE POLICY "insureds company isolation" ON public.insureds FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS "protocols auth all" ON public.protocols;
CREATE POLICY "protocols company isolation" ON public.protocols FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id = public.current_company_id());

DROP POLICY IF EXISTS "events auth read" ON public.protocol_events;
DROP POLICY IF EXISTS "events auth insert" ON public.protocol_events;
CREATE POLICY "protocol_events company read" ON public.protocol_events FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY "protocol_events company insert" ON public.protocol_events FOR INSERT TO authenticated
  WITH CHECK (
    company_id IS NULL OR company_id = public.current_company_id()
  );

DROP POLICY IF EXISTS "messages auth all" ON public.messages;
CREATE POLICY "messages company isolation" ON public.messages FOR ALL TO authenticated
  USING (company_id = public.current_company_id())
  WITH CHECK (company_id IS NULL OR company_id = public.current_company_id());

DROP POLICY IF EXISTS "locations auth read" ON public.location_history;
DROP POLICY IF EXISTS "locations auth insert" ON public.location_history;
CREATE POLICY "location_history company read" ON public.location_history FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY "location_history company insert" ON public.location_history FOR INSERT TO authenticated
  WITH CHECK (company_id IS NULL OR company_id = public.current_company_id());

DROP POLICY IF EXISTS "audit auth read" ON public.audit_logs;
DROP POLICY IF EXISTS "audit auth insert" ON public.audit_logs;
CREATE POLICY "audit_logs company read" ON public.audit_logs FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());
CREATE POLICY "audit_logs company insert" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (company_id IS NULL OR company_id = public.current_company_id());
