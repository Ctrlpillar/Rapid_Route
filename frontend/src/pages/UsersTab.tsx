import { useState, useEffect } from "react";
import { 
  Search, Trash2, Loader2, User, RefreshCcw, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// --- IMPORT YOUR CENTRALIZED API UTILITY ---
import API from "@/api"; 

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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // CLEANER CALL: Base URL handled by API utility, token attached by Interceptor
      const res = await API.get("/admin/users");
      
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
      // CLEANER CALL: Dynamic DELETE request
      await API.delete(`/users/${id}`);
      
      toast({ title: "Account Deleted", description: `${name} has been removed.` });
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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCurrentPage(p => Math.max(p - 1, 1));
      if (e.key === "ArrowRight") setCurrentPage(p => Math.min(p + 1, totalPages));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages]);

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden flex flex-col font-sans">
      <div className="p-8 border-b border-slate-50 bg-white flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search registry..." 
            className="pl-11 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-primary/20 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              {filteredUsers.length} Network Nodes
            </div>
            <Button variant="ghost" size="icon" onClick={fetchUsers} disabled={loading} className="text-slate-300 hover:text-primary transition-all rounded-xl h-10 w-10">
               <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </div>
      
      <div className="flex-1">
        {loading && users.length === 0 ? (
          <div className="py-32 text-center">
            <Loader2 className="animate-spin mx-auto text-primary w-10 h-10 opacity-30" />
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-6">Refreshing Registry...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
              <User className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-slate-900 font-black tracking-tight">No match found</p>
            <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">Try adjusting search parameters</p>
          </div>
        ) : (
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-400">
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Access Link</th>
                  <th className="px-6 py-4">Registry Date</th>
                  <th className="px-6 py-4 text-right">Options</th>
                </tr>
              </thead>
              <tbody className="bg-transparent">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="bg-white hover:bg-slate-50/80 transition-all group">
                    <td className="px-6 py-5 rounded-l-[1.5rem] border-y border-l border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs border border-primary/10 shadow-sm transition-transform group-hover:scale-105">
                          {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 text-sm tracking-tight truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 font-medium truncate tracking-tight">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-y border-slate-50">
                      <p className="text-sm font-black text-slate-700 tracking-tighter">{user.phone}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Verified Line</p>
                    </td>
                    <td className="px-6 py-5 border-y border-slate-50">
                      <p className="text-sm font-bold text-slate-500 tracking-tight">{user.joined}</p>
                    </td>
                    <td className="px-6 py-5 text-right rounded-r-[1.5rem] border-y border-r border-slate-50">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl h-9 w-9"
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

      {!loading && filteredUsers.length > 0 && (
        <div className="flex items-center justify-between px-10 py-8 bg-white border-t border-slate-50 rounded-b-[2rem]">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Displaying <span className="text-primary">{indexOfFirstItem + 1}</span> — <span className="text-primary">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of <span className="text-slate-900">{filteredUsers.length}</span>
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-9 w-9 rounded-xl border-slate-100 text-slate-400 hover:text-primary transition-all"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-9 w-9 rounded-xl border-slate-100 text-slate-400 hover:text-primary transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 px-5 h-9 bg-slate-50 rounded-xl border border-slate-100/50">
              <span className="text-[11px] font-black text-primary">{currentPage}</span>
              <span className="text-[11px] font-black text-slate-300">/</span>
              <span className="text-[11px] font-black text-slate-400">{totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-9 w-9 rounded-xl border-slate-100 text-slate-400 hover:text-primary transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-9 w-9 rounded-xl border-slate-100 text-slate-400 hover:text-primary transition-all"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}