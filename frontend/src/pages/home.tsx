import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Store, ShieldCheck, Settings, ArrowRight, Zap, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSubscribeEmail } from "@/hooks/use-tracking";
import { motion } from "framer-motion";

export default function Home() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [, setLocation] = useLocation();
  const subscribe = useSubscribeEmail();
  const [email, setEmail] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      setLocation(`/track?number=${encodeURIComponent(trackingNumber)}`);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      subscribe.mutate(email);
      setEmail("");
    }
  };

  return (
    <div className="flex flex-col w-full">
      <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40 overflow-hidden px-4">
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full -z-10 opacity-50" />

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Real-time Global Tracking
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground tracking-tight mb-8 leading-[1.1]">
              Track orders in <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                real time
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Never lose sight of a package again. Enter your tracking number below to get instant status updates and estimated delivery times.
            </p>

            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto bg-white p-3 rounded-2xl shadow-xl shadow-black/5 border border-border/50">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number (e.g., TRK123456789)"
                  className="w-full pl-12 h-14 bg-transparent border-none text-lg focus-visible:ring-0 placeholder:text-muted-foreground/60 shadow-none"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8 rounded-xl text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all w-full sm:w-auto font-semibold">
                Track Package
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-3xl transform -rotate-3" />
              <div className="relative rounded-3xl shadow-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-blue-50 h-64 flex items-center justify-center">
                <Zap className="w-24 h-24 text-primary/20" />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Connect with your same inventory</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Seamlessly integrate your online store and track all outbound shipments automatically. We sync with your existing inventory management tools to provide a unified tracking experience.
              </p>
              <ul className="space-y-4 mb-8">
                {["Automatic syncing with Shopify & Woo", "Real-time inventory deduction", "Automated customer email updates"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="rounded-full px-6 group border-2">
                Learn about integrations
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              From real-time updates to intelligent exception handling, we have every feature you need.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Zap className="w-6 h-6" />, title: "Real-time Updates", desc: "Get instant notifications the moment your package status changes." },
              { icon: <RefreshCw className="w-6 h-6" />, title: "Auto Re-routing", desc: "Automatically detect and handle shipment exceptions before they become problems." },
              { icon: <Store className="w-6 h-6" />, title: "Store Integration", desc: "Connect your Shopify, WooCommerce, or custom store in minutes." },
              { icon: <ShieldCheck className="w-6 h-6" />, title: "Secure Tracking", desc: "End-to-end encrypted tracking data to protect your shipment information." },
              { icon: <Settings className="w-6 h-6" />, title: "Custom Alerts", desc: "Configure exactly which events trigger alerts via email, SMS, or push." },
              { icon: <Search className="w-6 h-6" />, title: "Multi-carrier Support", desc: "Track packages from 900+ carriers worldwide in a single dashboard." },
            ].map((feature, i) => (
              <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-5">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-primary-foreground/20">
            <div className="pt-8 md:pt-0">
              <div className="text-5xl font-extrabold mb-2">99.9%</div>
              <div className="text-primary-foreground/80 font-medium">Tracking Accuracy</div>
            </div>
            <div className="pt-8 md:pt-0">
              <div className="text-5xl font-extrabold mb-2">150M+</div>
              <div className="text-primary-foreground/80 font-medium">Packages Tracked</div>
            </div>
            <div className="pt-8 md:pt-0">
              <div className="text-5xl font-extrabold mb-2">4.9/5</div>
              <div className="text-primary-foreground/80 font-medium">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Easily re-track shipments</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                If a package encounters an exception, our system automatically re-routes and provides updated ETA instantly. You have total visibility into every step of the journey.
              </p>
              <Link href="/signin">
                <Button className="rounded-full px-8">Get Started Free</Button>
              </Link>
            </div>
            <div className="relative">
              <div className="rounded-3xl shadow-2xl border border-border/50 bg-gradient-to-br from-orange-50 to-amber-50 h-72 flex items-center justify-center">
                <RefreshCw className="w-24 h-24 text-orange-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Got questions? We've got answers.</p>
          </div>

          <Accordion type="single" collapsible className="w-full bg-white rounded-2xl shadow-sm border border-border p-2">
            {[
              { q: "How fast does tracking update?", a: "Our tracking updates in real-time by polling carrier networks every 5 minutes. As soon as a scan happens, you see it." },
              { q: "Which carriers do you support?", a: "We support over 900+ global carriers including UPS, FedEx, USPS, DHL, and local postal services worldwide." },
              { q: "Can I connect my Shopify store?", a: "Yes! We have a native Shopify app that automatically imports your orders and syncs tracking information back to your customers." },
              { q: "What happens if a package is lost?", a: "Our system detects anomalies like prolonged lack of scans and flags them immediately so you can proactively handle claims." },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-none">
                <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary py-4 px-4">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed px-4 pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-24 bg-white border-t border-border/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Send className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay in the loop</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Subscribe to our newsletter to get the latest feature updates, logistics tips, and exclusive offers.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl border-border/80 focus-visible:ring-primary/20"
            />
            <Button type="submit" disabled={subscribe.isPending} className="h-12 rounded-xl px-8 shadow-md">
              {subscribe.isPending ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
