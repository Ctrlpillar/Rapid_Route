import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useTeam } from "@/contexts/team-context";

export default function Contacts() {
  const { team } = useTeam();
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  return (
    <div className="flex flex-col w-full">
      <section className="pt-20 pb-12 bg-white px-4 border-b border-border text-center">
        <div className="max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground">
            Our team in Goa is here to help. Reach out to any of our specialists below.
          </p>
        </div>
      </section>

      <section className="py-12 bg-slate-50 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Call Us</p>
                <p className="text-sm text-muted-foreground">+91 83800 00000</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Mon–Sat, 9AM–6PM IST</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Email Us</p>
                <p className="text-sm text-muted-foreground">support@rapidroute.in</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Response within 24 hrs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Visit Us</p>
                <p className="text-sm text-muted-foreground">18th June Road, Panaji</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Goa, India — 403001</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-white px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Our Team</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {team.map((contact, i) => (
              <Card key={i} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base ${contact.color}`}>
                      {contact.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{contact.location}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4 rounded-lg">
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Send a Message</h2>
          <p className="text-muted-foreground mb-8">Fill out the form below and we'll get back to you shortly.</p>

          {submitted ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Send className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
                <p className="text-green-700">Thanks for reaching out. Our team will get back to you within 24 hours.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Name</label>
                      <Input placeholder="e.g. Riya Menon" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="bg-slate-50 h-11" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input type="email" placeholder="you@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required className="bg-slate-50 h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input placeholder="How can we help?" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} required className="bg-slate-50 h-11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <textarea
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={5}
                      className="w-full bg-slate-50 border border-input rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl shadow-sm">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
