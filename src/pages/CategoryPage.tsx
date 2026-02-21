import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { loadPages, loadCategories } from "@/lib/aeo-types";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { FAIR_HOUSING_DISCLAIMER } from "@/lib/fair-housing";
import { getCoverImage } from "@/lib/cover-images";
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
  const coverImage = getCoverImage(category || "default");

  return (
    <Layout>
      {/* Hero cover */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={coverImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 flex items-end">
          <div className="container-narrow px-4 pb-8 md:pb-12 w-full">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight">
              {cat.label}
            </h1>
            <p className="text-primary-foreground/70 text-lg mt-2 max-w-2xl">
              Explore our {cat.label.toLowerCase()} resources for {market || "your area"}.
            </p>
          </div>
        </div>
      </div>

      <article className="section-padding">
        <div className="container-narrow">
          {pages.length === 0 ? (
            <p className="text-muted-foreground">No pages in this category yet.</p>
          ) : (
            <div className="grid gap-3 mb-12">
              {pages.map((p) => (
                <Link
                  key={p.id}
                  to={`/${category}/${p.slug}`}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 transition-colors group"
                >
                  <img
                    src={getCoverImage(p.slug)}
                    alt=""
                    className="w-16 h-16 rounded-md object-cover shrink-0 hidden sm:block"
                  />
                  <div className="min-w-0">
                    <span className="text-sm md:text-base font-semibold group-hover:text-accent transition-colors block">
                      {p.title}
                    </span>
                    {p.metaDescription && (
                      <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.metaDescription}</span>
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
