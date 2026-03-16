import { useState } from "react";
import { useLocation } from "wouter";
import { Truck, Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export default function DriverLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // <-- Added state for toggle

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/driver/login`, {
      company_email: email,
      password: password
      });

      // Store Driver specific data
      localStorage.setItem("driver_token", res.data.token);
      localStorage.setItem("driver_name", res.data.user.name);
      localStorage.setItem("assigned_truck", res.data.user.assigned_truck);
      
      toast({ title: "Welcome back!", description: "Manifest synced. Drive safe." });
      navigate("/driver");
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: err.response?.data?.message || "Invalid credentials." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20 mb-6">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Driver Portal</h1>
          <p className="text-slate-500 mt-2 font-medium">RapidRoute Fleet Management</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 tracking-widest">Company Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type="email" 
                required 
                placeholder="euan@rapidroute.goa"
                className="pl-11 h-12 rounded-2xl bg-slate-50 border-none focus-visible:ring-primary/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 ml-1 tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                type={showPassword ? "text" : "password"} // <-- Toggles type based on state
                required 
                placeholder="••••••••"
                className="pl-11 pr-12 h-12 rounded-2xl bg-slate-50 border-none focus-visible:ring-primary/20" // <-- Added pr-12 for button padding
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* --- TOGGLE BUTTON --- */}
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl text-md font-bold shadow-lg shadow-primary/20 mt-2">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Sign In to Route"}
          </Button>
        </form>
        
        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}