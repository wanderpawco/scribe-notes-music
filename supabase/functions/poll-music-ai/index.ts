import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MUSIC_AI_BASE = "https://api.music.ai/v1";
const BASIC_PITCH_BASE = "https://scribenoter-transcription-api.onrender.com";

function findStemUrl(
  instrument: string, 
  result: Record<string, string>
): string | null {
  console.log("Available stem keys from Music.AI:", Object.keys(result));
  
  const normalizedResult: Record<string, string> = {};
  for (const [key, val] of Object.entries(result)) {
    normalizedResult[key.toLowerCase()] = val;
  }
  
  const keyVariants: Record<string, string[]> = {
    "Vocals": ["vocals", "vocal", "voice", "voices", "singing"],
    "Lead Vocals": ["lead_vocals", "lead vocals", "leadVocals", "vocals", "vocal", "voice"],
    "Backing Vocals": ["backing_vocals", "backing vocals", "backingVocals", "backing", "vocals", "voice"],
    "Drums": ["drums", "drum", "percussion"],
    "Bass": ["bass", "bass_guitar", "bassGuitar", "electric_bass", "low_end"],
    "Electric Guitar": ["guitar", "guitars", "electric_guitar", "electricGuitar", "electric"],
    "Acoustic Guitar": ["guitar", "guitars", "acoustic_guitar", "acousticGuitar", "acoustic"],
    "Piano": ["piano", "keys", "keyboard", "keyboards", "piano_keys"],
    "Organ": ["organ", "keys", "keyboard", "keyboards"],
    "Strings": ["strings", "string", "violin", "viola", "cello", "orchestra", "orchestral"],
    "Brass": ["wind", "brass", "winds", "horn", "horns", "woodwind"],
    "Woodwinds": ["wind", "woodwind", "woodwinds", "winds", "flute"],
    "Trumpet": ["trumpet", "brass", "wind", "horn", "horns"],
    "Flugelhorn": ["flugelhorn", "brass", "wind", "horn"],
    "French Horn": ["french_horn", "frenchhorn", "horn", "brass", "wind"],
    "Trombone": ["trombone", "brass", "wind", "bone"],
    "Baritone/Euphonium": ["baritone", "euphonium", "brass", "wind"],
    "Tuba": ["tuba", "brass", "wind", "bass_brass"],
    "Flute": ["flute", "woodwind", "wind", "winds"],
    "Oboe": ["oboe", "woodwind", "wind", "winds"],
    "Clarinet": ["clarinet", "woodwind", "wind", "winds"],
    "Alto Saxophone": ["alto_sax", "alto saxophone", "alto", "sax", "saxophone", "woodwind"],
    "Tenor Saxophone": ["tenor_sax", "tenor saxophone", "tenor", "sax", "saxophone", "woodwind"],
    "Soprano Saxophone": ["soprano_sax", "soprano saxophone", "soprano", "sax", "saxophone", "woodwind"],
    "Bassoon": ["bassoon", "woodwind", "wind", "winds"],
  };
  const variants = keyVariants[instrument] || [];
  
  for (const variant of variants) {
    if (result[variant]) {
      console.log(`Found stem for ${instrument} using key: ${variant}`);
      return result[variant];
    }
    if (normalizedResult[variant.toLowerCase()]) {
      console.log(`Found stem for ${instrument} using normalized key: ${variant}`);
      return normalizedResult[variant.toLowerCase()];
    }
  }
  
  const fallbackKeys = Object.keys(result).filter(k => 
    !["other", "accompaniment", "accompaniments", "no_vocals"].includes(k.toLowerCase())
  );
  if (fallbackKeys.length > 0) {
    console.warn(`No exact match for ${instrument}, using fallback key: ${fallbackKeys[0]}`);
    return result[fallbackKeys[0]];
  }
  
  console.error(`No stem URL found for ${instrument}. Available keys: ${Object.keys(result).join(", ")}`);
  return null;
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
      .select("music_ai_job_id, selected_instruments, status, song_title")
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
      console.error("Music.AI job FAILED:", JSON.stringify(statusData));
      await supabase.from("transcriptions")
        .update({ 
          status: "failed", 
          error_message: `Music.AI failed: ${JSON.stringify(statusData.error || statusData)}` 
        })
        .eq("id", transcription_id);
      return new Response(JSON.stringify({ status: "failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (statusData.status === "SUCCEEDED") {
      const result = statusData.result || {};

      console.log("Music.AI result keys:", JSON.stringify(Object.keys(result)));
      console.log("Music.AI full result:", JSON.stringify(result));

      // Build Basic Pitch job IDs map
      const basicPitchJobIds: Record<string, string> = {};

      // Submit Basic Pitch job for each selected instrument
      await Promise.all(txn.selected_instruments.map(async (instrument: string) => {
        const stemUrl = findStemUrl(instrument, result);
        if (!stemUrl) {
          console.warn(`Skipping ${instrument} — no stem URL found`);
          return;
        }

        const bpJobId = `${transcription_id}_${instrument.toLowerCase().replace(/\s+/g, "_")}`;
        basicPitchJobIds[instrument] = bpJobId;

        const bpRes = await fetch(`${BASIC_PITCH_BASE}/transcribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio_url: stemUrl, instrument, job_id: bpJobId, song_title: txn.song_title || instrument }),
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
