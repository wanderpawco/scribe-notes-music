CREATE POLICY "allow_anon_update_transcriptions" 
ON public.transcriptions
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);