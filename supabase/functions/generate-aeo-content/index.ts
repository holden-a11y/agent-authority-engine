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

    const systemPrompt = `You are an expert real estate content strategist specializing in Answer Engine Optimization (AEO). You create high-quality, authoritative content for real estate agents.

CRITICAL FAIR HOUSING COMPLIANCE:
- NEVER use language that expresses preference, limitation, or discrimination based on race, color, religion, sex, handicap, familial status, or national origin.
- Use "primary bedroom" instead of "master bedroom".
- Never use phrases like "perfect for families", "ideal for singles", "adult community", "exclusive neighborhood".
- Focus on property features, location amenities, market data, and community infrastructure — never on the demographics of residents.
- All content must comply with the Federal Fair Housing Act.

CONTENT GUIDELINES:
- Write in a warm, professional, knowledgeable tone.
- Position the agent as a local authority.
- Use natural conversational questions that people actually search for.
- Include specific local details when possible based on the market provided.
- Each answer should be 2-4 sentences — concise but authoritative.
- H2 questions should flow logically from the H1 and cover different angles.
- FAQ questions should be practical, specific, and search-friendly.`;

    const userPrompt = `Generate AEO-optimized content for this real estate page:

Page Title: ${title || "Untitled"}
Category: ${category}
H1 Question: ${h1 || title || "General real estate question"}
Market: ${market}
Agent: ${agentName}

Generate exactly:
1. 4-5 H2 sub-questions that naturally flow from the H1 question
2. 5-6 FAQ accordion Q&A pairs with concise, authoritative answers

Each H2 should explore a different angle of the main topic.
Each FAQ should be a practical question a real person would search for.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_aeo_content",
              description: "Return structured AEO content with H2 questions and FAQ Q&A pairs",
              parameters: {
                type: "object",
                properties: {
                  h2Questions: {
                    type: "array",
                    items: { type: "string" },
                    description: "4-5 H2 sub-questions that flow from the H1",
                  },
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
                    description: "5-6 FAQ Q&A pairs with concise answers",
                  },
                },
                required: ["h2Questions", "metaDescription", "faqItems"],
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
    console.error("generate-aeo-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
