CREATE OR REPLACE FUNCTION public.guard_protocol_finish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text;
BEGIN
  IF NEW.status = 'concluido' AND OLD.status IS DISTINCT FROM 'concluido' THEN
    jwt_role := coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
      ''
    );
    IF jwt_role <> 'service_role' THEN
      RAISE EXCEPTION 'Finalização exige validação do código de confirmação do cliente.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_protocol_finish() FROM PUBLIC, anon, authenticated;