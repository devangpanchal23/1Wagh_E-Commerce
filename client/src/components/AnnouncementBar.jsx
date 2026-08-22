import React from 'react';
import { Zap, Truck, ShieldCheck } from 'lucide-react';

export default function AnnouncementBar() {
  return (
    <div className="bg-wagh-teal text-white py-2 px-4 text-xs md:text-sm font-medium tracking-wide border-b border-wagh-teal-light/30 print:hidden no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2 text-wagh-gold">
          <Truck className="w-4 h-4" />
          <span>FREE EXPRESS SHIPPING ON ORDERS OVER ₹499</span>
        </div>
        <div className="flex-1 sm:flex-none text-center font-mono-tag tracking-wider text-white flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-wagh-gold fill-wagh-gold animate-pulse" />
          <span>⚡ Super Fast Charger 2.0 (45W PPS) — Now Live!</span>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-gray-200">
          <ShieldCheck className="w-4 h-4 text-wagh-gold" />
          <span>6 Months Replacement Warranty</span>
        </div>
      </div>
    </div>
  );
}
