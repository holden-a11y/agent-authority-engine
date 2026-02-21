import { supabase } from "@/integrations/supabase/client";
import { loadPages, loadCategories } from "@/lib/aeo-types";

export async function regenerateSitemap() {
  const pages = loadPages();
  const categories = loadCategories();
  const siteUrl = window.location.origin;

  try {
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
