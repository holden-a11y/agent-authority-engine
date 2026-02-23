import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Globe, FileText, Save, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSiteConfig, useSaveSiteConfig, SiteConfigMap } from "@/hooks/use-site-config";

const Dashboard = () => {
  const { data: config, isLoading } = useSiteConfig();
  const saveMutation = useSaveSiteConfig();
  const [localOverrides, setLocalOverrides] = useState<Partial<SiteConfigMap>>({});
  const [savedSection, setSavedSection] = useState<string | null>(null);

  const merged: SiteConfigMap = { ...(config || {} as SiteConfigMap), ...localOverrides };

  const update = (key: keyof SiteConfigMap, value: string) => {
    setLocalOverrides((prev) => ({ ...prev, [key]: value }));
    setSavedSection(null);
  };

  const saveKeys = (keys: (keyof SiteConfigMap)[], section: string) => {
    const entries: Partial<SiteConfigMap> = {};
    for (const k of keys) {
      entries[k] = merged[k];
    }
    saveMutation.mutate(entries, {
      onSuccess: () => {
        // Clear saved overrides for these keys
        setLocalOverrides((prev) => {
          const next = { ...prev };
          for (const k of keys) delete next[k];
          return next;
        });
        setSavedSection(section);
        toast({ title: `${section.charAt(0).toUpperCase() + section.slice(1)} saved!`, description: "Your changes are stored in the database." });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary border-b border-border">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gold" />
            <h1 className="font-display text-lg font-bold text-primary-foreground">Site Dashboard</h1>
            <Badge variant="secondary" className="text-xs">Client</Badge>
          </div>
          <a href="/" className="text-primary-foreground/60 text-sm hover:text-primary-foreground transition-colors">
            ← Back to Site
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground text-sm">
            Use this dashboard to safely edit your site's content. Changes here update your site data without affecting the design or functionality.
          </p>
        </div>

        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="identity" className="gap-1.5"><User className="h-3.5 w-3.5" /> Identity</TabsTrigger>
            <TabsTrigger value="socials" className="gap-1.5"><Globe className="h-3.5 w-3.5" /> Social Links</TabsTrigger>
            <TabsTrigger value="content" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Page Content</TabsTrigger>
          </TabsList>

          {/* Identity */}
          <TabsContent value="identity">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl">Agent Identity</CardTitle>
                <CardDescription>Your name, contact info, and brokerage details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Agent Name</label>
                    <Input value={merged.agentName} onChange={(e) => update("agentName", e.target.value)} className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                    <Input value={merged.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(555) 123-4567" className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email Address</label>
                    <Input value={merged.email} onChange={(e) => update("email", e.target.value)} placeholder="agent@example.com" className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Market / City</label>
                    <Input value={merged.market} onChange={(e) => update("market", e.target.value)} className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Brokerage</label>
                    <Input value={merged.brokerage} onChange={(e) => update("brokerage", e.target.value)} placeholder="e.g. Keller Williams" className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Team Name</label>
                    <Input value={merged.teamName} onChange={(e) => update("teamName", e.target.value)} placeholder="e.g. The Richardson Group" className="h-9" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <Button variant="gold" onClick={() => saveKeys(["agentName", "phone", "email", "market", "brokerage", "teamName"], "identity")} disabled={saveMutation.isPending}>
                    <Save className="h-4 w-4 mr-1.5" /> Save Identity
                  </Button>
                  {savedSection === "identity" && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Saved</span>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Links */}
          <TabsContent value="socials">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl">Social Media Links</CardTitle>
                <CardDescription>Your online profiles. These appear in the site footer and JSON-LD schema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Google Business Profile</label>
                    <Input value={merged.googleBusinessProfile} onChange={(e) => update("googleBusinessProfile", e.target.value)} placeholder="https://g.page/..." className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Facebook</label>
                    <Input value={merged.facebookUrl} onChange={(e) => update("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Instagram</label>
                    <Input value={merged.instagramUrl} onChange={(e) => update("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">LinkedIn</label>
                    <Input value={merged.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/..." className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">YouTube</label>
                    <Input value={merged.youtubeUrl} onChange={(e) => update("youtubeUrl", e.target.value)} placeholder="https://youtube.com/@..." className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">X (Twitter)</label>
                    <Input value={merged.xUrl} onChange={(e) => update("xUrl", e.target.value)} placeholder="https://x.com/..." className="h-9" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">TikTok</label>
                    <Input value={merged.tiktokUrl} onChange={(e) => update("tiktokUrl", e.target.value)} placeholder="https://tiktok.com/@..." className="h-9" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <Button variant="gold" onClick={() => saveKeys(["googleBusinessProfile", "facebookUrl", "instagramUrl", "linkedinUrl", "youtubeUrl", "xUrl", "tiktokUrl"], "socials")} disabled={saveMutation.isPending}>
                    <Save className="h-4 w-4 mr-1.5" /> Save Social Links
                  </Button>
                  {savedSection === "socials" && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Saved</span>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Page Content */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl">Page Content</CardTitle>
                <CardDescription>Edit the text that appears on your About and Contact pages.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">About Page Bio</label>
                  <Textarea
                    value={merged.aboutBio}
                    onChange={(e) => update("aboutBio", e.target.value)}
                    placeholder="Tell visitors about yourself and your real estate experience..."
                    rows={6}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Contact Page Introduction</label>
                  <Textarea
                    value={merged.contactIntro}
                    onChange={(e) => update("contactIntro", e.target.value)}
                    placeholder="A brief message that appears on your contact page..."
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="gold" onClick={() => saveKeys(["aboutBio", "contactIntro"], "content")} disabled={saveMutation.isPending}>
                    <Save className="h-4 w-4 mr-1.5" /> Save Content
                  </Button>
                  {savedSection === "content" && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Saved</span>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
