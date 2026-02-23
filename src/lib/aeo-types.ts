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

const STOP_WORDS = new Set([
  "a","an","the","is","are","was","were","be","been","being",
  "in","on","at","to","for","of","with","by","from","as",
  "into","through","during","before","after","above","below",
  "do","does","did","will","would","shall","should","may","might",
  "can","could","have","has","had","having","i","me","my","we",
  "our","you","your","he","she","it","its","they","them","their",
  "this","that","these","those","am","and","but","or","nor","not",
  "so","if","then","just","very","really","about","up","out",
]);

const MAX_SLUG_WORDS = 5;

export function generateSlug(title: string): string {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));

  return words
    .slice(0, MAX_SLUG_WORDS)
    .join("-")
    .replace(/-+/g, "-");
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
