-- Real cross-tenant leak found by testing with two real accounts: an
-- intermediate pre-multi-tenancy migration (20260831204026) added
-- is_staff()-based policies to several tables that grant access to ANY
-- admin/operator regardless of company. Postgres OR-combines permissive
-- RLS policies for the same command, so these kept working alongside the
-- company-scoped policies from 20260905120000 and silently defeated them.
--
-- The company-scoped "FOR ALL" / read+insert policies already cover every
-- legitimate access pattern these provided (staff seeing all company rows,
-- drivers seeing their own protocols/messages/locations — a driver's
-- profile has the same company_id, so the company-wide policy already
-- includes them), so this is a pure drop, nothing to replace them with.

DROP POLICY IF EXISTS "drivers staff manage" ON public.drivers;
DROP POLICY IF EXISTS "drivers read own" ON public.drivers;
DROP POLICY IF EXISTS "drivers update own" ON public.drivers;

DROP POLICY IF EXISTS "insureds staff manage" ON public.insureds;

DROP POLICY IF EXISTS "protocols staff manage" ON public.protocols;
DROP POLICY IF EXISTS "protocols driver read" ON public.protocols;
DROP POLICY IF EXISTS "protocols driver update" ON public.protocols;

DROP POLICY IF EXISTS "events staff read" ON public.protocol_events;
DROP POLICY IF EXISTS "events staff insert" ON public.protocol_events;
DROP POLICY IF EXISTS "events driver read" ON public.protocol_events;
DROP POLICY IF EXISTS "events driver insert" ON public.protocol_events;

DROP POLICY IF EXISTS "messages staff manage" ON public.messages;
DROP POLICY IF EXISTS "messages driver read" ON public.messages;
DROP POLICY IF EXISTS "messages driver insert" ON public.messages;

DROP POLICY IF EXISTS "locations staff read" ON public.location_history;
DROP POLICY IF EXISTS "locations driver read" ON public.location_history;
DROP POLICY IF EXISTS "locations driver insert" ON public.location_history;

DROP POLICY IF EXISTS "audit staff read" ON public.audit_logs;
