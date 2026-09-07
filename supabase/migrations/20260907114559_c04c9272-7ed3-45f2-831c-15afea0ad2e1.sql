CREATE TABLE public.booking_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX booking_notes_booking_id_idx ON public.booking_notes(booking_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_notes TO authenticated;
GRANT ALL ON public.booking_notes TO service_role;

ALTER TABLE public.booking_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins view booking notes" ON public.booking_notes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert booking notes" ON public.booking_notes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND author_id = auth.uid());
CREATE POLICY "admins update booking notes" ON public.booking_notes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete booking notes" ON public.booking_notes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER booking_notes_touch_updated_at BEFORE UPDATE ON public.booking_notes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();