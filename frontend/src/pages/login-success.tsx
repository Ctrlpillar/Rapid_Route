import { useEffect } from "react";
import { useLocation } from "wouter";

export default function LoginSuccess() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // 1. Grab the token from the URL (the bit after ?token=)
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // 2. Save it so the AuthContext can use it for API calls
      localStorage.setItem("sb_token", token);
      
      // 3. Take the user to the dashboard
      navigate("/track"); 
    } else {
      // If something went wrong, send them back to try again
      navigate("/signin");
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-slate-600 font-medium">Finishing secure login...</p>
    </div>
  );
}