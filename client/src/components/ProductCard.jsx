import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Eye, Zap } from 'lucide-react';
import { RatingStars } from './RatingStars';
import { ProductImage } from './ProductImage';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();

  const isLiked = isInWishlist(product._id);
  const discountPercent = product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <div className="group bg-white rounded-xl border border-wagh-border p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-soft-hover hover:-translate-y-1.5 relative overflow-hidden w-full max-w-full">
      
      {/* Badges & Wishlist Trigger */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          {product.isBestSeller && (
            <span className="px-2 py-0.5 rounded-full bg-wagh-teal text-white text-[10px] font-mono-tag font-bold tracking-wider uppercase shadow-xs">
              Best Seller
            </span>
          )}
          {product.isNewArrival && (
            <span className="px-2 py-0.5 rounded-full bg-wagh-gold text-wagh-dark text-[10px] font-mono-tag font-bold tracking-wider uppercase shadow-xs">
              New
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-wagh-error text-[10px] font-mono-tag font-bold">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        <button
          onClick={() => toggleWishlist(product)}
          className={`p-2 rounded-full transition-colors shrink-0 ${
            isLiked
              ? 'bg-red-50 text-wagh-error'
              : 'bg-gray-100/80 text-gray-500 hover:text-wagh-error hover:bg-red-50'
          }`}
          title="Save to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-wagh-error' : ''}`} />
        </button>
      </div>

      {/* Product Image */}
      <Link to={`/product/${product._id}`} className="block relative my-4">
        <ProductImage
          src={product.images}
          alt={product.name}
          variant="card"
          imgClassName="group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      {/* Details */}
      <div className="space-y-2 flex-1 flex flex-col justify-between min-w-0 w-full">
        <div className="min-w-0 w-full">
          <div className="text-[11px] font-mono-tag uppercase tracking-wider text-wagh-muted font-semibold truncate">
            {product.brand || 'WAGH'}
          </div>
          <Link to={`/product/${product._id}`} className="block min-w-0 w-full">
            <h3 className="font-editorial text-sm sm:text-base font-bold text-wagh-dark group-hover:text-wagh-teal transition-colors line-clamp-2 leading-snug break-words max-w-full overflow-hidden">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Rating Stars */}
        <RatingStars rating={product.ratingAvg || 4.8} count={product.ratingCount || 24} />

        {/* Price & Add to Cart button */}
        <div className="pt-2 flex items-center justify-between border-t border-wagh-border/60">
          <div className="flex flex-col">
            <div className="font-mono-tag font-bold text-lg text-wagh-teal">
              ₹{product.price}
            </div>
            {product.mrp > product.price && (
              <div className="font-mono-tag text-xs text-wagh-muted line-through">
                ₹{product.mrp}
              </div>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            className="px-3 py-2 rounded-xl bg-wagh-teal text-white text-xs font-semibold hover:bg-wagh-teal-dark transition-all duration-200 flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
