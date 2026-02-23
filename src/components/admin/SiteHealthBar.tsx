import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSiteConfig } from "@/hooks/use-site-config";
import { usePages } from "@/hooks/use-aeo-data";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Status = "green" | "yellow" | "red";

interface HealthCheck {
  label: string;
  status: Status;
  description: string;
}

function useLatestBackup() {
  return useQuery({
    queryKey: ["latest-backup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_backups")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0]?.created_at ?? null;
    },
  });
}

function StatusDot({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full shrink-0",
        status === "green" && "bg-green-500",
        status === "yellow" && "bg-yellow-500",
        status === "red" && "bg-red-500"
      )}
    />
  );
}

export default function SiteHealthBar() {
  const { data: config, isLoading: configLoading } = useSiteConfig();
  const { data: pages = [], isLoading: pagesLoading } = usePages();
  const { data: latestBackupAt, isLoading: backupLoading } = useLatestBackup();

  const isLoading = configLoading || pagesLoading || backupLoading;

  if (isLoading) return null;

  const publishedPages = pages.filter((p) => p.status === "published");

  const checks: HealthCheck[] = [
    {
      label: "Config Complete",
      status: config?.agentName && config?.market ? "green" : "red",
      description:
        config?.agentName && config?.market
          ? "Agent name and market are set"
          : "Set agent name and market in Agent Config",
    },
    {
      label: "Pages Created",
      status: pages.length > 0 ? "green" : "yellow",
      description:
        pages.length > 0
          ? `${pages.length} page${pages.length !== 1 ? "s" : ""} in the system`
          : "No AEO pages created yet",
    },
    (() => {
      if (!latestBackupAt) return { label: "Backup Recent", status: "red" as Status, description: "No backups found" };
      const hoursAgo = (Date.now() - new Date(latestBackupAt).getTime()) / 3600000;
      if (hoursAgo <= 24) return { label: "Backup Recent", status: "green" as Status, description: `Last backup ${Math.round(hoursAgo)}h ago` };
      return { label: "Backup Recent", status: "yellow" as Status, description: `Last backup ${Math.round(hoursAgo)}h ago` };
    })(),
    {
      label: "Schema Valid",
      status:
        publishedPages.length === 0
          ? "yellow"
          : publishedPages.every((p) => Array.isArray(p.accordionQA) && (p.accordionQA as unknown[]).length > 0)
          ? "green"
          : "yellow",
      description:
        publishedPages.length === 0
          ? "No published pages to validate"
          : publishedPages.every((p) => Array.isArray(p.accordionQA) && (p.accordionQA as unknown[]).length > 0)
          ? "All published pages have FAQ content"
          : "Some published pages have empty FAQ content",
    },
  ];

  const hasRed = checks.some((c) => c.status === "red");

  return (
    <TooltipProvider delayDuration={200}>
      <Card
        className={cn(
          "px-4 py-3 flex items-center gap-6 flex-wrap",
          hasRed && "border-red-400/60 bg-red-50/30 dark:bg-red-950/10"
        )}
      >
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">
          Site Health
        </span>
        {checks.map((check) => (
          <Tooltip key={check.label}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-default">
                <StatusDot status={check.status} />
                <span className="text-sm font-medium">{check.label}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{check.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </Card>
    </TooltipProvider>
  );
}
