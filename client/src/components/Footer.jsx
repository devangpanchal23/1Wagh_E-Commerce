import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Phone, Mail, Globe, MapPin, Instagram, Facebook, Twitter, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-wagh-dark text-white pt-16 pb-8 border-t border-gray-800 print:hidden no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          
          {/* Column 1: Brand Blurb */}
          <div className="space-y-4">
            <Link to="/" className="inline-block py-1">
              <img 
                src="/assets/branding/wagh-logo-2x.png" 
                alt="WAGH Mobile Accessories" 
                className="h-9 w-auto object-contain brightness-0 invert" 
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Power that feels premium. Speed you can trust. Engineered for high-speed charging, long-lasting endurance, and uncompromising device protection.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 hover:text-wagh-gold hover:bg-gray-700 transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 hover:text-wagh-gold hover:bg-gray-700 transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 hover:text-wagh-gold hover:bg-gray-700 transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Shop Links */}
          <div className="space-y-4">
            <h4 className="font-editorial text-lg font-bold text-wagh-gold">Quick Shop</h4>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li><Link to="/shop?category=chargers-adapters" className="hover:text-wagh-gold transition-colors">45W Super Fast Chargers</Link></li>
              <li><Link to="/shop?category=power-banks" className="hover:text-wagh-gold transition-colors">20,000mAh Power Banks</Link></li>
              <li><Link to="/shop?category=cables-connectors" className="hover:text-wagh-gold transition-colors">100W Braided Type-C Cables</Link></li>
              <li><Link to="/shop?category=audio-wireless" className="hover:text-wagh-gold transition-colors">ANC Wireless TWS Earbuds</Link></li>
              <li><Link to="/shop" className="hover:text-wagh-gold transition-colors">All Mobile Accessories</Link></li>
            </ul>
          </div>

          {/* Column 3: Customer Support */}
          <div className="space-y-4">
            <h4 className="font-editorial text-lg font-bold text-wagh-gold">Customer Care</h4>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li><Link to="/about" className="hover:text-wagh-gold transition-colors">About WAGH Brand</Link></li>
              <li><Link to="/contact" className="hover:text-wagh-gold transition-colors">Track Order & Support</Link></li>
              <li><Link to="/about#warranty" className="hover:text-wagh-gold transition-colors">6-Month Warranty Policy</Link></li>
              <li><Link to="/about#shipping" className="hover:text-wagh-gold transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/profile" className="hover:text-wagh-gold transition-colors">My Account</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div className="space-y-4">
            <h4 className="font-editorial text-lg font-bold text-wagh-gold">Direct Contact</h4>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-wagh-teal shrink-0 mt-0.5" />
                <span>+91 90544 05305</span>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-wagh-teal shrink-0 mt-0.5" />
                <span>www.waghonline.in</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-wagh-teal shrink-0 mt-0.5" />
                <span>waghonline9@gmail.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-wagh-teal shrink-0 mt-0.5" />
                <span>20-A, Daheri Faliyu, Opposite Jalaram Bungalows, Near Ideal Pre-School, Nana Varachha, Surat, Gujarat &ndash; 395010</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-mono-tag">
          <p>© {new Date().getFullYear()} WAGH Mobile Accessories. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-wagh-gold transition-colors">Privacy Policy</Link>
            <Link to="/about" className="hover:text-wagh-gold transition-colors">Terms of Service</Link>
            <Link to="/about" className="hover:text-wagh-gold transition-colors">Shipping Policy</Link>
            
            {/* Admin Dashboard Access Link */}
            <Link
              to="/admin"
              className="text-gray-600 hover:text-wagh-gold transition-colors opacity-40 hover:opacity-100 flex items-center gap-1"
              title="Admin Access"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
