import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Zap, ArrowRight, Mail, ShieldCheck, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { "Accept": "application/json" }
});

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
  const [showPassword, setShowPassword] = useState(false); // Toggle state
  const [formData, setFormData] = useState({ email: "", code: "", password: "" });

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
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
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
        
        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary via-blue-500 to-blue-700 p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          </div>
          <div className="relative">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-xl"><Zap className="w-6 h-6 text-white" /></div>
              <span className="font-bold text-xl tracking-tight">RapidRoute</span>
            </Link>
          </div>
          <div className="relative space-y-6">
            <h2 className="text-3xl font-bold leading-tight text-white">
              Secure your account<br />
              <span className="text-blue-200">in seconds.</span>
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              If you've forgotten your password, don't worry. We'll send a 6-digit security code to your email to help you verify your identity and get back on track.
            </p>
          </div>
          <p className="relative text-xs text-blue-200 opacity-60">© {new Date().getFullYear()} RapidRoute Inc.</p>
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
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {step === 1 ? "Forgot Password?" : "Verify Identity"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {step === 1 
                  ? "Enter your email address and we'll send you a recovery code." 
                  : "Enter the 6-digit code sent to your email and choose a new password."}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleRequestCode} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="email" 
                      required
                      placeholder="you@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-9 h-11" 
                    />
                  </div>
                </div>
                <Button disabled={loading} className="w-full h-11 rounded-xl shadow-lg shadow-primary/20">
                  {loading ? <Spinner /> : null}
                  {loading ? "Checking..." : "Send Reset Code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">Security Code</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      required
                      maxLength={6}
                      placeholder="123456" 
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="pl-9 h-11 text-center text-lg tracking-widest font-mono" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Minimum 6 characters" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="pl-9 pr-10 h-11" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button disabled={loading} className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 mt-4">
                  {loading ? <Spinner /> : null}
                  {loading ? "Updating..." : "Reset Password"}
                </Button>
              </form>
            )}

            <div className="mt-8 text-center">
              <Link href="/signin">
                <button className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-2">
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