import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  return new Response(JSON.stringify({ success: true, message: "Polling handled by Render backend" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});