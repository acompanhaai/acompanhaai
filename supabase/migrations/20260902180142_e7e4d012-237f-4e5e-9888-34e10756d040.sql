DROP FUNCTION IF EXISTS public.ensure_account_plan();
DROP FUNCTION IF EXISTS public.reserve_request_slot();
DROP FUNCTION IF EXISTS public.release_request_slot();

CREATE OR REPLACE FUNCTION public.ensure_account_plan(_user_id uuid)
RETURNS public.account_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_out public.account_plans;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Conta inválida.';
  END IF;

  INSERT INTO public.account_plans (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO row_out FROM public.account_plans WHERE user_id = _user_id FOR UPDATE;

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
     WHERE user_id = _user_id
    RETURNING * INTO row_out;
  END IF;

  RETURN row_out;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_request_slot(_user_id uuid)
RETURNS public.account_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_row public.account_plans;
  updated_row public.account_plans;
BEGIN
  current_row := public.ensure_account_plan(_user_id);

  IF current_row.requests_used >= current_row.requests_limit THEN
    RETURN NULL;
  END IF;

  UPDATE public.account_plans
     SET requests_used = requests_used + 1
   WHERE user_id = _user_id
     AND requests_used < requests_limit
  RETURNING * INTO updated_row;

  RETURN updated_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_request_slot(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.account_plans
     SET requests_used = GREATEST(requests_used - 1, 0)
   WHERE user_id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_account_plan(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_request_slot(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_request_slot(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_account_plan(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_request_slot(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_request_slot(uuid) TO service_role;