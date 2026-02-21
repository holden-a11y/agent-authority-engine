export interface AeoQuestion {
  id: string;
  question: string;
  answer: string;
}

export type AeoPageStatus = "draft" | "published";

export interface NavCategory {
  slug: string;
  label: string;
  color: string;
  isDefault: boolean; // true for the 5 built-in categories
}

export const DEFAULT_CATEGORIES: NavCategory[] = [
  { slug: "buyers", label: "Buyers", color: "bg-blue-100 text-blue-800", isDefault: true },
  { slug: "sellers", label: "Sellers", color: "bg-green-100 text-green-800", isDefault: true },
  { slug: "neighborhoods", label: "Neighborhoods", color: "bg-amber-100 text-amber-800", isDefault: true },
  { slug: "market-insights", label: "Market Insights", color: "bg-purple-100 text-purple-800", isDefault: true },
  { slug: "entity", label: "Entity", color: "bg-slate-100 text-slate-800", isDefault: true },
];

export interface AeoPage {
  id: string;
  title: string;        // the question
  slug: string;          // derived from the question
  categorySlug: string;  // which nav category this lives under
  parentId?: string;     // if set, this is a child of another page
  status: AeoPageStatus;
  h1: string;            // same as title (the question)
  accordionQA: AeoQuestion[];
  youtubeVideoId: string;
  youtubeTranscript: string;
  metaDescription: string;
  createdAt: string;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function loadCategories(): NavCategory[] {
  try {
    const stored = localStorage.getItem("aeo-categories");
    if (stored) return JSON.parse(stored);
  } catch {}
  return [...DEFAULT_CATEGORIES];
}

export function saveCategories(cats: NavCategory[]) {
  localStorage.setItem("aeo-categories", JSON.stringify(cats));
}

export function loadPages(): AeoPage[] {
  try { return JSON.parse(localStorage.getItem("aeo-pages") || "[]"); }
  catch { return []; }
}

export function savePages(pages: AeoPage[]) {
  localStorage.setItem("aeo-pages", JSON.stringify(pages));
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
    url: typeof window !== "undefined" ? window.location.origin : "",
    sameAs: socialUrls.filter(Boolean),
  };

  return { faqSchema, localBusiness };
}
