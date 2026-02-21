import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Plus, X, Eye, Trash2, Sparkles, Loader2, Check, FolderPlus
} from "lucide-react";
import {
  AeoPage, AeoQuestion, NavCategory,
  generateSlug, loadPages, savePages, loadCategories, saveCategories, DEFAULT_CATEGORIES
} from "@/lib/aeo-types";
import { useToast } from "@/hooks/use-toast";
import { scanForFairHousingViolations, FairHousingFlag } from "@/lib/fair-housing";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface PageGeneratorProps {
  agentName: string;
  market: string;
  socialUrls: string[];
  entityConfig?: Record<string, any>;
}

type Step = "input" | "review" | "done";

const PageGenerator = ({ agentName, market, socialUrls, entityConfig }: PageGeneratorProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [pages, setPages] = useState<AeoPage[]>(loadPages);
  const [categories, setCategories] = useState<NavCategory[]>(loadCategories);
  const [step, setStep] = useState<Step>("input");
  const [question, setQuestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftPage, setDraftPage] = useState<AeoPage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // ── Generate ──
  const handleGenerate = async () => {
    if (!question.trim()) {
      toast({ title: "Enter a question", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-aeo-content", {
        body: { title: question, h1: question, market, agentName, entityConfig },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const page: AeoPage = {
        id: crypto.randomUUID(),
        title: question,
        slug: generateSlug(question),
        categorySlug: "",
        status: "draft",
        h1: question,
        accordionQA: (data.faqItems || []).map((faq: any) => ({
          id: crypto.randomUUID(),
          question: faq.question,
          answer: faq.answer,
        })),
        youtubeVideoId: "",
        youtubeTranscript: "",
        metaDescription: data.metaDescription || "",
        createdAt: new Date().toISOString(),
      };
      setDraftPage(page);
      setStep("review");
    } catch (e: any) {
      console.error("Generation error:", e);
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Edit FAQ inline ──
  const updateQA = (id: string, field: keyof AeoQuestion, value: string) => {
    if (!draftPage) return;
    setDraftPage({
      ...draftPage,
      accordionQA: draftPage.accordionQA.map((qa) => (qa.id === id ? { ...qa, [field]: value } : qa)),
    });
  };

  const removeQA = (id: string) => {
    if (!draftPage) return;
    setDraftPage({ ...draftPage, accordionQA: draftPage.accordionQA.filter((qa) => qa.id !== id) });
  };

  const addQA = () => {
    if (!draftPage) return;
    setDraftPage({
      ...draftPage,
      accordionQA: [...draftPage.accordionQA, { id: crypto.randomUUID(), question: "", answer: "" }],
    });
  };

  // ── Add custom category ──
  const handleAddCategory = () => {
    if (!newCategoryLabel.trim()) return;
    const slug = generateSlug(newCategoryLabel);
    if (categories.some((c) => c.slug === slug)) {
      toast({ title: "Category already exists", variant: "destructive" });
      return;
    }
    const newCat: NavCategory = {
      slug,
      label: newCategoryLabel.trim(),
      color: "bg-indigo-100 text-indigo-800",
      isDefault: false,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveCategories(updated);
    setSelectedCategory(slug);
    setNewCategoryLabel("");
    setShowAddCategory(false);
    toast({ title: `Added "${newCat.label}" category` });
  };

  // ── Save page ──
  const handleSavePage = () => {
    if (!draftPage || !selectedCategory) {
      toast({ title: "Pick a category first", variant: "destructive" });
      return;
    }
    const finalPage: AeoPage = {
      ...draftPage,
      categorySlug: selectedCategory,
      parentId: selectedParentId || undefined,
      status: "published",
    };
    const updated = [...pages, finalPage];
    setPages(updated);
    savePages(updated);
    setStep("done");
    toast({ title: "Page created!", description: `/${selectedCategory}/${finalPage.slug}` });
  };

  // ── Delete existing page ──
  const deletePage = (id: string) => {
    const updated = pages.filter((p) => p.id !== id);
    setPages(updated);
    savePages(updated);
    toast({ title: "Page deleted" });
  };

  // ── Reset ──
  const reset = () => {
    setStep("input");
    setQuestion("");
    setDraftPage(null);
    setSelectedCategory("");
    setSelectedParentId(null);
  };

  // ── Fair housing ──
  const fairHousingFlags: FairHousingFlag[] = draftPage
    ? scanForFairHousingViolations(
        [draftPage.h1, draftPage.metaDescription, ...draftPage.accordionQA.map((qa) => `${qa.question} ${qa.answer}`)].join(" ")
      )
    : [];

  // ─────────────────────────
  // RENDER
  // ─────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Page Generator</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Enter a question, generate 10 FAQ sub-questions, assign a category, and publish.
        </p>
      </div>

      {/* ── Step 1: Input ── */}
      {step === "input" && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Your Question (becomes the page title & H1)</label>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. How Do I Buy A Home In Grand Rapids?"
                className="text-base"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Slug: <code className="bg-muted px-1 rounded">{question ? `/${generateSlug(question)}` : "/..."}</code>
              </p>
            </div>
            <Button variant="gold" onClick={handleGenerate} disabled={isGenerating} className="gap-1.5">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate 10 FAQs
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Review & assign category ── */}
      {step === "review" && draftPage && (
        <div className="space-y-6">
          {/* Fair housing warning */}
          {fairHousingFlags.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-destructive mb-2">⚠ Fair Housing flags</p>
                {fairHousingFlags.map((f, i) => (
                  <p key={i} className="text-xs text-muted-foreground">"{f.text}" — {f.reason}</p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Page preview/edit */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Review & Edit FAQs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">H1 / Title</label>
                <Input
                  value={draftPage.h1}
                  onChange={(e) => setDraftPage({ ...draftPage, h1: e.target.value, title: e.target.value, slug: generateSlug(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Meta Description</label>
                <Textarea
                  value={draftPage.metaDescription}
                  onChange={(e) => setDraftPage({ ...draftPage, metaDescription: e.target.value })}
                  className="min-h-[60px]"
                />
                <p className="text-xs text-muted-foreground mt-1">{draftPage.metaDescription.length}/155 chars</p>
              </div>

              {/* FAQ list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">FAQ Sub-Questions ({draftPage.accordionQA.length})</label>
                  <Button variant="outline" size="sm" onClick={addQA} className="gap-1 text-xs">
                    <Plus className="h-3 w-3" /> Add Q&A
                  </Button>
                </div>
                {draftPage.accordionQA.map((qa, i) => (
                  <div key={qa.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground mt-2.5 shrink-0">Q{i + 1}</span>
                      <Input
                        value={qa.question}
                        onChange={(e) => updateQA(qa.id, "question", e.target.value)}
                        placeholder="Sub-question..."
                        className="text-sm"
                      />
                      <Button variant="ghost" size="sm" className="shrink-0 text-destructive" onClick={() => removeQA(qa.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      value={qa.answer}
                      onChange={(e) => updateQA(qa.id, "answer", e.target.value)}
                      placeholder="Answer..."
                      className="text-sm min-h-[60px] ml-6"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category selection */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Assign to Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                URL will be: <code className="bg-muted px-1 rounded">/{selectedCategory || "..."}/{draftPage.slug}</code>
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.slug}
                    variant={selectedCategory === cat.slug ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.slug)}
                    className="gap-1.5"
                  >
                    {selectedCategory === cat.slug && <Check className="h-3 w-3" />}
                    {cat.label}
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setShowAddCategory(true)} className="gap-1 text-muted-foreground">
                  <FolderPlus className="h-3 w-3" /> Add Nav Page
                </Button>
              </div>

              {showAddCategory && (
                <div className="flex gap-2 items-center mt-2">
                  <Input
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                    placeholder="e.g. Relocation"
                    className="h-9 max-w-xs"
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  />
                  <Button variant="gold" size="sm" onClick={handleAddCategory}>Add</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAddCategory(false)}>Cancel</Button>
                </div>
              )}

              {/* Parent page selection */}
              {selectedCategory && (() => {
                const potentialParents = pages.filter(
                  (p) => p.categorySlug === selectedCategory && !p.parentId
                );
                if (potentialParents.length === 0) return null;
                return (
                  <div className="mt-4 pt-4 border-t border-border">
                    <label className="text-sm font-medium mb-2 block">
                      Make this a child page? <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={!selectedParentId ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedParentId(null)}
                      >
                        {!selectedParentId && <Check className="h-3 w-3 mr-1" />}
                        Top-level page
                      </Button>
                      {potentialParents.map((p) => (
                        <Button
                          key={p.id}
                          variant={selectedParentId === p.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedParentId(p.id)}
                          className="gap-1.5 max-w-xs truncate"
                        >
                          {selectedParentId === p.id && <Check className="h-3 w-3" />}
                          ↳ {p.title}
                        </Button>
                      ))}
                    </div>
                    {selectedParentId && (
                      <p className="text-xs text-muted-foreground mt-2">
                        This page will appear as a child link on its parent page.
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-3 pt-4">
                <Button variant="gold" onClick={handleSavePage} disabled={!selectedCategory} className="gap-1.5">
                  <Check className="h-4 w-4" /> Add Page
                </Button>
                <Button variant="outline" onClick={reset}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step 3: Done ── */}
      {step === "done" && draftPage && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">✓</div>
          <h3 className="font-display text-xl font-semibold mb-2">Page Created</h3>
          <p className="text-muted-foreground text-sm mb-4">
            <code>/{selectedCategory}/{draftPage.slug}</code>
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="gold" onClick={() => navigate(`/${selectedCategory}/${draftPage.slug}`)} className="gap-1.5">
              <Eye className="h-4 w-4" /> View Page
            </Button>
            <Button variant="outline" onClick={reset} className="gap-1.5">
              <Plus className="h-4 w-4" /> Create Another
            </Button>
          </div>
        </Card>
      )}

      {/* ── Existing pages list ── */}
      {pages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Your Pages ({pages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {categories.map((cat) => {
                const catPages = pages.filter((p) => p.categorySlug === cat.slug);
                if (catPages.length === 0) return null;
                return (
                  <div key={cat.slug} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${cat.color} border-0 text-xs`}>{cat.label}</Badge>
                      <span className="text-xs text-muted-foreground">{catPages.length} pages</span>
                    </div>
                    {catPages.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-1.5 px-3 rounded hover:bg-muted/50 group">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground">/{cat.slug}/{p.slug}</p>
                        </div>
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => navigate(`/${cat.slug}/${p.slug}`)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => deletePage(p.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              {/* Uncategorized */}
              {pages.filter((p) => !categories.some((c) => c.slug === p.categorySlug)).length > 0 && (
                <div className="mb-4">
                  <Badge variant="outline" className="mb-2 text-xs">Uncategorized</Badge>
                  {pages.filter((p) => !categories.some((c) => c.slug === p.categorySlug)).map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1.5 px-3 rounded hover:bg-muted/50 group">
                      <p className="text-sm truncate">{p.title}</p>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive opacity-0 group-hover:opacity-100" onClick={() => deletePage(p.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PageGenerator;
