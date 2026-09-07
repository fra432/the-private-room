ALTER TABLE public.bookings
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS created_by_admin boolean NOT NULL DEFAULT false;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_client_or_guest_chk
  CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL AND length(trim(guest_name)) > 0));

CREATE POLICY "admins create bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));