-- 1) Motoristas: RE obrigatório e único
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS re text;

CREATE SEQUENCE IF NOT EXISTS public.driver_re_seq START 10001;

UPDATE public.drivers
SET re = 'RE-' || lpad(nextval('public.driver_re_seq')::text, 5, '0')
WHERE re IS NULL OR btrim(re) = '';

ALTER TABLE public.drivers ALTER COLUMN re SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS drivers_re_key ON public.drivers (re);

-- 2) Solicitações: endereço completo estruturado
ALTER TABLE public.protocols
  ADD COLUMN IF NOT EXISTS address_cep text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS address_district text,
  ADD COLUMN IF NOT EXISTS address_state text;

-- 3) Tipos de serviço permitidos (NOT VALID para preservar dados antigos)
ALTER TABLE public.protocols DROP CONSTRAINT IF EXISTS protocols_service_type_allowed;
ALTER TABLE public.protocols
  ADD CONSTRAINT protocols_service_type_allowed
  CHECK (service_type IN ('Taxi','Reboque','Chaveiro','Mecânico','Troca de pneu','Recarga de bateria'))
  NOT VALID;

-- 4) Código de confirmação de 4 dígitos, isolado do motorista
CREATE TABLE IF NOT EXISTS public.protocol_codes (
  protocol_id uuid PRIMARY KEY REFERENCES public.protocols(id) ON DELETE CASCADE,
  code text NOT NULL CHECK (code ~ '^[0-9]{4}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.protocol_codes TO service_role;
GRANT SELECT ON public.protocol_codes TO authenticated;

ALTER TABLE public.protocol_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "codes staff read" ON public.protocol_codes;
CREATE POLICY "codes staff read" ON public.protocol_codes
  FOR SELECT TO authenticated USING (public.is_staff());

DROP TRIGGER IF EXISTS protocol_codes_touch ON public.protocol_codes;
CREATE TRIGGER protocol_codes_touch BEFORE UPDATE ON public.protocol_codes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5) Geração automática do código ao entrar em deslocamento
CREATE OR REPLACE FUNCTION public.ensure_protocol_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('em_deslocamento','chegou','em_atendimento') THEN
    INSERT INTO public.protocol_codes (protocol_id, code)
    VALUES (NEW.id, lpad((floor(random() * 9000) + 1000)::int::text, 4, '0'))
    ON CONFLICT (protocol_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS protocols_ensure_code ON public.protocols;
CREATE TRIGGER protocols_ensure_code AFTER INSERT OR UPDATE OF status ON public.protocols
  FOR EACH ROW EXECUTE FUNCTION public.ensure_protocol_code();

-- 6) Somente base ou backend validado podem finalizar
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
    IF jwt_role <> 'service_role' AND NOT public.is_staff() THEN
      RAISE EXCEPTION 'Finalização exige validação do código de confirmação do cliente.';
    END IF;
  END IF;

  IF OLD.status = 'concluido' AND NEW.status = 'concluido' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS protocols_guard_finish ON public.protocols;
CREATE TRIGGER protocols_guard_finish BEFORE UPDATE ON public.protocols
  FOR EACH ROW EXECUTE FUNCTION public.guard_protocol_finish();