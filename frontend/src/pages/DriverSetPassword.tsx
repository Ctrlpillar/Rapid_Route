import { useState } from "react";
import { ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import axios from "axios";

export default function DriverSetPassword() {
  // Grab the token from the URL (e.g., ?token=wBUrhtg...)
  const token = new URLSearchParams(window.location.search).get("token");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // If someone visits this page without a token, show an error
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-6 text-center">
        <div>
          <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
          <h1 className="text-xl font-bold mb-2">Invalid Setup Link</h1>
          <p className="text-slate-400 text-sm">This link is broken or missing a security token.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      return toast({ variant: "destructive", title: "Too weak", description: "Password must be at least 8 characters." });
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:8000/api/driver/finalize-password", { 
        token: token, 
        password: password 
      });
      
      toast({ title: "Identity Secured", description: "Password set successfully. You can now login." });
      navigate("/driver-login"); // Redirect them to login!
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Link Expired", 
        description: err.response?.data?.message || "Please ask your Admin for a new setup link." 
      });
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-md w-full space-y-8 bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl border border-white/5">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold">Secure Your Account</h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">Create a private password for your fleet console.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-500 ml-1 tracking-widest">New Private Password</label>
            <div className="relative">
              <Input 
                type={showPass ? "text" : "password"}
                required 
                placeholder="Minimum 8 characters"
                className="h-14 rounded-2xl bg-white/5 border-white/10 pr-12 focus:ring-primary text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl text-md font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Secure My Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}