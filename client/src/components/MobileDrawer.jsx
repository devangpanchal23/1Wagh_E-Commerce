import React from 'react';
import { Link } from 'react-router-dom';
import { X, Zap, ShoppingBag, User, ShieldAlert, Phone, Info, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export function MobileDrawer({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const { wishlist } = useWishlist();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-wagh-dark/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-wagh-bg shadow-2xl flex flex-col z-50 transform transition-transform duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-wagh-border flex items-center justify-between bg-wagh-teal text-white">
          <Link to="/" onClick={onClose}>
            <img 
              src="/assets/branding/wagh-logo-2x.png" 
              alt="WAGH Mobile Accessories" 
              className="h-8 w-auto object-contain brightness-0 invert" 
            />
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-mono-tag tracking-wider uppercase text-wagh-muted">Navigation</p>
            
            <Link
              to="/"
              onClick={onClose}
              className="block py-2.5 px-4 rounded-xl text-base font-semibold text-wagh-dark hover:bg-wagh-teal/10 hover:text-wagh-teal transition-colors"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={onClose}
              className="block py-2.5 px-4 rounded-xl text-base font-semibold text-wagh-dark hover:bg-wagh-teal/10 hover:text-wagh-teal transition-colors"
            >
              Shop All Accessories
            </Link>
            <Link
              to={user ? "/profile" : "/profile"}
              onClick={onClose}
              className="flex items-center justify-between py-2.5 px-4 rounded-xl text-base font-semibold text-wagh-dark hover:bg-wagh-teal/10 hover:text-wagh-teal transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-5 h-5 text-wagh-teal" />
                <span>Favorites / Saved</span>
              </div>
              {wishlist.length > 0 && (
                <span className="bg-wagh-gold text-wagh-dark text-xs font-bold font-mono-tag px-2 py-0.5 rounded-full">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              to="/about"
              onClick={onClose}
              className="block py-2.5 px-4 rounded-xl text-base font-semibold text-wagh-dark hover:bg-wagh-teal/10 hover:text-wagh-teal transition-colors"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              onClick={onClose}
              className="block py-2.5 px-4 rounded-xl text-base font-semibold text-wagh-dark hover:bg-wagh-teal/10 hover:text-wagh-teal transition-colors"
            >
              Contact Us
            </Link>
          </div>

          <hr className="border-wagh-border" />

          {/* Account Links */}
          <div className="space-y-3">
            <p className="text-xs font-mono-tag tracking-wider uppercase text-wagh-muted">Account</p>
            {user ? (
              <>
                <div className="px-4 py-2 bg-wagh-teal/5 rounded-xl border border-wagh-teal/20">
                  <p className="text-sm font-bold text-wagh-teal">{user.name}</p>
                  <p className="text-xs text-wagh-muted">{user.email}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="block py-2.5 px-4 rounded-xl text-base font-semibold text-wagh-dark hover:bg-wagh-teal/10 transition-colors"
                >
                  My Profile & Orders
                </Link>
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full text-left py-2.5 px-4 rounded-xl text-base font-semibold text-wagh-error hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/profile"
                onClick={onClose}
                className="block py-2.5 px-4 rounded-xl text-base font-semibold text-wagh-teal bg-wagh-teal/10 hover:bg-wagh-teal hover:text-white transition-all text-center"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-wagh-border bg-gray-50 text-center text-xs text-wagh-muted font-mono-tag">
          Support: +91 90544 05305
        </div>
      </div>
    </div>
  );
}
