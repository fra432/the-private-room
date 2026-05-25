
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  hair_type TEXT NOT NULL,
  hair_length TEXT NOT NULL,
  hair_color TEXT NOT NULL,
  treatments TEXT,
  allergies TEXT,
  goals TEXT NOT NULL,
  inspiration TEXT,
  additional TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own questionnaire"
  ON public.questionnaires FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own questionnaire"
  ON public.questionnaires FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND length(trim(hair_type)) BETWEEN 1 AND 100
    AND length(trim(hair_length)) BETWEEN 1 AND 100
    AND length(trim(hair_color)) BETWEEN 1 AND 100
    AND length(trim(goals)) BETWEEN 1 AND 2000
    AND (treatments IS NULL OR length(treatments) <= 2000)
    AND (allergies IS NULL OR length(allergies) <= 2000)
    AND (inspiration IS NULL OR length(inspiration) <= 2000)
    AND (additional IS NULL OR length(additional) <= 2000)
  );

CREATE POLICY "users update own questionnaire"
  ON public.questionnaires FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins view all questionnaires"
  ON public.questionnaires FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_questionnaires_updated_at
  BEFORE UPDATE ON public.questionnaires
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
