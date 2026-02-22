import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Plus, ExternalLink, ChevronRight, FileText } from "lucide-react";
import { usePages, useCategories } from "@/hooks/use-aeo-data";
import { AeoPage } from "@/lib/aeo-types";

interface BlueprintCategory {
  slug: string;
  label: string;
  description: string;
  min: number;
  max: number;
  enabled: boolean;
  emoji: string;
}

const DEFAULT_BLUEPRINT: BlueprintCategory[] = [
  { slug: "buyers", label: "Buyers", description: "Home buying guides, financing, process questions", min: 3, max: 10, enabled: true, emoji: "🏠" },
  { slug: "sellers", label: "Sellers", description: "Home selling guides, pricing, staging, market timing", min: 3, max: 10, enabled: true, emoji: "💰" },
  { slug: "neighborhoods", label: "Neighborhoods", description: "Area guides, school districts, lifestyle questions", min: 3, max: 15, enabled: true, emoji: "📍" },
  { slug: "market-insights", label: "Market Insights", description: "Market trends, data, forecasts, investment questions", min: 2, max: 8, enabled: true, emoji: "📊" },
  { slug: "first-time-buyers", label: "First-Time Buyers", description: "First-time specific guides — can be disabled if not relevant", min: 2, max: 8, enabled: true, emoji: "🔑" },
  { slug: "entity", label: "Agent Profile", description: "About the agent, credentials, philosophy", min: 1, max: 3, enabled: true, emoji: "👤" },
];

