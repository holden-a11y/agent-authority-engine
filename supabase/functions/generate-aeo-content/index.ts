import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, category, h1, market, agentName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert real estate content strategist specializing in Answer Engine Optimization (AEO).

CRITICAL FAIR HOUSING COMPLIANCE:
- NEVER use language expressing preference based on race, color, religion, sex, handicap, familial status, or national origin.
- Use "primary bedroom" not "master bedroom".
- Never use "perfect for families", "ideal for singles", "exclusive neighborhood".
- Focus on property features, amenities, market data, community infrastructure.

CONTENT GUIDELINES:
- Write warm, professional, knowledgeable content.
- Position the agent as a local authority.
- Generate exactly 10 FAQ Q&A pairs with comprehensive answers (2-4 sentences each).
- Generate 3-5 related question titles that link to other pages.
- Each FAQ should be a practical, specific question a real person would search for.`;

    const userPrompt = `Generate AEO content for this page:

Page Title/Question: ${h1 || title || "General real estate question"}
Category: ${category}
Market: ${market}
Agent: ${agentName}

Generate exactly 10 FAQ Q&A pairs and 3-5 related question titles.`;

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
              name: "generate_aeo_content",
              description: "Return structured AEO content with 10 FAQ pairs and related questions",
              parameters: {
                type: "object",
                properties: {
                  metaDescription: {
                    type: "string",
                    description: "SEO meta description under 155 characters",
                  },
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
                required: ["metaDescription", "faqItems", "relatedQuestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_aeo_content" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI did not return structured content" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-aeo-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
