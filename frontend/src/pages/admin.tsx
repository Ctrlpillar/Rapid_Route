import { useState, useEffect } from "react";
import {
  Users, Package, Trash2, CheckCircle2, Search,
  LayoutDashboard, LogOut, Zap, TrendingUp, PlusCircle, UserCog 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTeam } from "@/contexts/team-context";
import { useToast } from "@/hooks/use-toast";

// --- IMPORT YOUR NEW API UTILITY ---
import API from "@/api"; 

// Components
import AddOrder from "./AddOrder"; 
import OrdersTab from "./OrdersTab"; 
import TeamManagement from "./TeamManagement"; 
import UsersTab from "./UsersTab";

// --- TYPES ---
export type OrderStatus = "pending" | "approved" | "in_transit" | "out_for_delivery" | "delivered" | "cancelled" | "deleted";

export interface AdminOrder {
  id: string; trackingNumber: string; orderName: string;
  customerName: string; customerEmail: string; customerPhone?: string;
  deliveryLocation?: string; carrier: string; status: OrderStatus; createdAt: string; zipcode: string; formatted_weight?: string;
}

// --- MOCK CHART DATA ---
const chartData = [
  { day: 'Mon', total: 12 },
  { day: 'Tue', total: 18 },
  { day: 'Wed', total: 15 },
  { day: 'Thu', total: 22 },
  { day: 'Fri', total: 30 },
  { day: 'Sat', total: 10 },
  { day: 'Sun', total: 5 },
];

