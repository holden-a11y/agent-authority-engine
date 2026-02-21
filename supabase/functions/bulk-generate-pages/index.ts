import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAGE_CATEGORIES = [
  { value: "buying-guides", label: "Buying Guides", maxPages: 5 },
  { value: "selling-guides", label: "Selling Guides", maxPages: 5 },
  { value: "neighborhood", label: "Neighborhood Pages", maxPages: 5 },
  { value: "market-insights", label: "Market Insights", maxPages: 3 },
  { value: "first-time-buyer", label: "First-Time Buyer", maxPages: 5 },
  { value: "entity-profile", label: "Entity Profile", maxPages: 1 },
  { value: "niche-relocation", label: "Niche: Relocation", maxPages: 5 },
  { value: "niche-school-districts", label: "Niche: School Districts", maxPages: 5 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { entityConfig, existingPageSlugs } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert real estate AEO (Answer Engine Optimization) content strategist.

CRITICAL RULES:
1. Every page TITLE and H1 must be a NATURAL QUESTION that a real person would type or ask an AI assistant. Examples:
   - "How Do I Buy a Home in Grand Rapids?"
   - "What Are the Best Neighborhoods in Grand Rapids for Families?"  
   - "How Much Does It Cost to Live in East Grand Rapids?"
   NEVER use statement titles like "Grand Rapids Home Buying Guide" or "Step-by-Step Process".

2. Each page must have exactly 10 FAQ question-answer pairs. Each FAQ must:
   - Be a specific, natural question related to the page's main question
   - Have a comprehensive, authoritative answer (2-4 sentences minimum)
   - Include local data, agent positioning, and actionable advice where relevant

3. Each page should include 3-5 related questions (titles of other pages the reader might want to visit next). These should be natural questions that form a logical next step.

FAIR HOUSING COMPLIANCE:
- NEVER use language expressing preference based on race, color, religion, sex, handicap, familial status, or national origin.
- Use "primary bedroom" not "master bedroom".
- Never use "perfect for families", "ideal for singles", "exclusive neighborhood".
- Focus on property features, amenities, market data, community infrastructure.

CONTENT DEPTH:
- Only generate pages you have enough information to make high-quality.
- For universal topics (buying/selling/first-time-buyer), use your general real estate knowledge.
- For local topics, lean on the specific neighborhoods, employers, and districts provided.
- The entity profile page question should be about the agent specifically, e.g. "Who Is [Agent Name] and Why Work With Them?"`;

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

LOCAL KNOWLEDGE: ${entityConfig.localKnowledge || "Not provided"}
MARKET NUANCES: ${entityConfig.marketNuances || "Not provided"}
AVG PRICE RANGE: ${entityConfig.avgPriceRange || "Not provided"}

AGENT BIO: ${entityConfig.agentBio || "Not provided"}

EXISTING PAGES (do NOT duplicate): ${(existingPageSlugs || []).join(", ") || "None yet"}
`;

    const userPrompt = `Based on this agent entity configuration, generate AEO pages. EVERY title must be a natural question.

${entitySummary}

Categories and max pages:
${PAGE_CATEGORIES.map((c) => `- ${c.label} (${c.value}): up to ${c.maxPages} pages`).join("\n")}

Generate quality pages with question-based titles, 10 FAQ pairs each, and 3-5 related question links per page.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_page_plan",
              description: "Return structured pages with question-based titles, 10 FAQs each, and related question links",
              parameters: {
                type: "object",
                properties: {
                  pages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Natural question title, e.g. 'How Do I Buy a Home in Grand Rapids?'" },
                        category: {
                          type: "string",
                          enum: PAGE_CATEGORIES.map((c) => c.value),
                        },
                        h1: { type: "string", description: "Same as title — the natural question" },
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
                          description: "Exactly 10 FAQ question-answer pairs",
                        },
                        relatedQuestions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string", description: "A related natural question title" },
                            },
                            required: ["title"],
                            additionalProperties: false,
                          },
                          description: "3-5 related question page titles",
                        },
                      },
                      required: ["title", "category", "h1", "metaDescription", "faqItems", "relatedQuestions"],
                      additionalProperties: false,
                    },
                  },
                  summary: {
                    type: "string",
                    description: "Brief summary of what was generated",
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
