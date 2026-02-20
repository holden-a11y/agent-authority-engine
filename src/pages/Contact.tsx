import { Layout } from "@/components/Layout";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { Mail, Phone, MapPin } from "lucide-react";

const Contact = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container-narrow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Contact</p>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">Let's Talk Real Estate</h1>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Whether you're ready to buy, sell, or just exploring your options in Grand Rapids — I'm here to help. Fill out the form and I'll get back to you within 24 hours.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium text-sm">(616) 555-0123</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-sm">holden@example.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium text-sm">Grand Rapids, Michigan</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">Send a Message</h2>
              <LeadCaptureForm />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
