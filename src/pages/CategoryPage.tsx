import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { loadPages, loadCategories } from "@/lib/aeo-types";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { FAIR_HOUSING_DISCLAIMER } from "@/lib/fair-housing";
import NotFound from "./NotFound";

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const categories = loadCategories();
  const cat = categories.find((c) => c.slug === category);

  if (!cat) return <NotFound />;

  const pages = loadPages().filter((p) => p.categorySlug === category);
  const config = JSON.parse(localStorage.getItem("aeo-entity-config") || "{}");
  const agentName = config.agentName || "Agent";
  const market = config.market || "";

  return (
    <Layout>
      <article className="section-padding">
        <div className="container-narrow">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            {cat.label}
          </h1>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl">
            Explore our {cat.label.toLowerCase()} resources for {market || "your area"}.
          </p>

          {pages.length === 0 ? (
            <p className="text-muted-foreground">No pages in this category yet.</p>
          ) : (
            <div className="grid gap-3 mb-12">
              {pages.map((p) => (
                <Link
                  key={p.id}
                  to={`/${category}/${p.slug}`}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
                >
                  <span className="text-primary font-bold text-lg">→</span>
                  <div className="min-w-0">
                    <span className="text-sm md:text-base font-medium group-hover:text-primary transition-colors block">
                      {p.title}
                    </span>
                    {p.metaDescription && (
                      <span className="text-xs text-muted-foreground line-clamp-1">{p.metaDescription}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
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

export default CategoryPage;
