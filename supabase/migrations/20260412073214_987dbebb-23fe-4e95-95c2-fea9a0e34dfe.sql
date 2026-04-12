
-- 1. Remove permissive public policies
DROP POLICY IF EXISTS "Allow public read transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Allow public insert transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Allow public update transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Allow public read transcription_outputs" ON public.transcription_outputs;
DROP POLICY IF EXISTS "Allow public insert transcription_outputs" ON public.transcription_outputs;

-- 2. Add user_id column
ALTER TABLE public.transcriptions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 3. Secure RLS policies for transcriptions
CREATE POLICY "Users read own transcriptions"
ON public.transcriptions FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users insert own transcriptions"
ON public.transcriptions FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users update own transcriptions"
ON public.transcriptions FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access transcriptions"
ON public.transcriptions FOR ALL
USING (auth.role() = 'service_role');

-- 4. Secure RLS policies for transcription_outputs
CREATE POLICY "Users read own outputs"
ON public.transcription_outputs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.transcriptions t
    WHERE t.id = transcription_id
    AND (t.user_id = auth.uid() OR t.user_id IS NULL)
  )
);

CREATE POLICY "Service role full access outputs"
ON public.transcription_outputs FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Insert own outputs"
ON public.transcription_outputs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transcriptions t
    WHERE t.id = transcription_id
    AND (t.user_id = auth.uid() OR t.user_id IS NULL)
  )
);

-- 5. Lock down audio-uploads storage
DROP POLICY IF EXISTS "Allow public upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read audio" ON storage.objects;

CREATE POLICY "Authenticated upload audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio-uploads'
  AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

CREATE POLICY "Users read own audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-uploads');
