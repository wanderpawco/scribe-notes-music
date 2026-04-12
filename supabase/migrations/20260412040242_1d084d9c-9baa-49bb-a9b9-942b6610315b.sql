
-- Create transcriptions table
CREATE TABLE public.transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  selected_instruments TEXT[] NOT NULL DEFAULT '{}',
  detected_key TEXT DEFAULT 'C Major',
  detected_bpm INTEGER DEFAULT 120,
  music_ai_job_id TEXT,
  stem_urls JSONB,
  error_message TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transcription_outputs table
CREATE TABLE public.transcription_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transcription_id UUID NOT NULL REFERENCES public.transcriptions(id) ON DELETE CASCADE,
  instrument TEXT NOT NULL,
  format TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcription_outputs ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (no auth yet)
CREATE POLICY "Allow public read transcriptions" ON public.transcriptions FOR SELECT USING (true);
CREATE POLICY "Allow public insert transcriptions" ON public.transcriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update transcriptions" ON public.transcriptions FOR UPDATE USING (true);

CREATE POLICY "Allow public read transcription_outputs" ON public.transcription_outputs FOR SELECT USING (true);
CREATE POLICY "Allow public insert transcription_outputs" ON public.transcription_outputs FOR INSERT WITH CHECK (true);

-- Create audio-uploads storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-uploads', 'audio-uploads', true);

-- Storage policies for audio uploads
CREATE POLICY "Allow public upload audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio-uploads');
CREATE POLICY "Allow public read audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio-uploads');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON public.transcriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
