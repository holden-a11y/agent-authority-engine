import { Layout } from "@/components/Layout";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, GraduationCap, TreePine, Building2 } from "lucide-react";

const neighborhoods = [
  { name: "East Grand Rapids", district: "EGR Schools", highlight: "Walkable lakeside living with top-rated schools", icon: GraduationCap },
  { name: "Ada", district: "Forest Hills", highlight: "Scenic rural charm with access to the city", icon: TreePine },
  { name: "Cascade", district: "Forest Hills", highlight: "Family-friendly with excellent amenities", icon: TreePine },
  { name: "Rockford", district: "Rockford Schools", highlight: "Small-town feel with outstanding school district", icon: GraduationCap },
  { name: "Hudsonville", district: "Hudsonville Schools", highlight: "Growing community with strong family values", icon: Building2 },
  { name: "Byron Center", district: "Byron Center Schools", highlight: "Spacious lots and new construction opportunities", icon: Building2 },
  { name: "Grandville", district: "Grandville Schools", highlight: "Convenient location with great dining and shopping", icon: Building2 },
  { name: "Downtown Grand Rapids", district: "GRPS", highlight: "Urban living with culture, dining, and nightlife", icon: Building2 },
];

const Neighborhoods = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-wide">
          <div className="max-w-2xl mb-12">
            <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Explore</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Grand Rapids Neighborhoods</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              From lakeside communities with top-rated schools to vibrant urban neighborhoods — discover where you belong in West Michigan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {neighborhoods.map((n) => (
              <Card key={n.name} className="card-hover border-border/50">
                <CardContent className="p-6">
                  <n.icon className="h-8 w-8 text-gold mb-3" />
                  <h3 className="font-display text-xl font-semibold mb-1">{n.name}</h3>
                  <p className="text-xs text-gold font-medium mb-2">{n.district}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{n.highlight}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-primary">
        <div className="container-narrow text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">Not Sure Which Neighborhood Is Right?</h2>
          <p className="text-primary-foreground/70 mb-6">Let's chat about your priorities — schools, commute, lifestyle — and find the perfect fit.</p>
          <LeadCaptureForm
            trigger={<Button variant="hero">Get Neighborhood Guidance <ArrowRight className="h-4 w-4 ml-1" /></Button>}
            title="Find Your Neighborhood"
          />
        </div>
      </section>
    </Layout>
  );
};

export default Neighborhoods;
