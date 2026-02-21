import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Plus, X, Copy, Eye, Code, Trash2, ShieldCheck, AlertTriangle,
  Sparkles, Loader2, ChevronRight, ChevronDown, ArrowLeft, FolderTree
} from "lucide-react";
import {
  AeoPage, AeoPageCategory, AeoQuestion, PAGE_CATEGORIES,
  generateSlug, generatePageHtml, generateJsonLd
} from "@/lib/aeo-types";
import { useToast } from "@/hooks/use-toast";
import { scanForFairHousingViolations, FairHousingFlag } from "@/lib/fair-housing";
import { supabase } from "@/integrations/supabase/client";

interface CategoryWizardProps {
  agentName: string;
  market: string;
  socialUrls: string[];
  entityConfig?: Record<string, any>;
}

// ── Helpers ──

const loadPages = (): AeoPage[] => {
  try { return JSON.parse(localStorage.getItem("aeo-pages") || "[]"); }
  catch { return []; }
};

const persistPages = (pages: AeoPage[]) => {
  localStorage.setItem("aeo-pages", JSON.stringify(pages));
};

const getChildren = (pages: AeoPage[], parentSlug: string) =>
  pages.filter((p) => p.parentSlug === parentSlug);

const countDescendants = (pages: AeoPage[], slug: string): number => {
  const children = getChildren(pages, slug);
  return children.length + children.reduce((sum, c) => sum + countDescendants(pages, c.slug), 0);
};

// ── Views ──

type WizardView =
  | { type: "categories" }
  | { type: "category"; category: AeoPageCategory }
  | { type: "generate"; category: AeoPageCategory; parentSlug?: string; depth: number }
  | { type: "edit"; pageId: string }
  | { type: "add-children"; pageSlug: string };

// ── Component ──

