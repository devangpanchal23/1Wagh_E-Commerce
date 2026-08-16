import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, Zap, ArrowRight } from 'lucide-react';
import { fetchApi } from '../api';
import { ProductImage } from './ProductImage';

export function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchApi(`/products?search=${encodeURIComponent(query)}&limit=6`);
        if (res.success && res.data?.products) {
          setResults(res.data.products);
        }
      } catch (e) {
        console.error('Search error', e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-start pt-12 sm:pt-20 px-4 animate-fade-in overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 my-auto sm:my-0 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Top Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-3 bg-white shrink-0">
          <Search className="w-5 h-5 text-teal-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search WAGH products (e.g. 45W Charger, Power Bank)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full min-w-0 bg-transparent text-base sm:text-lg font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0 cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Search Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {loading && (
            <div className="py-8 text-center text-gray-500 font-medium flex items-center justify-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-teal-600 animate-bounce" />
              Searching WAGH catalog...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-base font-bold text-gray-900">No accessories found matching "{query}"</p>
              <p className="text-xs text-gray-500 mt-1">Try searching for "45W", "Power Bank", "Earbuds", or "Braided Cable"</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-mono-tag tracking-wider uppercase text-gray-400 font-bold px-1">Matching Products</p>
              {results.map((product) => (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  onClick={onClose}
                  className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-gray-50 cursor-pointer transition-all group border border-transparent hover:border-gray-100"
                >
                  <ProductImage
                    src={product.images}
                    alt={product.name}
                    variant="thumbnail"
                    className="w-12 h-12 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-teal-600 transition-colors truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{product.brand || 'WAGH'} · {product.specs?.outputPower || 'Premium Quality'}</p>
                  </div>
                  <div className="text-right font-mono-tag shrink-0">
                    <div className="font-bold text-teal-600 text-sm">₹{product.price}</div>
                    {product.mrp > product.price && (
                      <div className="text-[11px] text-gray-400 line-through">₹{product.mrp}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!query && (
            <div className="space-y-3">
              <p className="text-[11px] font-mono-tag tracking-wider uppercase text-gray-400 font-bold px-1">Popular Searches</p>
              <div className="flex flex-wrap gap-2 w-full max-w-full">
                {['45W Super Fast Charger', '20000mAh Power Bank', 'MagSafe Wireless', '100W Type-C Cable', 'ANC TWS Earbuds'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3.5 py-2 rounded-full bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 text-xs font-semibold text-gray-700 hover:text-teal-700 transition-all max-w-full text-left truncate cursor-pointer shadow-2xs"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
