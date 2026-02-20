import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, FileText, Link2, CheckSquare, LayoutDashboard, Plus, X } from "lucide-react";

interface EntityConfig {
  agentName: string;
  teamName: string;
  market: string;
  brokerage: string;
  niche1: string;
  niche2: string;
  targetNeighborhoods: string[];
  schoolDistricts: string[];
  keyEmployers: string[];
  agentBio: string;
  voiceToneNotes: string;
  fubWebhookUrl: string;
}

const defaultConfig: EntityConfig = {
  agentName: "Holden Richardson",
  teamName: "",
  market: "Grand Rapids, Michigan",
  brokerage: "",
  niche1: "Relocation to Grand Rapids",
  niche2: "Premium School District Communities",
  targetNeighborhoods: ["East Grand Rapids", "Ada", "Cascade", "Rockford", "Hudsonville", "Byron Center", "Grandville"],
  schoolDistricts: ["EGR Schools", "Forest Hills", "Rockford Schools", "Hudsonville Schools", "Byron Center Schools"],
  keyEmployers: ["Corewell Health", "Meijer", "Amway", "GE Aerospace"],
  agentBio: "",
  voiceToneNotes: "",
  fubWebhookUrl: "",
};

const pageCategories = [
  { name: "Buying Guides", count: 25, color: "bg-blue-100 text-blue-800" },
  { name: "Selling Guides", count: 25, color: "bg-green-100 text-green-800" },
  { name: "Neighborhood Pages", count: 20, color: "bg-amber-100 text-amber-800" },
  { name: "Market Insights", count: 8, color: "bg-purple-100 text-purple-800" },
  { name: "First-Time Buyer", count: 10, color: "bg-pink-100 text-pink-800" },
  { name: "Entity Profile", count: 1, color: "bg-slate-100 text-slate-800" },
  { name: "Niche: Relocation", count: 25, color: "bg-orange-100 text-orange-800" },
  { name: "Niche: School Districts", count: 25, color: "bg-teal-100 text-teal-800" },
];

function TagInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");
  const add = () => {
    if (input.trim() && !values.includes(input.trim())) {
      onChange([...values, input.trim()]);
      setInput("");
    }
  };
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <div className="flex gap-2 mb-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          className="h-9"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1 pr-1">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

