import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, ShoppingBag, HelpCircle, Compass, Zap } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-wagh-bg">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        
        {/* Visual 404 Graphic Badge */}
        <div className="relative inline-block">
          <div className="absolute -inset-4 bg-gradient-to-r from-wagh-teal/30 to-wagh-gold/30 rounded-full blur-xl opacity-60" />
          <div className="relative bg-white rounded-3xl p-8 border border-wagh-border shadow-soft inline-flex flex-col items-center">
            <span className="font-editorial text-7xl sm:text-8xl font-black text-wagh-teal tracking-tighter">
              404
            </span>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wagh-gold/10 text-wagh-gold text-xs font-mono-tag font-bold uppercase tracking-widest border border-wagh-gold/30">
              <Compass className="w-3.5 h-3.5" />
              <span>Page Not Found</span>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-3 max-w-lg mx-auto">
          <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-wagh-dark tracking-tight">
            Lost your charge?
          </h1>
          <p className="text-wagh-muted text-sm sm:text-base leading-relaxed">
            The page you are looking for doesn't exist, may have been moved, or the link is no longer valid.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-wagh-teal text-white font-extrabold text-sm hover:bg-wagh-teal-dark transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <Link
            to="/shop"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-wagh-dark border border-wagh-border font-bold text-sm hover:bg-gray-50 hover:border-wagh-teal transition-all duration-200 shadow-sm cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-wagh-teal" />
            <span>Browse Products</span>
          </Link>
        </div>

        {/* Quick Help Links */}
        <div className="pt-8 border-t border-wagh-border/80 max-w-md mx-auto">
          <p className="text-xs font-mono-tag text-wagh-muted mb-3 font-semibold uppercase tracking-wider">
            Popular Destinations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono-tag">
            <Link
              to="/shop?category=chargers-adapters"
              className="text-wagh-teal hover:underline flex items-center gap-1 font-bold"
            >
              <Zap className="w-3.5 h-3.5 text-wagh-gold fill-wagh-gold" />
              <span>Chargers & Adapters</span>
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/contact"
              className="text-wagh-dark hover:text-wagh-teal hover:underline flex items-center gap-1 font-semibold"
            >
              <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
              <span>Customer Support</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default NotFound;
