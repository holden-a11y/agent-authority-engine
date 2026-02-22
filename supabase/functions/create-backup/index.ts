import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let backupData: Record<string, unknown> = {};
    let backupType = "manual";

    // If POST body has data, use it (called from client with localStorage data)
    if (req.method === "POST") {
      try {
        const body = await req.json();
        backupData = body.data || {};
        backupType = body.type || "manual";
      } catch {
        // Empty body is fine for cron-triggered backups
      }
    }

    // Insert the backup
    const { error: insertError } = await supabase
      .from("site_backups")
      .insert({
        backup_data: backupData,
        backup_type: backupType,
      });

    if (insertError) throw insertError;

    // Clean up old backups - keep only the last 14
    const { data: allBackups, error: fetchError } = await supabase
      .from("site_backups")
      .select("id, created_at")
      .order("created_at", { ascending: false });

    if (!fetchError && allBackups && allBackups.length > 14) {
      const idsToDelete = allBackups.slice(14).map((b) => b.id);
      await supabase.from("site_backups").delete().in("id", idsToDelete);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
