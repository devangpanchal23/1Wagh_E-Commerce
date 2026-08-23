import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Sparkles, Cpu, CheckCircle2, ChevronRight } from 'lucide-react';
import { StatStrip } from '../components/StatStrip';
import { TrustStrip } from '../components/TrustStrip';
import { ProductCard } from '../components/ProductCard';
import { NewsletterBlock } from '../components/NewsletterBlock';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { fetchApi } from '../api';

export function Home() {
  const [collections, setCollections] = useState({ bestSellers: [], newArrivals: [], featured: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const res = await fetchApi('/products/collections/featured');
        if (res.success && res.data) {
          setCollections(res.data);
        }
      } catch (err) {
        console.error('Home collections error', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  return (
    <div className="space-y-12 pb-16">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-wagh-teal/10 via-wagh-bg to-wagh-bg pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-wagh-border/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Text */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-wagh-teal/10 text-wagh-teal font-mono-tag text-xs font-bold uppercase tracking-widest border border-wagh-teal/20">
              <Zap className="w-4 h-4 text-wagh-gold fill-wagh-gold" />
              <span>NEW Launching — 100 WATT SUPPORTED</span>
            </div>

            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-extrabold text-wagh-dark tracking-tight leading-[1.1]">
              Power that feels <span className="text-wagh-teal underline decoration-wagh-gold decoration-4 underline-offset-8">premium.</span>
              <br />
              100W Speed you can trust.
            </h1>

            <p className="text-wagh-dark/80 text-base sm:text-lg max-w-2xl leading-relaxed">
              Experience next-gen charging engineered with WAGH 100 Watt Supported Ultra-Fast Output, multi-layer heat management, and aerospace-grade build quality.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Link
                to="/shop?category=chargers-adapters"
                className="px-8 py-4 rounded-full bg-wagh-teal text-white font-extrabold text-sm sm:text-base hover:bg-wagh-teal-dark transition-all duration-300 shadow-lg hover:shadow-teal-glow flex items-center justify-center gap-3 group"
              >
                <span>Shop the 100W Adapter</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/shop"
                className="px-8 py-4 rounded-full bg-white text-wagh-dark border border-wagh-border font-bold text-sm sm:text-base hover:bg-gray-50 hover:border-wagh-teal transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Explore Collection</span>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="pt-6 flex flex-wrap items-center gap-6 text-xs font-mono-tag text-wagh-dark/80 border-t border-wagh-border/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-wagh-success" />
                <span>Samsung SFC 2.0 Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-wagh-success" />
                <span>6 Months Doorstep Warranty</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-wagh-success" />
                <span>Free Express Delivery</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image Card */}
          <div className="lg:col-span-5 relative w-full">
            <div className="absolute -inset-4 bg-gradient-to-r from-wagh-teal to-wagh-gold rounded-3xl opacity-20 blur-2xl transform -rotate-3" />
            <div className="relative bg-white rounded-3xl p-5 sm:p-6 lg:p-8 border border-wagh-border shadow-2xl space-y-5 sm:space-y-6">
              
              {/* Product Badge */}
              <div className="flex items-center justify-between">
                <span className="font-mono-tag text-xs font-bold text-wagh-gold bg-wagh-dark px-3 py-1 rounded-full uppercase tracking-wider">
                  ₹749 <span className="line-through text-gray-400 font-normal ml-1">₹1,499</span>
                </span>
                <span className="text-xs font-mono-tag font-semibold text-wagh-teal bg-wagh-teal/10 px-3 py-1 rounded-full">
                  50% OFF TODAY
                </span>
              </div>

              {/* Responsive Hero Banner Image Container */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-md group">
                <img
                  src="/assets/branding/wagh-100w-launch-banner.png"
                  alt="WAGH 100W Fast Charger New Launch Banner"
                  className="w-full h-full object-cover sm:object-contain group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                  width="800"
                  height="800"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>

              <div className="space-y-2">
                <h3 className="font-editorial text-xl sm:text-2xl font-bold text-wagh-dark">
                  WAGH 100W Super Fast Charger 2.0
                </h3>
                <p className="text-xs text-wagh-muted font-sans">
                  Engineered with 100W Supported Fast Charging & Braided Type-C Cable.
                </p>
              </div>

              <Link
                to="/shop?category=chargers-adapters"
                className="w-full py-3.5 rounded-full bg-wagh-teal hover:bg-wagh-teal-dark text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
              >
                <span>Buy 100W Adapter Now</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* STAT STRIP */}
      <StatStrip />

      {/* FEATURE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="font-mono-tag text-xs font-bold uppercase tracking-widest text-wagh-teal bg-wagh-teal/10 px-3 py-1 rounded-full">
            Engineering Excellence
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-extrabold text-wagh-dark">
            Why WAGH Outperforms Generic Chargers
          </h2>
          <p className="text-wagh-muted text-sm sm:text-base">
            Every WAGH accessory undergoes 48 hours of stress testing before leaving our facility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-wagh-teal text-wagh-gold flex items-center justify-center font-bold">
              <Zap className="w-6 h-6 fill-wagh-gold" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-wagh-dark">45W Super Fast 2.0</h3>
            <p className="text-sm text-wagh-muted leading-relaxed">
              True PPS fast charging protocol boosts phone battery to 65% in under 25 minutes with intelligent voltage matching.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-wagh-teal text-wagh-gold flex items-center justify-center font-bold">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-wagh-dark">Universal Fit</h3>
            <p className="text-sm text-wagh-muted leading-relaxed">
              Seamlessly powers Samsung, iPhone 15/16, Google Pixel, iPads, and Type-C laptops without needing separate bricks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-wagh-teal text-wagh-gold flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-wagh-dark">Multi-Protection</h3>
            <p className="text-sm text-wagh-muted leading-relaxed">
              10-layer smart safety guards against over-voltage, short-circuiting, high temperature spikes, and over-current.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-xl bg-wagh-teal text-wagh-gold flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-wagh-dark">Safety Assured</h3>
            <p className="text-sm text-wagh-muted leading-relaxed">
              BIS-Certified Indian plug standard with flame-retardant polycarbonate outer casing and anodized aluminum accent trim.
            </p>
          </div>
        </div>
      </section>

      {/* BEST SELLER CAROUSEL / GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="font-mono-tag text-xs font-bold uppercase tracking-widest text-wagh-gold bg-wagh-dark px-3 py-1 rounded-full">
              Customer Favorites
            </span>
            <h2 className="font-editorial text-3xl font-extrabold text-wagh-dark mt-2">
              Best Sellers Collection
            </h2>
          </div>
          <Link to="/shop" className="text-sm font-bold text-wagh-teal hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collections.bestSellers.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* WAGH ALL IN 1 2.0 FEATURED PRODUCT BANNER (Located after Best Selling Products) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-wagh-teal/15 via-white to-wagh-teal/10 text-wagh-dark rounded-3xl shadow-xl border border-wagh-teal/20 grid grid-cols-1 lg:grid-cols-12 items-center">
          
          {/* Subtle decorative background glows */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-wagh-teal/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-wagh-gold/10 rounded-full blur-3xl pointer-events-none" />

          <div className="lg:col-span-6 p-6 sm:p-10 space-y-5 text-left relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono-tag text-[11px] font-bold uppercase tracking-wider text-wagh-teal bg-wagh-teal/10 px-3 py-1 rounded-full border border-wagh-teal/20 shadow-2xs">
                FLAGSHIP FEATURED PRODUCT
              </span>
              <span className="font-mono-tag text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300/80 shadow-2xs">
                MADE IN INDIA 🇮🇳
              </span>
            </div>

            <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-wagh-dark tracking-tight">
              WAGH ALL IN 1 2.0 — <br />
              <span className="text-wagh-teal underline decoration-wagh-gold decoration-2 underline-offset-4">66W / 100W Flash Charger</span>
            </h2>

            <p className="text-wagh-dark/75 text-sm sm:text-base leading-relaxed max-w-lg">
              Ultra Super VOOC & PPS Smart Fast Charging Technology. Engineered with 100% higher charging efficiency than standard wall adapters.
            </p>

            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to="/shop?category=chargers-adapters"
                className="px-6 py-3 rounded-full bg-wagh-teal text-white font-extrabold text-xs sm:text-sm hover:bg-wagh-teal-dark transition-all duration-300 shadow-md hover:shadow-teal-glow hover:scale-105 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Shop ALL IN 1 2.0 Now</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="text-[11px] font-mono-tag text-wagh-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-wagh-teal animate-pulse" />
                <span>Model: ALL IN 1 2.0 | Max Output: 66/100W</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 p-6 sm:p-10 flex items-center justify-center relative z-10">
            <div className="relative group w-full max-w-lg aspect-square flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl p-4 border border-wagh-teal/20 shadow-lg">
              <div className="absolute -inset-2 bg-gradient-to-r from-wagh-teal/20 to-wagh-gold/20 rounded-3xl opacity-30 blur-xl group-hover:opacity-50 transition-opacity" />
              <img
                src="/assets/branding/wagh-all-in-one-packaging-banner.jpg"
                alt="WAGH ALL IN 1 2.0 66W 100W Flash Charger Box Packaging"
                className="w-full h-full object-contain rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-500 relative z-10"
              />
            </div>
          </div>

        </div>
      </section>

      {/* NEW ARRIVALS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="font-mono-tag text-xs font-bold uppercase tracking-widest text-wagh-teal bg-wagh-teal/10 px-3 py-1 rounded-full">
              Fresh Off the Line
            </span>
            <h2 className="font-editorial text-3xl font-extrabold text-wagh-dark mt-2">
              New Arrivals
            </h2>
          </div>
          <Link to="/shop" className="text-sm font-bold text-wagh-teal hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collections.newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* TRUST STRIP */}
      <TrustStrip />

      {/* NEWSLETTER */}
      <div className="max-w-7xl mx-auto px-4">
        <NewsletterBlock />
      </div>

    </div>
  );
}
