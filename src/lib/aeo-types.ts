export interface AeoQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface AeoPage {
  id: string;
  title: string;
  slug: string;
  category: AeoPageCategory;
  h1: string;
  h2Questions: string[];
  accordionQA: AeoQuestion[];
  youtubeVideoId: string;
  youtubeTranscript: string;
  metaDescription: string;
  createdAt: string;
}

export type AeoPageCategory =
  | "buying-guides"
  | "selling-guides"
  | "neighborhood"
  | "market-insights"
  | "first-time-buyer"
  | "entity-profile"
  | "niche-relocation"
  | "niche-school-districts";

export const PAGE_CATEGORIES: { value: AeoPageCategory; label: string; color: string; description: string }[] = [
  { value: "buying-guides", label: "Buying Guides", color: "bg-blue-100 text-blue-800", description: "Guides for homebuyers in your market" },
  { value: "selling-guides", label: "Selling Guides", color: "bg-green-100 text-green-800", description: "Guides for home sellers" },
  { value: "neighborhood", label: "Neighborhood Pages", color: "bg-amber-100 text-amber-800", description: "Community and neighborhood profiles" },
  { value: "market-insights", label: "Market Insights", color: "bg-purple-100 text-purple-800", description: "Local market data and trends" },
  { value: "first-time-buyer", label: "First-Time Buyer", color: "bg-pink-100 text-pink-800", description: "Content for first-time homebuyers" },
  { value: "entity-profile", label: "Entity Profile", color: "bg-slate-100 text-slate-800", description: "Your agent authority page" },
  { value: "niche-relocation", label: "Niche: Relocation", color: "bg-orange-100 text-orange-800", description: "Relocation-focused content" },
  { value: "niche-school-districts", label: "Niche: School Districts", color: "bg-teal-100 text-teal-800", description: "School district community pages" },
];

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function generateJsonLd(page: AeoPage, agentName: string, market: string, socialUrls: string[]): { faqSchema: object; localBusiness: object } {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.accordionQA.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.answer || "[Answer content here]",
      },
    })),
  };

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: agentName,
    areaServed: market,
    url: window.location.origin,
    sameAs: socialUrls.filter(Boolean),
  };

  return { faqSchema, localBusiness };
}

export function generatePageHtml(page: AeoPage, agentName: string, market: string, socialUrls: string[]): string {
  const jsonLd = generateJsonLd(page, agentName, market, socialUrls);
  
  const qaHtml = page.accordionQA
    .map(
      (qa) => `    <details>
      <summary>${qa.question}</summary>
      <p>${qa.answer || "[Answer content here]"}</p>
    </details>`
    )
    .join("\n");

  const h2Html = page.h2Questions
    .map((q) => `    <section>\n      <h2>${q}</h2>\n      <p>[Content here]</p>\n    </section>`)
    .join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${page.title} | ${agentName}</title>
  <meta name="description" content="${page.metaDescription}" />
  <script type="application/ld+json">
${JSON.stringify(jsonLd.faqSchema, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(jsonLd.localBusiness, null, 2)}
  </script>
</head>
<body>
  <article>
    <h1>${page.h1}</h1>

${h2Html}

    <section class="faq">
${qaHtml}
    </section>${page.youtubeVideoId ? `\n\n    <section class="video">\n      <iframe src="https://www.youtube.com/embed/${page.youtubeVideoId}" allowfullscreen></iframe>\n    </section>` : ""}
  </article>
</body>
</html>`;
}
