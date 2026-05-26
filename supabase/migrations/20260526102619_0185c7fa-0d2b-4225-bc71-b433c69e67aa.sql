CREATE TABLE public.weekly_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week SMALLINT NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  is_closed BOOLEAN NOT NULL DEFAULT false,
  open_time TIME,
  close_time TIME,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone view weekly hours"
  ON public.weekly_hours FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "admins manage weekly hours"
  ON public.weekly_hours FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER weekly_hours_updated
  BEFORE UPDATE ON public.weekly_hours
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed defaults: closed Sun/Mon, open 09-18 Tue-Sat
INSERT INTO public.weekly_hours (day_of_week, is_closed, open_time, close_time) VALUES
  (0, true,  NULL, NULL),
  (1, true,  NULL, NULL),
  (2, false, '09:00', '18:00'),
  (3, false, '09:00', '18:00'),
  (4, false, '09:00', '18:00'),
  (5, false, '09:00', '18:00'),
  (6, false, '09:00', '18:00');