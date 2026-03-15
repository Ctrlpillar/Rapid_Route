import { useState, useEffect } from "react";
import { UserPlus, Mail, Truck, Key, CheckCircle, Phone, Loader2, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

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
      const res = await axios.get("http://localhost:8000/api/admin/team", {
        headers: { Authorization: `Bearer ${localStorage.getItem("sb_token")}` }
      });
      setMembers(res.data);
    } catch (err: any) {
      console.error("Fetch Team Error:", err.response);
      toast({ 
        variant: "destructive", 
        title: "Sync Failed", 
        description: err.response?.status === 401 
          ? "Session expired. Please log out of the Admin panel and back in." 
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
      await axios.post("http://localhost:8000/api/admin/team", formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("sb_token")}`,
          Accept: "application/json"
        }
      });
      
      // Changed the success message to match the new secure workflow
      toast({ title: "Driver Added", description: "Use the Key icon to generate their secure setup link!" });
      setShowAddModal(false);
      setFormData({ full_name: "", company_email: "", assigned_truck: TRUCK_OPTIONS[0], phone: "" }); // Reset form
      fetchTeam();
    } catch (err: any) {
      const message = err.response?.data?.errors?.company_email 
        ? "This company email is already in use." 
        : "Failed to register driver. Please check all fields.";
      toast({ variant: "destructive", title: "Error", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- NEW SECURE LINK LOGIC ---
  const handleResetRequest = async (id: number) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/admin/team/${id}/reset-link`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("sb_token")}` }
      });
      
      // Automatically copy the link to the Admin's clipboard
      await navigator.clipboard.writeText(res.data.reset_url);
      
      toast({ 
        title: "Link Copied!", 
        description: "Secure URL copied to clipboard. Send it to the driver. It expires in 30 minutes." 
      });
    } catch (err: any) { 
      toast({ 
        variant: "destructive", 
        title: "Link Generation Failed", 
        description: err.response?.data?.message || "Driver must be 'Active' to generate a link." 
      }); 
    }
  };

  const deleteMember = async (id: number) => {
    if (!confirm("Are you sure you want to remove this member from the fleet?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/admin/team/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("sb_token")}` }
      });
      toast({ title: "Removed", description: "Member deleted successfully." });
      fetchTeam();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: "Could not delete member." }); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Fleet Team</h2>
          <p className="text-sm text-muted-foreground">Manage authorized drivers and company credentials.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
          <UserPlus className="w-4 h-4" /> Add Team Member
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
      ) : members.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <Truck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No team members registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card key={member.id} className="border-none shadow-sm group hover:ring-2 hover:ring-primary/10 transition-all bg-white rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                    {member.full_name.charAt(0)}
                  </div>
                  <div className="flex gap-1">
                    {/* Changed onClick to handleResetRequest */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-amber-600" title="Copy Secure Setup Link" onClick={() => handleResetRequest(member.id)}>
                      <Key className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-600" title="Delete Member" onClick={() => deleteMember(member.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-slate-900">{member.full_name}</h3>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" /> {member.company_email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" /> {member.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-primary font-bold">
                    <Truck className="w-4 h-4 flex-shrink-0" /> {member.assigned_truck}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                     <CheckCircle className="w-3 h-3" /> {member.status}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">ID: {member.id.toString().padStart(4, '0')}</span>
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
              <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
              <h3 className="text-xl font-bold mb-1">Add Fleet Driver</h3>
              <p className="text-sm text-muted-foreground mb-6">Create professional company credentials.</p>
              
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-400 ml-1">Full Name</label>
                  <Input 
                    required 
                    placeholder="E.g. Euan Fernandes" 
                    className="rounded-xl bg-slate-50 border-none h-11" 
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-400 ml-1">Company Email</label>
                  <Input 
                    required 
                    type="email" 
                    placeholder="euan@rapidroute.goa" 
                    className="rounded-xl bg-slate-50 border-none h-11" 
                    value={formData.company_email}
                    onChange={(e) => setFormData({...formData, company_email: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-400 ml-1">Phone Number</label>
                  <Input 
                    required 
                    type="tel"
                    placeholder="+91 00000 00000" 
                    className="rounded-xl bg-slate-50 border-none h-11" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-400 ml-1">Assign Route</label>
                  <select 
                    className="w-full bg-slate-50 border-none p-3 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none h-11" 
                    value={formData.assigned_truck}
                    onChange={(e) => setFormData({...formData, assigned_truck: e.target.value})}
                  >
                    {TRUCK_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl mt-4 font-bold">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Register Driver
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}