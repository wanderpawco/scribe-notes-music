import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MUSIC_AI_BASE = "https://api.music.ai/v1";

const instrumentMapping: Record<string, Record<string, boolean>> = {
  "Vocals": { vocals: true },
  "Lead Vocals": { lead_vocals: true },
  "Backing Vocals": { backing_vocals: true },
  "Drums": { drums: true, kick_drum: true, snare_drum: true, toms: true, "hi-hat": true, cymbals: true },
  "Bass": { bass: true },
  "Electric Guitar": { electric_guitar: true, guitars: true },
  "Acoustic Guitar": { acoustic_guitar: true, guitars: true },
  "Piano": { piano: true },
  "Organ": { keys: true },
  "Strings": { strings: true },
  "Brass": { wind: true },
  "Woodwinds": { wind: true },
};

const allStemParams = [
  "vocals", "drums", "bass", "guitars", "strings", "piano", "keys", "wind",
  "lead_vocals", "backing_vocals", "kick_drum", "snare_drum", "toms",
  "hi-hat", "cymbals", "rhythm_guitars", "solo_guitars", "acoustic_guitar",
  "electric_guitar", "other",
];

function buildStemParams(selectedInstruments: string[]): Record<string, boolean> {
  const params: Record<string, boolean> = {};
  for (const key of allStemParams) params[key] = false;
  for (const inst of selectedInstruments) {
    const mapping = instrumentMapping[inst];
    if (mapping) {
      for (const [key, val] of Object.entries(mapping)) {
        if (val) params[key] = true;
      }
    }
  }
  return params;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const MUSIC_AI_API_KEY = Deno.env.get("MUSIC_AI_API_KEY");
  if (!MUSIC_AI_API_KEY) {
    return new Response(JSON.stringify({ error: "MUSIC_AI_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { transcription_id, audio_url, selected_instruments } = await req.json();
    
    // Update status to separating
    await supabase.from("transcriptions")
      .update({ status: "separating" })
      .eq("id", transcription_id);

    // Create Music.AI job
    const stemParams = buildStemParams(selected_instruments);
    const jobRes = await fetch(`${MUSIC_AI_BASE}/job`, {
      method: "POST",
      headers: { "Authorization": MUSIC_AI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `ScribeNoter-${transcription_id}`,
        workflow: "untitled-workflow-36652e8",
        params: { inputUrl: audio_url, ...stemParams },
      }),
    });

    console.log("Submitting to Music.AI:", JSON.stringify({
      workflow: "untitled-workflow-36652e8",
      inputUrl: audio_url,
      stemParams
    }));

    if (!jobRes.ok) {
      const errText = await jobRes.text();
      throw new Error(`Music.AI job creation failed [${jobRes.status}]: ${errText}`);
    }

    const { id: musicAiJobId } = await jobRes.json();
    
    // Store job ID
    await supabase.from("transcriptions")
      .update({ music_ai_job_id: musicAiJobId })
      .eq("id", transcription_id);

    return new Response(JSON.stringify({ success: true, music_ai_job_id: musicAiJobId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    try {
      const body = await req.clone().json();
      if (body.transcription_id) {
        await supabase.from("transcriptions")
          .update({ status: "failed", error_message: msg })
          .eq("id", body.transcription_id);
      }
    } catch { /* ignore */ }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
