CREATE TABLE public.account_plans (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL DEFAULT 'free',
  requests_limit integer NOT NULL DEFAULT 10,
  requests_used integer NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL DEFAULT now(),
  period_end timestamptz NOT NULL DEFAULT (now() + interval '1 month'),
  status text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_plans_plan_id_check CHECK (plan_id IN ('free','start','growth','scale')),
  CONSTRAINT account_plans_used_check CHECK (requests_used >= 0),
  CONSTRAINT account_plans_limit_check CHECK (requests_limit >= 0)
);

GRANT SELECT ON public.account_plans TO authenticated;
GRANT ALL ON public.account_plans TO service_role;

ALTER TABLE public.account_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account plan read own" ON public.account_plans
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER account_plans_touch
  BEFORE UPDATE ON public.account_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.plan_request_limit(_plan text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _plan
    WHEN 'start' THEN 100
    WHEN 'growth' THEN 500
    WHEN 'scale' THEN 2000
    ELSE 10
  END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_account_plan()
RETURNS public.account_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  row_out public.account_plans;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória.';
  END IF;

  INSERT INTO public.account_plans (user_id)
  VALUES (uid)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO row_out FROM public.account_plans WHERE user_id = uid FOR UPDATE;

  IF row_out.period_end <= now() THEN
    WHILE row_out.period_end <= now() LOOP
      row_out.period_start := row_out.period_end;
      row_out.period_end := row_out.period_end + interval '1 month';
    END LOOP;

    UPDATE public.account_plans
       SET period_start = row_out.period_start,
           period_end = row_out.period_end,
           requests_used = 0,
           plan_id = CASE WHEN status = 'canceled' THEN 'free' ELSE plan_id END,
           requests_limit = CASE WHEN status = 'canceled' THEN public.plan_request_limit('free') ELSE requests_limit END,
           status = CASE WHEN status = 'canceled' THEN 'free' ELSE status END
     WHERE user_id = uid
    RETURNING * INTO row_out;
  END IF;

  RETURN row_out;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_request_slot()
RETURNS public.account_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_row public.account_plans;
  updated_row public.account_plans;
BEGIN
  current_row := public.ensure_account_plan();

  IF current_row.requests_used >= current_row.requests_limit THEN
    RETURN NULL;
  END IF;

  UPDATE public.account_plans
     SET requests_used = requests_used + 1
   WHERE user_id = current_row.user_id
     AND requests_used < requests_limit
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_request_slot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.account_plans
     SET requests_used = GREATEST(requests_used - 1, 0)
   WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_subscription_plan(
  _user_id uuid,
  _plan text,
  _status text,
  _period_start timestamptz,
  _period_end timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  start_at timestamptz := coalesce(_period_start, now());
  end_at timestamptz := coalesce(_period_end, coalesce(_period_start, now()) + interval '1 month');
  effective_plan text := CASE WHEN _plan IN ('free','start','growth','scale') THEN _plan ELSE 'free' END;
BEGIN
  INSERT INTO public.account_plans (user_id, plan_id, requests_limit, requests_used, period_start, period_end, status)
  VALUES (_user_id, effective_plan, public.plan_request_limit(effective_plan), 0, start_at, end_at, coalesce(_status, 'active'))
  ON CONFLICT (user_id) DO UPDATE
     SET plan_id = effective_plan,
         requests_limit = public.plan_request_limit(effective_plan),
         requests_used = CASE
           WHEN public.account_plans.plan_id <> effective_plan THEN 0
           WHEN public.account_plans.period_start <> start_at THEN 0
           ELSE public.account_plans.requests_used
         END,
         period_start = start_at,
         period_end = end_at,
         status = coalesce(_status, 'active');
END;
$$;

REVOKE ALL ON FUNCTION public.plan_request_limit(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_account_plan() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reserve_request_slot() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.release_request_slot() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.apply_subscription_plan(uuid, text, text, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.plan_request_limit(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_account_plan() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reserve_request_slot() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_request_slot() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.apply_subscription_plan(uuid, text, text, timestamptz, timestamptz) TO service_role;