function loadBlueprint(): BlueprintCategory[] {
  try {
    const stored = localStorage.getItem("aeo-blueprint");
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_BLUEPRINT.map((c) => ({ ...c }));
}

function saveBlueprint(bp: BlueprintCategory[]) {
  localStorage.setItem("aeo-blueprint", JSON.stringify(bp));
}

function getHealthBadge(count: number, max: number) {
  if (max === 0) return { label: "Healthy", variant: "green" as const };
  const ratio = count / max;
  if (ratio >= 0.9) return { label: "At Capacity", variant: "red" as const };
  if (ratio >= 0.6) return { label: "Filling Up", variant: "yellow" as const };
  return { label: "Healthy", variant: "green" as const };
}

const healthColors = {
  green: "bg-green-100 text-green-800 border-green-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  red: "bg-red-100 text-red-800 border-red-200",
};

interface BlueprintPlannerProps {
  onSwitchToGenerator?: () => void;
}

export default function BlueprintPlanner({ onSwitchToGenerator }: BlueprintPlannerProps) {
  const { data: pages = [] } = usePages();
  const [blueprint, setBlueprint] = useState<BlueprintCategory[]>(loadBlueprint);
  const [newNiche, setNewNiche] = useState("");

  const pagesByCategory = useMemo(() => {
    const map: Record<string, AeoPage[]> = {};
    for (const p of pages) {
      (map[p.categorySlug] ||= []).push(p);
    }
    return map;
  }, [pages]);

  const enabledCategories = blueprint.filter((c) => c.enabled);
  const totalPages = pages.length;
  const totalMax = enabledCategories.reduce((s, c) => s + c.max, 0);

  const overallHealth = getHealthBadge(totalPages, totalMax);

  const update = (slug: string, patch: Partial<BlueprintCategory>) => {
    setBlueprint((prev) => {
      const next = prev.map((c) => (c.slug === slug ? { ...c, ...patch } : c));
      saveBlueprint(next);
      return next;
    });
  };

  const addNiche = () => {
    const label = newNiche.trim();
    if (!label) return;
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    if (blueprint.some((c) => c.slug === slug)) return;
    setBlueprint((prev) => {
      const next = [...prev, { slug, label, description: "Custom niche category", min: 3, max: 10, enabled: true, emoji: "📁" }];
      saveBlueprint(next);
      return next;
    });
    setNewNiche("");
  };

  // Build tree per category
  function buildTree(catPages: AeoPage[]) {
    const roots = catPages.filter((p) => !p.parentId);
    const childMap: Record<string, AeoPage[]> = {};
    for (const p of catPages) {
      if (p.parentId) (childMap[p.parentId] ||= []).push(p);
    }
    return { roots, childMap };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold">AEO Blueprint</h2>
        <p className="text-muted-foreground mt-1">
          Your page-building roadmap. Each category has a recommended range — not a rigid quota. Build what makes sense for this agent's market, stop when cannibalization signals say so.
        </p>
      </div>

      {/* Summary Bar */}
      <Card className="bg-muted/50">
        <CardContent className="py-4 flex flex-wrap items-center gap-6">
          <div className="text-sm">
            <span className="text-muted-foreground">Total Pages</span>
            <span className="ml-2 font-display font-bold text-lg">{totalPages}</span>
            <span className="text-muted-foreground"> of {totalMax}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Categories Active</span>
            <span className="ml-2 font-display font-bold text-lg">{enabledCategories.length}</span>
            <span className="text-muted-foreground"> of {blueprint.length}</span>
          </div>
          <Badge className={`${healthColors[overallHealth.variant]} border text-xs`}>
            {overallHealth.label}
          </Badge>
        </CardContent>
      </Card>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {blueprint.map((cat) => {
          const catPages = pagesByCategory[cat.slug] || [];
          const count = catPages.length;
          const health = getHealthBadge(count, cat.max);
          const progress = cat.max > 0 ? Math.min((count / cat.max) * 100, 100) : 0;

          return (
            <Card key={cat.slug} className={!cat.enabled ? "opacity-50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <span>{cat.emoji}</span> {cat.label}
                  </CardTitle>
                  <Switch checked={cat.enabled} onCheckedChange={(v) => update(cat.slug, { enabled: v })} />
                </div>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Range:</span>
                  <Input
                    type="number"
                    value={cat.min}
                    onChange={(e) => update(cat.slug, { min: Math.max(0, +e.target.value) })}
                    className="h-7 w-14 text-center text-xs"
                    min={0}
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="number"
                    value={cat.max}
                    onChange={(e) => update(cat.slug, { max: Math.max(1, +e.target.value) })}
                    className="h-7 w-14 text-center text-xs"
                    min={1}
                  />
                  <span className="text-muted-foreground text-xs">pages</span>
                </div>

                <div className="flex items-end justify-between">
                  <span className="font-display text-3xl font-bold">{count}</span>
                  <Badge className={`${healthColors[health.variant]} border text-xs`}>
                    {health.label}
                  </Badge>
                </div>

                <Progress value={progress} className="h-2" />

                <a
                  href={`/${cat.slug}`}
                  className="text-xs text-gold hover:underline inline-flex items-center gap-1"
                >
                  View Pages <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Niche */}
      <div className="flex gap-2 max-w-sm">
        <Input
          placeholder="Add niche (e.g. Relocation)"
          value={newNiche}
          onChange={(e) => setNewNiche(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNiche()}
          className="h-9"
        />
        <Button variant="outline" size="sm" onClick={addNiche} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Niche
        </Button>
      </div>

      {/* Visual Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Page Hierarchy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {enabledCategories.map((cat) => {
            const catPages = pagesByCategory[cat.slug] || [];
            const { roots, childMap } = buildTree(catPages);

            return (
              <div key={cat.slug}>
                <div className="flex items-center gap-2 font-display font-semibold text-sm mb-2">
                  <span>{cat.emoji}</span> {cat.label}
                  <Badge variant="secondary" className="text-xs font-normal">{catPages.length}</Badge>
                </div>

                {roots.length === 0 ? (
                  <div className="ml-6 border-l-2 border-border pl-4 py-2">
                    <p className="text-xs text-muted-foreground italic">No pages yet</p>
                    {onSwitchToGenerator && (
                      <Button variant="link" size="sm" className="text-xs text-gold p-0 h-auto mt-1" onClick={onSwitchToGenerator}>
                        <FileText className="h-3 w-3 mr-1" /> Go to Page Generator
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="ml-6 border-l-2 border-border">
                    {roots.map((page) => (
                      <TreeNode key={page.id} page={page} childMap={childMap} categorySlug={cat.slug} depth={0} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function TreeNode({ page, childMap, categorySlug, depth }: { page: AeoPage; childMap: Record<string, AeoPage[]>; categorySlug: string; depth: number }) {
  const children = childMap[page.id] || [];
  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 pl-4 py-1">
        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        <a
          href={`/${categorySlug}/${page.slug}`}
          className="text-sm hover:text-gold transition-colors truncate"
          title={page.title}
        >
          {page.title}
        </a>
        {page.status === "draft" && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">draft</Badge>
        )}
      </div>
      {children.length > 0 && (
        <div className="ml-4 border-l-2 border-border/50">
          {children.map((child) => (
            <TreeNode key={child.id} page={child} childMap={childMap} categorySlug={categorySlug} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
