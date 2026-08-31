-- has_role no longer needs elevated privileges: it only reads the caller's own rows
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','operator')
  )
$$;

CREATE OR REPLACE FUNCTION public.current_driver_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT id FROM public.drivers WHERE user_id = auth.uid() LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_driver_id() TO authenticated;

-- trigger function runs with owner privileges so status events are always logged
CREATE OR REPLACE FUNCTION public.log_protocol_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.protocol_events (protocol_id, status) VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.log_protocol_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_protocol_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- drivers
DROP POLICY IF EXISTS "drivers auth all" ON public.drivers;
CREATE POLICY "drivers staff manage" ON public.drivers FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "drivers read own" ON public.drivers FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "drivers update own" ON public.drivers FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- insureds
DROP POLICY IF EXISTS "insureds auth all" ON public.insureds;
CREATE POLICY "insureds staff manage" ON public.insureds FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- protocols
DROP POLICY IF EXISTS "protocols auth all" ON public.protocols;
CREATE POLICY "protocols staff manage" ON public.protocols FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "protocols driver read" ON public.protocols FOR SELECT TO authenticated
  USING (
    public.current_driver_id() IS NOT NULL
    AND (driver_id = public.current_driver_id() OR status = 'aguardando_aceite')
  );
CREATE POLICY "protocols driver update" ON public.protocols FOR UPDATE TO authenticated
  USING (
    public.current_driver_id() IS NOT NULL
    AND (driver_id = public.current_driver_id() OR status = 'aguardando_aceite')
  )
  WITH CHECK (driver_id = public.current_driver_id());

-- protocol_events
DROP POLICY IF EXISTS "events auth read" ON public.protocol_events;
DROP POLICY IF EXISTS "events auth insert" ON public.protocol_events;
CREATE POLICY "events staff read" ON public.protocol_events FOR SELECT TO authenticated
  USING (public.is_staff());
CREATE POLICY "events staff insert" ON public.protocol_events FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());
CREATE POLICY "events driver read" ON public.protocol_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.protocols p
    WHERE p.id = protocol_id AND p.driver_id = public.current_driver_id()
  ));
CREATE POLICY "events driver insert" ON public.protocol_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.protocols p
    WHERE p.id = protocol_id AND p.driver_id = public.current_driver_id()
  ));

-- messages
DROP POLICY IF EXISTS "messages auth all" ON public.messages;
CREATE POLICY "messages staff manage" ON public.messages FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY "messages driver read" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.protocols p
    WHERE p.id = protocol_id AND p.driver_id = public.current_driver_id()
  ));
CREATE POLICY "messages driver insert" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.protocols p
      WHERE p.id = protocol_id AND p.driver_id = public.current_driver_id()
    )
  );

-- location_history
DROP POLICY IF EXISTS "locations auth read" ON public.location_history;
DROP POLICY IF EXISTS "locations auth insert" ON public.location_history;
CREATE POLICY "locations staff read" ON public.location_history FOR SELECT TO authenticated
  USING (public.is_staff());
CREATE POLICY "locations driver read" ON public.location_history FOR SELECT TO authenticated
  USING (driver_id = public.current_driver_id());
CREATE POLICY "locations driver insert" ON public.location_history FOR INSERT TO authenticated
  WITH CHECK (driver_id = public.current_driver_id());

-- audit_logs
DROP POLICY IF EXISTS "audit auth read" ON public.audit_logs;
CREATE POLICY "audit staff read" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_staff());