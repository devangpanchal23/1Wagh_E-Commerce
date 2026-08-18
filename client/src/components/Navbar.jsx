import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, User, Heart, Menu } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export function Navbar({ onOpenSearch, onOpenMobileDrawer, onOpenAuthModal }) {
  const { totalItemCount } = useCart();
  const { user, isSignedIn } = useAuth();
  const { wishlist } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const handleProfileClick = (e) => {
    if (!user) {
      e.preventDefault();
      if (onOpenAuthModal) onOpenAuthModal();
    }
  };


  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 print:hidden no-print ${scrolled ? 'glass-nav shadow-md border-b border-wagh-border/60 py-3' : 'bg-wagh-bg py-4 border-b border-wagh-border/40'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left Mobile Menu Toggle + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileDrawer}
            className="lg:hidden p-2 rounded-xl text-wagh-dark hover:bg-wagh-teal/10 transition-colors focus:outline-none"
            aria-label="Open Mobile Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/" className="flex items-center group py-1">
            <img 
              src="/assets/branding/wagh-logo-2x.png" 
              alt="WAGH Mobile Accessories" 
              className="h-8 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform" 
            />
          </Link>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-semibold tracking-wide transition-all relative py-1 ${
                  isActive ? 'text-wagh-teal' : 'text-wagh-dark/80 hover:text-wagh-teal'
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-wagh-gold rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Icon Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2.5 rounded-full text-wagh-dark/80 hover:text-wagh-teal hover:bg-wagh-teal/10 transition-colors"
            aria-label="Search"
            title="Search products"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist / Favorites */}
          <Link
            to={user ? "/profile" : "#"}
            onClick={handleProfileClick}
            className="flex p-2.5 rounded-full text-wagh-dark/80 hover:text-wagh-teal hover:bg-wagh-teal/10 transition-colors relative"
            title="Saved items"
            aria-label="Favorites"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-wagh-gold" />
            )}
          </Link>

          {/* Profile / Sign In button */}
          {!isSignedIn ? (
            <button
              onClick={onOpenAuthModal}
              className="p-2.5 rounded-full text-wagh-dark/80 hover:text-wagh-teal hover:bg-wagh-teal/10 transition-colors flex items-center gap-1 cursor-pointer"
              title="Sign In"
            >
              <User className="w-5 h-5" />
              <span className="hidden md:inline text-xs font-semibold text-wagh-dark/80 hover:text-wagh-teal">
                Sign In
              </span>
            </button>
          ) : (
            <Link
              to="/profile"
              className="p-2.5 rounded-full text-wagh-teal bg-teal-50 hover:bg-teal-100 transition-colors flex items-center gap-1.5 border border-teal-200"
              title="My Account & Profile"
            >
              <User className="w-5 h-5 text-wagh-teal" />
              <span className="hidden md:inline text-xs font-bold text-wagh-teal max-w-[100px] truncate">
                {user?.displayName || user?.name || 'Account'}
              </span>
            </Link>
          )}

          {/* Cart Icon with Live Badge */}
          <Link
            to="/cart"
            className="p-2.5 rounded-full bg-wagh-teal text-white hover:bg-wagh-teal-dark transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 relative"
            aria-label="Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-mono-tag font-bold text-xs bg-wagh-gold text-wagh-dark px-2 py-0.5 rounded-full">
              {totalItemCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
