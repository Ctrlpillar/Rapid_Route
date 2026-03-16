import { useState, useEffect } from "react";
import { UserPlus, Mail, Truck, Key, CheckCircle, Phone, Loader2, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// --- IMPORT YOUR CENTRALIZED API UTILITY ---
import API from "@/api"; 

const TRUCK_OPTIONS = [
  "Truck 01 - Panjim & Tiswadi",
  "Truck 02 - Mapusa & North",
  "Truck 03 - Margao & South",
  "Truck 04 - Vasco & Mormugao",
  "Truck 05 - Ponda & Inland",
  "Truck 06 - General/Overflow"
];

export default function TeamManagement() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "", 
    company_email: "", 
    assigned_truck: TRUCK_OPTIONS[0], 
    phone: ""
  });

  useEffect(() => { fetchTeam(); }, []);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      // CLEANER CALL: URL is handled by API utility, headers are automatic
      const res = await API.get("/admin/team");
      setMembers(res.data);
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Sync Failed", 
        description: err.response?.status === 401 
          ? "Session expired. Please log out and back in." 
          : "Could not load the team from the database."
      });
    } finally { 
      setLoading(false); 
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // CLEANER CALL
      await API.post("/admin/team", formData);
      
      toast({ title: "Driver Added", description: "Use the Key icon to generate their setup link!" });
      setShowAddModal(false);
      setFormData({ full_name: "", company_email: "", assigned_truck: TRUCK_OPTIONS[0], phone: "" }); 
      fetchTeam();
    } catch (err: any) {
      const message = err.response?.data?.errors?.company_email 
        ? "This email is already in use." 
        : "Failed to register driver.";
      toast({ variant: "destructive", title: "Error", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetRequest = async (id: number) => {
    try {
      // CLEANER CALL
      const res = await API.get(`/admin/team/${id}/reset-link`);
      
      await navigator.clipboard.writeText(res.data.reset_url);
      
      toast({ 
        title: "Link Copied!", 
        description: "Secure URL copied to clipboard. Link expires in 30 minutes." 
      });
    } catch (err: any) { 
      toast({ 
        variant: "destructive", 
        title: "Link Failed", 
        description: err.response?.data?.message || "Driver must be 'Active' to generate a link." 
      }); 
    }
  };

  const deleteMember = async (id: number) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      // CLEANER CALL
      await API.delete(`/admin/team/${id}`);
      toast({ title: "Removed", description: "Member deleted successfully." });
      fetchTeam();
    } catch (e) { 
        toast({ variant: "destructive", title: "Error", description: "Could not delete member." }); 
    }
  };

  return (
    <div className="space-y-8 font-sans selection:bg-primary/10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fleet Team</h2>
          <p className="text-sm font-medium text-slate-400">Manage authorized drivers and access credentials.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 rounded-2xl h-11 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
          <UserPlus className="w-4 h-4" /> Add Team Member
        </Button>
      </div>

      {loading ? (
        <div className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-primary w-10 h-10 opacity-50" /></div>
      ) : members.length === 0 ? (
        <Card className="p-16 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] shadow-none">
          <Truck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active team members</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card key={member.id} className="border-none shadow-sm group hover:ring-2 hover:ring-primary/10 transition-all bg-white rounded-[2rem] overflow-hidden">
              <CardContent className="p-7">
                <div className="flex justify-between items-start mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center font-black text-primary text-2xl border border-primary/10">
                    {member.full_name.charAt(0)}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-xl" title="Copy Setup Link" onClick={() => handleResetRequest(member.id)}>
                      <Key className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl" title="Delete Member" onClick={() => deleteMember(member.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-black text-xl text-slate-900 tracking-tight">{member.full_name}</h3>
                <div className="space-y-2.5 mt-4">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <Mail className="w-4 h-4 text-slate-300" /> {member.company_email}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                    <Phone className="w-4 h-4 text-slate-300" /> {member.phone}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-black text-primary uppercase tracking-widest pt-1">
                    <Truck className="w-4 h-4" /> {member.assigned_truck}
                  </div>
                </div>

                <div className="mt-7 pt-5 border-t border-slate-50 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                     <CheckCircle className="w-3 h-3" /> {member.status}
                  </span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    ID: {member.id.toString().padStart(4, '0')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full relative border border-slate-100">
              <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5"/></button>
              <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Register Driver</h3>
              <p className="text-sm font-medium text-slate-400 mb-8">Create official fleet access credentials.</p>
              
              <form onSubmit={handleAddMember} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                  <Input required placeholder="E.g. Euan Fernandes" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-medium" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Company Email</label>
                  <Input required type="email" placeholder="euan@rapidroute.goa" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-medium" value={formData.company_email} onChange={(e) => setFormData({...formData, company_email: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <Input required type="tel" placeholder="+91 00000 00000" className="rounded-xl bg-slate-50 border-slate-200 h-12 font-medium" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assign Route</label>
                  <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none h-12" value={formData.assigned_truck} onChange={(e) => setFormData({...formData, assigned_truck: e.target.value})}>
                    {TRUCK_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl mt-4 font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Authorize Entry"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}