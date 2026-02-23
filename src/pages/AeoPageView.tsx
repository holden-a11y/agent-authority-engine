import { useParams } from "react-router-dom";
import { usePages } from "@/hooks/use-aeo-data";
import { useSiteConfig } from "@/hooks/use-site-config";
import AeoPageTemplate from "@/components/AeoPageTemplate";
import NotFound from "./NotFound";
import { Loader2 } from "lucide-react";

const AeoPageView = () => {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const { data: pages, isLoading } = usePages();
  const { data: siteConfig, isLoading: configLoading } = useSiteConfig();

  if (isLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const page = pages?.find((p) => p.slug === slug && p.categorySlug === category);
  if (!page) return <NotFound />;

  const agentName = siteConfig?.agentName || "Agent";
  const market = siteConfig?.market || "";
  const socialUrls = [
    siteConfig?.googleBusinessProfile,
    siteConfig?.facebookUrl,
    siteConfig?.instagramUrl,
    siteConfig?.linkedinUrl,
    siteConfig?.youtubeUrl,
    siteConfig?.xUrl,
    siteConfig?.tiktokUrl,
  ].filter(Boolean);

  return <AeoPageTemplate page={page} agentName={agentName} market={market} socialUrls={socialUrls} />;
};

export default AeoPageView;
