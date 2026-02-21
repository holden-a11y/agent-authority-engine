import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { title, category, h1, market, agentName, mode, childCount, parentTitle, entityConfig } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── Mode: suggest child topics ──
    if (mode === "suggest-children") {
      const prompt = `You are an AEO content strategist for real estate agent "${agentName}" in ${market}.

Given the parent question page: "${title}"
Category: ${category}

Suggest exactly ${childCount || 3} child sub-question page titles that would naturally fall UNDER this parent topic.

Rules:
- Each must be a NATURAL QUESTION (e.g. "What Credit Score Do I Need to Buy a Home in ${market}?")
- They should cover distinct angles/sub-topics of the parent question
- NEVER use statement titles
- Comply with Fair Housing Act — no demographic language
- Be specific to ${market} where relevant
${entityConfig?.targetNeighborhoods?.length ? `- Available neighborhoods: ${entityConfig.targetNeighborhoods.join(", ")}` : ""}
${entityConfig?.schoolDistricts?.length ? `- School districts: ${entityConfig.schoolDistricts.join(", ")}` : ""}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "suggest_children",
              description: "Return child question titles",
              parameters: {
                type: "object",
                properties: {
                  childTopics: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of child question titles",
                  },
                },
                required: ["childTopics"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "suggest_children" } },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI error:", response.status, errText);
        return new Response(JSON.stringify({ error: "AI generation failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        return new Response(JSON.stringify({ error: "AI did not return structured content" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(toolCall.function.arguments, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Mode: generate full page content ──
    const parentContext = parentTitle ? `\nThis is a CHILD page under the parent: "${parentTitle}". The FAQs should focus on the specific sub-topic, not repeat the parent's broad scope.` : "";

    const systemPrompt = `You are an expert real estate AEO content strategist for "${agentName}" in ${market}.

FAIR HOUSING: Never express preference based on race, color, religion, sex, handicap, familial status, or national origin. Use "primary bedroom" not "master bedroom". Focus on property features and market data.

Generate exactly 10 FAQ question-answer pairs for this page. Each answer must be 2-4 sentences, authoritative, and include local specifics where possible.${parentContext}`;

    const userPrompt = `Generate 10 FAQ Q&A pairs for this AEO page:

Question/Title: ${h1 || title}
Category: ${category}
Market: ${market}
Agent: ${agentName}
${entityConfig?.avgPriceRange ? `Avg Price: ${entityConfig.avgPriceRange}` : ""}
${entityConfig?.targetNeighborhoods?.length ? `Neighborhoods: ${entityConfig.targetNeighborhoods.join(", ")}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_aeo_content",
            description: "Return 10 FAQ pairs and meta description",
            parameters: {
              type: "object",
              properties: {
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
                  description: "Exactly 10 FAQ Q&A pairs",
                },
              },
              required: ["metaDescription", "faqItems"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_aeo_content" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI did not return structured content" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(toolCall.function.arguments, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-aeo-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
