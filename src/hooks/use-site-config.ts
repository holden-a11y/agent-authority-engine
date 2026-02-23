import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteConfigMap {
  agentName: string;
  phone: string;
  email: string;
  market: string;
  brokerage: string;
  teamName: string;
  fubApiKey: string;
  googleBusinessProfile: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  xUrl: string;
  tiktokUrl: string;
  aboutBio: string;
  contactIntro: string;
}

const DEFAULTS: SiteConfigMap = {
  agentName: "",
  phone: "",
  email: "",
  market: "",
  brokerage: "",
  teamName: "",
  fubApiKey: "",
  googleBusinessProfile: "",
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  youtubeUrl: "",
  xUrl: "",
  tiktokUrl: "",
  aboutBio: "",
  contactIntro: "",
};

export function useSiteConfig() {
  return useQuery({
    queryKey: ["site-config"],
    queryFn: async (): Promise<SiteConfigMap> => {
      const { data, error } = await supabase
        .from("site_config")
        .select("key, value");
      if (error) throw error;
      const map = { ...DEFAULTS };
      for (const row of data || []) {
        if (row.key in map) {
          (map as any)[row.key] = row.value;
        }
      }
      return map;
    },
  });
}

export function useSaveSiteConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entries: Partial<SiteConfigMap>) => {
      const rows = Object.entries(entries).map(([key, value]) => ({
        key,
        value: value || "",
        updated_at: new Date().toISOString(),
      }));
      // Upsert each key
      const { error } = await supabase
        .from("site_config")
        .upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-config"] }),
  });
}
