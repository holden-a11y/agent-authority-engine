import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, RefreshCw, Clock, Loader2 } from "lucide-react";

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
  const [restoring, setRestoring] = useState<string | null>(null);

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
      // Snapshot all three DB tables
      const [pagesRes, categoriesRes, configRes] = await Promise.all([
        supabase.from("aeo_pages").select("*"),
        supabase.from("aeo_categories").select("*"),
        supabase.from("site_config").select("*"),
      ]);

      if (pagesRes.error) throw pagesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (configRes.error) throw configRes.error;

      const backupData = {
        aeo_pages: pagesRes.data,
        aeo_categories: categoriesRes.data,
        site_config: configRes.data,
      };

      const { error } = await supabase.functions.invoke("create-backup", {
        body: { data: backupData, type: "manual" },
      });

      if (error) throw error;
      toast({ title: "Backup created!", description: "A snapshot of your database has been saved." });
      fetchBackups();
    } catch (err: any) {
      toast({ title: "Backup failed", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (backup: Backup) => {
    setRestoring(backup.id);
    try {
      const data = backup.backup_data as Record<string, any>;

      // Restore site_config via upsert
      if (Array.isArray(data.site_config) && data.site_config.length > 0) {
        const { error } = await supabase
          .from("site_config")
          .upsert(data.site_config, { onConflict: "key" });
        if (error) throw error;
      }

      // Restore aeo_categories: delete all then re-insert
      if (Array.isArray(data.aeo_categories)) {
        await supabase.from("aeo_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (data.aeo_categories.length > 0) {
          const { error } = await supabase.from("aeo_categories").insert(data.aeo_categories);
          if (error) throw error;
        }
      }

      // Restore aeo_pages: delete all then re-insert
      if (Array.isArray(data.aeo_pages)) {
        await supabase.from("aeo_pages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (data.aeo_pages.length > 0) {
          const { error } = await supabase.from("aeo_pages").insert(data.aeo_pages);
          if (error) throw error;
        }
      }

      toast({
        title: "Backup restored!",
        description: `Data from ${new Date(backup.created_at).toLocaleString()} has been restored. Reload the page to see changes.`,
      });
    } catch (err: any) {
      toast({ title: "Restore failed", description: err.message, variant: "destructive" });
    } finally {
      setRestoring(null);
    }
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
              const pageCount = Array.isArray((backup.backup_data as any)?.aeo_pages)
                ? ((backup.backup_data as any).aeo_pages as unknown[]).length
                : 0;
              const catCount = Array.isArray((backup.backup_data as any)?.aeo_categories)
                ? ((backup.backup_data as any).aeo_categories as unknown[]).length
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
                        {pageCount} pages · {catCount} categories · {Object.keys(backup.backup_data).length} tables
                      </p>
                    </div>
                    <Badge variant={backup.backup_type === "auto" ? "secondary" : "outline"} className="text-xs">
                      {backup.backup_type}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => restoreBackup(backup)} disabled={restoring === backup.id}>
                    {restoring === backup.id ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                    {restoring === backup.id ? "Restoring..." : "Restore"}
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
