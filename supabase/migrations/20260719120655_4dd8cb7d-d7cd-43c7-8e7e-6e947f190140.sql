GRANT SELECT (id) ON public.access_requests TO anon;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'access_requests'
      AND policyname = 'anon can read request ids only'
  ) THEN
    CREATE POLICY "anon can read request ids only"
      ON public.access_requests
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;