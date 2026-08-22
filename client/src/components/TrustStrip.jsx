import React from 'react';
import { Star, ShieldCheck, ShoppingBag, Clock } from 'lucide-react';

export function TrustStrip() {
  const trustPoints = [
    { icon: Star, text: '4.9★ Average Rating' },
    { icon: ShieldCheck, text: '6 Mo Replacement Warranty' },
    { icon: ShoppingBag, text: '1.2M+ Orders Fulfilled' },
    { icon: Clock, text: '48 Hr Express Dispatch' },
  ];

  return (
    <div className="bg-wagh-teal/5 border-y border-wagh-teal/15 py-6 my-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {trustPoints.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center justify-center gap-2.5 text-wagh-teal font-bold text-sm sm:text-base">
                <Icon className="w-5 h-5 text-wagh-gold fill-wagh-gold shrink-0" />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
