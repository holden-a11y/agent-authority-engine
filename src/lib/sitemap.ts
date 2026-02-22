import { supabase } from "@/integrations/supabase/client";

export async function regenerateSitemap() {
  const siteUrl = window.location.origin;

  try {
    // Fetch pages and categories from DB
    const [pagesRes, catsRes] = await Promise.all([
      supabase.from("aeo_pages").select("*"),
      supabase.from("aeo_categories").select("*"),
    ]);

    const pages = (pagesRes.data || []).map((r: any) => ({
      slug: r.slug,
      categorySlug: r.category_slug,
      title: r.title,
      status: r.status,
      createdAt: r.created_at,
    }));

    const categories = (catsRes.data || []).map((r: any) => ({
      slug: r.slug,
      label: r.label,
    }));

    const { data, error } = await supabase.functions.invoke("sitemap", {
      body: { siteUrl, pages, categories },
    });
    if (error) throw error;
    console.log("Sitemap regenerated:", data);
    return data;
  } catch (e) {
    console.error("Sitemap regeneration failed:", e);
  }
}
