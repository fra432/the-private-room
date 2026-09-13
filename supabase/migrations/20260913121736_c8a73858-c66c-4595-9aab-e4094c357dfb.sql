CREATE OR REPLACE FUNCTION public.is_booking_date_available(_date date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE date = _date
      AND status = 'confirmed'::public.booking_status
  )
$$;

REVOKE ALL ON FUNCTION public.is_booking_date_available(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_booking_date_available(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_booking_date_available(date) TO service_role;

DROP POLICY IF EXISTS "users create own bookings" ON public.bookings;
CREATE POLICY "users create own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'::public.booking_status
  AND date >= CURRENT_DATE
  AND (notes IS NULL OR length(notes) <= 1000)
  AND public.is_booking_date_available(date)
);