// --- HELPERS ---
function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub: string; color: string }) {
  return (
    <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden transition-all hover:scale-[1.02]">
      <CardContent className="p-6 flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${color} shadow-inner`}>{icon}</div>
        <div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5 italic">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfirmDialog({ action, onConfirm, onCancel }: { action: any; onConfirm: () => void; onCancel: () => void }) {
  if (!action) return null;
  const isDelete = action.type.startsWith("delete");
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100">
        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{isDelete ? "Confirm Deletion" : "Confirm Action"}</h3>
        <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
          Are you sure you want to proceed with <span className="font-bold text-slate-900">{action.label}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold border-slate-200 hover:bg-slate-50" onClick={onCancel}>Cancel</Button>
          <Button className={`flex-1 rounded-xl h-12 font-bold shadow-lg ${isDelete ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white" : "bg-primary text-white"}`} onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Admin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<"dashboard" | "users" | "orders" | "add_order" | "team">("dashboard");
  
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [confirmAction, setConfirmAction] = useState<any>(null);

  // --- State for the live Dashboard Stats ---
  const [stats, setStats] = useState({
    total_shipments: 0,
    total_customers: 0,
    active_fleet: 0,
    pending_orders: 0
  });

  const fetchData = async () => {
    try {
      // 1. Fetch Orders List (URL is handled by API utility)
      const orderRes = await API.get("/orders");
      const formattedOrders = orderRes.data.map((o: any) => ({
        id: o.id.toString(), 
        trackingNumber: o.tracking_number, 
        orderName: o.item_name || "Standard Parcel",
        customerName: o.customer_name, 
        customerEmail: o.customer_email || "", 
        customerPhone: o.customer_phone || "",
        deliveryLocation: o.delivery_location, 
        zipcode: o.zipcode || "",
        carrier: o.carrier || "Unassigned", 
        status: o.status,
        createdAt: new Date(o.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      }));
      setOrders(formattedOrders);

      // 2. Fetch live Dashboard Overview Stats (Headers handled automatically!)
      const statsRes = await API.get("/admin/stats");
      setStats(statsRes.data);

    } catch (err) { console.error("Sync failed", err); }
  };

  useEffect(() => {
    if (localStorage.getItem("is_admin") !== "true") navigate("/admin");
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("is_admin");
    localStorage.removeItem("sb_token");
    localStorage.removeItem("sb_user");
    toast({
      title: "Logged Out",
      description: "You have been securely signed out of the Control Hub.",
    });
    navigate("/admin");
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      // Cleaner PATCH call
      await API.patch(`/orders/${id}/status`, { status });
      
      setOrders(currentOrders => currentOrders.map(order => 
        order.id === id ? { ...order, status } : order
      ));
      
      fetchData(); // Refresh stats after update
      toast({ title: "Status Updated", description: `Shipment is now marked as ${status.replace('_', ' ')}` });
    } catch (err) { 
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update the database." }); 
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    try {
      if (type === "delete_order") {
        // Cleaner DELETE call
        await API.delete(`/orders/${id}`);
        setOrders(o => o.filter(x => x.id !== id));
        fetchData(); 
        toast({ title: "Deleted", description: "Order successfully removed." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Action failed." });
    }
    setConfirmAction(null); 
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" />, badge: stats.total_customers > 0 ? stats.total_customers : null },
    { id: "orders", label: "Orders", icon: <Package className="w-4 h-4" />, badge: stats.pending_orders > 0 ? stats.pending_orders : null },
    { id: "add_order", label: "Add Order", icon: <PlusCircle className="w-4 h-4" /> },
    { id: "team", label: "Team", icon: <UserCog className="w-4 h-4" />, badge: stats.active_fleet > 0 ? stats.active_fleet : null }, 
  ];

  const Sidebar = () => (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-full">
      <div className="px-8 py-8 flex items-center gap-3">
        <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-primary/30">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-xl tracking-tighter text-slate-900">RapidRoute</span>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => setTab(item.id as any)} 
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${tab === item.id ? "bg-slate-900 text-white shadow-xl shadow-slate-200" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
          >
            <div className="flex items-center gap-3">{item.icon} {item.label}</div>
            {item.badge ? <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black ${tab === item.id ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>{item.badge}</span> : null}
          </button>
        ))}
      </nav>
      <div className="p-6 border-t border-slate-50">
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-3 text-red-500 text-xs font-black uppercase tracking-widest w-full px-4 py-4 hover:bg-red-50 rounded-2xl transition-all group"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
          Exit System
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans selection:bg-primary/10 relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-10 py-5 flex items-center justify-between sticky top-0 z-40">
           <h1 className="text-xl font-black text-slate-900 tracking-tight">{navItems.find(i => i.id === tab)?.label}</h1>
           <div className="flex items-center gap-4">
             <div className="bg-slate-100/50 rounded-2xl px-4 py-2 flex items-center gap-3 border border-slate-200/50">
               <div className="w-8 h-8 rounded-xl bg-primary text-white text-[10px] flex items-center justify-center font-black shadow-lg shadow-primary/20">AD</div>
               <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Control Hub</span>
             </div>
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
             >
                <LogOut className="w-5 h-5" />
             </Button>
           </div>
        </header>

        <main className="flex-1 p-10 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.01 }} transition={{ duration: 0.2 }}>
              
              {tab === "dashboard" && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Wired to live database counts */}
                    <StatCard icon={<Users className="w-6 h-6 text-blue-600" />} label="Total Users" value={stats.total_customers} sub="Network Registry" color="bg-blue-50" />
                    <StatCard icon={<Package className="w-6 h-6 text-violet-600" />} label="Total Orders" value={stats.total_shipments} sub="Manifest Volume" color="bg-violet-50" />
                    <StatCard icon={<UserCog className="w-6 h-6 text-emerald-600" />} label="Active Fleet" value={stats.active_fleet} sub="Drivers on Road" color="bg-emerald-50" />
                    <StatCard icon={<TrendingUp className="w-6 h-6 text-amber-600" />} label="Pending" value={stats.pending_orders} sub="Requires Action" color="bg-amber-50" />
                  </div>

                  {/* Shipment Volume Chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white p-10">
                      <div className="mb-8">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Shipment Volume</h3>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Weekly Throughput Analysis</p>
                      </div>
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                            <Tooltip 
                              cursor={{fill: '#f8fafc'}}
                              contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px'}}
                            />
                            <Bar dataKey="total" radius={[8, 8, 8, 8]} barSize={45}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 4 ? '#3b82f6' : '#e2e8f0'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* System Feed */}
                    <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                      <div className="p-10 border-b border-slate-50">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">System Feed</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time Events</p>
                      </div>
                      <div className="p-8 space-y-8">
                        {orders.slice(0, 5).map((order, i) => (
                          <div key={order.id} className="flex gap-5">
                            <div className="relative">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${i === 0 ? 'bg-blue-600 text-white rotate-3' : 'bg-slate-50 text-slate-400'}`}>
                                 {i === 0 ? <Zap className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                              </div>
                              {i !== 4 && <div className="absolute top-14 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-slate-50" />}
                            </div>
                            <div className="pt-1">
                              <p className="text-sm font-bold text-slate-900 leading-tight">
                                {order.customerName.split(' ')[0]}'s order is {order.status.replace('_', ' ')}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                {order.trackingNumber} • {i + 1}m ago
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {tab === "users" && <UsersTab onUpdateStats={fetchData} />}
              {tab === "orders" && (
                <OrdersTab 
                  orders={orders} 
                  onUpdateStatus={updateOrderStatus}
                  onDeleteClick={(id, label) => setConfirmAction({ type: "delete_order", id, label })} 
                />
              )}
              {tab === "add_order" && <AddOrder onAddOrders={() => fetchData()} onViewOrders={() => setTab("orders")} />}
              {tab === "team" && <TeamManagement />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ConfirmDialog 
        action={confirmAction} 
        onConfirm={handleConfirmAction} 
        onCancel={() => setConfirmAction(null)} 
      />
    </div>
  );
}