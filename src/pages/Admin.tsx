import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, FileText, SearchCheck, Database, Map } from "lucide-react";
import PageGenerator from "@/components/admin/PageGenerator";
import CannibalizationScanner from "@/components/admin/CannibalizationScanner";
import BackupManager from "@/components/admin/BackupManager";
import BlueprintPlanner from "@/components/admin/BlueprintPlanner";

interface EntityConfig {
  agentName: string;
  teamName: string;
  market: string;
  brokerage: string;
  fubApiKey: string;
  googleBusinessProfile: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  xUrl: string;
  tiktokUrl: string;
}

const defaultConfig: EntityConfig = {
  agentName: "Holden Richardson",
  teamName: "",
  market: "Grand Rapids, Michigan",
  brokerage: "",
  fubApiKey: "",
  googleBusinessProfile: "",
  facebookUrl: "https://www.facebook.com/profile.php?id=61585877413251",
  instagramUrl: "https://www.instagram.com/holdengr.re",
  linkedinUrl: "https://www.linkedin.com/in/holdenrichardson",
  youtubeUrl: "https://youtube.com/@holdengr.michigan",
  xUrl: "https://x.com/realholdengr",
  tiktokUrl: "https://www.tiktok.com/@realholdengr.re",
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState("entity");
  const [config, setConfig] = useState<EntityConfig>(() => {
    const stored = localStorage.getItem("aeo-entity-config");
    return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
  });
  const [saved, setSaved] = useState(false);

  const update = (key: keyof EntityConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("aeo-entity-config", JSON.stringify(config));
    setSaved(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
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

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="entity" className="gap-1.5"><Settings className="h-3.5 w-3.5" /> Agent Config</TabsTrigger>
            <TabsTrigger value="blueprint" className="gap-1.5"><Map className="h-3.5 w-3.5" /> Blueprint</TabsTrigger>
            <TabsTrigger value="pages" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Page Generator</TabsTrigger>
            <TabsTrigger value="cannibalization" className="gap-1.5"><SearchCheck className="h-3.5 w-3.5" /> Cannibalization</TabsTrigger>
            <TabsTrigger value="backups" className="gap-1.5"><Database className="h-3.5 w-3.5" /> Backups</TabsTrigger>
          </TabsList>

          {/* Agent Config */}
          <TabsContent value="entity">
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
                    <label className="text-sm font-medium mb-1.5 block">Follow Up Boss API Key</label>
                    <Input value={config.fubApiKey} onChange={(e) => update("fubApiKey", e.target.value)} placeholder="fka_..." type="password" className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Google Business Profile URL</label>
                    <Input value={config.googleBusinessProfile} onChange={(e) => update("googleBusinessProfile", e.target.value)} placeholder="https://g.page/..." className="h-9" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Facebook URL</label>
                    <Input value={config.facebookUrl} onChange={(e) => update("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Instagram URL</label>
                    <Input value={config.instagramUrl} onChange={(e) => update("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">LinkedIn URL</label>
                    <Input value={config.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">YouTube URL</label>
                    <Input value={config.youtubeUrl} onChange={(e) => update("youtubeUrl", e.target.value)} placeholder="https://youtube.com/@..." className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">X (Twitter) URL</label>
                    <Input value={config.xUrl} onChange={(e) => update("xUrl", e.target.value)} placeholder="https://x.com/..." className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">TikTok URL</label>
                    <Input value={config.tiktokUrl} onChange={(e) => update("tiktokUrl", e.target.value)} placeholder="https://tiktok.com/@..." className="h-9" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <Button variant="gold" onClick={handleSave}>Save Config</Button>
                  {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blueprint */}
          <TabsContent value="blueprint">
            <BlueprintPlanner onSwitchToGenerator={() => setActiveTab("pages")} />
          </TabsContent>

          {/* Page Generator */}
          <TabsContent value="pages">
            <PageGenerator
              agentName={config.agentName}
              market={config.market}
              socialUrls={[
                config.googleBusinessProfile,
                config.facebookUrl,
                config.instagramUrl,
                config.linkedinUrl,
                config.youtubeUrl,
                config.xUrl,
                config.tiktokUrl,
              ].filter(Boolean)}
              entityConfig={config}
            />
          </TabsContent>

          {/* Cannibalization Scanner */}
          <TabsContent value="cannibalization">
            <CannibalizationScanner />
          </TabsContent>

          {/* Backups */}
          <TabsContent value="backups">
            <BackupManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
