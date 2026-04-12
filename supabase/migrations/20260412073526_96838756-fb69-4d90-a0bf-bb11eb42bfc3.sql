
-- Drop all existing policies
DROP POLICY IF EXISTS "Users read own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users insert own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Users update own transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "Service role full access transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "service_role_transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "owner_read_transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "owner_insert_transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "owner_update_transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "anon_insert_transcriptions" ON public.transcriptions;
DROP POLICY IF EXISTS "anon_read_transcriptions" ON public.transcriptions;

DROP POLICY IF EXISTS "Users read own outputs" ON public.transcription_outputs;
DROP POLICY IF EXISTS "Service role full access outputs" ON public.transcription_outputs;
DROP POLICY IF EXISTS "Insert own outputs" ON public.transcription_outputs;
DROP POLICY IF EXISTS "service_role_outputs" ON public.transcription_outputs;
DROP POLICY IF EXISTS "owner_read_outputs" ON public.transcription_outputs;
DROP POLICY IF EXISTS "anon_read_outputs" ON public.transcription_outputs;

DROP POLICY IF EXISTS "Authenticated upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Users read own audio" ON storage.objects;
DROP POLICY IF EXISTS "upload_audio" ON storage.objects;
DROP POLICY IF EXISTS "read_audio" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_upload_audio" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_read_audio" ON storage.objects;

-- TRANSCRIPTIONS: strict authenticated policies
CREATE POLICY "service_role_transcriptions"
ON public.transcriptions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "owner_read_transcriptions"
ON public.transcriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "owner_insert_transcriptions"
ON public.transcriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner_update_transcriptions"
ON public.transcriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- TRANSCRIPTION OUTPUTS: strict authenticated policies
CREATE POLICY "service_role_outputs"
ON public.transcription_outputs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "owner_read_outputs"
ON public.transcription_outputs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transcriptions t
    WHERE t.id = transcription_id
    AND t.user_id = auth.uid()
  )
);

-- STORAGE: authenticated only
CREATE POLICY "authenticated_upload_audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio-uploads');

CREATE POLICY "authenticated_read_audio"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audio-uploads');
