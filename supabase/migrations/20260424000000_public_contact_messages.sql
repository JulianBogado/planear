CREATE TABLE IF NOT EXISTS public_contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  ip_hash text,
  user_agent text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'email_failed')),
  source text NOT NULL DEFAULT 'public_contact_form',
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public_contact_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public_contact_messages FROM anon, authenticated;
GRANT ALL ON public_contact_messages TO service_role;
