import { Bell, Smartphone, Mail, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUserSettings, useUpdateSettings } from "@/hooks/use-tracking";
import { useState, useEffect } from "react";

export default function Notifications() {
  const { data: user, isLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();

  const [toggles, setToggles] = useState({ email: true, sms: false, push: true });

  useEffect(() => {
    if (user?.notifications) {
      setToggles(user.notifications);
    }
  }, [user]);

  const handleToggle = (key: string) => {
    const newToggles = { ...toggles, [key]: !toggles[key as keyof typeof toggles] };
    setToggles(newToggles);
    updateSettings.mutate({ notifications: newToggles });
  };

  return (
    <div className="flex flex-col w-full">
      <section className="pt-20 pb-12 bg-white px-4 border-b border-border text-center">
        <div className="max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bell className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Notification Preferences</h1>
          <p className="text-xl text-muted-foreground">
            Control when and how you receive updates about your shipments.
          </p>
        </div>
      </section>

      <section className="py-16 bg-slate-50 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            { key: "email", icon: <Mail className="w-5 h-5" />, label: "Email Notifications", desc: "Receive updates via email for every shipment event." },
            { key: "sms", icon: <Smartphone className="w-5 h-5" />, label: "SMS Notifications", desc: "Get text messages for critical shipment updates." },
            { key: "push", icon: <Bell className="w-5 h-5" />, label: "Push Notifications", desc: "Receive browser push notifications in real-time." },
          ].map(({ key, icon, label, desc }) => (
            <Card key={key} className="border-border/60 shadow-sm">
              <CardContent className="p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <Switch
                  checked={toggles[key as keyof typeof toggles]}
                  onCheckedChange={() => handleToggle(key)}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-16 bg-white px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Alert Types</h2>

          <Accordion type="multiple" className="space-y-3">
            {[
              {
                icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
                title: "Delivery Exceptions",
                desc: "Get alerted when a package encounters a problem: missed delivery, address issue, or customs delay.",
              },
              {
                icon: <Bell className="w-5 h-5 text-blue-500" />,
                title: "Status Changes",
                desc: "Receive a notification every time your package moves to a new stage in its journey.",
              },
              {
                icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
                title: "Security Alerts",
                desc: "Be notified of any suspicious activity or unauthorized access attempts on your account.",
              },
            ].map((alert, i) => (
              <Card key={i} className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
                <Accordion type="single" collapsible>
                  <AccordionItem value={`item-${i}`} className="border-none">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                          {alert.icon}
                        </div>
                        <span className="font-semibold text-base">{alert.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-muted-foreground">
                      {alert.desc}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-10 bg-slate-50 px-4 border-t border-border">
        <div className="max-w-3xl mx-auto flex justify-end">
          <Button className="px-10 h-12 rounded-xl" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </section>
    </div>
  );
}
