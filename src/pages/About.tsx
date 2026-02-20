import { Layout } from "@/components/Layout";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Heart, Users } from "lucide-react";

const About = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-narrow">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">About</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">Meet Holden Richardson</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                With over a decade of experience in the Grand Rapids real estate market, I've helped hundreds of families find their perfect home in West Michigan. My approach is simple: listen first, advise honestly, and work tirelessly to exceed expectations.
              </p>
              <p>
                I specialize in two areas where I can make the biggest impact: helping professionals and families relocate to Grand Rapids, and guiding buyers toward premium school district communities along the East and Southwest corridors.
              </p>
              <p>
                Whether you're a healthcare worker relocating for Corewell Health, a remote worker seeking Michigan's quality of life, or a family prioritizing top-rated schools in East Grand Rapids or Forest Hills — I have the local knowledge and network to make your transition seamless.
              </p>
            </div>
            <div className="space-y-6">
              <div className="aspect-[4/5] bg-secondary rounded-lg flex items-center justify-center border border-border">
                <p className="text-muted-foreground text-sm">Agent Photo</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <Award className="h-6 w-6 text-gold mx-auto mb-2" />
                  <p className="text-xs font-medium">Top Producer</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <Heart className="h-6 w-6 text-gold mx-auto mb-2" />
                  <p className="text-xs font-medium">Community Focused</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <Users className="h-6 w-6 text-gold mx-auto mb-2" />
                  <p className="text-xs font-medium">Family First</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="section-padding bg-muted/50">
        <div className="container-narrow">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">My Story</h2>
          <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center border border-border">
            <p className="text-muted-foreground text-sm">YouTube Video Embed</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-narrow text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Let's Work Together</h2>
          <p className="text-muted-foreground mb-6">I'd love to learn about your real estate goals.</p>
          <LeadCaptureForm
            trigger={<Button variant="hero">Get in Touch <ArrowRight className="h-4 w-4 ml-1" /></Button>}
          />
        </div>
      </section>
    </Layout>
  );
};

export default About;
