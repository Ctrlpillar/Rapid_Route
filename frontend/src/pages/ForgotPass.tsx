import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Zap, ArrowRight, Mail, ShieldCheck, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// --- IMPORT YOUR CENTRALIZED API UTILITY ---
import API from "@/api"; 

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export default function ForgotPass() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const [formData, setFormData] = useState({ email: "", code: "", password: "" });

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // CLEANER CALL: Base URL is handled automatically
      const res = await API.post("/forgot-password", { email: formData.email });
      toast({ title: "Code Sent", description: res.data.message });
      setStep(2);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Account Error",
        description: error.response?.data?.message || "Could not find account."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // CLEANER CALL
      await API.post("/reset-password", formData);
      toast({ title: "Success!", description: "Password reset successfully. Redirecting to sign in..." });
      setTimeout(() => navigate("/signin"), 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.response?.data?.message || "Invalid code or expired session."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 shadow-2xl rounded-3xl overflow-hidden bg-white font-sans">
        
        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-blue-500 to-blue-700 p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          </div>
          <div className="relative">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-xl"><Zap className="w-6 h-6 text-white" /></div>
              <span className="font-black text-xl tracking-tight">RapidRoute</span>
            </Link>
          </div>
          <div className="relative space-y-6">
            <h2 className="text-3xl font-black leading-tight text-white">
              Secure your account<br />
              <span className="text-blue-200">in seconds.</span>
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed font-medium">
              If you've forgotten your password, don't worry. We'll send a 6-digit security code to your email to help you verify your identity and get back on track.
            </p>
          </div>
          <p className="relative text-[10px] font-black uppercase tracking-widest text-blue-200 opacity-60">© {new Date().getFullYear()} RapidRoute Inc.</p>
        </div>

        {/* Right Side: Reset Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <h1 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
                {step === 1 ? "Forgot Password?" : "Verify Identity"}
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                {step === 1 
                  ? "Enter your email address and we'll send you a recovery code." 
                  : "Enter the 6-digit code sent to your email and choose a new password."}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleRequestCode} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="email" 
                      required
                      placeholder="you@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-9 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-primary" 
                    />
                  </div>
                </div>
                <Button disabled={loading} className="w-full h-12 rounded-2xl font-black shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                  {loading ? <Spinner /> : null}
                  {loading ? "Checking..." : "Send Reset Code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Security Code</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      required
                      maxLength={6}
                      placeholder="123456" 
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="pl-9 h-12 text-center text-lg tracking-[0.5em] font-black border-slate-200 bg-slate-50/50 rounded-xl focus:ring-primary" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Minimum 6 characters" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="pl-9 pr-10 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-primary" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button disabled={loading} className="w-full h-12 rounded-2xl font-black shadow-lg shadow-primary/20 mt-4 transition-all active:scale-[0.98]">
                  {loading ? <Spinner /> : null}
                  {loading ? "Updating..." : "Reset Password"}
                </Button>
              </form>
            )}

            <div className="mt-8 text-center">
              <Link href="/signin">
                <button className="text-xs font-black uppercase tracking-widest text-primary hover:underline inline-flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 rotate-180" /> Back to Sign In
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}