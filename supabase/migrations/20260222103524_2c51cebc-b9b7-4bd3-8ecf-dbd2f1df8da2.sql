
-- Create site_backups table for automated backup system
CREATE TABLE public.site_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  backup_type TEXT NOT NULL DEFAULT 'auto',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_backups ENABLE ROW LEVEL SECURITY;

-- Anyone can read backups (no auth on this site)
CREATE POLICY "Anyone can read backups"
  ON public.site_backups FOR SELECT
  USING (true);

-- Allow edge function to insert via service role (no user-facing insert policy needed)
-- The edge function uses service role key which bypasses RLS

-- Allow edge function to delete old backups via service role
-- No user-facing delete policy needed

-- Create index on created_at for efficient cleanup queries
CREATE INDEX idx_site_backups_created_at ON public.site_backups (created_at DESC);
