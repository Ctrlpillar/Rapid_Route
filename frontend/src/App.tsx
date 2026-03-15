import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/contexts/auth-context";
import { TeamProvider } from "@/contexts/team-context";
import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Track from "@/pages/track";
import Settings from "@/pages/settings";
import Contacts from "@/pages/contacts";
import Notifications from "@/pages/notifications";
import SignIn from "@/pages/signin";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/AdminLogin";
import DriverDashboard from "@/pages/DriverDashboard"; 
import DriverLogin from "@/pages/DriverLogin";
import DriverSetPassword from "@/pages/DriverSetPassword"; // <-- IMPORTED NEW COMPONENT
import NotFound from "@/pages/not-found";
import LoginSuccess from "./pages/login-success";
import ForgotPass from "./pages/ForgotPass";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* 1. External & Auth Pages (No Sidebar) */}
      <Route path="/signin" component={SignIn} />
      <Route path="/forgot-password" component={ForgotPass} />
      <Route path="/login-success" component={LoginSuccess} /> 
      
      {/* ADMIN ROUTES */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={Admin} />

      {/* DRIVER ROUTES (Separate from Admin and Customer UI) */}
      <Route path="/driver-login" component={DriverLogin} />
      <Route path="/driver/set-password" component={DriverSetPassword} /> {/* <-- ADDED ROUTE HERE */}
      <Route path="/driver" component={DriverDashboard} />

      {/* 2. Authenticated Customer App Pages (With Sidebar/Layout) */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/track" component={Track} />
            <Route path="/settings" component={Settings} />
            <Route path="/contacts" component={Contacts} />
            <Route path="/notifications" component={Notifications} />
            
            {/* The NotFound route MUST always be the very last item */}
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TeamProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </TeamProvider>
    </QueryClientProvider>
  );
}

export default App;