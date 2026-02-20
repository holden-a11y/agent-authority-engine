import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Home, TrendingUp, Users, MapPin, Star } from "lucide-react";
import heroImage from "@/assets/hero-grand-rapids.jpg";

const stats = [
  { value: "150+", label: "Homes Sold" },
  { value: "$45M+", label: "Sales Volume" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "12", label: "Years Experience" },
];

const services = [
  { icon: Home, title: "Buying a Home", desc: "Expert guidance through every step of your home purchase in Grand Rapids." },
  { icon: TrendingUp, title: "Selling Your Home", desc: "Strategic marketing and pricing to maximize your home's value." },
  { icon: Users, title: "Relocation Services", desc: "Specialized support for families and professionals relocating to West Michigan." },
  { icon: MapPin, title: "Neighborhood Expertise", desc: "Deep knowledge of Grand Rapids communities and school districts." },
];

const testimonials = [
  { name: "Sarah & Mike T.", text: "Holden made our relocation from Chicago seamless. He understood exactly what we needed for our family.", location: "East Grand Rapids" },
  { name: "David L.", text: "His knowledge of the local market is unmatched. Sold our home in 5 days above asking price.", location: "Ada" },
  { name: "Jennifer K.", text: "As a first-time buyer, I was nervous. Holden's patience and expertise made the process enjoyable.", location: "Rockford" },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center">
        <img src={heroImage} alt="Grand Rapids Michigan skyline" className="absolute inset-0 w-full h-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative z-10 container-wide px-4 lg:px-8">
          <div className="max-w-2xl space-y-6 animate-fade-in-up">
            <p className="text-gold text-sm font-semibold uppercase tracking-widest font-body">Grand Rapids Real Estate</p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
              Find Your Perfect Home in Grand Rapids
            </h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed font-body max-w-lg">
              Whether you're relocating to West Michigan or searching for the ideal school district, I'll guide you home with local expertise you can trust.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <LeadCaptureForm
                trigger={<Button variant="hero">Start Your Search <ArrowRight className="h-4 w-4 ml-1" /></Button>}
                title="Start Your Home Search"
              />
              <Button variant="outline-light" size="lg" asChild>
                <Link to="/about">Learn About Holden</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary">
        <div className="container-wide px-4 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-display font-bold text-gold">{s.value}</div>
                <div className="text-primary-foreground/70 text-sm mt-1 font-body">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">How I Help</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold gold-underline inline-block">Expert Real Estate Services</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => (
              <Card key={s.title} className="card-hover border-border/50">
                <CardContent className="p-6">
                  <s.icon className="h-10 w-10 text-gold mb-4" />
                  <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="section-padding bg-muted/50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">On the Market</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Featured Listings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="card-hover overflow-hidden border-border/50">
                <div className="h-48 bg-secondary flex items-center justify-center">
                  <Home className="h-12 w-12 text-muted-foreground/30" />
                </div>
                <CardContent className="p-5">
                  <p className="text-gold font-semibold text-lg">$425,000</p>
                  <h3 className="font-display font-semibold mt-1">123 Maple Street</h3>
                  <p className="text-muted-foreground text-sm mt-1">East Grand Rapids · 4 bd · 3 ba · 2,400 sqft</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link to="/contact">View All Listings <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Video Embed Spot */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="text-center mb-8">
            <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Get to Know Me</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Why Work With Holden?</h2>
          </div>
          <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border border-border">
            <p className="text-muted-foreground text-sm">YouTube Video Embed</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-primary">
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Client Stories</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">What My Clients Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="bg-primary-foreground/5 border-primary-foreground/10">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-primary-foreground/80 text-sm leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <p className="font-semibold text-primary-foreground text-sm">{t.name}</p>
                    <p className="text-primary-foreground/50 text-xs">{t.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-narrow text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Dream Home?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Let's start a conversation about your real estate goals in Grand Rapids.
          </p>
          <LeadCaptureForm
            trigger={<Button variant="hero">Schedule a Free Consultation <ArrowRight className="h-4 w-4 ml-1" /></Button>}
          />
        </div>
      </section>
    </Layout>
  );
};

export default Index;
