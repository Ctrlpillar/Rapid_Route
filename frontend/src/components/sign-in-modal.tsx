import { useState } from "react";
import { X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { motion, AnimatePresence } from "framer-motion";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function SignInModal() {
  const { showSignInModal, setShowSignInModal, signInWithGoogle } = useAuth();
  const [signing, setSigning] = useState(false);

  const handleGoogleSignIn = async () => {
    setSigning(true);
    await signInWithGoogle();
    setSigning(false);
  };

  return (
    <AnimatePresence>
      {showSignInModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSignInModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 z-10"
          >
            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to RapidRoute</h2>
              <p className="text-muted-foreground text-sm">Sign in to track your orders and manage shipments.</p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={signing}
              className="w-full flex items-center justify-center gap-3 border border-border rounded-xl px-4 py-3 text-sm font-semibold text-foreground hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-60 shadow-sm"
            >
              {signing ? (
                <>
                  <svg className="animate-spin w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground mt-6">
              By signing in, you agree to our{" "}
              <a href="#" className="underline hover:text-foreground">Terms</a> and{" "}
              <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
