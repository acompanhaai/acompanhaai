ALTER TABLE public.account_plans
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'live';

ALTER TABLE public.account_plans DROP CONSTRAINT IF EXISTS account_plans_environment_check;
ALTER TABLE public.account_plans
  ADD CONSTRAINT account_plans_environment_check CHECK (environment IN ('sandbox','live'));

ALTER TABLE public.account_plans DROP CONSTRAINT IF EXISTS account_plans_pkey;
ALTER TABLE public.account_plans
  ADD CONSTRAINT account_plans_pkey PRIMARY KEY (user_id, environment);

DROP FUNCTION IF EXISTS public.ensure_account_plan(uuid);
DROP FUNCTION IF EXISTS public.reserve_request_slot(uuid);
DROP FUNCTION IF EXISTS public.release_request_slot(uuid);
DROP FUNCTION IF EXISTS public.apply_subscription_plan(uuid, text, text, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.ensure_account_plan(_user_id uuid, _environment text)
RETURNS public.account_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  env text := CASE WHEN _environment = 'sandbox' THEN 'sandbox' ELSE 'live' END;
  row_out public.account_plans;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Conta inválida.';
  END IF;

  INSERT INTO public.account_plans (user_id, environment)
  VALUES (_user_id, env)
  ON CONFLICT (user_id, environment) DO NOTHING;

  SELECT * INTO row_out FROM public.account_plans
   WHERE user_id = _user_id AND environment = env FOR UPDATE;

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
     WHERE user_id = _user_id AND environment = env
    RETURNING * INTO row_out;
  END IF;

  RETURN row_out;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_request_slot(_user_id uuid, _environment text)
RETURNS public.account_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  env text := CASE WHEN _environment = 'sandbox' THEN 'sandbox' ELSE 'live' END;
  current_row public.account_plans;
  updated_row public.account_plans;
BEGIN
  current_row := public.ensure_account_plan(_user_id, env);

  IF current_row.requests_used >= current_row.requests_limit THEN
    RETURN NULL;
  END IF;

  UPDATE public.account_plans
     SET requests_used = requests_used + 1
   WHERE user_id = _user_id
     AND environment = env
     AND requests_used < requests_limit
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_request_slot(_user_id uuid, _environment text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  env text := CASE WHEN _environment = 'sandbox' THEN 'sandbox' ELSE 'live' END;
BEGIN
  UPDATE public.account_plans
     SET requests_used = GREATEST(requests_used - 1, 0)
   WHERE user_id = _user_id AND environment = env;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_subscription_plan(
  _user_id uuid,
  _plan text,
  _status text,
  _period_start timestamptz,
  _period_end timestamptz,
  _environment text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  env text := CASE WHEN _environment = 'sandbox' THEN 'sandbox' ELSE 'live' END;
  start_at timestamptz := coalesce(_period_start, now());
  end_at timestamptz := coalesce(_period_end, coalesce(_period_start, now()) + interval '1 month');
  effective_plan text := CASE WHEN _plan IN ('free','start','growth','scale') THEN _plan ELSE 'free' END;
BEGIN
  INSERT INTO public.account_plans (user_id, environment, plan_id, requests_limit, requests_used, period_start, period_end, status)
  VALUES (_user_id, env, effective_plan, public.plan_request_limit(effective_plan), 0, start_at, end_at, coalesce(_status, 'active'))
  ON CONFLICT (user_id, environment) DO UPDATE
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

REVOKE ALL ON FUNCTION public.ensure_account_plan(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_request_slot(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_request_slot(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_subscription_plan(uuid, text, text, timestamptz, timestamptz, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.ensure_account_plan(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_request_slot(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_request_slot(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_subscription_plan(uuid, text, text, timestamptz, timestamptz, text) TO service_role;