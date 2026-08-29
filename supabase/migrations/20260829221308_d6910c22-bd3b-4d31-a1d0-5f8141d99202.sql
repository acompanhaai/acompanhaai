-- roles
CREATE TYPE public.app_role AS ENUM ('admin','operator','driver');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  company text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- drivers
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  cpf text NOT NULL UNIQUE,
  phone text,
  vehicle text,
  plate text,
  photo_url text,
  city text,
  provider text,
  status text NOT NULL DEFAULT 'offline',
  last_lat double precision,
  last_lng double precision,
  last_seen timestamptz,
  accept_rate numeric NOT NULL DEFAULT 0,
  avg_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drivers auth all" ON public.drivers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- insureds
CREATE TABLE public.insureds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cpf text,
  phone text,
  insurer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insureds TO authenticated;
GRANT ALL ON public.insureds TO service_role;
ALTER TABLE public.insureds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insureds auth all" ON public.insureds FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- protocols
CREATE SEQUENCE public.protocol_seq START 1000;

CREATE TABLE public.protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  client_name text NOT NULL,
  client_phone text,
  client_cpf text,
  origin text NOT NULL,
  destination text,
  origin_lat double precision,
  origin_lng double precision,
  service_type text,
  insurer text,
  city text,
  priority text NOT NULL DEFAULT 'normal',
  notes text,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'aguardando_aceite',
  created_by uuid,
  accepted_at timestamptz,
  en_route_at timestamptz,
  arrived_at timestamptz,
  service_started_at timestamptz,
  finished_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocols TO authenticated;
GRANT ALL ON public.protocols TO service_role;
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "protocols auth all" ON public.protocols FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_protocol_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.number IS NULL OR NEW.number = '' THEN
    NEW.number := 'AC-' || to_char(now(),'YYMM') || '-' || lpad(nextval('public.protocol_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER protocols_number BEFORE INSERT ON public.protocols
FOR EACH ROW EXECUTE FUNCTION public.set_protocol_number();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER protocols_touch BEFORE UPDATE ON public.protocols
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.protocol_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.protocol_events TO authenticated;
GRANT ALL ON public.protocol_events TO service_role;
ALTER TABLE public.protocol_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events auth read" ON public.protocol_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events auth insert" ON public.protocol_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_protocol_event()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.protocol_events (protocol_id, status) VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER protocols_event_insert AFTER INSERT ON public.protocols
FOR EACH ROW EXECUTE FUNCTION public.log_protocol_event();
CREATE TRIGGER protocols_event_update AFTER UPDATE ON public.protocols
FOR EACH ROW EXECUTE FUNCTION public.log_protocol_event();

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  sender_role text NOT NULL,
  sender_id uuid,
  sender_name text,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages auth all" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.location_history (
  id bigserial PRIMARY KEY,
  protocol_id uuid REFERENCES public.protocols(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.location_history TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.location_history_id_seq TO authenticated;
GRANT ALL ON public.location_history TO service_role;
GRANT ALL ON SEQUENCE public.location_history_id_seq TO service_role;
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations auth read" ON public.location_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "locations auth insert" ON public.location_history FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.audit_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid,
  action text NOT NULL,
  entity text,
  entity_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.audit_logs_id_seq TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
GRANT ALL ON SEQUENCE public.audit_logs_id_seq TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit auth read" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit auth insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, company)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'name', ''),
          COALESCE(NEW.email, ''),
          NEW.raw_user_meta_data->>'phone',
          NEW.raw_user_meta_data->>'company')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'operator'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.protocols;
ALTER PUBLICATION supabase_realtime ADD TABLE public.protocol_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_history;