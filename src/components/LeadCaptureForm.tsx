import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface LeadFormProps {
  trigger?: React.ReactNode;
  title?: string;
}

export function LeadCaptureForm({ trigger, title = "Let's Connect" }: LeadFormProps) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would POST to Follow Up Boss webhook
    console.log("Lead captured:", form);
    setSubmitted(true);
  };

  const formContent = submitted ? (
    <div className="text-center py-8">
      <h3 className="font-display text-2xl font-bold mb-2">Thank You!</h3>
      <p className="text-muted-foreground">Holden will be in touch shortly.</p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Full Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
        className="h-11"
      />
      <Input
        type="email"
        placeholder="Email Address"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
        className="h-11"
      />
      <Input
        type="tel"
        placeholder="Phone Number"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="h-11"
      />
      <textarea
        placeholder="Tell me about your home search..."
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <Button type="submit" variant="gold" className="w-full h-11">
        Send Message
      </Button>
    </form>
  );

  if (trigger) {
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return formContent;
}
