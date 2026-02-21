import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // GET: serve the cached sitemap XML
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("sitemap_cache")
        .select("xml_content, updated_at")
        .eq("id", 1)
        .single();

      if (error || !data?.xml_content) {
        return new Response("<urlset xmlns='http://www.sitemaps.org/schemas/sitemap/0.9'/>", {
          headers: { ...corsHeaders, "Content-Type": "application/xml" },
        });
      }

      return new Response(data.xml_content, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // POST: regenerate sitemap from page data
    if (req.method === "POST") {
      const body = await req.json();
      const { siteUrl, pages, categories, staticPages } = body;

      const baseUrl = (siteUrl || "https://example.com").replace(/\/$/, "");
      const now = new Date().toISOString().split("T")[0];

      const urls: string[] = [];

      // Static pages
      const statics = staticPages || ["/", "/about", "/neighborhoods", "/blog", "/contact"];
      for (const path of statics) {
        urls.push(`  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${path === "/" ? "daily" : "weekly"}</changefreq>
    <priority>${path === "/" ? "1.0" : "0.7"}</priority>
  </url>`);
      }

      // Category hub pages
      if (categories?.length) {
        for (const cat of categories) {
          urls.push(`  <url>
    <loc>${baseUrl}/${cat.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
        }
      }

      // AEO pages
      if (pages?.length) {
        for (const page of pages) {
          if (page.status !== "published") continue;
          const lastmod = page.createdAt ? page.createdAt.split("T")[0] : now;
          urls.push(`  <url>
    <loc>${baseUrl}/${page.categorySlug}/${page.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page.parentId ? "0.5" : "0.6"}</priority>
  </url>`);
        }
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

      const { error } = await supabase
        .from("sitemap_cache")
        .update({ xml_content: xml, updated_at: new Date().toISOString() })
        .eq("id", 1);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, urlCount: urls.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (e) {
    console.error("sitemap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
