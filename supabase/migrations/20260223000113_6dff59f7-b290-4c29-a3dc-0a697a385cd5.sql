
CREATE TABLE public.site_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read config" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Anyone can insert config" ON public.site_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update config" ON public.site_config FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete config" ON public.site_config FOR DELETE USING (true);
