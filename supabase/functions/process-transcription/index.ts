import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MUSIC_AI_BASE = "https://api.music.ai/v1";
const BASIC_PITCH_BASE = "https://scribenoter-transcription-api.onrender.com";

// Instrument name → Music.AI param mapping
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
  for (const key of allStemParams) {
    params[key] = false;
  }
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

// Find primary stem key for an instrument
function getPrimaryStemKey(instrument: string): string[] {
  const mapping = instrumentMapping[instrument];
  if (!mapping) return [];
  return Object.keys(mapping);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    if (!transcription_id || !audio_url || !selected_instruments?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // A) Update status to "separating"
    await supabase.from("transcriptions").update({ status: "separating" }).eq("id", transcription_id);

    // B) Create Music.AI stem separation job
    const stemParams = buildStemParams(selected_instruments);
    const jobRes = await fetch(`${MUSIC_AI_BASE}/job`, {
      method: "POST",
      headers: {
        "Authorization": MUSIC_AI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `ScribeNoter-${transcription_id}`,
        workflow: "untitled-workflow-36652e8",
        params: { inputUrl: audio_url, ...stemParams },
      }),
    });

    if (!jobRes.ok) {
      const errText = await jobRes.text();
      throw new Error(`Music.AI job creation failed [${jobRes.status}]: ${errText}`);
    }

    const jobData = await jobRes.json();
    const musicAiJobId = jobData.id;

    // C) Store job ID
    await supabase.from("transcriptions").update({ music_ai_job_id: musicAiJobId }).eq("id", transcription_id);

    // D) Poll Music.AI job status
    const maxPollTime = 10 * 60 * 1000; // 10 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < maxPollTime) {
      await sleep(5000);
      const statusRes = await fetch(`${MUSIC_AI_BASE}/job/${musicAiJobId}`, {
        headers: { "Authorization": MUSIC_AI_API_KEY },
      });

      if (!statusRes.ok) {
        console.error(`Music.AI status poll failed: ${statusRes.status}`);
        continue;
      }

      const statusData = await statusRes.json();
      console.log(`Music.AI job status: ${statusData.status}`);

      if (statusData.status === "SUCCEEDED") {
        // E) Extract stem URLs from result
        const result = statusData.result || {};
        await supabase.from("transcriptions").update({
          stem_urls: result,
          status: "transcribing",
        }).eq("id", transcription_id);

        // F) Call Basic Pitch for each selected instrument
        const transcriptionJobs: Array<{ instrument: string; jobId: string }> = [];

        await Promise.all(selected_instruments.map(async (instrument: string) => {
          const stemKeys = getPrimaryStemKey(instrument);
          let stemUrl: string | null = null;

          // Find the first available stem URL
          for (const key of stemKeys) {
            if (result[key]) {
              stemUrl = result[key];
              break;
            }
          }

          if (!stemUrl) {
            console.warn(`No stem URL found for ${instrument}, skipping`);
            return;
          }

          const bpJobId = `${transcription_id}_${instrument.toLowerCase().replace(/\s+/g, "_")}`;
          transcriptionJobs.push({ instrument, jobId: bpJobId });

          const bpRes = await fetch(`${BASIC_PITCH_BASE}/transcribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audio_url: stemUrl,
              instrument,
              job_id: bpJobId,
            }),
          });

          if (!bpRes.ok) {
            const errText = await bpRes.text();
            console.error(`Basic Pitch submit failed for ${instrument}: ${errText}`);
          }
        }));

        // G) Poll Basic Pitch for each job
        const bpMaxPoll = 5 * 60 * 1000;
        const bpResults: Array<{ instrument: string; midi_b64?: string; musicxml_b64?: string }> = [];

        await Promise.all(transcriptionJobs.map(async ({ instrument, jobId }) => {
          const bpStart = Date.now();
          while (Date.now() - bpStart < bpMaxPoll) {
            await sleep(3000);
            try {
              const pollRes = await fetch(`${BASIC_PITCH_BASE}/job/${jobId}`);
              if (!pollRes.ok) continue;

              const pollData = await pollRes.json();
              if (pollData.status === "completed") {
                bpResults.push({
                  instrument,
                  midi_b64: pollData.midi_b64,
                  musicxml_b64: pollData.musicxml_b64,
                });
                return;
              } else if (pollData.status === "failed") {
                console.error(`Basic Pitch failed for ${instrument}: ${pollData.error}`);
                return;
              }
            } catch (e) {
              console.error(`Poll error for ${instrument}:`, e);
            }
          }
          console.error(`Basic Pitch timeout for ${instrument}`);
        }));

        // H) Store results
        for (const result of bpResults) {
          if (result.midi_b64) {
            await supabase.from("transcription_outputs").insert({
              transcription_id,
              instrument: result.instrument,
              format: "midi",
              file_path: result.midi_b64,
            });
          }
          if (result.musicxml_b64) {
            await supabase.from("transcription_outputs").insert({
              transcription_id,
              instrument: result.instrument,
              format: "musicxml",
              file_path: result.musicxml_b64,
            });
          }
        }

        await supabase.from("transcriptions").update({
          status: "completed",
          completed_at: new Date().toISOString(),
        }).eq("id", transcription_id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else if (statusData.status === "FAILED") {
        throw new Error(`Music.AI job failed: ${JSON.stringify(statusData)}`);
      }
    }

    // Timeout
    throw new Error("Music.AI job timed out after 10 minutes");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Process transcription error:", msg);

    // I) Update status to failed
    try {
      const { transcription_id } = await req.clone().json().catch(() => ({ transcription_id: null }));
      if (transcription_id) {
        await supabase.from("transcriptions").update({
          status: "failed",
          error_message: msg,
        }).eq("id", transcription_id);
      }
    } catch { /* best effort */ }

    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
