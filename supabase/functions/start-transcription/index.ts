import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RENDER_API = "https://scribenoter-transcription-api.onrender.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { transcription_id, audio_url, selected_instruments, song_title, file_size_bytes } = await req.json();

    const instrument = Array.isArray(selected_instruments) ? selected_instruments[0] : selected_instruments;
    const jobId = `${transcription_id}_${instrument.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    await supabase.from("transcriptions")
      .update({ status: "transcribing" })
      .eq("id", transcription_id);

    const renderRes = await fetch(`${RENDER_API}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audio_url,
        instrument,
        job_id: jobId,
        song_title: song_title || "Transcription",
        transcription_id: transcription_id,
        file_size_bytes: file_size_bytes || null,
      }),
    });

    if (!renderRes.ok) {
      const errText = await renderRes.text();
      throw new Error(`Render backend failed [${renderRes.status}]: ${errText}`);
    }

    console.log(`Started transcription job ${jobId} for instrument: ${instrument}`);

    return new Response(JSON.stringify({ success: true, job_id: jobId }), {
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