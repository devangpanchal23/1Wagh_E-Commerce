import React from 'react';
import { Zap, ShieldCheck, Cpu, Award, Truck, CheckCircle2 } from 'lucide-react';
import { StatStrip } from '../components/StatStrip';
import { TrustStrip } from '../components/TrustStrip';

export function About() {
  return (
    <div className="space-y-16 pb-16">
      
      {/* HERO SECTION */}
      <section className="bg-wagh-teal text-white py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="font-mono-tag text-xs font-bold uppercase tracking-widest text-wagh-gold bg-wagh-gold/20 px-4 py-1.5 rounded-full border border-wagh-gold/30">
            About WAGH Mobile Accessories
          </span>

          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
            Power that feels premium. <br />
            <span className="text-wagh-gold italic">Speed you can trust.</span>
          </h1>

          <p className="text-gray-200 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            We started WAGH with a single mission: to end the era of cheap, slow, overheating mobile accessories and replace them with high-efficiency, precision-engineered power gear.
          </p>
        </div>
      </section>

      {/* BRAND STORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <span className="font-mono-tag text-xs font-bold uppercase tracking-wider text-wagh-teal bg-wagh-teal/10 px-3 py-1 rounded-full">
              Our Journey
            </span>

            <h2 className="font-editorial text-3xl sm:text-4xl font-extrabold text-wagh-dark leading-tight">
              Engineered in India for the modern fast-paced lifestyle.
            </h2>

            <p className="text-wagh-dark/80 text-sm sm:text-base leading-relaxed">
              In 2024, our founding engineering team noticed a gap in the market: smartphone battery tech was advancing rapidly with 45W and 65W charging standards, but off-the-shelf chargers were prone to overheating, voltage drops, and premature cable wear.
            </p>

            <p className="text-wagh-dark/80 text-sm sm:text-base leading-relaxed">
              WAGH was born to solve this. Every charger, power bank, and braided cable we design is crafted using GaN semiconductor tech, multi-layer heat dissipation, and double-woven nylon armor.
            </p>
          </div>

          <div className="lg:col-span-6 bg-white p-8 rounded-3xl border border-wagh-border shadow-soft space-y-6">
            <h3 className="font-editorial text-2xl font-bold text-wagh-dark border-b border-wagh-border pb-3">
              The 3 WAGH Pillars
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-wagh-teal text-wagh-gold flex items-center justify-center font-bold shrink-0 mt-1">
                  <Zap className="w-5 h-5 fill-wagh-gold" />
                </div>
                <div>
                  <h4 className="font-bold text-wagh-dark text-base">Unmatched Charging Speed</h4>
                  <p className="text-xs text-wagh-muted leading-relaxed">
                    Full PPS protocol support delivering true 45W and 65W charging output.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-wagh-teal text-wagh-gold flex items-center justify-center font-bold shrink-0 mt-1">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-wagh-dark text-base">Zero-Failure Safety</h4>
                  <p className="text-xs text-wagh-muted leading-relaxed">
                    10-layer safety protective circuit preventing overvoltage, short circuits, and thermal spikes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-wagh-teal text-wagh-gold flex items-center justify-center font-bold shrink-0 mt-1">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-wagh-dark text-base">6-Month Doorstep Warranty</h4>
                  <p className="text-xs text-wagh-muted leading-relaxed">
                    If anything breaks within 6 months, we replace it directly at your doorstep without hassle.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* STAT STRIP */}
      <StatStrip />

      {/* TRUST STRIP */}
      <TrustStrip />

    </div>
  );
}
