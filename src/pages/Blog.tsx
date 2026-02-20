import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const posts = [
  { title: "Top 5 Neighborhoods for Families Relocating to Grand Rapids", category: "Relocation", date: "Feb 15, 2026", excerpt: "Moving to Grand Rapids? Here are the best communities for families with school-age children." },
  { title: "Understanding the East Grand Rapids Real Estate Market in 2026", category: "Market Insights", date: "Feb 10, 2026", excerpt: "A deep dive into pricing trends, inventory levels, and what buyers can expect this spring." },
  { title: "First-Time Buyer's Guide to West Michigan", category: "Buying", date: "Feb 5, 2026", excerpt: "Everything you need to know about buying your first home in the Grand Rapids area." },
  { title: "Forest Hills vs. Rockford Schools: A Comprehensive Comparison", category: "Schools", date: "Jan 28, 2026", excerpt: "Comparing two of West Michigan's most sought-after school districts for families." },
  { title: "Why Remote Workers Are Choosing Grand Rapids", category: "Relocation", date: "Jan 20, 2026", excerpt: "Lower cost of living, outdoor recreation, and vibrant culture are drawing remote workers to GR." },
  { title: "Selling Your Home in a Competitive Market", category: "Selling", date: "Jan 15, 2026", excerpt: "Strategies to maximize your home's value and attract multiple offers in West Michigan." },
];

const Blog = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-wide">
          <div className="max-w-2xl mb-12">
            <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Insights</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Real Estate Blog</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Expert insights on the Grand Rapids real estate market, neighborhoods, and home buying tips from Holden Richardson.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <Card key={p.title} className="card-hover border-border/50 cursor-pointer group">
                <div className="h-40 bg-secondary flex items-center justify-center border-b border-border/50">
                  <p className="text-xs text-muted-foreground/40 uppercase tracking-wider">{p.category}</p>
                </div>
                <CardContent className="p-5">
                  <p className="text-xs text-gold font-medium mb-2">{p.date}</p>
                  <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-gold transition-colors">{p.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-3">{p.excerpt}</p>
                  <span className="text-sm font-medium text-foreground group-hover:text-gold transition-colors inline-flex items-center">
                    Read More <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
