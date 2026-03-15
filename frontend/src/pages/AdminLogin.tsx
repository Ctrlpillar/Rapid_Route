import { useState } from "react";
import { useLocation } from "wouter";
import { ShieldAlert, Lock, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState({ email: "", password: "" });

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calling a specific admin endpoint
      const res = await axios.post("http://localhost:8000/api/admin/login", creds);
      
      localStorage.setItem("sb_token", res.data.token);
      localStorage.setItem("is_admin", "true");
      
      toast({ title: "Welcome, Admin", description: "Accessing RapidRoute Command Center." });
      navigate("/admin/dashboard");
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Access Denied", 
        description: "Invalid Administrator credentials." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-white shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-primary/30">
            <ShieldAlert className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
          <CardDescription className="text-slate-400">Authorized personnel only</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  type="email" 
                  className="bg-slate-800 border-slate-700 pl-10 text-white focus-visible:ring-primary" 
                  placeholder="admin"
                  onChange={e => setCreds({...creds, email: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  type="password" 
                  className="bg-slate-800 border-slate-700 pl-10 text-white focus-visible:ring-primary" 
                  placeholder="••••••••"
                  onChange={e => setCreds({...creds, password: e.target.value})}
                  required
                />
              </div>
            </div>
            <Button className="w-full h-11 bg-primary hover:bg-primary/90 mt-2" disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Verify Identity"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}