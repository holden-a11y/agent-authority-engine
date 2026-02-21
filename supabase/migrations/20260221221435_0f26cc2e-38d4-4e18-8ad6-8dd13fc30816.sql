
CREATE TABLE public.sitemap_cache (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  xml_content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial empty row
INSERT INTO public.sitemap_cache (id, xml_content) VALUES (1, '');

-- Allow public read (crawlers), no auth needed for GET
ALTER TABLE public.sitemap_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sitemap"
  ON public.sitemap_cache FOR SELECT
  USING (true);

-- Edge function will use service role for writes, so no INSERT/UPDATE policy needed for anon
