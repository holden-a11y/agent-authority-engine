
-- Enable required extensions for scheduled backups
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Allow the backup edge function to insert/delete via service role
-- (service role bypasses RLS, but we need insert policy for the cron-triggered net.http_post)
CREATE POLICY "Allow insert for backups"
  ON public.site_backups FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow delete for cleanup"
  ON public.site_backups FOR DELETE
  USING (true);
