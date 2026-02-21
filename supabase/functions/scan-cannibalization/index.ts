import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pages } = await req.json();
    if (!pages || !Array.isArray(pages) || pages.length < 2) {
      return new Response(JSON.stringify({ clusters: [], summary: "Need at least 2 pages to scan." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build a compact representation of all pages for the LLM
    const pageList = pages.map((p: any, i: number) => {
      const questions = (p.accordionQA || []).map((qa: any) => qa.question).join("; ");
      return `[${i + 1}] Title: "${p.title}" | Category: ${p.categorySlug} | FAQ questions: ${questions}`;
    }).join("\n");

    const systemPrompt = `You are an SEO cannibalization auditor for a real estate agent's website. Your job is to find pages or FAQ questions that are too similar and would compete with each other in search results.

Rules:
- Group overlapping pages into "clusters" where 2+ pages target essentially the same search intent or question.
- For each cluster, list the page numbers involved, explain why they overlap, and give a specific recommendation (merge, differentiate, or delete).
- Also flag individual FAQ questions that appear nearly identical across different pages (mention the page numbers and the duplicate questions).
- A severity score: "low" (2 pages overlap slightly), "medium" (3+ pages or high overlap), "high" (4+ pages or near-identical content).
- Return valid JSON only, no markdown. Schema:
{
  "clusters": [
    {
      "severity": "low"|"medium"|"high",
      "pageNumbers": [1, 3],
      "pageTitles": ["...", "..."],
      "reason": "...",
      "recommendation": "...",
      "duplicateQuestions": ["question text that appears in both"]
    }
  ],
  "summary": "Brief overall assessment"
}
If no cannibalization found, return empty clusters array with a positive summary.`;

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
          { role: "user", content: `Here are all ${pages.length} pages on the site:\n\n${pageList}\n\nAnalyze for cannibalization.` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (strip markdown fences if present)
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { clusters: [], summary: content.slice(0, 500) };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-cannibalization error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
