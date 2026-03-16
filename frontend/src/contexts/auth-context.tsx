import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// --- 1. DYNAMIC API SETUP ---
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json"
  }
});

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
  role: string;
  google_id?: string | null;
  initials: string;
  phone?: string;
  website?: string;
  avatar?: string; // Ensured this is here
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
  // ... (Your mock orders stay the same)
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

        if (userData.role === "admin") {
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
          avatar: userData.avatar, // 👇 ADDED THIS: Now the avatar flows into the app!
          initials,
          orders: MOCK_ORDERS,
        };

        setUser(u);
        localStorage.setItem("sb_user", JSON.stringify(u));
      } catch (error) {
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
      
      if (isSignUp) return { registered: true };

      const { token, user: userData } = response.data;

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
        avatar: userData.avatar, // 👇 ADDED THIS
        initials,
        orders: MOCK_ORDERS,
      };

      setUser(u);
      localStorage.setItem("sb_token", token);
      localStorage.setItem("sb_user", JSON.stringify(u));
      return u;

    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Authentication failed";
      const customError = new Error(message) as any;
      customError.status = error.response?.status;
      throw customError;
    }
  };

  const signInWithGoogle = async () => {
    // 👇 UPDATED: Uses the base URL variable instead of hardcoded localhost
    window.location.href = `${BASE_URL}/auth/google`;
  };

  const signOut = async () => {
    try { await API.post("/logout"); } catch (e) {}
    setUser(null);
    localStorage.removeItem("sb_user");
    localStorage.removeItem("sb_token");
    localStorage.removeItem("is_admin"); // Clean admin flag too
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