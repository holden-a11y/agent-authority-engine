import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AeoPage, AeoQuestion, NavCategory, DEFAULT_CATEGORIES, generateSlug } from "@/lib/aeo-types";

// ── Map DB row → AeoPage ──
function rowToPage(row: any): AeoPage {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    categorySlug: row.category_slug,
    parentId: row.parent_id || undefined,
    status: row.status,
    h1: row.h1,
    accordionQA: (row.accordion_qa || []) as AeoQuestion[],
    youtubeVideoId: row.youtube_video_id || "",
    youtubeTranscript: row.youtube_transcript || "",
    metaDescription: row.meta_description || "",
    createdAt: row.created_at,
  };
}

function rowToCategory(row: any): NavCategory {
  return {
    slug: row.slug,
    label: row.label,
    color: row.color,
    isDefault: row.is_default,
  };
}

// ── Queries ──

export function usePages() {
  return useQuery({
    queryKey: ["aeo-pages"],
    queryFn: async (): Promise<AeoPage[]> => {
      const { data, error } = await supabase
        .from("aeo_pages")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map(rowToPage);
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["aeo-categories"],
    queryFn: async (): Promise<NavCategory[]> => {
      const { data, error } = await supabase
        .from("aeo_categories")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map(rowToCategory);
    },
  });
}

// ── Mutations ──

export function useSavePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page: AeoPage) => {
      const { error } = await supabase.from("aeo_pages").insert({
        id: page.id,
        title: page.title,
        slug: page.slug,
        category_slug: page.categorySlug,
        parent_id: page.parentId || null,
        status: page.status,
        h1: page.h1,
        accordion_qa: page.accordionQA as any,
        youtube_video_id: page.youtubeVideoId,
        youtube_transcript: page.youtubeTranscript,
        meta_description: page.metaDescription,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aeo-pages"] }),
  });
}

export function useUpdatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page: AeoPage) => {
      const { error } = await supabase.from("aeo_pages").update({
        title: page.title,
        slug: page.slug,
        category_slug: page.categorySlug,
        parent_id: page.parentId || null,
        status: page.status,
        h1: page.h1,
        accordion_qa: page.accordionQA as any,
        youtube_video_id: page.youtubeVideoId,
        youtube_transcript: page.youtubeTranscript,
        meta_description: page.metaDescription,
      }).eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aeo-pages"] }),
  });
}

export function useDeletePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("aeo_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aeo-pages"] }),
  });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: NavCategory) => {
      const { error } = await supabase.from("aeo_categories").insert({
        slug: cat.slug,
        label: cat.label,
        color: cat.color,
        is_default: cat.isDefault,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aeo-categories"] }),
  });
}
