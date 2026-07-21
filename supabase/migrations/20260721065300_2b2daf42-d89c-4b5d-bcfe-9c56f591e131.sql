
CREATE TABLE public.booking_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  requested_date DATE,
  requested_arrival_time TIME,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.booking_change_requests TO authenticated;
GRANT ALL ON public.booking_change_requests TO service_role;

ALTER TABLE public.booking_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own change requests"
  ON public.booking_change_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own change requests"
  ON public.booking_change_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update change requests"
  ON public.booking_change_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_booking_change_requests
  BEFORE UPDATE ON public.booking_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
