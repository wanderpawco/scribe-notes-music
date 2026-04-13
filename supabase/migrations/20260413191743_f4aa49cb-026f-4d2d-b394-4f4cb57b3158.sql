CREATE POLICY "allow_anon_insert_outputs" 
ON public.transcription_outputs
FOR INSERT
TO anon
WITH CHECK (true);