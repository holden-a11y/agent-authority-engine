import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAGE_CATEGORIES = [
  { value: "buying-guides", label: "Buying Guides", maxPages: 25 },
  { value: "selling-guides", label: "Selling Guides", maxPages: 25 },
  { value: "neighborhood", label: "Neighborhood Pages", maxPages: 20 },
  { value: "market-insights", label: "Market Insights", maxPages: 8 },
  { value: "first-time-buyer", label: "First-Time Buyer", maxPages: 10 },
  { value: "entity-profile", label: "Entity Profile", maxPages: 1 },
  { value: "niche-relocation", label: "Niche: Relocation", maxPages: 25 },
  { value: "niche-school-districts", label: "Niche: School Districts", maxPages: 25 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { entityConfig, existingPageSlugs } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert real estate AEO (Answer Engine Optimization) content strategist. Your job is to analyze an agent's entity configuration and generate a comprehensive set of page titles and H1 questions across all content categories.

CRITICAL FAIR HOUSING COMPLIANCE:
- NEVER use language that expresses preference based on race, color, religion, sex, handicap, familial status, or national origin.
- Use "primary bedroom" not "master bedroom".
- Never use phrases like "perfect for families", "ideal for singles", "exclusive neighborhood".
- Focus on property features, amenities, market data, community infrastructure.

PAGE STRUCTURE RULES:
- Each page needs a unique, specific title and an H1 question that a real person would search for.
- Pages should form a funnel: Top (relocation/awareness) → Mid (neighborhood/school district deep-dives) → Bottom (buying/selling action guides).
- Every category should have parent "pillar" pages and child "detail" pages.
- Titles must include the market name where relevant for local SEO.
- Avoid duplicate or overlapping topics — each page should serve a unique search intent.

CONTENT DEPTH RULES:
- Only generate pages you have ENOUGH information to make high-quality. 
- You have general real estate knowledge — use it for universal buying/selling/first-time-buyer guides.
- For neighborhood, relocation, and school district pages, lean on the specific neighborhoods, employers, and districts provided.
- For market insights, use the stats and nuances provided.
- The entity profile page should be based on the agent's bio, USPs, and credentials.

OUTPUT: Generate as many quality pages as the data supports per category. Be conservative — quality over quantity. Each page must have a distinct search intent.`;

    const entitySummary = `
AGENT: ${entityConfig.agentName}${entityConfig.teamName ? ` | Team: ${entityConfig.teamName}` : ""}${entityConfig.brokerage ? ` | Brokerage: ${entityConfig.brokerage}` : ""}
MARKET: ${entityConfig.market}
NICHES: ${entityConfig.niche1}, ${entityConfig.niche2}

NEIGHBORHOODS: ${(entityConfig.targetNeighborhoods || []).join(", ")}
SCHOOL DISTRICTS: ${(entityConfig.schoolDistricts || []).join(", ")}
KEY EMPLOYERS: ${(entityConfig.keyEmployers || []).join(", ")}

USPs: ${(entityConfig.usps || []).join(", ") || "Not provided"}
CERTIFICATIONS: ${(entityConfig.certifications || []).join(", ") || "Not provided"}
EXPERIENCE: ${entityConfig.yearsExperience || "Not provided"}
CLIENT PERSONAS: ${(entityConfig.clientPersonas || []).join(", ") || "Not provided"}

LOCAL KNOWLEDGE: ${entityConfig.localKnowledge || "Not provided"}
MARKET NUANCES: ${entityConfig.marketNuances || "Not provided"}
COMPETITIVE LANDSCAPE: ${entityConfig.competitiveLandscape || "Not provided"}
CURRENT CHALLENGES: ${entityConfig.currentChallenges || "Not provided"}

RECENT STATS: ${entityConfig.recentStats || "Not provided"}
AVG PRICE RANGE: ${entityConfig.avgPriceRange || "Not provided"}
AVG DAYS ON MARKET: ${entityConfig.avgDaysOnMarket || "Not provided"}
CLOSED NEIGHBORHOODS: ${(entityConfig.closedNeighborhoods || []).join(", ") || "Not provided"}

AGENT BIO: ${entityConfig.agentBio || "Not provided"}
VOICE/TONE: ${entityConfig.voiceToneNotes || "Professional, warm, knowledgeable"}

EXISTING PAGES (do NOT duplicate): ${(existingPageSlugs || []).join(", ") || "None yet"}
`;

    const userPrompt = `Based on this agent entity configuration, generate a comprehensive set of AEO pages across all categories.

${entitySummary}

Categories and their max page counts:
${PAGE_CATEGORIES.map((c) => `- ${c.label} (${c.value}): up to ${c.maxPages} pages`).join("\n")}

Generate as many quality, distinct pages as the provided information supports. For universal real estate topics (buying guides, selling guides, first-time buyer), you can use your general knowledge. For local topics, lean on the specific data provided.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_page_plan",
              description: "Return a structured list of pages to generate across all categories",
              parameters: {
                type: "object",
                properties: {
                  pages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Page title for SEO" },
                        category: { 
                          type: "string", 
                          enum: PAGE_CATEGORIES.map((c) => c.value),
                          description: "Page category" 
                        },
                        h1: { type: "string", description: "H1 primary question" },
                        h2Questions: {
                          type: "array",
                          items: { type: "string" },
                          description: "3-5 H2 sub-questions",
                        },
                        metaDescription: { type: "string", description: "SEO meta under 155 chars" },
                        faqItems: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              question: { type: "string" },
                              answer: { type: "string" },
                            },
                            required: ["question", "answer"],
                            additionalProperties: false,
                          },
                          description: "3-5 FAQ Q&A pairs",
                        },
                      },
                      required: ["title", "category", "h1", "h2Questions", "metaDescription", "faqItems"],
                      additionalProperties: false,
                    },
                  },
                  summary: {
                    type: "string",
                    description: "Brief summary of what was generated and why certain categories have more/fewer pages",
                  },
                },
                required: ["pages", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_page_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI did not return structured content" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bulk-generate-pages error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