const Admin = () => {
  const [config, setConfig] = useState<EntityConfig>(defaultConfig);
  const [saved, setSaved] = useState(false);

  const update = (key: keyof EntityConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("aeo-entity-config", JSON.stringify(config));
    setSaved(true);
  };

  const totalPages = pageCategories.reduce((a, c) => a + c.count, 0);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Admin header */}
      <header className="bg-primary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-gold" />
            <h1 className="font-display text-lg font-bold text-primary-foreground">AEO Factory</h1>
            <Badge variant="secondary" className="text-xs">Admin</Badge>
          </div>
          <a href="/" className="text-primary-foreground/60 text-sm hover:text-primary-foreground transition-colors">
            ← Back to Site
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <Tabs defaultValue="entity" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="entity" className="gap-1.5"><Settings className="h-3.5 w-3.5" /> Entity Config</TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Page Generator</TabsTrigger>
            <TabsTrigger value="map" className="gap-1.5"><LayoutDashboard className="h-3.5 w-3.5" /> Standardization Map</TabsTrigger>
            <TabsTrigger value="links" className="gap-1.5"><Link2 className="h-3.5 w-3.5" /> Linking Engine</TabsTrigger>
            <TabsTrigger value="qa" className="gap-1.5"><CheckSquare className="h-3.5 w-3.5" /> QA Suite</TabsTrigger>
          </TabsList>

          {/* Entity Config */}
          <TabsContent value="entity">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader><CardTitle className="font-display text-xl">Agent Identity</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Agent Name</label>
                        <Input value={config.agentName} onChange={(e) => update("agentName", e.target.value)} className="h-9" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Market / City</label>
                        <Input value={config.market} onChange={(e) => update("market", e.target.value)} className="h-9" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Brokerage</label>
                        <Input value={config.brokerage} onChange={(e) => update("brokerage", e.target.value)} placeholder="e.g. Keller Williams" className="h-9" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Team Name</label>
                        <Input value={config.teamName} onChange={(e) => update("teamName", e.target.value)} placeholder="e.g. The Richardson Group" className="h-9" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Follow Up Boss Webhook URL</label>
                        <Input value={config.fubWebhookUrl} onChange={(e) => update("fubWebhookUrl", e.target.value)} placeholder="https://..." className="h-9" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="font-display text-xl">Niches</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Niche 1</label>
                        <Input value={config.niche1} onChange={(e) => update("niche1", e.target.value)} className="h-9" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Niche 2</label>
                        <Input value={config.niche2} onChange={(e) => update("niche2", e.target.value)} className="h-9" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="font-display text-xl">Market Geography</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    <TagInput label="Target Neighborhoods" values={config.targetNeighborhoods} onChange={(v) => update("targetNeighborhoods", v)} placeholder="Add neighborhood" />
                    <TagInput label="School Districts" values={config.schoolDistricts} onChange={(v) => update("schoolDistricts", v)} placeholder="Add school district" />
                    <TagInput label="Key Employers" values={config.keyEmployers} onChange={(v) => update("keyEmployers", v)} placeholder="Add employer" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="font-display text-xl">Agent Voice</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Agent Bio / Story</label>
                      <textarea
                        value={config.agentBio}
                        onChange={(e) => update("agentBio", e.target.value)}
                        placeholder="Tell your story — this will be used to generate the entity profile and weave your authority throughout AEO pages..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Voice & Tone Notes</label>
                      <textarea
                        value={config.voiceToneNotes}
                        onChange={(e) => update("voiceToneNotes", e.target.value)}
                        placeholder="e.g. Professional but warm, avoid jargon, conversational, data-driven..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-3">
                  <Button variant="gold" onClick={handleSave}>Save Entity Config</Button>
                  {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
                </div>
              </div>

              {/* Sidebar summary */}
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="font-display text-lg">Page Blueprint</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-display font-bold text-gold mb-4">{totalPages} pages</p>
                    <div className="space-y-2">
                      {pageCategories.map((c) => (
                        <div key={c.name} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{c.name}</span>
                          <Badge className={c.color + " text-xs font-medium border-0"}>{c.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="font-display text-lg">Funnel Structure</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="p-3 bg-orange-50 rounded-md border border-orange-100">
                      <p className="font-medium text-orange-800">Top of Funnel</p>
                      <p className="text-orange-600 text-xs mt-0.5">Relocation pages → attract movers</p>
                    </div>
                    <div className="text-center text-muted-foreground">↓</div>
                    <div className="p-3 bg-teal-50 rounded-md border border-teal-100">
                      <p className="font-medium text-teal-800">Mid-Bottom Funnel</p>
                      <p className="text-teal-600 text-xs mt-0.5">School district / community pages</p>
                    </div>
                    <div className="text-center text-muted-foreground">↓</div>
                    <div className="p-3 bg-amber-50 rounded-md border border-amber-100">
                      <p className="font-medium text-amber-800">Conversion</p>
                      <p className="text-amber-600 text-xs mt-0.5">CTA → Follow Up Boss lead capture</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Placeholder tabs */}
          <TabsContent value="pages">
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">Page Generator</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Generate AEO-optimized pages with JSON-LD schema, internal linking, and agent authority positioning. Configure entity first, then generate pages by category.
              </p>
              <Button variant="gold" className="mt-6" disabled>Coming Next →</Button>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card className="p-12 text-center">
              <LayoutDashboard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">Standardization Map</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Visual dashboard of all page categories, clusters, and the hierarchical linking structure from pages → cluster pillars → categories → entity profile.
              </p>
              <Button variant="gold" className="mt-6" disabled>Coming Next →</Button>
            </Card>
          </TabsContent>

          <TabsContent value="links">
            <Card className="p-12 text-center">
              <Link2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">Linking Engine</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Manage internal link hierarchy, ensure no orphan pages, and validate the 3-inbound / 3-outbound link rule across all AEO pages.
              </p>
              <Button variant="gold" className="mt-6" disabled>Coming Next →</Button>
            </Card>
          </TabsContent>

          <TabsContent value="qa">
            <Card className="p-12 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">QA Suite</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Validation checks for JSON-LD correctness, internal link completeness, content quality scoring, and duplicate/cannibalization detection.
              </p>
              <Button variant="gold" className="mt-6" disabled>Coming Next →</Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
