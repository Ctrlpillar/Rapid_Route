import { useState, useEffect } from "react";
import { 
  Truck, MapPin, CheckCircle, Navigation, 
  Package, Search, Clock, LogOut, RefreshCw, Phone 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// --- IMPORT YOUR API UTILITY ---
import API from "@/api"; 

const STATUS_PRIORITY: Record<string, number> = {
  out_for_delivery: 1,
  in_transit: 2,
  approved: 3,
  pending: 4,
};

const getActionConfig = (status: string) => {
  switch (status) {
    case 'pending': 
      return { text: "Awaiting Admin", color: "bg-slate-100 text-slate-400 shadow-none", next: null, disabled: true, Icon: Clock };
    case 'approved': 
      return { text: "Start Transit", color: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20", next: "in_transit", disabled: false, Icon: Truck };
    case 'in_transit': 
      return { text: "Out for Delivery", color: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20", next: "out_for_delivery", disabled: false, Icon: MapPin };
    case 'out_for_delivery': 
      return { text: "Mark Delivered", color: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20", next: "delivered", disabled: false, Icon: CheckCircle };
    default: 
      return { text: "Completed", color: "bg-slate-200 text-slate-400 shadow-none", next: null, disabled: true, Icon: CheckCircle };
  }
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'pending': return { bar: 'bg-amber-400', pill: 'bg-amber-100 text-amber-700' };
    case 'approved': return { bar: 'bg-blue-500', pill: 'bg-blue-100 text-blue-700' };
    case 'in_transit': return { bar: 'bg-violet-500', pill: 'bg-violet-100 text-violet-700' };
    case 'out_for_delivery': return { bar: 'bg-purple-500', pill: 'bg-purple-100 text-purple-700' };
    default: return { bar: 'bg-slate-300', pill: 'bg-slate-100 text-slate-600' };
  }
};

export default function DriverDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const driverName = localStorage.getItem("driver_name") || "Driver";
  const assignedTruck = localStorage.getItem("assigned_truck") || "No Truck Assigned";

  useEffect(() => {
    fetchManifest();
  }, []);

  const fetchManifest = async () => {
    setLoading(true);
    try {
      // CLEANER CALL: Auth header is added automatically by the interceptor
      // We just need to ensure the interceptor checks for 'driver_token' as well!
      const res = await API.get("/driver/manifest", {
        headers: { Authorization: `Bearer ${localStorage.getItem("driver_token")}` }
      });
      setParcels(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleLogout();
      }
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not load manifest." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string, customerName: string) => {
    try {
      setParcels(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      
      // CLEANER CALL: Patch status using the API utility
      await API.patch(`/driver/update-status/${id}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem("driver_token")}` }}
      );
      
      toast({ title: "Status Updated", description: `${customerName}'s package is now ${newStatus.replace(/_/g, ' ')}.` });
      
      if (newStatus === 'delivered') {
        setTimeout(() => fetchManifest(), 1000);
      }
    } catch (e) {
      fetchManifest();
      toast({ variant: "destructive", title: "Update Failed", description: "Check your connection." });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("driver_token");
    localStorage.removeItem("driver_name");
    localStorage.removeItem("assigned_truck");
    navigate("/driver-login"); 
  };

  const sortedAndFilteredParcels = parcels
    .filter(p => 
      p.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.tracking_number.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const pA = STATUS_PRIORITY[a.status] || 99;
      const pB = STATUS_PRIORITY[b.status] || 99;
      return pA - pB;
    });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 font-sans">
      <div className="bg-white border-b border-slate-200 px-6 py-6 sticky top-0 z-10 shadow-sm rounded-b-[2rem]">
        <div className="max-w-md mx-auto flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Hello, {driverName.split(' ')[0]}!</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{assignedTruck}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-600 transition-colors">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search manifest..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-slate-100 border-transparent rounded-xl focus-visible:ring-primary/20 text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-4">
        {loading && parcels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-primary" />
            <p className="text-sm font-medium text-slate-500">Syncing live manifest...</p>
          </div>
        ) : sortedAndFilteredParcels.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Route Clear!</h3>
            <p className="text-sm text-slate-500 mt-1">All assigned parcels have been processed.</p>
            <Button variant="outline" className="mt-6 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 font-bold" onClick={fetchManifest}>
              <RefreshCw className="w-4 h-4 mr-2 text-primary" /> Refresh Manifest
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{sortedAndFilteredParcels.length} Active Stops</span>
              <span className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase"><Clock className="w-3 h-3" /> Live Sync</span>
            </div>

            {sortedAndFilteredParcels.map((parcel) => {
              const action = getActionConfig(parcel.status);
              const styles = getStatusStyles(parcel.status);
              const ActionIcon = action.Icon;

              return (
                <Card key={parcel.id} className="border-none shadow-sm rounded-3xl bg-white overflow-hidden active:scale-[0.98] transition-all">
                  <CardContent className="p-0">
                    <div className="flex items-stretch min-h-[140px]">
                      <div className={`w-1.5 transition-colors duration-300 ${styles.bar}`} />
                      
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">{parcel.tracking_number}</p>
                            <h3 className="font-bold text-lg text-slate-900 leading-tight">{parcel.customer_name}</h3>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${styles.pill}`}>
                              {parcel.status.replace(/_/g, ' ')}
                            </span>
                            
                            {parcel.customer_phone && (
                              <a 
                                href={`tel:${parcel.customer_phone}`} 
                                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-primary transition-colors bg-slate-50 px-2 py-1 rounded-md border border-slate-100"
                              >
                                <Phone className="w-3 h-3" /> {parcel.customer_phone}
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-2 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                          <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed">
                            {parcel.delivery_location}
                          </p>
                        </div>

                        <div className="grid grid-cols-[1fr_2fr] gap-3">
                          <Button 
                            variant="outline" 
                            className="rounded-2xl h-12 font-bold border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-2 shadow-sm"
                            // 👇 FIXED MAPS LINK 👇
                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(parcel.delivery_location)}`, '_blank')}
                          >
                            <Navigation className="w-4 h-4 text-blue-500" /> Maps
                          </Button>
                          
                          <Button 
                            disabled={action.disabled}
                            className={`rounded-2xl h-12 font-bold shadow-md gap-2 transition-all duration-300 ${action.color}`}
                            onClick={() => action.next && handleUpdateStatus(parcel.id, action.next, parcel.customer_name)}
                          >
                            <ActionIcon className="w-4 h-4" /> {action.text}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {!loading && parcels.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20">
          <Button 
            className="w-full h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold shadow-2xl hover:bg-slate-50 transition-all flex items-center justify-between px-6"
            onClick={fetchManifest}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sync Manifest
            </div>
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      )}
    </div>
  );
}