import { useParams } from "react-router-dom";
import { AeoPage } from "@/lib/aeo-types";
import AeoPageTemplate from "@/components/AeoPageTemplate";
import NotFound from "./NotFound";

const AeoPageView = () => {
  const { slug } = useParams<{ slug: string }>();

  const pages: AeoPage[] = JSON.parse(localStorage.getItem("aeo-pages") || "[]");
  const page = pages.find((p) => p.slug === slug);

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
