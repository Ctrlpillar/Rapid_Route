import { useState, useEffect } from "react";
import { 
  User, Shield, Loader2, Trash2, KeyRound, LogIn, Eye, Package, 
  Clock, MapPin, CheckCircle2, XCircle, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: { "Accept": "application/json" }
});

export default function Settings() {
  const { user, loading, updateUser, signOut } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [isPending, setIsPending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", website: "" });
  const [passwords, setPasswords] = useState({ current: "", next: "" });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        website: user.website || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "orders" && user) {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await API.get("/user/order-history", {
        headers: { Authorization: `Bearer ${localStorage.getItem("sb_token")}` }
      });
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const response = await API.post("/user/update", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("sb_token")}` }
      });
      updateUser(response.data.user);
      toast({ title: "Success", description: "Profile information updated successfully." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save changes." });
    } finally { setIsPending(false); }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current || !passwords.next) return;
    setPasswordPending(true);
    try {
      await API.post("/user/update-password", {
        current_password: passwords.current,
        new_password: passwords.next
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("sb_token")}` }
      });
      toast({ title: "Password Updated", description: "Your security credentials have been changed." });
      setPasswords({ current: "", next: "" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update password." });
    } finally { setPasswordPending(false); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("This will permanently delete your account. Proceed?")) return;
    setIsDeleting(true);
    try {
      await API.delete(`/users/${user?.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("sb_token")}` }
      });
      toast({ title: "Account Deleted" });
      signOut();
    } catch (e) {
      toast({ variant: "destructive", title: "Error deleting account" });
    } finally { setIsDeleting(false); }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-2"><User className="w-10 h-10 text-primary" /></div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in to manage account</h2>
            <p className="text-muted-foreground">You need to be logged in to access your profile settings and history.</p>
          </div>
          <Button onClick={() => navigate("/signin")} className="w-full h-12 rounded-xl text-md font-semibold shadow-lg shadow-primary/20 flex items-center justify-center gap-2"><LogIn className="w-5 h-5" />Sign In to RapidRoute</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold">Your account settings</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information, security, and tracking history.</p>
      </div>

      <div className="grid md:grid-cols-[250px_1fr] gap-8">
        <div className="space-y-2">
          <Button variant={activeTab === "personal" ? "secondary" : "ghost"} onClick={() => setActiveTab("personal")} className={`w-full justify-start font-medium ${activeTab === "personal" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
            <User className="mr-2 w-4 h-4" /> Personal Info
          </Button>
          <Button variant={activeTab === "security" ? "secondary" : "ghost"} onClick={() => setActiveTab("security")} className={`w-full justify-start font-medium ${activeTab === "security" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
            <Shield className="mr-2 w-4 h-4" /> Security
          </Button>
          <Button variant={activeTab === "orders" ? "secondary" : "ghost"} onClick={() => setActiveTab("orders")} className={`w-full justify-start font-medium ${activeTab === "orders" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
            <Package className="mr-2 w-4 h-4" /> Order History
          </Button>
        </div>

        <div className="space-y-8">
          {activeTab === "personal" && (
            <form onSubmit={handleProfileUpdate} className="space-y-8">
               <Card className="shadow-sm">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md overflow-hidden">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt="Profile" 
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      user?.name?.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="text-center sm:text-left">
                    <h3 className="font-semibold text-lg">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-sm font-medium">Full Name</label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-50" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">Email Address</label><Input type="email" value={formData.email} className="bg-slate-50" disabled /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-sm font-medium">Phone Number</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 00000 00000" className="bg-slate-50" /></div>
                    <div className="space-y-2"><label className="text-sm font-medium">Website</label><Input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://example.com" className="bg-slate-50" /></div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end pt-4"><Button type="submit" disabled={isPending} className="px-8 shadow-md">{isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Save Changes</Button></div>
            </form>
          )}

          {activeTab === "security" && (
            <div className="space-y-8">
              {!user.google_id ? (
                <form onSubmit={handlePasswordUpdate}>
                  <Card className="shadow-sm border-primary/10">
                    <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary" /> Password Security</CardTitle><CardDescription>Update your password regularly.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Current Password</label>
                        <div className="relative max-w-sm">
                          <Input type={showCurrentPassword ? "text" : "password"} value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="bg-slate-50 pr-10" />
                          <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Eye className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">New Password</label>
                        <div className="relative max-w-sm">
                          <Input type={showNewPassword ? "text" : "password"} value={passwords.next} onChange={e => setPasswords({...passwords, next: e.target.value})} className="bg-slate-50 pr-10" />
                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Eye className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <Button type="submit" disabled={passwordPending} className="mt-2">{passwordPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Update Password</Button>
                    </CardContent>
                  </Card>
                </form>
              ) : (
                <Card className="bg-blue-50/50 border-blue-100 border-2 border-dashed shadow-none"><CardHeader><CardTitle className="text-blue-700 text-lg">Google Authentication</CardTitle><CardDescription className="text-blue-600/80">Security managed by Google.</CardDescription></CardHeader></Card>
              )}
              <Card className="border-destructive/20 bg-destructive/5 shadow-none"><CardContent className="pt-6"><div className="flex items-center justify-between"><p className="font-bold text-slate-900">Delete Account</p><Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting} className="flex items-center gap-2">{isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete Permanently</Button></div></CardContent></Card>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Transaction History</h2>
              <p className="text-sm text-muted-foreground">Completed or cancelled shipments linked to <b>{user.email}</b>.</p>

              {loadingHistory ? (
                <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
              ) : history.length === 0 ? (
                <Card className="border-dashed border-2 py-20 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No completed orders found.</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {history.map((order) => (
                    <Card key={order.id} className="group hover:border-primary/50 transition-all cursor-pointer overflow-hidden border-border/60 shadow-sm" onClick={() => navigate(`/track?number=${order.tracking_number}`)}>
                      <CardContent className="p-0">
                        <div className="flex items-stretch min-h-[100px]">
                          <div className={`w-1.5 ${order.status === 'delivered' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                          <div className="flex-1 p-5 flex items-center justify-between">
                            <div className="flex items-start gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {order.status === 'delivered' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 truncate">{order.item_name || "Standard Parcel"}</h4>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">{order.tracking_number}</p>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                                  <span className="flex items-center gap-1 text-[11px] text-slate-400"><Clock className="w-3 h-3" /> {new Date(order.updated_at).toLocaleDateString()}</span>
                                  <span className="flex items-center gap-1 text-[11px] text-slate-400 max-w-[200px] truncate"><MapPin className="w-3 h-3" /> {order.delivery_location}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 flex flex-col items-end">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{order.status}</span>
                              <ChevronRight className="w-5 h-5 text-slate-300 mt-4 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}