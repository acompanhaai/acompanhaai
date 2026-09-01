-- Integridade dos motoristas
ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS drivers_re_required;
ALTER TABLE public.drivers ADD CONSTRAINT drivers_re_required CHECK (btrim(re) <> '');

-- Integridade das solicitações novas (NOT VALID preserva protocolos legados)
ALTER TABLE public.protocols DROP CONSTRAINT IF EXISTS protocols_required_data;
ALTER TABLE public.protocols ADD CONSTRAINT protocols_required_data CHECK (
  btrim(client_name) <> ''
  AND client_cpf IS NOT NULL AND client_cpf ~ '^[0-9]{11}$'
  AND client_phone IS NOT NULL AND client_phone ~ '^[0-9]{10,11}$'
  AND address_cep IS NOT NULL AND address_cep ~ '^[0-9]{8}$'
  AND address_street IS NOT NULL AND btrim(address_street) <> ''
  AND address_number IS NOT NULL AND btrim(address_number) <> ''
  AND address_district IS NOT NULL AND btrim(address_district) <> ''
  AND city IS NOT NULL AND btrim(city) <> ''
  AND address_state IS NOT NULL AND address_state ~ '^[A-Z]{2}$'
) NOT VALID;

ALTER TABLE public.protocols DROP CONSTRAINT IF EXISTS protocols_service_type_allowed;
ALTER TABLE public.protocols ADD CONSTRAINT protocols_service_type_allowed CHECK (
  service_type IN ('Taxi','Reboque','Chaveiro','Mecânico','Troca de pneu','Recarga de bateria')
) NOT VALID;

-- Validação de CPF com dígitos verificadores e telefone brasileiro.
CREATE OR REPLACE FUNCTION public.is_valid_cpf(value text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE digits text := regexp_replace(coalesce(value, ''), '\D', '', 'g');
DECLARE sum_one integer := 0;
DECLARE sum_two integer := 0;
DECLARE i integer;
DECLARE digit integer;
BEGIN
  IF digits !~ '^[0-9]{11}$' OR digits ~ '^([0-9])\1{10}$' THEN RETURN false; END IF;
  FOR i IN 1..9 LOOP sum_one := sum_one + substr(digits, i, 1)::integer * (11-i); END LOOP;
  digit := (sum_one * 10) % 11; IF digit = 10 THEN digit := 0; END IF;
  IF digit <> substr(digits, 10, 1)::integer THEN RETURN false; END IF;
  FOR i IN 1..10 LOOP sum_two := sum_two + substr(digits, i, 1)::integer * (12-i); END LOOP;
  digit := (sum_two * 10) % 11; IF digit = 10 THEN digit := 0; END IF;
  RETURN digit = substr(digits, 11, 1)::integer;
END; $$;

CREATE OR REPLACE FUNCTION public.is_valid_br_phone(value text)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE digits text := regexp_replace(coalesce(value, ''), '\D', '', 'g');
BEGIN
  RETURN digits ~ '^[1-9][1-9](9[0-9]{8}|[2-5][0-9]{7})$';
END; $$;

ALTER TABLE public.protocols DROP CONSTRAINT IF EXISTS protocols_client_cpf_valid;
ALTER TABLE public.protocols ADD CONSTRAINT protocols_client_cpf_valid CHECK (public.is_valid_cpf(client_cpf)) NOT VALID;
ALTER TABLE public.protocols DROP CONSTRAINT IF EXISTS protocols_client_phone_valid;
ALTER TABLE public.protocols ADD CONSTRAINT protocols_client_phone_valid CHECK (public.is_valid_br_phone(client_phone)) NOT VALID;

-- Apenas transições válidas são aceitas para alterações feitas fora da base.
CREATE OR REPLACE FUNCTION public.guard_protocol_transition()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND OLD.status NOT IN ('concluido','cancelado')
     AND NEW.status NOT IN ('cancelado','concluido')
     AND NOT (
       (OLD.status = 'aguardando_aceite' AND NEW.status = 'aceito') OR
       (OLD.status = 'aceito' AND NEW.status = 'em_deslocamento') OR
       (OLD.status = 'em_deslocamento' AND NEW.status = 'chegou') OR
       (OLD.status = 'chegou' AND NEW.status = 'em_atendimento')
     )
     AND coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') <> 'service_role'
     AND NOT public.is_staff()
  THEN
    RAISE EXCEPTION 'Transição de status inválida.';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS protocols_guard_transition ON public.protocols;
CREATE TRIGGER protocols_guard_transition BEFORE UPDATE OF status ON public.protocols
  FOR EACH ROW EXECUTE FUNCTION public.guard_protocol_transition();
REVOKE ALL ON FUNCTION public.guard_protocol_transition() FROM PUBLIC, anon, authenticated;

-- O código só pode ser criado pelos gatilhos internos; clientes não podem alterá-lo.
REVOKE INSERT, UPDATE, DELETE ON public.protocol_codes FROM authenticated;
REVOKE ALL ON FUNCTION public.is_valid_cpf(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_valid_br_phone(text) FROM PUBLIC, anon, authenticated;