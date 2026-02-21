import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle, Trash2, AlertTriangle, Plus, X, Sparkles } from "lucide-react";
import { loadPages, savePages, AeoPage } from "@/lib/aeo-types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DuplicateInstance {
  index: number;
  pageId: string;
  pageTitle: string;
  question: string;
  questionId: string;
}

interface DuplicateGroup {
  question: string;
  instances: DuplicateInstance[];
}

interface ScanResult {
  duplicates: DuplicateGroup[];
  summary: string;
}

interface Suggestion {
  pageId: string;
  question: string;
  answer: string;
  loading: boolean;
}

const CannibalizationScanner = () => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, Suggestion>>({});

  const handleScan = async () => {
    const pages = loadPages();
    if (pages.length < 2) {
      toast({ title: "Need at least 2 pages to scan", variant: "destructive" });
      return;
    }

    setScanning(true);
    setResult(null);
    setSuggestions({});

    try {
      const { data, error } = await supabase.functions.invoke("scan-cannibalization", {
        body: { pages },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as ScanResult);
      toast({
        title: data.duplicates?.length
          ? `Found ${data.duplicates.length} duplicate question group(s)`
          : "No duplicate questions found ✓",
      });
    } catch (e: any) {
      console.error("Scan error:", e);
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const fetchSuggestion = async (page: AeoPage, removedQuestion: string) => {
    const key = page.id;
    setSuggestions((prev) => ({
      ...prev,
      [key]: { pageId: page.id, question: "", answer: "", loading: true },
    }));

    try {
      const existingQuestions = page.accordionQA.map((qa) => qa.question);
      const { data, error } = await supabase.functions.invoke("suggest-replacement-question", {
        body: {
          pageTitle: page.title,
          existingQuestions,
          removedQuestion,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuggestions((prev) => ({
        ...prev,
        [key]: { pageId: page.id, question: data.question || "", answer: data.answer || "", loading: false },
      }));
    } catch (e: any) {
      console.error("Suggestion error:", e);
      toast({ title: "Couldn't generate suggestion", description: e.message, variant: "destructive" });
      setSuggestions((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleRemoveQuestion = async (pageId: string, questionId: string, groupIndex: number, removedQuestionText: string) => {
    const key = `${pageId}-${questionId}`;
    setRemoving(key);

    const pages = loadPages();
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) {
      toast({ title: "Page not found", variant: "destructive" });
      setRemoving(null);
      return;
    }

    pages[pageIndex].accordionQA = pages[pageIndex].accordionQA.filter(
      (qa) => qa.id !== questionId
    );
    savePages(pages);

    // Update the result
    if (result) {
      const updated = { ...result };
      const group = updated.duplicates[groupIndex];
      if (group) {
        group.instances = group.instances.filter(
          (inst) => !(inst.pageId === pageId && inst.questionId === questionId)
        );
        if (group.instances.length <= 1) {
          updated.duplicates.splice(groupIndex, 1);
        }
      }
      setResult(updated);
    }

    toast({ title: "Question removed from page" });
    setRemoving(null);

    // Fetch suggestion for the page we just removed from
    const updatedPages = loadPages();
    const updatedPage = updatedPages.find((p) => p.id === pageId);
    if (updatedPage) {
      fetchSuggestion(updatedPage, removedQuestionText);
    }
  };

  const handleInsertSuggestion = (pageId: string) => {
    const suggestion = suggestions[pageId];
    if (!suggestion || !suggestion.question) return;

    const pages = loadPages();
    const pageIndex = pages.findIndex((p) => p.id === pageId);
    if (pageIndex === -1) return;

    pages[pageIndex].accordionQA.push({
      id: crypto.randomUUID(),
      question: suggestion.question,
      answer: suggestion.answer,
    });
    savePages(pages);

    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[pageId];
      return next;
    });

    toast({ title: "Question added to page" });
  };

  const handleDismissSuggestion = (pageId: string) => {
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[pageId];
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Duplicate Question Scanner</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Find FAQ questions that appear nearly identical across different pages, then remove them where you don't want them.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Button variant="gold" onClick={handleScan} disabled={scanning} className="gap-1.5">
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {scanning ? "Scanning..." : "Scan for Duplicates"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {loadPages().length} pages will be analyzed
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Suggestion cards (shown after removal) */}
      {Object.entries(suggestions).map(([pageId, suggestion]) => {
        const page = loadPages().find((p) => p.id === pageId);
        return (
          <Card key={pageId} className="border-2 border-dashed border-accent">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-foreground" />
                <CardTitle className="font-display text-sm">
                  Suggested replacement for "{page?.title || "page"}"
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {suggestion.loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating a unique replacement question...
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">QUESTION</p>
                    <p className="text-sm font-medium">{suggestion.question}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">ANSWER</p>
                    <p className="text-sm">{suggestion.answer}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="gold"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleInsertSuggestion(pageId)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Insert
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleDismissSuggestion(pageId)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Pass
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {result && (
        <>
          {/* Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {result.duplicates.length > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {result.duplicates.length > 0
                      ? `${result.duplicates.length} duplicate question group(s) found`
                      : "All clear — no duplicate questions detected"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{result.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duplicate groups */}
          {result.duplicates.map((group, gi) => (
            <Card key={gi} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="font-display text-base">
                    "{group.question}"
                  </CardTitle>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {group.instances.length} pages
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  FOUND ON THESE PAGES — click remove to delete it from that page
                </p>
                <div className="space-y-2">
                  {group.instances.map((inst, ii) => {
                    const isRemoving = removing === `${inst.pageId}-${inst.questionId}`;
                    return (
                      <div
                        key={ii}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/30"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{inst.pageTitle}</p>
                          <p className="text-xs text-muted-foreground truncate">"{inst.question}"</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="shrink-0 gap-1.5"
                          disabled={isRemoving}
                          onClick={() => handleRemoveQuestion(inst.pageId, inst.questionId, gi, inst.question)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {isRemoving ? "Removing..." : "Remove"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
};

export default CannibalizationScanner;
