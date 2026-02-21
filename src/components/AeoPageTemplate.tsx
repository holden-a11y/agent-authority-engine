import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { AeoPage, PAGE_CATEGORIES, generateJsonLd } from "@/lib/aeo-types";
import { Layout } from "@/components/Layout";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { FAIR_HOUSING_DISCLAIMER } from "@/lib/fair-housing";
import { Link } from "react-router-dom";

interface AeoPageTemplateProps {
  page: AeoPage;
  agentName: string;
  market: string;
  socialUrls: string[];
}

const AeoPageTemplate = ({ page, agentName, market, socialUrls }: AeoPageTemplateProps) => {
  const category = PAGE_CATEGORIES.find((c) => c.value === page.category);
  const jsonLd = generateJsonLd(page, agentName, market, socialUrls);
  const relatedQuestions = page.relatedQuestions || [];

  return (
    <Layout>
      {/* JSON-LD injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify((jsonLd as any).faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify((jsonLd as any).localBusiness) }}
      />

      <article className="section-padding">
        <div className="container-narrow">
          {/* Category badge */}
          {category && (
            <Badge className={`${category.color} border-0 mb-4`}>{category.label}</Badge>
          )}

          {/* H1 */}
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            {page.h1 || "[Primary Question H1]"}
          </h1>

          {/* Meta description preview */}
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl">
            {page.metaDescription || "[Meta description — 155 characters max]"}
          </p>

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
                      {qa.answer || "[FAQ answer — write a comprehensive, authoritative response.]"}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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

          {/* Related Questions */}
          {relatedQuestions.length > 0 && (
            <section className="mb-12">
              <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-4">
                Related Questions
              </h2>
              <div className="grid gap-2">
                {relatedQuestions.map((rq, i) => (
                  <Link
                    key={i}
                    to={`/pages/${rq.slug}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                  >
                    <span className="text-primary font-bold text-lg">→</span>
                    <span className="text-sm md:text-base font-medium group-hover:text-primary transition-colors">
                      {rq.title}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

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

          {/* Fair Housing Disclaimer */}
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
