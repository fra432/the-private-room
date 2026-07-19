
-- Case-insensitive uniqueness for pending/approved access requests
CREATE UNIQUE INDEX IF NOT EXISTS access_requests_unique_active_email
  ON public.access_requests (lower(email))
  WHERE status IN ('pending', 'approved');

-- Trigger: block new requests when an account already exists for that email
CREATE OR REPLACE FUNCTION public.access_requests_block_existing_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(email) = lower(NEW.email)) THEN
    RAISE EXCEPTION 'account_exists' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS access_requests_block_existing_account_trg ON public.access_requests;
CREATE TRIGGER access_requests_block_existing_account_trg
  BEFORE INSERT ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.access_requests_block_existing_account();

-- Public helper to check email status before submitting
CREATE OR REPLACE FUNCTION public.check_access_email_status(_email text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _e text := lower(trim(_email));
  _s text;
BEGIN
  IF _e IS NULL OR _e = '' THEN RETURN 'none'; END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(email) = _e) THEN
    RETURN 'account_exists';
  END IF;

  SELECT status::text INTO _s
  FROM public.access_requests
  WHERE lower(email) = _e
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN COALESCE(_s, 'none');
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_access_email_status(text) TO anon, authenticated;
