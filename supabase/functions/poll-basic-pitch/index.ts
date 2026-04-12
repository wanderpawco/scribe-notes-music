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
    if (txn.status !== "transcribing") {
      return new Response(JSON.stringify({ status: txn.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jobIds = txn.basic_pitch_job_ids as Record<string, string> || {};
    const instruments = Object.keys(jobIds);
    
    if (instruments.length === 0) {
      await supabase.from("transcriptions").update({
        status: "failed",
        error_message: "No Basic Pitch jobs found",
      }).eq("id", transcription_id);
      return new Response(JSON.stringify({ status: "failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let allCompleted = true;
    let anyFailed = false;

    await Promise.all(instruments.map(async (instrument) => {
      const jobId = jobIds[instrument];
      
      // Check if already stored
      const { data: existing } = await supabase
        .from("transcription_outputs")
        .select("id")
        .eq("transcription_id", transcription_id)
        .eq("instrument", instrument)
        .limit(1);
      
      if (existing && existing.length > 0) return; // already saved

      try {
        const pollRes = await fetch(`${BASIC_PITCH_BASE}/job/${jobId}`);
        if (!pollRes.ok) { allCompleted = false; return; }

        const pollData = await pollRes.json();

        if (pollData.status === "completed") {
          if (pollData.result?.midi_b64) {
            await supabase.from("transcription_outputs").insert({
              transcription_id,
              instrument,
              format: "midi",
              file_path: pollData.result.midi_b64,
            });
          }
          if (pollData.result?.musicxml_b64) {
            await supabase.from("transcription_outputs").insert({
              transcription_id,
              instrument,
              format: "musicxml",
              file_path: pollData.result.musicxml_b64,
            });
          }
        } else if (pollData.status === "failed") {
          anyFailed = true;
          console.error(`Basic Pitch failed for ${instrument}`);
        } else {
          allCompleted = false; // still processing
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

    return new Response(JSON.stringify({ 
      status: anyFailed ? "partial" : "transcribing" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
