import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, AlertTriangle, CheckCircle } from "lucide-react";
import { loadPages } from "@/lib/aeo-types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Cluster {
  severity: "low" | "medium" | "high";
  pageNumbers: number[];
  pageTitles: string[];
  reason: string;
  recommendation: string;
  duplicateQuestions?: string[];
}

interface ScanResult {
  clusters: Cluster[];
  summary: string;
}

const severityConfig = {
  low: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: "⚠️" },
  medium: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: "🔶" },
  high: { color: "bg-red-100 text-red-800 border-red-200", icon: "🔴" },
};

const CannibalizationScanner = () => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScan = async () => {
    const pages = loadPages();
    if (pages.length < 2) {
      toast({ title: "Need at least 2 pages to scan", variant: "destructive" });
      return;
    }

    setScanning(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("scan-cannibalization", {
        body: { pages },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as ScanResult);
      toast({
        title: data.clusters?.length
          ? `Found ${data.clusters.length} overlap cluster(s)`
          : "No cannibalization detected ✓",
      });
    } catch (e: any) {
      console.error("Scan error:", e);
      toast({ title: "Scan failed", description: e.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Cannibalization Scanner</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Scan all your pages for overlapping content, duplicate questions, and keyword cannibalization using AI analysis.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Button variant="gold" onClick={handleScan} disabled={scanning} className="gap-1.5">
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {scanning ? "Scanning..." : "Run Cannibalization Scan"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {loadPages().length} pages will be analyzed
            </span>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {result.clusters.length > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {result.clusters.length > 0
                      ? `${result.clusters.length} overlap cluster(s) found`
                      : "All clear — no cannibalization detected"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{result.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clusters */}
          {result.clusters.map((cluster, i) => {
            const config = severityConfig[cluster.severity] || severityConfig.low;
            return (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <CardTitle className="font-display text-base">
                      Overlap Cluster #{i + 1}
                    </CardTitle>
                    <Badge className={`${config.color} border text-xs`}>
                      {cluster.severity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {cluster.pageNumbers.length} pages
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Affected pages */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">AFFECTED PAGES</p>
                    <div className="space-y-1">
                      {cluster.pageTitles.map((title, j) => (
                        <p key={j} className="text-sm">
                          <span className="text-muted-foreground mr-1.5">#{cluster.pageNumbers[j]}</span>
                          {title}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">WHY IT OVERLAPS</p>
                    <p className="text-sm">{cluster.reason}</p>
                  </div>

                  {/* Duplicate questions */}
                  {cluster.duplicateQuestions && cluster.duplicateQuestions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">DUPLICATE QUESTIONS</p>
                      <ul className="space-y-1">
                        {cluster.duplicateQuestions.map((q, k) => (
                          <li key={k} className="text-sm text-orange-700 flex items-start gap-1.5">
                            <span className="shrink-0">•</span>
                            <span>"{q}"</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">RECOMMENDATION</p>
                    <p className="text-sm font-medium">{cluster.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
};

export default CannibalizationScanner;
