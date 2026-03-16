import { useState, useEffect } from "react";
import { PlusCircle, UploadCloud, FileText, Loader2, Phone, Mail, MapPin, Truck, Package, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import type { AdminOrder, OrderStatus } from "./admin";

// 1. DEFINE YOUR FLEET AND ROUTES (Goa Zones)
const GOA_ROUTES: Record<string, string[]> = {
  "Truck 01 - Panjim & Tiswadi": ["403001", "403002", "403003", "403004", "403206"],
  "Truck 02 - Mapusa & North Coastal": ["403507", "403509", "403516", "403519", "403521"],
  "Truck 03 - Margao & South Coastal": ["403601", "403602", "403708", "403726", "403701"],
  "Truck 04 - Vasco & Mormugao": ["403802", "403806", "403711"],
  "Truck 05 - Ponda & Inland": ["403401", "403404", "403115"],
};

const TRUCK_NAMES = Object.keys(GOA_ROUTES);
const FALLBACK_TRUCK = "Truck 06 - General/Overflow";

const getTruckForPin = (pin: string) => {
  for (const [truck, pins] of Object.entries(GOA_ROUTES)) {
    if (pins.includes(pin)) return truck;
  }
  return FALLBACK_TRUCK;
};

const EMPTY_FORM = { 
  trackingNumber: "", 
  itemName: "", 
  weight: 10, // Default 10g
  customerName: "", 
  customerEmail: "", 
  customerPhone: "",
  deliveryLocation: "",
  zipcode: "", 
  carrier: TRUCK_NAMES[0], 
  status: "pending" as OrderStatus 
};

export default function AddOrder({ onAddOrders, onViewOrders }: { onAddOrders: (orders: AdminOrder[]) => void; onViewOrders: () => void; }) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (form.zipcode.length >= 6) {
      const assignedTruck = getTruckForPin(form.zipcode);
      setForm(prev => ({ ...prev, carrier: assignedTruck }));
    }
  }, [form.zipcode]);

  // Logic to handle the display of weight (1000g -> 1kg)
  const formatWeight = (grams: number) => {
    if (grams >= 1000) {
      const kg = grams / 1000;
      return kg % 1 === 0 ? `${kg}kg` : `${kg.toFixed(1)}kg`;
    }
    return `${grams}g`;
  };

  const syncToNeon = async (orders: any[]) => {
    setLoading(true);
    try {
      const dbPayload = orders.map(o => ({
        tracking_number: o.trackingNumber,
        item_name: o.itemName, 
        weight: o.weight, // Send the raw numeric grams to DB
        customer_name: o.customerName,
        customer_email: o.customerEmail,
        customer_phone: o.customerPhone, 
        delivery_location: o.deliveryLocation,
        zipcode: o.zipcode, 
        carrier: o.carrier,
        status: o.status
      }));

      const res = await axios.post("http://localhost:8000/api/orders", { orders: dbPayload }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("sb_token")}` }
      });
      onAddOrders(orders);
      toast({ title: "Sync Successful", description: res.data.message });
      return true;
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || "Database rejected the entry.";
      toast({ variant: "destructive", title: "Sync Failed", description: serverMessage });
      return false;
    } finally { 
      setLoading(false); 
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!form.trackingNumber.trim()) errs.trackingNumber = "Required";
    if (!form.itemName.trim()) errs.itemName = "Required"; 
    if (!form.customerName.trim()) errs.customerName = "Required";
    if (!form.customerPhone.trim()) errs.customerPhone = "Required";
    if (!form.customerEmail.trim()) errs.customerEmail = "Required";
    if (!form.zipcode.trim()) errs.zipcode = "Required"; 
    if (!form.deliveryLocation.trim()) errs.deliveryLocation = "Required";
    
    if (Object.keys(errs).length) { 
      setErrors(errs); 
      toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please fill in all required fields marked with an asterisk (*)."
      });
      return; 
    }

    const newOrder = {
      ...form,
      id: `temp-${Date.now()}`,
      orderName: form.itemName,
      createdAt: new Date().toLocaleDateString("en-GB")
    };

    const success = await syncToNeon([newOrder]);
    if (success) {
      setForm(EMPTY_FORM);
      setErrors({});
      onViewOrders(); 
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8000/api/orders/bulk-upload", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("sb_token")}`
        }
      });
      toast({ title: "Import Successful", description: res.data.message });
      onViewOrders(); 
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Upload Failed", 
        description: err.response?.data?.message || "Could not process the CSV file." 
      });
    } finally {
      setLoading(false);
      e.target.value = ''; 
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex bg-slate-200 p-1 rounded-xl w-fit mx-auto mb-6 shadow-inner">
        <button onClick={() => setMode("single")} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === "single" ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}>Single Entry</button>
        <button onClick={() => setMode("bulk")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === "bulk" ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"}`}>
          <FileText className="w-4 h-4" /> Bulk Import
        </button>
      </div>

      {mode === "single" && (
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="pt-8 px-8 pb-2">
            <CardTitle className="text-xl font-bold">Logistics Entry</CardTitle>
            <p className="text-sm text-muted-foreground font-medium">Add a new shipment to the network.</p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSingleSubmit} className="space-y-6 mt-4">
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Tracking ID *</label>
                  <Input value={form.trackingNumber} onChange={e => setForm({...form, trackingNumber: e.target.value})} placeholder="RR-GOA-2026" className={errors.trackingNumber ? "border-red-400" : "bg-slate-50/50"} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Item Name *</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={form.itemName} onChange={e => setForm({...form, itemName: e.target.value})} placeholder="e.g. Nike Shoes" className={`pl-10 bg-slate-50/50 ${errors.itemName ? "border-red-400" : ""}`} />
                  </div>
                </div>
              </div>

              {/* --- NEW: PACKAGE WEIGHT SLIDER --- */}
              <div className="space-y-4 bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-primary" />
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Package Weight
                    </label>
                  </div>
                  <span className="text-sm font-black text-white bg-primary px-3 py-1 rounded-lg shadow-md shadow-primary/20">
                    {formatWeight(form.weight)}
                  </span>
                </div>
                
                <input 
                  type="range"
                  min="10"
                  max="2000"
                  step="10"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                
                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  <span>10g</span>
                  <span>1kg</span>
                  <span>2kg</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Recipient Name *</label>
                  <Input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} placeholder="e.g. Arjun Sharma" className={errors.customerName ? "border-red-400" : "bg-slate-50/50"} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Truck</label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                      value={form.carrier} 
                      onChange={e => setForm({...form, carrier: e.target.value})} 
                      className="w-full h-10 bg-slate-50/50 border rounded-md pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary border-input font-semibold text-primary"
                    >
                      {TRUCK_NAMES.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value={FALLBACK_TRUCK}>{FALLBACK_TRUCK}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} placeholder="+91 98xxx xxxxx" className={`pl-10 bg-slate-50/50 ${errors.customerPhone ? "border-red-400" : ""}`} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="email" value={form.customerEmail} onChange={e => setForm({...form, customerEmail: e.target.value})} placeholder="arjun@example.com" className={`pl-10 bg-slate-50/50 ${errors.customerEmail ? "border-red-400" : ""}`} />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-[1fr_2fr] gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">PIN Code *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={form.zipcode} onChange={e => setForm({...form, zipcode: e.target.value})} placeholder="403001" maxLength={6} className={`pl-10 bg-slate-50/50 font-mono ${errors.zipcode ? "border-red-400" : ""}`} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Address *</label>
                  <Input value={form.deliveryLocation} onChange={e => setForm({...form, deliveryLocation: e.target.value})} placeholder="City, Area, Goa" className={errors.deliveryLocation ? "border-red-400" : "bg-slate-50/50"} />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-base font-bold shadow-lg transition-all hover:scale-[1.01]">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle className="w-5 h-5 mr-2" />}
                Register Shipment
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {mode === "bulk" && (
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 shadow-none py-10">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5 border border-primary/20">
              <UploadCloud className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Upload Dataset</h3>
            <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
              Upload your .csv file. The system expects headers like <b>item_name</b>, <b>weight</b>, and <b>tracking_number</b>.
            </p>
            <input 
              type="file" accept=".csv" id="csv-upload" className="hidden" 
              onChange={handleBulkUpload} disabled={loading}
            />
            <label 
              htmlFor="csv-upload" 
              className={`bg-primary text-white px-8 py-3.5 rounded-xl font-bold cursor-pointer hover:bg-primary/90 transition-all shadow-lg flex items-center gap-2 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <FileText className="w-5 h-5" />}
              {loading ? "Syncing..." : "Select CSV File"}
            </label>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 text-center">
        <button onClick={onViewOrders} className="text-sm text-primary hover:underline font-bold">
          View all active shipments →
        </button>
      </div>
    </div>
  );
}