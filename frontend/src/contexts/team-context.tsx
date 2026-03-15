import { createContext, useContext, useState, useEffect } from "react";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  color: string;
}

interface TeamContextType {
  team: TeamMember[];
  addTeamMember: (member: Omit<TeamMember, "id">) => void;
  removeTeamMember: (id: string) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
}

const TeamContext = createContext<TeamContextType | null>(null);

const DEFAULT_TEAM: TeamMember[] = [
  { id: "t1", name: "Arjun Sharma", role: "Head of Logistics", email: "arjun.sharma@rapidroute.in", phone: "+91 98201 45678", location: "Panaji, Goa", avatar: "AS", color: "bg-blue-100 text-blue-700" },
  { id: "t2", name: "Priya Nair", role: "Customer Support Lead", email: "priya.nair@rapidroute.in", phone: "+91 94231 56789", location: "Margao, Goa", avatar: "PN", color: "bg-purple-100 text-purple-700" },
  { id: "t3", name: "Rohan Desai", role: "Fleet Manager", email: "rohan.desai@rapidroute.in", phone: "+91 93451 78901", location: "Vasco da Gama, Goa", avatar: "RD", color: "bg-green-100 text-green-700" },
  { id: "t4", name: "Meera Pillai", role: "Operations Coordinator", email: "meera.pillai@rapidroute.in", phone: "+91 95671 23456", location: "Panjim, Goa", avatar: "MP", color: "bg-amber-100 text-amber-700" },
  { id: "t5", name: "Vikram Bhat", role: "Technical Support", email: "vikram.bhat@rapidroute.in", phone: "+91 92011 34567", location: "Mapusa, Goa", avatar: "VB", color: "bg-rose-100 text-rose-700" },
  { id: "t6", name: "Sneha Kamat", role: "Delivery Supervisor", email: "sneha.kamat@rapidroute.in", phone: "+91 91901 67890", location: "Calangute, Goa", avatar: "SK", color: "bg-teal-100 text-teal-700" },
];

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [team, setTeam] = useState<TeamMember[]>(DEFAULT_TEAM);

  useEffect(() => {
    const stored = localStorage.getItem("rapidroute_team");
    if (stored) {
      try {
        setTeam(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const addTeamMember = (member: Omit<TeamMember, "id">) => {
    const newMember: TeamMember = { ...member, id: `t${Date.now()}` };
    const updated = [...team, newMember];
    setTeam(updated);
    localStorage.setItem("rapidroute_team", JSON.stringify(updated));
  };

  const removeTeamMember = (id: string) => {
    const updated = team.filter(m => m.id !== id);
    setTeam(updated);
    localStorage.setItem("rapidroute_team", JSON.stringify(updated));
  };

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    const updated = team.map(m => m.id === id ? { ...m, ...updates } : m);
    setTeam(updated);
    localStorage.setItem("rapidroute_team", JSON.stringify(updated));
  };

  return (
    <TeamContext.Provider value={{ team, addTeamMember, removeTeamMember, updateTeamMember }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeam must be used within TeamProvider");
  return ctx;
}
