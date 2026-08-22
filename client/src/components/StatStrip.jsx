import React from 'react';
import { Zap, ShieldCheck, Users, Award } from 'lucide-react';

export function StatStrip() {
  const stats = [
    {
      icon: Zap,
      number: '45W',
      label: 'Super Fast Output',
      sublabel: 'Samsung SFC 2.0 PPS protocol',
    },
    {
      icon: ShieldCheck,
      number: '100%',
      label: 'Original WAGH Gear',
      sublabel: 'Tested with multi-protection',
    },
    {
      icon: Users,
      number: '1.2M+',
      label: 'Happy Customers',
      sublabel: 'Delivered nationwide in India',
    },
    {
      icon: Award,
      number: '6 Mo',
      label: 'Hassle-Free Warranty',
      sublabel: 'Doorstep replacement policy',
    },
  ];

  return (
    <section className="my-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft hover:shadow-soft-hover transition-all duration-300 flex flex-col items-center text-center group hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-wagh-teal/10 text-wagh-teal flex items-center justify-center mb-3 group-hover:bg-wagh-teal group-hover:text-wagh-gold transition-colors duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="font-mono-tag font-extrabold text-2xl md:text-3xl text-wagh-teal">
                  {stat.number}
                </div>
                <div className="font-bold text-sm text-wagh-dark mt-1">
                  {stat.label}
                </div>
                <div className="text-xs text-wagh-muted mt-0.5">
                  {stat.sublabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
