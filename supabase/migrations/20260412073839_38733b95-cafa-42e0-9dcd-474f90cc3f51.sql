
UPDATE storage.buckets SET public = false WHERE id = 'audio-uploads';

DROP POLICY IF EXISTS "authenticated_upload_audio" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_read_audio" ON storage.objects;
DROP POLICY IF EXISTS "upload_audio" ON storage.objects;
DROP POLICY IF EXISTS "read_audio" ON storage.objects;

CREATE POLICY "owner_upload_audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "owner_read_audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "service_role_audio"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'audio-uploads')
WITH CHECK (bucket_id = 'audio-uploads');
