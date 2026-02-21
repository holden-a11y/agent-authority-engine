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
      return new Response(JSON.stringify({ duplicates: [], summary: "Need at least 2 pages to scan." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build a compact list of every question with its page
    const questionList = pages.flatMap((p: any) =>
      (p.accordionQA || []).map((qa: any) => ({
        pageId: p.id,
        pageTitle: p.title,
        questionId: qa.id,
        question: qa.question,
      }))
    );

    const questionsText = questionList
      .map((q: any, i: number) => `[${i}] Page: "${q.pageTitle}" | Q: "${q.question}"`)
      .join("\n");

    const systemPrompt = `You are a duplicate-question detector for a real estate FAQ website. Your ONLY job is to find FAQ questions that are essentially the same or nearly identical across DIFFERENT pages.

Rules:
- Only flag questions that appear on DIFFERENT pages and ask essentially the same thing.
- Questions on the SAME page should NOT be flagged.
- Do NOT flag questions that are merely related or in the same topic area — only flag true duplicates/near-duplicates where the wording is very similar or the intent is identical.
- Group each set of duplicate questions together.
- Return valid JSON only, no markdown. Schema:
{
  "duplicates": [
    {
      "question": "The common question text (pick the most representative wording)",
      "instances": [
        { "index": 0, "pageTitle": "...", "question": "exact question text from this page" },
        { "index": 3, "pageTitle": "...", "question": "exact question text from this page" }
      ]
    }
  ],
  "summary": "Brief summary like 'Found 3 duplicate question groups' or 'No duplicates found'"
}
If no duplicates found, return empty duplicates array with a positive summary.`;

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
          { role: "user", content: `Here are all ${questionList.length} FAQ questions across ${pages.length} pages:\n\n${questionsText}\n\nFind duplicate questions.` },
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

    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { duplicates: [], summary: content.slice(0, 500) };
    }

    // Enrich with pageId and questionId from our original list
    if (parsed.duplicates) {
      for (const dup of parsed.duplicates) {
        if (dup.instances) {
          for (const inst of dup.instances) {
            const original = questionList[inst.index];
            if (original) {
              inst.pageId = original.pageId;
              inst.questionId = original.questionId;
              inst.pageTitle = original.pageTitle;
              inst.question = original.question;
            }
          }
        }
      }
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
