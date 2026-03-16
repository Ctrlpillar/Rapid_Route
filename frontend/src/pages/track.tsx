import { useState, useEffect } from "react";
import { Search, MapPin, Truck, PackageCheck, Clock, Package, LogIn, ChevronRight, CheckCircle2, Circle, Lock, ShieldCheck, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";

// --- IMPORT YOUR CENTRALIZED API UTILITY ---
import API from "@/api"; 

(L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl = undefined;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// --- CONSTANTS & ICONS ---
const HQ_POS: [number, number] = [15.4909, 73.8278]; 
const DEFAULT_ZOOM = 12;

const truckIcon = new L.DivIcon({
  html: `<div style="background:#3b82f6;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 10px rgba(59,130,246,0.5);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><polyline points="12 17 13 11 16 11 19 17"/><line x1="16" y1="11" x2="19" y2="11"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div>`,
  className: "", iconSize: [34, 34], iconAnchor: [17, 17],
});
const destinationIcon = new L.DivIcon({
  html: `<div style="background:#22c55e;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(34,197,94,0.5);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
  className: "", iconSize: [30, 30], iconAnchor: [15, 30],
});
const waypointIcon = new L.DivIcon({
  html: `<div style="background:#f59e0b;border-radius:50%;width:20px;height:20px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>`,
  className: "", iconSize: [20, 20], iconAnchor: [10, 10],
});
const deliveredIcon = new L.DivIcon({
  html: `<div style="background:#22c55e;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(34,197,94,0.4);"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>`,
  className: "", iconSize: [28, 28], iconAnchor: [14, 14],
});
const hubIcon = new L.DivIcon({
  html: `<div style="background:#1e293b;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.2);"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
  className: "", iconSize: [34, 34], iconAnchor: [17, 17],
});

// --- TYPES ---
interface RoutePoint { pos: [number, number]; label: string; time: string; }
interface SearchResult {
  trackingNumber: string; status: string; item: string; carrier: string;
  estimatedDelivery: string; currentLocation: string; route: RoutePoint[];
  currentStop: number; events: { date: string; description: string; location: string }[];
  driverPhone?: string; 
}

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { animate: true, duration: 1 }); }, [center, zoom, map]);
  return null;
}

function TrackingMap({ route, currentStop, center, zoom, isSearching }: { 
  route: RoutePoint[]; currentStop: number; center: [number, number]; zoom: number; isSearching: boolean;
}) {
  const routePositions = route.map(p => p.pos);
  const activeStop = currentStop ?? route.length - 2;
  return (
    <div className="rounded-2xl overflow-hidden border border-border/50" style={{ height: 380 }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} zoomControl={true} scrollWheelZoom={false}>
        <MapRecenter center={center} zoom={zoom} />
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {!isSearching ? (
          <Marker position={HQ_POS} icon={hubIcon}>
            <Popup><div className="text-center font-bold text-primary">RapidRoute HQ<br/><span className="text-[10px] text-muted-foreground font-normal">Panaji Sorting Hub</span></div></Popup>
          </Marker>
        ) : (
          <>
            <Polyline positions={routePositions.slice(0, activeStop + 1)} color="#3b82f6" weight={4} opacity={0.9} />
            <Polyline positions={routePositions.slice(activeStop)} color="#94a3b8" weight={3} opacity={0.6} dashArray="8,8" />
            {route.map((point, i) => {
              const isActive = i === activeStop;
              const isDestination = i === route.length - 1;
              const isCompleted = i < activeStop;
              const icon = isActive ? (isDestination ? deliveredIcon : truckIcon) : isDestination ? destinationIcon : waypointIcon;
              return (
                <Marker key={i} position={point.pos} icon={icon}>
                  <Popup><div className="text-sm"><p className="font-semibold">{point.label}</p><p className="text-gray-400 text-xs mt-0.5">{point.time}</p></div></Popup>
                </Marker>
              );
            })}
          </>
        )}
      </MapContainer>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { "In Transit": "bg-blue-100 text-blue-700", "Delivered": "bg-green-100 text-green-700", "Pending": "bg-amber-100 text-amber-700", "Out for Delivery": "bg-purple-100 text-purple-700", "out_for_delivery": "bg-purple-100 text-purple-700", "Cancelled": "bg-red-100 text-red-700" };
  const badgeClass = map[status] || map[status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())] || "bg-slate-100 text-slate-700";
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>{status.toLowerCase() === "delivered" ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}{status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>;
}

export default function Track() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchInput, setSearchInput] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("rapidroute_recent_searches");
    if (saved) { try { setRecentSearches(JSON.parse(saved)); } catch (e) { console.error("History load failed"); } }
    
    if (user) {
      const params = new URLSearchParams(window.location.search);
      const num = params.get("number");
      if (num) { setSearchInput(num); handleSearchNumber(num); }
    }
  }, [user]);

  const addToHistory = (order: SearchResult) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.trackingNumber !== order.trackingNumber);
      const updated = [order, ...filtered].slice(0, 6);
      localStorage.setItem("rapidroute_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearchNumber = async (num?: string) => {
    const t = (num || searchInput).trim();
    if (!t) return;
    setIsSearchLoading(true); setSearchError(null); setSearchResult(null);
    window.history.replaceState(null, "", `/track?number=${encodeURIComponent(t)}`);

    try {
      // CLEANER CALL: Base URL and Headers handled automatically
      const response = await API.get(`/track/${t}`);
      const data = response.data;

      let destinationPos: [number, number] = [15.2993, 74.124];
      const carrierInfo = data.carrier || "";
      if (carrierInfo.includes("Truck 01")) destinationPos = [15.4909, 73.8278];
      else if (carrierInfo.includes("Truck 02")) destinationPos = [15.5937, 73.8105];
      else if (carrierInfo.includes("Truck 03")) destinationPos = [15.2736, 73.9580];
      else if (carrierInfo.includes("Truck 04")) destinationPos = [15.3975, 73.8118];
      else if (carrierInfo.includes("Truck 05")) destinationPos = [15.3996, 74.0204];

      const result: SearchResult = {
        trackingNumber: data.trackingNumber, 
        status: data.status, 
        item: data.item, 
        carrier: data.carrier,
        estimatedDelivery: data.estimatedDelivery, 
        currentLocation: data.currentLocation,
        driverPhone: data.driver_phone || data.driverPhone || "+91 98234 56789", 
        route: [
          { pos: HQ_POS, label: "Panaji Hub", time: data.events[data.events.length - 1]?.date || "Started" },
          { pos: [15.4, 73.9], label: "In Transit", time: "On Route" },
          { pos: destinationPos, label: data.deliveryAddress || data.currentLocation, time: "Destination" }
        ],
        currentStop: data.currentStop === 4 ? 2 : (data.currentStop >= 2 ? 1 : 0), 
        events: data.events,
      };

      setSearchResult(result);
      addToHistory(result);
    } catch (err: any) {
      setSearchError(err.response?.status === 404 ? `Tracking number "${t}" not found.` : "Authentication required or server error.");
    } finally { setIsSearchLoading(false); }
  };

  // --- LOCKED STATE UI ---
  if (!user && !authLoading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-6 bg-slate-50">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border-2 border-primary/20"><Lock className="w-10 h-10 text-primary" /></div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md"><ShieldCheck className="w-5 h-5 text-emerald-500" /></div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Tracker Locked</h2>
            <p className="text-slate-500 leading-relaxed">Live tracking is restricted to authorized account holders to protect sensitive logistics data.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <Button onClick={() => navigate("/signin")} className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/20 gap-2"><LogIn className="w-5 h-5" /> Sign In to Track</Button>
            <p className="text-xs text-slate-400">Don't have an account? <span className="text-primary font-semibold cursor-pointer hover:underline" onClick={() => navigate("/signup")}>Create one</span></p>
          </div>
        </motion.div>
      </div>
    );
  }

  const isSearching = !!searchResult;
  const mapRoute = (searchResult?.route || []) as RoutePoint[];
  const mapStop = searchResult?.currentStop ?? 0;
  const mapCenter: [number, number] = isSearching ? (mapRoute[mapStop]?.pos || HQ_POS) : HQ_POS;

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50 pb-20 font-sans">
      <div className="bg-white border-b border-border pt-12 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Track Order</h1>
          <p className="text-slate-400 font-medium mb-6">Hello, {user?.name?.split(" ")[0]}! Monitor your active shipments in real-time.</p>
          <form onSubmit={(e) => { e.preventDefault(); handleSearchNumber(); }} className="flex gap-3 max-w-2xl bg-slate-100/50 p-2.5 rounded-2xl border border-slate-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Enter tracking ID (e.g. RR-GOA-2026)" className="w-full pl-10 h-12 bg-transparent border-none shadow-none focus-visible:ring-0 text-base font-medium" />
            </div>
            <Button type="submit" disabled={isSearchLoading} className="h-12 rounded-xl px-10 font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">{isSearchLoading ? "Locating..." : "Track"}</Button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 mt-8 space-y-6">
        {searchError && <div className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 font-bold text-sm tracking-wide">{searchError}</div>}
        {isSearchLoading && <Skeleton className="w-full h-24 rounded-2xl" />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-black text-lg text-slate-900 tracking-tight uppercase">Recent</h2>
                {recentSearches.length > 0 && (
                  <button onClick={() => { localStorage.removeItem("rapidroute_recent_searches"); setRecentSearches([]); }} className="text-[10px] uppercase font-black text-slate-400 hover:text-red-500 transition-colors">Clear All</button>
                )}
              </div>
              {recentSearches.length === 0 ? (
                <div className="p-10 text-center bg-white border border-dashed rounded-3xl"><p className="text-xs font-bold text-slate-300 uppercase tracking-widest">History is empty</p></div>
              ) : (
                recentSearches.map(order => (
                  <button key={order.trackingNumber} onClick={() => { setSearchResult(order); setSearchInput(order.trackingNumber); }} className={`w-full text-left rounded-3xl border p-5 transition-all ${searchResult?.trackingNumber === order.trackingNumber ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-[1.02]" : "border-slate-100 bg-white hover:border-primary/40 hover:shadow-md"}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5 text-primary" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1.5"><p className="text-sm font-black text-slate-900 truncate tracking-tight">{order.item}</p><ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" /></div>
                        <p className="text-[10px] font-black font-mono text-slate-400 mb-3 tracking-tighter">{order.trackingNumber}</p>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-[2.5rem] shadow-sm border-slate-100 overflow-hidden bg-white">
              <CardContent className="p-0">
                <div className="px-8 pt-7 pb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{isSearching ? searchResult.item : "Network Center"}</h3>
                    <p className="text-sm font-medium text-slate-400">{isSearching ? searchResult.currentLocation : "RapidRoute Panaji Hub, Goa"}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-100">
                    <span className={`w-2 h-2 rounded-full ${isSearching ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                    {isSearching ? 'Live' : 'Hub Online'}
                  </span>
                </div>
                <div className="mx-4 mb-4"><TrackingMap route={mapRoute} currentStop={mapStop} center={mapCenter} zoom={isSearching ? 13 : DEFAULT_ZOOM} isSearching={isSearching} /></div>
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              {searchResult && (
                <motion.div key={searchResult.trackingNumber} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6" >
                  <Card className="rounded-[2.5rem] shadow-sm border-slate-100 overflow-hidden bg-white">
                    <div className={`px-8 py-7 text-white ${searchResult.status.toLowerCase().includes("delivered") ? "bg-gradient-to-br from-emerald-600 to-green-500" : "bg-gradient-to-br from-primary to-blue-600"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="w-5 h-5 opacity-80" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{searchResult.carrier}</span>
                      </div>
                      
                      <h2 className="text-3xl font-black capitalize tracking-tight">{searchResult.status.replace(/_/g, ' ')}</h2>
                      <p className="opacity-80 text-sm font-medium mt-1 truncate">{searchResult.currentLocation}</p>
                      
                      {searchResult.status.toLowerCase().includes("out") && searchResult.status.toLowerCase().includes("delivery") && searchResult.driverPhone && (
                        <div className="mt-6 inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-all border border-white/20 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl">
                          <div className="bg-white p-2 rounded-xl flex-shrink-0 shadow-inner">
                            <Phone className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none mb-1.5">Direct Line</span>
                            <span className="text-base font-black text-white leading-none tracking-wider">{searchResult.driverPhone}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/5 rounded-[1rem] flex items-center justify-center flex-shrink-0 border border-primary/10"><PackageCheck className="w-6 h-6 text-primary" /></div>
                          <div className="min-w-0"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Tracking ID</p><p className="font-bold text-sm text-slate-900 truncate font-mono">{searchResult.trackingNumber}</p></div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-50 rounded-[1rem] flex items-center justify-center flex-shrink-0 border border-emerald-100"><Clock className="w-6 h-6 text-emerald-600" /></div>
                          <div className="min-w-0"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">ETA</p><p className="font-bold text-sm text-slate-900 truncate">{searchResult.estimatedDelivery}</p></div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-amber-50 rounded-[1rem] flex items-center justify-center flex-shrink-0 border border-amber-100"><MapPin className="w-6 h-6 text-amber-600" /></div>
                          <div className="min-w-0"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Current Point</p><p className="font-bold text-sm text-slate-900 leading-tight line-clamp-2">{searchResult.currentLocation}</p></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2.5rem] shadow-sm border-slate-100 bg-white">
                    <CardContent className="p-10">
                      <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight uppercase">Manifest History</h3>
                      <div className="space-y-0">
                        {searchResult.events.map((event, i) => (
                          <div key={i} className="flex gap-6">
                            <div className="flex flex-col items-center">
                              <div className={`w-5 h-5 rounded-full border-4 flex-shrink-0 transition-all ${i === 0 ? "bg-primary border-primary/20 scale-110" : "bg-white border-slate-100"}`} />
                              {i < (searchResult.events.length - 1) && <div className="w-1 bg-slate-50 flex-1 my-2 rounded-full" style={{ minHeight: "3rem" }} />}
                            </div>
                            <div className="pb-8">
                              <p className={`font-black text-sm tracking-tight ${i === 0 ? "text-slate-900" : "text-slate-500"}`}>{event.description}</p>
                              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{event.location}</p>
                              <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">{event.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}