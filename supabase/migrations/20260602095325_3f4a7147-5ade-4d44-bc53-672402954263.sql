
ALTER TABLE public.questionnaires ADD COLUMN IF NOT EXISTS goal_images text[] NOT NULL DEFAULT '{}';

CREATE POLICY "users view own questionnaire images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'questionnaire-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "admins view all questionnaire images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'questionnaire-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users upload own questionnaire images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'questionnaire-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users update own questionnaire images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'questionnaire-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users delete own questionnaire images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'questionnaire-images' AND auth.uid()::text = (storage.foldername(name))[1]);