const CategoryWizard = ({ agentName, market, socialUrls, entityConfig }: CategoryWizardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pages, setPages] = useState<AeoPage[]>(loadPages);
  const [view, setView] = useState<WizardView>({ type: "categories" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [childCount, setChildCount] = useState(3);
  const [suggestedChildren, setSuggestedChildren] = useState<string[]>([]);
  const [editingPage, setEditingPage] = useState<AeoPage | null>(null);
  const [showHtml, setShowHtml] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");

  const save = (updated: AeoPage[]) => {
    setPages(updated);
    persistPages(updated);
  };

  // ── AI Generation ──

  const generatePage = async (
    title: string,
    category: AeoPageCategory,
    parentSlug?: string,
    depth = 0
  ): Promise<AeoPage | null> => {
    setIsGenerating(true);
    try {
      const parentPage = parentSlug ? pages.find((p) => p.slug === parentSlug) : null;
      const { data, error } = await supabase.functions.invoke("generate-aeo-content", {
        body: {
          title,
          category,
          h1: title,
          market,
          agentName,
          parentTitle: parentPage?.title,
          entityConfig,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newPage: AeoPage = {
        id: crypto.randomUUID(),
        title,
        slug: generateSlug(title),
        category,
        status: "draft",
        h1: title,
        h2Questions: [],
        accordionQA: (data.faqItems || []).map((faq: any) => ({
          id: crypto.randomUUID(),
          question: faq.question,
          answer: faq.answer,
        })),
        relatedQuestions: [],
        parentSlug,
        depth,
        youtubeVideoId: "",
        youtubeTranscript: "",
        metaDescription: data.metaDescription || "",
        createdAt: new Date().toISOString(),
      };

      // Wire parent → child link
      let updatedPages = [...pages, newPage];
      if (parentSlug) {
        updatedPages = updatedPages.map((p) =>
          p.slug === parentSlug
            ? {
                ...p,
                relatedQuestions: [
                  ...(p.relatedQuestions || []).filter((rq) => rq.slug !== newPage.slug),
                  { title: newPage.title, slug: newPage.slug },
                ],
              }
            : p
        );
        // Wire child → parent link
        const parentIdx = updatedPages.findIndex((p) => p.id === newPage.id);
        if (parentIdx >= 0 && parentPage) {
          updatedPages[parentIdx] = {
            ...updatedPages[parentIdx],
            relatedQuestions: [
              { title: parentPage.title, slug: parentPage.slug },
              ...(updatedPages[parentIdx].relatedQuestions || []),
            ],
          };
        }
      }

      save(updatedPages);
      return newPage;
    } catch (e: any) {
      console.error("Generation error:", e);
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestChildTopics = async (parentTitle: string, category: AeoPageCategory, count: number) => {
    setIsGenerating(true);
    setSuggestedChildren([]);
    try {
      const { data, error } = await supabase.functions.invoke("generate-aeo-content", {
        body: {
          title: parentTitle,
          category,
          h1: parentTitle,
          market,
          agentName,
          mode: "suggest-children",
          childCount: count,
          entityConfig,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuggestedChildren(data.childTopics || []);
    } catch (e: any) {
      console.error("Suggest children error:", e);
      toast({ title: "Suggestion failed", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Page CRUD ──

  const savePage = () => {
    if (!editingPage) return;
    const updated = pages.map((p) => (p.id === editingPage.id ? editingPage : p));
    save(updated);
    setEditingPage(null);
    toast({ title: "Page saved" });
  };

  const deletePage = (id: string) => {
    const page = pages.find((p) => p.id === id);
    if (!page) return;
    // Remove from parent's relatedQuestions
    let updated = pages.filter((p) => p.id !== id);
    if (page.parentSlug) {
      updated = updated.map((p) =>
        p.slug === page.parentSlug
          ? { ...p, relatedQuestions: (p.relatedQuestions || []).filter((rq) => rq.slug !== page.slug) }
          : p
      );
    }
    // Recursively remove children
    const removeDescendants = (slug: string, list: AeoPage[]): AeoPage[] => {
      const children = list.filter((p) => p.parentSlug === slug);
      let result = list.filter((p) => p.parentSlug !== slug);
      children.forEach((c) => { result = removeDescendants(c.slug, result); });
      return result;
    };
    updated = removeDescendants(page.slug, updated);
    save(updated);
    toast({ title: "Page deleted" });
  };

  const updateQA = (id: string, field: keyof AeoQuestion, value: string) => {
    if (!editingPage) return;
    setEditingPage({
      ...editingPage,
      accordionQA: editingPage.accordionQA.map((qa) => (qa.id === id ? { ...qa, [field]: value } : qa)),
    });
  };

  const addQA = () => {
    if (!editingPage) return;
    setEditingPage({
      ...editingPage,
      accordionQA: [...editingPage.accordionQA, { id: crypto.randomUUID(), question: "", answer: "" }],
    });
  };

  const removeQA = (id: string) => {
    if (!editingPage) return;
    setEditingPage({
      ...editingPage,
      accordionQA: editingPage.accordionQA.filter((qa) => qa.id !== id),
    });
  };

  // ── Fair Housing ──
  const fairHousingFlags: FairHousingFlag[] = editingPage
    ? scanForFairHousingViolations(
        [editingPage.h1, editingPage.title, editingPage.metaDescription,
         ...editingPage.accordionQA.map((qa) => `${qa.question} ${qa.answer}`)].join(" ")
      )
    : [];

  const categoryLabel = (cat: AeoPageCategory) => PAGE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
  const categoryCss = (cat: AeoPageCategory) => PAGE_CATEGORIES.find((c) => c.value === cat)?.color ?? "";

  // ─────────────────────────────────────────────
  // ── RENDER: Categories List ──
  // ─────────────────────────────────────────────
  if (view.type === "categories") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Content Wizard</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Build your AEO content tree category by category. Generate parent pages, then drill into children and grandchildren.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PAGE_CATEGORIES.map((cat) => {
            const catPages = pages.filter((p) => p.category === cat.value);
            const parents = catPages.filter((p) => !p.parentSlug);
            const hasParent = parents.length > 0;
            return (
              <Card
                key={cat.value}
                className="cursor-pointer hover:border-primary/40 transition-colors group"
                onClick={() => setView({ type: "category", category: cat.value })}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={`${cat.color} border-0 text-xs`}>{cat.label}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-2xl font-display font-bold">{catPages.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {hasParent ? `${parents.length} parent · ${catPages.length - parents.length} children` : "No pages yet"}
                    </p>
                  </div>
                  {!hasParent && (
                    <Button variant="outline" size="sm" className="mt-3 w-full gap-1 text-xs">
                      <Sparkles className="h-3 w-3" /> Start Category
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Global stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total pages generated</p>
                <p className="text-3xl font-display font-bold">{pages.length}</p>
              </div>
              {pages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive gap-1"
                  onClick={() => {
                    if (confirm("Delete ALL generated pages? This cannot be undone.")) {
                      save([]);
                      toast({ title: "All pages deleted" });
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" /> Clear All
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // ── RENDER: Category Tree View ──
  // ─────────────────────────────────────────────
  if (view.type === "category") {
    const cat = PAGE_CATEGORIES.find((c) => c.value === view.category)!;
    const catPages = pages.filter((p) => p.category === view.category);
    const parentPages = catPages.filter((p) => !p.parentSlug);

    const TreeNode = ({ page, depth = 0 }: { page: AeoPage; depth?: number }) => {
      const children = getChildren(pages, page.slug);
      const descendants = countDescendants(pages, page.slug);
      return (
        <div className="ml-0">
          <div
            className={`flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors group ${depth > 0 ? "ml-6 border-l-2 border-border pl-4" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {children.length > 0 && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                {children.length === 0 && depth > 0 && <div className="w-3.5" />}
                <span className="text-sm font-medium truncate">{page.title}</span>
                {descendants > 0 && (
                  <span className="text-xs text-muted-foreground">({descendants})</span>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => {
                setEditingPage(page);
                setView({ type: "edit", pageId: page.id });
              }}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => navigate(`/pages/${page.slug}`)}>
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => {
                setView({ type: "add-children", pageSlug: page.slug });
                setChildCount(3);
                setSuggestedChildren([]);
              }}>
                <Plus className="h-3 w-3" /> Children
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive hover:text-destructive" onClick={() => deletePage(page.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {children.length > 0 && (
            <div>
              {children.map((child) => (
                <TreeNode key={child.id} page={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView({ type: "categories" })}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Categories
          </Button>
          <Badge className={`${cat.color} border-0`}>{cat.label}</Badge>
          <span className="text-sm text-muted-foreground">{catPages.length} pages</span>
        </div>

        {parentPages.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderTree className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No parent page yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Start by generating the main parent question for {cat.label}. Then add child sub-questions beneath it.
            </p>
            <Button
              variant="gold"
              onClick={() => setView({ type: "generate", category: view.category, depth: 0 })}
              className="gap-1.5"
            >
              <Sparkles className="h-4 w-4" /> Generate Parent Page
            </Button>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <FolderTree className="h-4 w-4" /> Page Tree
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setView({ type: "generate", category: view.category, depth: 0 })}>
                  <Plus className="h-3 w-3" /> Another Parent
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {parentPages.map((p) => (
                <TreeNode key={p.id} page={p} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // ── RENDER: Generate Parent Page ──
  // ─────────────────────────────────────────────
  if (view.type === "generate") {
    const cat = PAGE_CATEGORIES.find((c) => c.value === view.category)!;

    const handleGenerate = async () => {
      if (!newPageTitle.trim()) {
        toast({ title: "Enter a question", variant: "destructive" });
        return;
      }
      const page = await generatePage(newPageTitle, view.category, view.parentSlug, view.depth);
      if (page) {
        setNewPageTitle("");
        setEditingPage(page);
        setView({ type: "edit", pageId: page.id });
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView({ type: "category", category: view.category })}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Badge className={`${cat.color} border-0`}>{cat.label}</Badge>
          <span className="text-sm text-muted-foreground">
            {view.depth === 0 ? "New Parent Page" : `Depth ${view.depth}`}
          </span>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              {view.depth === 0 ? "What's the main question for this category?" : "Enter the child question"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Question Title</label>
              <Input
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                placeholder={`e.g. How Do I Buy a Home in ${market}?`}
                className="h-11 text-base"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Must be a natural question — this becomes the page title, H1, and slug.
              </p>
            </div>
            <Button variant="gold" onClick={handleGenerate} disabled={isGenerating} className="w-full gap-2">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isGenerating ? "Generating 10 FAQs..." : "Generate Page"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // ── RENDER: Add Children ──
  // ─────────────────────────────────────────────
  if (view.type === "add-children") {
    const parentPage = pages.find((p) => p.slug === view.pageSlug);
    if (!parentPage) return null;

    const existingChildren = getChildren(pages, view.pageSlug);

    const handleSuggest = () => {
      suggestChildTopics(parentPage.title, parentPage.category, childCount);
    };

    const handleGenerateChild = async (title: string) => {
      const page = await generatePage(
        title,
        parentPage.category,
        parentPage.slug,
        (parentPage.depth || 0) + 1
      );
      if (page) {
        // Remove from suggestions
        setSuggestedChildren((prev) => prev.filter((t) => t !== title));
        toast({ title: `Generated: ${title}` });
      }
    };

    const handleGenerateAll = async () => {
      for (const title of suggestedChildren) {
        await handleGenerateChild(title);
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView({ type: "category", category: parentPage.category })}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tree
          </Button>
          <Badge className={`${categoryCss(parentPage.category)} border-0`}>
            {categoryLabel(parentPage.category)}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">
              Add Children Under: "{parentPage.title}"
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingChildren.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Existing children ({existingChildren.length})</p>
                <div className="space-y-1">
                  {existingChildren.map((c) => (
                    <div key={c.id} className="text-sm py-1.5 px-3 rounded bg-muted/50 flex items-center gap-2">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      {c.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium mb-3">How many new child questions do you want?</p>
              <div className="flex gap-3 items-center">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={childCount}
                  onChange={(e) => setChildCount(parseInt(e.target.value) || 3)}
                  className="h-9 w-20"
                />
                <Button variant="gold" onClick={handleSuggest} disabled={isGenerating} className="gap-1.5">
                  {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {isGenerating ? "Suggesting..." : "Suggest Topics"}
                </Button>
              </div>
            </div>

            {suggestedChildren.length > 0 && (
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Suggested child questions</p>
                  <Button variant="outline" size="sm" onClick={handleGenerateAll} disabled={isGenerating} className="gap-1 text-xs">
                    <Sparkles className="h-3 w-3" /> Generate All
                  </Button>
                </div>
                {suggestedChildren.map((title, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-md border border-border">
                    <Input
                      value={title}
                      onChange={(e) => {
                        const updated = [...suggestedChildren];
                        updated[i] = e.target.value;
                        setSuggestedChildren(updated);
                      }}
                      className="h-8 text-sm flex-1"
                    />
                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs shrink-0" onClick={() => handleGenerateChild(title)} disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Generate
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => setSuggestedChildren((prev) => prev.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // ── RENDER: Edit Page (inline preview) ──
  // ─────────────────────────────────────────────
  if (view.type === "edit" && editingPage) {
    const parentPage = editingPage.parentSlug ? pages.find((p) => p.slug === editingPage.parentSlug) : null;
    const children = getChildren(pages, editingPage.slug);

    return (
      <div className="space-y-6">
        {/* Editor header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => {
              savePage();
              setView({ type: "category", category: editingPage.category });
            }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tree
            </Button>
            <Badge className={`${categoryCss(editingPage.category)} border-0`}>
              {categoryLabel(editingPage.category)}
            </Badge>
            {editingPage.depth !== undefined && editingPage.depth > 0 && (
              <span className="text-xs text-muted-foreground">Depth {editingPage.depth}</span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowHtml(!showHtml)} className="gap-1.5">
              <Code className="h-3.5 w-3.5" /> {showHtml ? "Hide HTML" : "View HTML"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/pages/${editingPage.slug}`)} className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button variant="gold" size="sm" onClick={savePage}>Save Page</Button>
          </div>
        </div>

        {/* Breadcrumb */}
        {parentPage && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <button onClick={() => { savePage(); setEditingPage(parentPage); setView({ type: "edit", pageId: parentPage.id }); }}
              className="hover:text-foreground transition-colors truncate max-w-[200px]">
              {parentPage.title}
            </button>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium truncate">{editingPage.title}</span>
          </div>
        )}

        {/* Fair Housing */}
        {fairHousingFlags.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {fairHousingFlags.map((flag, i) => (
                    <p key={i} className="text-xs text-destructive">
                      <strong>"{flag.text}"</strong> — {flag.reason}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Meta */}
            <Card>
              <CardHeader><CardTitle className="font-display text-xl">Page Question</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Question Title (H1)</label>
                  <Input
                    value={editingPage.title}
                    onChange={(e) => setEditingPage({
                      ...editingPage,
                      title: e.target.value,
                      h1: e.target.value,
                      slug: generateSlug(e.target.value),
                    })}
                    className="h-10 text-base"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Slug: /{editingPage.slug}</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Meta Description <span className="text-muted-foreground font-normal">({editingPage.metaDescription.length}/160)</span>
                  </label>
                  <Textarea
                    value={editingPage.metaDescription}
                    onChange={(e) => setEditingPage({ ...editingPage, metaDescription: e.target.value })}
                    placeholder="155 chars max"
                    className="min-h-[60px]"
                    maxLength={160}
                  />
                </div>
              </CardContent>
            </Card>

            {/* FAQ Accordion */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-xl">FAQ Questions & Answers ({editingPage.accordionQA.length})</CardTitle>
                  <Button variant="outline" size="sm" onClick={addQA} className="gap-1">
                    <Plus className="h-3 w-3" /> Add Q&A
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="space-y-2">
                  {editingPage.accordionQA.map((qa, i) => (
                    <AccordionItem key={qa.id} value={qa.id} className="border rounded-md px-3">
                      <AccordionTrigger className="text-sm py-3">
                        <span className="text-left flex-1 truncate">{qa.question || `Q&A #${i + 1} — click to edit`}</span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pb-4">
                        <div>
                          <label className="text-xs font-medium mb-1 block">Question</label>
                          <Input value={qa.question} onChange={(e) => updateQA(qa.id, "question", e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block">Answer</label>
                          <Textarea value={qa.answer} onChange={(e) => updateQA(qa.id, "answer", e.target.value)} className="min-h-[80px] text-sm" />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeQA(qa.id)} className="text-destructive hover:text-destructive text-xs h-7">
                          <Trash2 className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="font-display text-lg">Page Info</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><Badge className={`${categoryCss(editingPage.category)} border-0 text-xs`}>{categoryLabel(editingPage.category)}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">FAQ items</span><span className="font-medium">{editingPage.accordionQA.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Children</span><span className="font-medium">{children.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Depth</span><span className="font-medium">{editingPage.depth || 0}</span></div>
              </CardContent>
            </Card>

            {/* Add children action */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => {
                    savePage();
                    setView({ type: "add-children", pageSlug: editingPage.slug });
                    setChildCount(3);
                    setSuggestedChildren([]);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Child Pages
                </Button>
                {children.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Children:</p>
                    {children.map((c) => (
                      <button
                        key={c.id}
                        className="text-xs text-left w-full py-1 px-2 rounded hover:bg-muted/50 transition-colors truncate flex items-center gap-1"
                        onClick={() => {
                          savePage();
                          setEditingPage(c);
                          setView({ type: "edit", pageId: c.id });
                        }}
                      >
                        <ChevronRight className="h-3 w-3 shrink-0" />
                        {c.title}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* JSON-LD */}
            <Card>
              <CardHeader><CardTitle className="font-display text-lg">JSON-LD Preview</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-[250px] whitespace-pre-wrap font-mono">
                  {JSON.stringify(generateJsonLd(editingPage, agentName, market, socialUrls), null, 2)}
                </pre>
              </CardContent>
            </Card>

            {showHtml && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-lg">HTML</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => {
                      navigator.clipboard.writeText(generatePageHtml(editingPage, agentName, market, socialUrls));
                      toast({ title: "Copied!" });
                    }} className="h-7 text-xs gap-1"><Copy className="h-3 w-3" /> Copy</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-[300px] whitespace-pre-wrap font-mono">
                    {generatePageHtml(editingPage, agentName, market, socialUrls)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CategoryWizard;
