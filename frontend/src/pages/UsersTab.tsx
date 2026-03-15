import { useState, useEffect } from "react";
import { 
  Search, Trash2, Loader2, User, RefreshCcw, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  joined: string;
  status: string;
}

export default function UsersTab({ onUpdateStats }: { onUpdateStats?: () => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("sb_token");
      const res = await axios.get("http://localhost:8000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const formatted = res.data.map((u: any) => ({
        id: u.id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone || "No Phone",
        joined: new Date(u.created_at).toLocaleDateString("en-GB", { 
          day: "2-digit", month: "short", year: "numeric" 
        }),
        status: "approved"
      }));
      
      setUsers(formatted);
      if (onUpdateStats) onUpdateStats();
    } catch (err: any) {
      console.error("Fetch Users Error:", err);
      toast({ 
        variant: "destructive", 
        title: "Sync Error", 
        description: err.response?.data?.message || "Failed to load customer list." 
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}'s account? This action cannot be undone.`)) return;
    
    try {
      const token = localStorage.getItem("sb_token");
      await axios.delete(`http://localhost:8000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({ title: "Account Deleted", description: `${name} has been removed from the system.` });
      setUsers(prev => prev.filter(u => u.id !== id));
      if (onUpdateStats) onUpdateStats();
      
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: err.response?.data?.message || "Could not remove user." 
      });
    }
  };

  // --- FILTERING & PAGINATION LOGIC ---
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Physical Arrow Key Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCurrentPage(p => Math.max(p - 1, 1));
      if (e.key === "ArrowRight") setCurrentPage(p => Math.min(p + 1, totalPages));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages]);

  return (
    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden flex flex-col">
      {/* Header & Search */}
      <div className="p-6 border-b bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-10 bg-slate-50 border-none rounded-xl focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              {filteredUsers.length} Customers
            </div>
            <Button variant="ghost" size="icon" onClick={fetchUsers} disabled={loading} className="text-slate-400 hover:text-primary transition-colors">
               <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1">
        {loading && users.length === 0 ? (
          <div className="py-24 text-center">
            <Loader2 className="animate-spin mx-auto text-primary w-8 h-8 opacity-20" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-4">Pulling Registry...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-slate-500 font-bold">No customers found.</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100/50 shadow-sm">
                          {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{user.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700">{user.phone}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Direct Line</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-600">{user.joined}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl"
                        onClick={() => deleteUser(user.id, user.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- PAGINATION FOOTER --- */}
      {!loading && filteredUsers.length > 0 && (
        <div className="flex items-center justify-between px-8 py-5 bg-white border-t border-slate-50">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Showing <span className="text-slate-900">{indexOfFirstItem + 1}</span> to{" "}
            <span className="text-slate-900">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of{" "}
            <span className="text-slate-900">{filteredUsers.length}</span>
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-xl border-slate-100 text-slate-400 hover:text-primary"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-xl border-slate-100 text-slate-400 hover:text-primary"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1.5 px-4 h-8 bg-slate-50 rounded-xl border border-slate-100/50">
              <span className="text-[11px] font-black text-primary">{currentPage}</span>
              <span className="text-[11px] font-bold text-slate-300">/</span>
              <span className="text-[11px] font-bold text-slate-500">{totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-xl border-slate-100 text-slate-400 hover:text-primary"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-xl border-slate-100 text-slate-400 hover:text-primary"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}