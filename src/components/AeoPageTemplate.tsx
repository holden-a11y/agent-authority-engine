import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AeoPage, loadCategories, loadPages, generateJsonLd } from "@/lib/aeo-types";
import { Layout } from "@/components/Layout";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { FAIR_HOUSING_DISCLAIMER } from "@/lib/fair-housing";
import { getCoverImage } from "@/lib/cover-images";
import { Link } from "react-router-dom";
import { Calendar, Phone, MessageSquare, ArrowLeft, ChevronRight } from "lucide-react";

interface AeoPageTemplateProps {
  page: AeoPage;
  agentName: string;
  market: string;
  socialUrls: string[];
}

const AeoPageTemplate = ({ page, agentName, market, socialUrls }: AeoPageTemplateProps) => {
  const categories = loadCategories();
  const allPages = loadPages();
  const category = categories.find((c) => c.slug === page.categorySlug);
  const parentPage = page.parentId ? allPages.find((p) => p.id === page.parentId) : null;
  const childPages = allPages.filter((p) => p.parentId === page.id);
  const jsonLd = generateJsonLd(page, agentName, market, socialUrls);
  const coverImage = getCoverImage(page.slug);

  return (
    <Layout>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify((jsonLd as any).faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify((jsonLd as any).localBusiness) }} />

      {/* Hero cover */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={coverImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 flex items-end">
          <div className="container-narrow px-4 pb-8 md:pb-12 w-full">
            {category && (
              <nav className="flex items-center gap-1.5 text-sm text-primary-foreground/70 mb-3 flex-wrap">
                <Link to={`/${category.slug}`} className="hover:text-primary-foreground transition-colors">
                  {category.label}
                </Link>
                {parentPage && (
                  <>
                    <span>/</span>
                    <Link to={`/${category.slug}/${parentPage.slug}`} className="hover:text-primary-foreground transition-colors">
                      {parentPage.title}
                    </Link>
                  </>
                )}
                <span>/</span>
                <span className="text-primary-foreground font-medium truncate">{page.title}</span>
              </nav>
            )}
            {category && (
              <Badge className="bg-accent text-accent-foreground border-0 mb-3">{category.label}</Badge>
            )}
            <h1 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight max-w-3xl">
              {page.h1 || "[Primary Question H1]"}
            </h1>
          </div>
        </div>
      </div>

      <article className="section-padding">
        <div className="container-narrow">
          {/* Meta description */}
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl">
            {page.metaDescription || "[Meta description — 155 characters max]"}
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-10">
            <LeadCaptureForm
              title="Book a Consultation"
              trigger={
                <Button variant="gold" size="lg">
                  <Calendar className="h-4 w-4 mr-2" /> Book a Consult
                </Button>
              }
            />
            <Button variant="outline" size="lg" asChild>
              <a href="tel:+16165550123">
                <Phone className="h-4 w-4 mr-2" /> Call Holden
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="sms:+16165550123">
                <MessageSquare className="h-4 w-4 mr-2" /> Text Holden
              </a>
            </Button>
          </div>

          {/* FAQ Accordion */}
          {page.accordionQA.length > 0 && (
            <section className="mb-12">
              <Accordion type="multiple" className="border rounded-lg divide-y">
                {page.accordionQA.map((qa) => (
                  <AccordionItem key={qa.id} value={qa.id} className="border-0 px-4">
                    <AccordionTrigger className="text-left text-sm md:text-base font-medium">
                      {qa.question || "[FAQ question]"}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {qa.answer || "[FAQ answer]"}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
           )}

          {/* Child pages */}
          {childPages.length > 0 && (
            <section className="mb-12">
              <h2 className="font-display text-lg font-semibold mb-3">Related Topics</h2>
              <div className="grid gap-2">
                {childPages.map((child) => (
                  <Link
                    key={child.id}
                    to={`/${page.categorySlug}/${child.slug}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 transition-colors group"
                  >
                    <ChevronRight className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-sm font-medium group-hover:text-accent transition-colors">{child.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* YouTube embed */}
          {page.youtubeVideoId && (
            <section className="mb-10">
              <div className="aspect-video rounded-lg overflow-hidden border border-border">
                <iframe
                  src={`https://www.youtube.com/embed/${page.youtubeVideoId}`}
                  className="w-full h-full"
                  allowFullScreen
                  title="Video"
                />
              </div>
              {page.youtubeTranscript && (
                <details className="mt-3">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    View transcript
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                    {page.youtubeTranscript}
                  </p>
                </details>
              )}
            </section>
          )}

          {/* Back navigation */}
          <section className="mb-8 flex flex-wrap gap-4">
            {parentPage && category && (
              <Link
                to={`/${category.slug}/${parentPage.slug}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {parentPage.title}
              </Link>
            )}
            <Link
              to={category ? `/${category.slug}` : "/"}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {category ? category.label : "Home"}
            </Link>
          </section>

          {/* CTA */}
          <section className="bg-primary rounded-xl p-8 md:p-12 text-primary-foreground">
            <h2 className="font-display text-2xl font-bold mb-2">
              Ready to explore {market}?
            </h2>
            <p className="text-primary-foreground/70 mb-6">
              Connect with {agentName} for personalized guidance.
            </p>
            <LeadCaptureForm />
          </section>

          {/* Fair Housing */}
          <footer className="mt-12 pt-6 border-t border-border">
            <div className="flex items-start gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Equal_Housing_Opportunity.svg/120px-Equal_Housing_Opportunity.svg.png"
                alt="Equal Housing Opportunity logo"
                className="w-8 h-8 shrink-0 mt-0.5"
                loading="lazy"
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {FAIR_HOUSING_DISCLAIMER}
              </p>
            </div>
          </footer>
        </div>
      </article>
    </Layout>
  );
};

export default AeoPageTemplate;
