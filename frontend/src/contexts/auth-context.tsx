import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// --- 1. AXIOS SETUP FOR LARAVEL API ---
const API = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json"
  }
});

// Automatically attach the token to every request if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("sb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- INTERFACES ---
interface Order {
  id: string;
  trackingNumber: string;
  status: string;
  item: string;
  carrier: string;
  estimatedDelivery: string;
  currentLocation: string;
  mapPos?: [number, number];
  events: { date: string; description: string; location: string }[];
  route: { pos: [number, number]; label: string; time: string }[];
  currentStop: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Added role to the interface
  google_id?: string | null;
  initials: string;
  phone?: string;
  website?: string;
  orders: Order[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithForm: (formData: { name?: string; email: string; phone?: string; password?: string }) => Promise<User | { registered: boolean }>;
  signOut: () => void;
  updateUser: (updates: Partial<User>) => void;
  showSignInModal: boolean;
  setShowSignInModal: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_ORDERS: Order[] = [
  {
    id: "ord_1",
    trackingNumber: "TRK-GOA-20240312",
    status: "In Transit",
    item: "Laptop Stand + Desk Organizer",
    carrier: "BlueDart",
    estimatedDelivery: "Tomorrow by 6:00 PM",
    currentLocation: "Margao Facility, Goa",
    mapPos: [15.3477, 74.0231],
    events: [
      { date: "Mar 13, 8:00 AM", description: "Departed Margao Facility", location: "Margao, Goa" },
      { date: "Mar 12, 2:30 PM", description: "Scanned at relay point", location: "Ponda, Goa" },
      { date: "Mar 12, 9:00 AM", description: "Package received & processed", location: "Panaji, Goa" },
    ],
    route: [
      { pos: [15.5057, 73.8173], label: "Panaji Sorting Hub", time: "Mar 12, 9:00 AM" },
      { pos: [15.4289, 73.9685], label: "Ponda Relay", time: "Mar 12, 2:30 PM" },
      { pos: [15.3477, 74.0231], label: "Margao Facility", time: "Mar 13, 8:00 AM" },
      { pos: [15.2993, 74.124], label: "Your Address, Goa", time: "Mar 14 (Est.)" },
    ],
    currentStop: 2,
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignInModal, setShowSignInModal] = useState(false);

  // --- PERSISTENCE & AUTO-LOGIN ---
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("sb_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await API.get("/user");
        const userData = response.data;

        //  THE BOUNCER: If an Admin token bleeds over into the customer site, ignore it
        if (userData.role === "admin") {
          console.warn("Admin detected in Customer portal. Keeping session clean.");
          localStorage.removeItem("sb_token");
          localStorage.removeItem("sb_user");
          setUser(null);
          setLoading(false);
          return;
        }

        const initials = userData.name
          ? userData.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
          : userData.email.slice(0, 2).toUpperCase();

        const u: User = {
          id: userData.id.toString(),
          name: userData.name,
          email: userData.email,
          role: userData.role,
          google_id: userData.google_id,
          phone: userData.phone,
          initials,
          orders: MOCK_ORDERS,
        };

        setUser(u);
        localStorage.setItem("sb_user", JSON.stringify(u));
      } catch (error) {
        console.error("Token invalid or expired", error);
        localStorage.removeItem("sb_token");
        localStorage.removeItem("sb_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const signInWithForm = async (formData: { name?: string; email: string; phone?: string; password?: string }) => {
    const isSignUp = !!formData.name;
    const endpoint = isSignUp ? "/register" : "/login";

    try {
      const response = await API.post(endpoint, formData);
      
      if (isSignUp) {
        return { registered: true };
      }

      const { token, user: userData } = response.data;

      //  THE BOUNCER: Prevent Admins from logging in through the customer form
      if (userData.role === "admin") {
        throw new Error("Administrators must use the dedicated Admin Portal.");
      }

      const initials = userData.name
        ? userData.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
        : userData.email.slice(0, 2).toUpperCase();

      const u: User = {
        id: userData.id.toString(),
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        initials,
        orders: MOCK_ORDERS,
      };

      setUser(u);
      localStorage.setItem("sb_token", token);
      localStorage.setItem("sb_user", JSON.stringify(u));
      return u;

    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Authentication failed";
      const status = error.response?.status;
      const customError = new Error(message) as any;
      customError.status = status;
      throw customError;
    }
  };

  const signInWithGoogle = async () => {
    window.location.href = "http://localhost:8000/api/auth/google";
  };

  const signOut = async () => {
    try { await API.post("/logout"); } catch (e) {}
    setUser(null);
    localStorage.removeItem("sb_user");
    localStorage.removeItem("sb_token");
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      if (updated.name) {
        updated.initials = updated.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
      }
      localStorage.setItem("sb_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithForm, signOut, updateUser, showSignInModal, setShowSignInModal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}