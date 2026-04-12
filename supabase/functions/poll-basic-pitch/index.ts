import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASIC_PITCH_BASE = "https://scribenoter-transcription-api.onrender.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { transcription_id } = await req.json();

    const { data: txn, error } = await supabase
      .from("transcriptions")
      .select("basic_pitch_job_ids, selected_instruments, status")
      .eq("id", transcription_id)
      .single();

    if (error || !txn) throw new Error("Transcription not found");

    if (txn.status === "completed" || txn.status === "failed") {
      return new Response(JSON.stringify({ status: txn.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (txn.status !== "transcribing") {
      return new Response(JSON.stringify({ status: txn.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jobIds = txn.basic_pitch_job_ids as Record<string, string> | null;

    if (!jobIds || Object.keys(jobIds).length === 0) {
      return new Response(JSON.stringify({ status: "transcribing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instruments = Object.keys(jobIds);
    let allCompleted = true;
    let anyFailed = false;

    await Promise.all(instruments.map(async (instrument) => {
      const jobId = jobIds[instrument];

      const { data: existing } = await supabase
        .from("transcription_outputs")
        .select("id")
        .eq("transcription_id", transcription_id)
        .eq("instrument", instrument)
        .limit(1);

      if (existing && existing.length > 0) return;

      try {
        const pollRes = await fetch(`${BASIC_PITCH_BASE}/job/${jobId}`);

        if (pollRes.status === 404) {
          console.error(`Job ${jobId} not found - server may have restarted`);
          anyFailed = true;
          return;
        }

        if (!pollRes.ok) {
          allCompleted = false;
          return;
        }

        const pollData = await pollRes.json();

        if (pollData.status === "completed") {
          const midiB64 = pollData.result?.midi_b64;
          const xmlB64 = pollData.result?.musicxml_b64;

          if (midiB64) {
            await supabase.from("transcription_outputs").insert({
              transcription_id,
              instrument,
              format: "midi",
              file_path: midiB64,
            });
          }
          if (xmlB64) {
            await supabase.from("transcription_outputs").insert({
              transcription_id,
              instrument,
              format: "musicxml",
              file_path: xmlB64,
            });
          }
        } else if (pollData.status === "failed") {
          anyFailed = true;
          console.error(`Basic Pitch failed for ${instrument}: ${pollData.error}`);
        } else {
          allCompleted = false;
        }
      } catch (e) {
        allCompleted = false;
        console.error(`Poll error for ${instrument}:`, e);
      }
    }));

    if (allCompleted) {
      await supabase.from("transcriptions").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", transcription_id);
      return new Response(JSON.stringify({ status: "completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (anyFailed && allCompleted) {
      await supabase.from("transcriptions").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", transcription_id);
      return new Response(JSON.stringify({ status: "completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "transcribing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
