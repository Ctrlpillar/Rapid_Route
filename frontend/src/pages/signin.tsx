import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Zap, ArrowRight, Eye, EyeOff, Phone, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function SignIn() {
  const [, navigate] = useLocation();
  const { signInWithGoogle, signInWithForm } = useAuth();

  const [tab, setTab] = useState("signin");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (tab === "signup" && !form.name.trim()) e.name = "Name is required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email is required";
    if (!form.password || form.password.length < 6) e.password = "Password must be at least 6 characters";
    return e;
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Browser will redirect to Laravel, so no need to navigate manually
    } catch (error) {
      setGoogleLoading(false);
      alert("Google Sign-In failed. Please try again.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({});
    setFormLoading(true);

    try {
      const result = await signInWithForm(form);

      if (result && 'registered' in result) {
        setTab("signin");
        setForm(f => ({ ...f, password: "", name: "", phone: "" }));
        alert("Account created! Please sign in.");
      } else {
        navigate("/track");
      }
    } catch (error: any) {
      // If the error status is 404 (which we just set in Laravel), switch tabs!
      if (tab === "signin" && error.status === 404) {
        alert("We couldn't find your account. Taking you to the Sign Up page!");
        setTab("signup");
      } else {
        alert(error.message || "Login failed");
      }
    } finally {
      // THIS IS THE FIX for the "Please wait..." getting stuck
      setFormLoading(false);
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
              <div className="bg-white/20 p-2 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">RapidRoute</span>
            </Link>
          </div>

          <div className="relative space-y-6">
            <h2 className="text-3xl font-bold leading-tight">
              Track every delivery,<br />
              <span className="text-blue-200">in real time.</span>
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Sign in to see all your shipments on a live map, get instant delivery updates, and manage your orders from one place.
            </p>
            <div className="space-y-3">
              {["Live map tracking across Goa", "Instant delivery notifications", "Full shipment history"].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-blue-100">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-blue-200 opacity-60">© {new Date().getFullYear()} RapidRoute Inc.</p>
        </div>

        {/* Right Side: Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">RapidRoute</span>
          </div>

          <div className="flex bg-slate-100 rounded-2xl p-1 mb-8 gap-1">
            {["signin", "signup"].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <motion.div
            key={tab}
            initial={{ opacity: 0, x: tab === "signup" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {tab === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground mb-7">
              {tab === "signin" ? "Sign in to your RapidRoute account." : "Start tracking your deliveries today."}
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 border border-border rounded-xl px-4 py-3 text-sm font-semibold text-foreground hover:bg-slate-50 active:bg-slate-100 transition-all disabled:opacity-60 shadow-sm mb-5"
            >
              {googleLoading ? <Spinner /> : <GoogleIcon />}
              {googleLoading ? "Signing in..." : `Continue with Google`}
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">or {tab === "signin" ? "sign in" : "sign up"} with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {tab === "signup" && (
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={form.name} onChange={set("name")} placeholder="Arjun Sharma" className={`pl-9 h-11 ${errors.name ? "border-red-400 focus-visible:ring-red-200" : ""}`} />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={`pl-9 h-11 ${errors.email ? "border-red-400 focus-visible:ring-red-200" : ""}`} />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {tab === "signup" && (
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Phone number <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={form.phone}
                      onChange={(e) => {
                        const onlyNums = e.target.value.replace(/\D/g, "");
                        setForm({ ...form, phone: onlyNums });
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder={tab === "signup" ? "Min. 6 characters" : "Enter your password"}
                    className={`pr-10 h-11 ${errors.password ? "border-red-400 focus-visible:ring-red-200" : ""}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              <Button type="submit" disabled={formLoading} className="w-full h-11 rounded-xl mt-2 flex items-center justify-center gap-2 shadow-sm shadow-primary/20">
                {formLoading ? <Spinner /> : null}
                {formLoading ? "Please wait..." : tab === "signin" ? "Sign in" : "Create account"}
                {!formLoading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              {tab === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => { setTab(tab === "signin" ? "signup" : "signin"); setErrors({}); }} className="text-primary font-semibold hover:underline">
                {tab === "signin" ? "Create one" : "Sign in"}
              </button>
            </p>

            {tab === "signup" && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                By creating an account you agree to our{" "}
                <a href="#" className="underline hover:text-foreground">Terms</a> and{" "}
                <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}