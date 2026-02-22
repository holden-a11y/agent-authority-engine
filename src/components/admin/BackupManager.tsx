import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, Trash2, RefreshCw, Clock } from "lucide-react";

interface Backup {
  id: string;
  backup_data: Record<string, unknown>;
  backup_type: string;
  created_at: string;
}

const BackupManager = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_backups")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBackups(data as unknown as Backup[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createBackup = async () => {
    setCreating(true);
    try {
      // Gather all localStorage data relevant to the site
      const backupData: Record<string, unknown> = {};
      const keys = ["aeo-pages", "aeo-categories", "aeo-entity-config", "aeo-site-content"];
      for (const key of keys) {
        const val = localStorage.getItem(key);
        if (val) {
          try { backupData[key] = JSON.parse(val); } catch { backupData[key] = val; }
        }
      }

      const { error } = await supabase.functions.invoke("create-backup", {
        body: { data: backupData, type: "manual" },
      });

      if (error) throw error;
      toast({ title: "Backup created!", description: "A snapshot of your site data has been saved." });
      fetchBackups();
    } catch (err: any) {
      toast({ title: "Backup failed", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = (backup: Backup) => {
    const data = backup.backup_data as Record<string, unknown>;
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    }
    toast({
      title: "Backup restored!",
      description: `Data from ${new Date(backup.created_at).toLocaleString()} has been restored. Reload the site to see changes.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-xl">Site Backups</CardTitle>
            <CardDescription>Snapshots of your site data. Auto-backups run every 24 hours.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchBackups} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="gold" size="sm" onClick={createBackup} disabled={creating}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> {creating ? "Creating..." : "Create Backup Now"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {backups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No backups yet. Create your first backup above.
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => {
              const pageCount = Array.isArray((backup.backup_data as any)?.["aeo-pages"])
                ? ((backup.backup_data as any)["aeo-pages"] as unknown[]).length
                : 0;
              return (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(backup.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pageCount} pages · {Object.keys(backup.backup_data).length} data keys
                      </p>
                    </div>
                    <Badge variant={backup.backup_type === "auto" ? "secondary" : "outline"} className="text-xs">
                      {backup.backup_type}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => restoreBackup(backup)}>
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Restore
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackupManager;
