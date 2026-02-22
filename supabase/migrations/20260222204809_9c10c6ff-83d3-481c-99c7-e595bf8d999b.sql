
-- Create aeo_categories table
CREATE TABLE public.aeo_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-slate-100 text-slate-800',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aeo_categories ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read categories"
  ON public.aeo_categories FOR SELECT
  USING (true);

-- Open write (no auth in this app)
CREATE POLICY "Anyone can insert categories"
  ON public.aeo_categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update categories"
  ON public.aeo_categories FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete categories"
  ON public.aeo_categories FOR DELETE
  USING (true);

-- Seed default categories
INSERT INTO public.aeo_categories (slug, label, color, is_default) VALUES
  ('buyers', 'Buyers', 'bg-blue-100 text-blue-800', true),
  ('sellers', 'Sellers', 'bg-green-100 text-green-800', true),
  ('neighborhoods', 'Neighborhoods', 'bg-amber-100 text-amber-800', true),
  ('market-insights', 'Market Insights', 'bg-purple-100 text-purple-800', true),
  ('entity', 'Entity', 'bg-slate-100 text-slate-800', true);

-- Create aeo_pages table
CREATE TABLE public.aeo_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  parent_id UUID REFERENCES public.aeo_pages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  h1 TEXT NOT NULL,
  accordion_qa JSONB NOT NULL DEFAULT '[]'::jsonb,
  youtube_video_id TEXT NOT NULL DEFAULT '',
  youtube_transcript TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_slug, slug)
);

-- Enable RLS
ALTER TABLE public.aeo_pages ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read pages"
  ON public.aeo_pages FOR SELECT
  USING (true);

-- Open write
CREATE POLICY "Anyone can insert pages"
  ON public.aeo_pages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update pages"
  ON public.aeo_pages FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete pages"
  ON public.aeo_pages FOR DELETE
  USING (true);

-- Index for fast lookups
CREATE INDEX idx_aeo_pages_category_slug ON public.aeo_pages(category_slug, slug);
CREATE INDEX idx_aeo_pages_parent ON public.aeo_pages(parent_id);
