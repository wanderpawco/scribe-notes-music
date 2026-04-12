import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MUSIC_AI_BASE = "https://api.music.ai/v1";
const BASIC_PITCH_BASE = "https://scribenoter-transcription-api.onrender.com";

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

function getPrimaryStemKeys(instrument: string): string[] {
  const mapping = instrumentMapping[instrument];
  if (!mapping) return [];
  return Object.keys(mapping);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const MUSIC_AI_API_KEY = Deno.env.get("MUSIC_AI_API_KEY");

  try {
    const { transcription_id } = await req.json();

    // Get transcription record
    const { data: txn, error } = await supabase
      .from("transcriptions")
      .select("music_ai_job_id, selected_instruments, status")
      .eq("id", transcription_id)
      .single();

    if (error || !txn) throw new Error("Transcription not found");
    if (txn.status !== "separating") {
      return new Response(JSON.stringify({ status: txn.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check Music.AI job status
    const statusRes = await fetch(`${MUSIC_AI_BASE}/job/${txn.music_ai_job_id}`, {
      headers: { "Authorization": MUSIC_AI_API_KEY! },
    });
    if (!statusRes.ok) throw new Error(`Music.AI poll failed: ${statusRes.status}`);
    
    const statusData = await statusRes.json();

    if (statusData.status === "QUEUED" || statusData.status === "STARTED") {
      return new Response(JSON.stringify({ status: "separating" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (statusData.status === "FAILED") {
      await supabase.from("transcriptions")
        .update({ status: "failed", error_message: "Music.AI stem separation failed" })
        .eq("id", transcription_id);
      return new Response(JSON.stringify({ status: "failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (statusData.status === "SUCCEEDED") {
      const result = statusData.result || {};
      
      // Build Basic Pitch job IDs map
      const basicPitchJobIds: Record<string, string> = {};
      
      // Submit Basic Pitch job for each selected instrument
      await Promise.all(txn.selected_instruments.map(async (instrument: string) => {
        const stemKeys = getPrimaryStemKeys(instrument);
        let stemUrl: string | null = null;
        for (const key of stemKeys) {
          if (result[key]) { stemUrl = result[key]; break; }
        }
        if (!stemUrl) {
          console.warn(`No stem URL for ${instrument}`);
          return;
        }

        const bpJobId = `${transcription_id}_${instrument.toLowerCase().replace(/\s+/g, "_")}`;
        basicPitchJobIds[instrument] = bpJobId;

        const bpRes = await fetch(`${BASIC_PITCH_BASE}/transcribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio_url: stemUrl, instrument, job_id: bpJobId }),
        });
        if (!bpRes.ok) console.error(`Basic Pitch submit failed for ${instrument}`);
      }));

      // Update transcription with stem URLs and Basic Pitch job IDs
      await supabase.from("transcriptions").update({
        stem_urls: result,
        basic_pitch_job_ids: basicPitchJobIds,
        status: "transcribing",
      }).eq("id", transcription_id);

      return new Response(JSON.stringify({ status: "transcribing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "separating" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
