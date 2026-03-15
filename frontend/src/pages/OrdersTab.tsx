import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Added Button import
import { 
  Trash2, ChevronDown, ChevronUp, Lock, Search, Package, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AdminOrder, OrderStatus } from "./admin";

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  deleted: "bg-red-100 text-red-500 border-red-200",
  cancelled: "bg-red-100 text-red-500 border-red-200",
  in_transit: "bg-blue-100 text-blue-700 border-blue-200",
  out_for_delivery: "bg-violet-100 text-violet-700 border-violet-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATUS_LABELS: Record<string, string> = {
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
};

function StatusDropdown({ value, onChange, disabled }: { value: OrderStatus; onChange: (v: OrderStatus) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className={`relative flex justify-center ${open ? "z-50" : "z-10"}`}>
      <button 
        onClick={() => !disabled && setOpen(o => !o)} 
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all 
          ${STATUS_STYLES[value] || "bg-slate-100"} 
          ${!disabled ? "hover:shadow-md cursor-pointer active:scale-95" : "cursor-not-allowed opacity-80"}`}
      >
        {disabled && <Lock className="w-2.5 h-2.5 mr-0.5" />}
        {STATUS_LABELS[value] || value.charAt(0).toUpperCase() + value.slice(1)}
        {!disabled && (open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: -4, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-[100] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden min-w-[180px] p-2"
            >
              {ORDER_STATUSES.map(s => (
                <button 
                  key={s.value} 
                  onClick={() => { onChange(s.value); setOpen(false); }} 
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-bold text-slate-600 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors text-left"
                >
                  <div className={`w-2 h-2 rounded-full ${STATUS_STYLES[s.value]?.split(' ')[0]}`} />
                  {s.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrdersTab({
  orders,
  onUpdateStatus,
  onDeleteClick
}: {
  orders: AdminOrder[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onDeleteClick: (id: string, trackingNumber: string) => void;
}) {
  const [orderSearch, setOrderSearch] = useState("");
  
  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredOrders = orders.filter(o => 
    o.trackingNumber.toLowerCase().includes(orderSearch.toLowerCase()) || 
    o.customerName.toLowerCase().includes(orderSearch.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [orderSearch]);

  // --- PHYSICAL ARROW KEY NAVIGATION ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCurrentPage(p => Math.max(p - 1, 1));
      if (e.key === "ArrowRight") setCurrentPage(p => Math.min(p + 1, totalPages));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages]);

  return (
    <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
      <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={orderSearch} 
            onChange={e => setOrderSearch(e.target.value)} 
            placeholder="Search tracking or customer..." 
            className="pl-12 h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-primary/20 font-medium" 
          />
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl">
          {filteredOrders.length} Shipments In Network
        </div>
      </div>

      <div className="overflow-x-visible flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest font-black text-slate-400">
              <th className="px-8 py-5">Tracking ID</th>
              <th className="px-8 py-5">Customer</th>
              <th className="px-8 py-5 text-center">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {currentOrders.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-24 text-center">
                  <Package className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold text-sm">No active shipments found</p>
                </td>
              </tr>
            ) : (
              currentOrders.map(o => {
                const isFinalStatus = o.status === "delivered" || o.status === "cancelled";
                
                return (
                  <tr key={o.id} className="hover:bg-slate-50/30 transition-all duration-200 group">
                    <td className="px-8 py-6">
                      <p className="font-mono text-xs font-black text-blue-600 tracking-tighter uppercase">
                        {o.trackingNumber}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                        {o.orderName || "Standard Parcel"}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col justify-center">
                        <p className="font-black text-slate-900 text-sm leading-tight tracking-tight">
                          {o.customerName}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                          {o.customerPhone || o.customerEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <StatusDropdown 
                        value={o.status} 
                        onChange={v => onUpdateStatus(o.id, v)}
                        disabled={isFinalStatus} 
                      />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => onDeleteClick(o.id, o.trackingNumber)} 
                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90 group"
                      >
                        <Trash2 className="w-5 h-5 opacity-100"/>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION FOOTER --- */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between px-8 py-5 bg-white border-t border-slate-50">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Showing <span className="text-slate-900">{indexOfFirstItem + 1}</span> to{" "}
            <span className="text-slate-900">{Math.min(indexOfLastItem, filteredOrders.length)}</span> of{" "}
            <span className="text-slate-900">{filteredOrders.length}</span>
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