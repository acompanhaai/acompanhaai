-- The public /contato form only showed a success toast and threw the
-- submission away. Give it somewhere real to land.
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
-- Submitted anonymously from the public marketing site (no auth.uid()),
-- so writes go through the server-role client. Readable by any
-- authenticated teammate for now — narrow this to an admin role once
-- staff roles/permissions exist.
GRANT SELECT ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
CREATE POLICY "contact_messages auth read" ON public.contact_messages FOR SELECT TO authenticated USING (true);
