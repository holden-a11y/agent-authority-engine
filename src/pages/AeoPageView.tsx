import { useParams } from "react-router-dom";
import { usePages } from "@/hooks/use-aeo-data";
import AeoPageTemplate from "@/components/AeoPageTemplate";
import NotFound from "./NotFound";
import { Loader2 } from "lucide-react";

const AeoPageView = () => {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const { data: pages, isLoading } = usePages();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const page = pages?.find((p) => p.slug === slug && p.categorySlug === category);
  if (!page) return <NotFound />;

  const config = JSON.parse(localStorage.getItem("aeo-entity-config") || "{}");
  const agentName = config.agentName || "Agent";
  const market = config.market || "";
  const socialUrls = [
    config.googleBusinessProfile,
    config.facebookUrl,
    config.instagramUrl,
    config.linkedinUrl,
    config.youtubeUrl,
    config.xUrl,
    config.tiktokUrl,
  ].filter(Boolean);

  return <AeoPageTemplate page={page} agentName={agentName} market={market} socialUrls={socialUrls} />;
};

export default AeoPageView;
