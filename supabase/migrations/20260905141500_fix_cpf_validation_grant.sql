-- Real bug found by testing protocol creation with a real account:
-- protocols_client_cpf_valid / protocols_client_phone_valid CHECK
-- constraints call public.is_valid_cpf() / is_valid_br_phone(), but a
-- previous migration revoked EXECUTE on both from `authenticated`. Neither
-- function is SECURITY DEFINER, so they run as the calling role — meaning
-- every INSERT/UPDATE into protocols by an authenticated user (i.e. every
-- protocol creation through the app) failed with "permission denied for
-- function is_valid_cpf". Core product feature was broken.
--
-- These are pure validation functions (regex/digit-check math, IMMUTABLE,
-- no data access) — revoking EXECUTE only ever stopped them from being
-- usable as-is by the very inserts that need them, it bought no real
-- security. Grant EXECUTE back to authenticated.
GRANT EXECUTE ON FUNCTION public.is_valid_cpf(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_br_phone(text) TO authenticated;
