import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Neighborhoods", to: "/neighborhoods" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container-wide flex items-center justify-between h-16 px-4 lg:px-8">
        <Link to="/" className="font-display text-xl font-bold tracking-tight text-foreground">
          Holden <span className="text-gradient-gold">Richardson</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === l.to
                  ? "text-accent-foreground bg-accent/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Button variant="gold" size="sm" asChild className="ml-3">
            <Link to="/contact">
              <Phone className="h-3.5 w-3.5 mr-1" /> Get in Touch
            </Link>
          </Button>
        </nav>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-foreground">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="md:hidden border-t border-border bg-background px-4 pb-4">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`block py-3 text-sm font-medium border-b border-border/50 ${
                location.pathname === l.to ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Button variant="gold" size="sm" asChild className="mt-3 w-full">
            <Link to="/contact" onClick={() => setOpen(false)}>Get in Touch</Link>
          </Button>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy-gradient text-primary-foreground">
      <div className="container-wide section-padding">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-display text-xl font-bold mb-4">
              Holden <span className="text-gradient-gold">Richardson</span>
            </h3>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Your trusted real estate advisor in Grand Rapids, Michigan. Specializing in relocation and premium school district communities.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider mb-4 text-gold">Quick Links</h4>
            <div className="space-y-2">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} className="block text-sm text-primary-foreground/70 hover:text-gold transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider mb-4 text-gold">Contact</h4>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              Grand Rapids, Michigan<br />
              holden@example.com<br />
              (616) 555-0123
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Holden Richardson. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
