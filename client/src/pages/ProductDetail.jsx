import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Zap, ShieldCheck, Truck, RefreshCw, Heart, ChevronRight, ChevronLeft, Star, Check, Ruler, CheckCircle, Maximize2, X } from 'lucide-react';
import { RatingStars } from '../components/RatingStars';
import { ProductCard } from '../components/ProductCard';
import { ProductImage } from '../components/ProductImage';
import { fetchApi } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

// Formatted Multi-Line & Bullet Text Component
function FormattedText({ text, title = null, className = '' }) {
  if (!text) return null;

  const rawLines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(
      (l) =>
        Boolean(l) &&
        !['product details', 'product detail', 'product specifications', 'details'].includes(l.toLowerCase())
    );

  if (rawLines.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <h4 className="font-editorial text-xl font-bold text-slate-900 mb-3">
          {title}
        </h4>
      )}
      <ul className="space-y-3 pl-1">
        {rawLines.map((line, idx) => {
          const cleanLine = line.replace(/^([•\-*▪]|(\d+[\.\)]))\s*/, '');

          return (
            <li
              key={idx}
              className="flex items-start gap-3 text-slate-600 text-sm sm:text-base leading-relaxed font-sans"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0 mt-2.5" />
              <span className="flex-1 break-words">{cleanLine}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Helper function to extract only specs added by admin (no hardcoded fallbacks)
function getValidAdminSpecs(product) {
  if (!product?.specs || typeof product.specs !== 'object') return [];

  const specLabelMap = {
    outputPower: 'OUTPUT POWER',
    dimensions: 'SIZE & DIMENSIONS',
    size: 'SIZE',
    warranty: 'WARRANTY',
    compatibility: 'COMPATIBILITY',
    cableLength: 'CABLE LENGTH',
    height: 'HEIGHT',
    width: 'WIDTH',
    color: 'COLOR',
    material: 'MATERIAL',
  };

  const valid = [];
  const keys = Object.keys(product.specs);

  for (const key of keys) {
    const rawVal = product.specs[key];
    if (typeof rawVal === 'string' && rawVal.trim() !== '') {
      const val = rawVal.trim();
      // Skip redundant size if dimensions is already present
      if (key === 'size' && product.specs.dimensions && product.specs.dimensions.trim() !== '') {
        continue;
      }
      const label = specLabelMap[key] || key.replace(/([A-Z])/g, ' $1').toUpperCase();
      valid.push({
        key,
        label,
        value: val,
        isLong: val.length > 40 || val.includes('\n'),
      });
    }
  }

  return valid;
}



export function ProductDetail() {

  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'specifications' | 'reviews'
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight' && product?.images?.length) {
        setSelectedImage((prev) => (prev + 1) % product.images.length);
      }
      if (e.key === 'ArrowLeft' && product?.images?.length) {
        setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, product?.images?.length]);

  // New review form
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const loadProductAndRelated = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchApi(`/products/${id}`);
        if (res && res.data) {
          setProduct(res.data);
          setSelectedImage(0);

          // Fetch reviews
          const revRes = await fetchApi(`/products/${id}/reviews`);
          if (revRes && revRes.data) {
            setReviews(Array.isArray(revRes.data) ? revRes.data : (revRes.data.reviews || []));
          }

          // Fetch related products
          if (res.data.category) {
            const catId = typeof res.data.category === 'object' ? res.data.category._id : res.data.category;
            const relRes = await fetchApi(`/products?category=${catId}&limit=5`);
            if (relRes && relRes.data) {
              const relList = Array.isArray(relRes.data)
                ? relRes.data
                : (relRes.data.products || []);
              setRelatedProducts(relList.filter(p => String(p._id) !== String(id)));
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    loadProductAndRelated();
    window.scrollTo(0, 0);
  }, [id]);

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, qty);
      navigate('/cart');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      addToast('Please log in to leave a review', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetchApi(`/products/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });
      if (res && res.success) {
        addToast('Review submitted successfully!', 'success');
        setNewComment('');
        const revRes = await fetchApi(`/products/${id}/reviews`);
        if (revRes && revRes.data) setReviews(revRes.data);
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-wagh-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-mono-tag text-xs uppercase tracking-wider text-wagh-muted">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-editorial text-2xl font-bold text-wagh-dark">Product Not Found</h2>
        <p className="text-wagh-muted text-sm">{error || 'The requested item could not be retrieved.'}</p>
        <Link to="/shop" className="inline-block px-6 py-2.5 rounded-full bg-wagh-teal text-white font-bold text-xs">
          Return to Shop
        </Link>
      </div>
    );
  }

  const isLiked = isInWishlist(product._id);
  const discountPercent = product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs font-mono-tag text-wagh-muted uppercase tracking-wider">
        <Link to="/" className="hover:text-wagh-teal">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/shop" className="hover:text-wagh-teal">Shop</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-wagh-dark font-bold truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* PRODUCT MAIN HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* IMAGE GALLERY WITH NORMALIZE 1:1 THUMBNAILS & LIGHTBOX */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Hero Image Container with Zoom Trigger */}
          <div
            onClick={() => setLightboxOpen(true)}
            className="relative cursor-zoom-in group rounded-3xl overflow-hidden border border-slate-200/60 bg-white shadow-2xs"
            title="Click to view fullscreen"
          >
            <ProductImage
              src={product.images?.[selectedImage] || product.images}
              alt={product.name}
              variant="detail"
              className="w-full h-full border-0 p-0"
            />

            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-wagh-gold text-wagh-dark font-mono-tag font-bold text-xs shadow-md z-20">
                {discountPercent}% OFF
              </span>
            )}

            {/* Expand / Lightbox Trigger Button Badge */}
            <div className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-md text-slate-700 opacity-80 group-hover:opacity-100 transition-all duration-200 group-hover:scale-110 group-hover:bg-wagh-teal group-hover:text-white z-20">
              <Maximize2 className="w-4 h-4" />
            </div>

            <div className="absolute bottom-3 right-4 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-xs text-white font-mono-tag text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
              Click to Expand
            </div>
          </div>

          {/* Normalized 1:1 Aspect Ratio Thumbnail Switcher Strip */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.images.map((img, idx) => {
                const isSelected = selectedImage === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer p-0 bg-white ${
                      isSelected
                        ? 'border-2 border-wagh-teal ring-2 ring-wagh-teal/20 shadow-xs scale-105 z-10'
                        : 'border border-slate-200/60 hover:border-slate-300 hover:opacity-90'
                    }`}
                    title={`View Image ${idx + 1}`}
                  >
                    <ProductImage
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      variant="thumbnail"
                      className="w-full h-full p-0 border-0 rounded-xl"
                    />
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* FULLSCREEN LIGHTBOX VIEWER MODAL */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Top Header Controls */}
            <div
              className="flex items-center justify-between text-white font-mono-tag text-xs sm:text-sm z-10 max-w-7xl w-full mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-700/80">
                <span className="font-bold text-wagh-teal">{selectedImage + 1}</span>
                <span className="text-slate-400">/</span>
                <span>{product.images?.length || 1}</span>
                <span className="text-slate-400 font-normal ml-2 hidden sm:inline">{product.name}</span>
              </div>

              <button
                onClick={() => setLightboxOpen(false)}
                className="p-2.5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white transition-colors border border-slate-700/80 cursor-pointer shadow-lg"
                title="Close Lightbox (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Center Image Stage with Left / Right Navigation */}
            <div
              className="relative flex-1 flex items-center justify-center p-2 sm:p-4 my-auto w-full max-w-7xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {product.images?.length > 1 && (
                <button
                  onClick={() => setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length)}
                  className="absolute left-2 sm:left-6 z-30 p-3 rounded-full bg-slate-900/90 hover:bg-wagh-teal text-white transition-all border border-slate-700/80 hover:scale-110 shadow-2xl cursor-pointer"
                  title="Previous Image (Left Arrow)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <div className="max-w-4xl max-h-[75vh] flex items-center justify-center p-2 sm:p-4 rounded-3xl bg-white shadow-2xl border border-slate-800 overflow-hidden">
                <ProductImage
                  src={product.images?.[selectedImage] || product.images}
                  alt={`${product.name} Fullscreen`}
                  variant="detail"
                  className="max-h-[70vh] max-w-full border-0 p-0 shadow-none"
                />
              </div>

              {product.images?.length > 1 && (
                <button
                  onClick={() => setSelectedImage((prev) => (prev + 1) % product.images.length)}
                  className="absolute right-2 sm:right-6 z-30 p-3 rounded-full bg-slate-900/90 hover:bg-wagh-teal text-white transition-all border border-slate-700/80 hover:scale-110 shadow-2xl cursor-pointer"
                  title="Next Image (Right Arrow)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Lightbox Thumbnail Selector Strip */}
            {product.images && product.images.length > 1 && (
              <div
                className="flex items-center justify-center gap-3 overflow-x-auto py-2 z-10 custom-scrollbar max-w-7xl w-full mx-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {product.images.map((img, idx) => {
                  const isSelected = selectedImage === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer shrink-0 border-2 bg-white ${
                        isSelected
                          ? 'border-wagh-teal ring-2 ring-wagh-teal/50 scale-105 shadow-md'
                          : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                      }`}
                    >
                      <ProductImage src={img} alt={`Thumbnail ${idx + 1}`} variant="thumbnail" className="w-full h-full p-1 border-0 rounded-none bg-white" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PRODUCT SUMMARY & BUY ACTIONS */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2.5">
            <span className="inline-block font-mono-tag text-[10px] font-bold uppercase tracking-widest text-[#0f4b3f] bg-[#0f4b3f]/10 px-3 py-1 rounded-md border border-[#0f4b3f]/15">
              {product.brand || 'WAGH'}
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 pt-0.5">
              <RatingStars rating={product.ratingAvg || 4.8} count={product.ratingCount || 24} />
            </div>
          </div>

          {/* Price Block */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-baseline gap-3">
              <span className="font-mono-tag text-3xl font-extrabold text-[#0f4b3f]">
                ₹{product.price}
              </span>
              {product.mrp > product.price && (
                <span className="font-mono-tag text-sm text-slate-400 line-through font-medium">
                  MRP ₹{product.mrp}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider font-mono-tag">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
            <span className="font-mono-tag text-xs font-bold text-[#0f4b3f] ml-auto">
              Inclusive of all taxes
            </span>
          </div>

          {/* Quick Spec Highlights (Adaptive Layout: Short badges side-by-side, Long content full width) */}
          {(() => {
            const validSpecs = getValidAdminSpecs(product);
            if (validSpecs.length === 0) return null;

            const shortSpecs = validSpecs.filter((s) => !s.isLong);
            const longSpecs = validSpecs.filter((s) => s.isLong);

            return (
              <div className="space-y-3 pt-1">
                {/* Short specs in adaptive flex/grid with compact items-start height */}
                {shortSpecs.length > 0 && (
                  <div
                    className={`grid gap-3 items-start ${
                      shortSpecs.length === 1
                        ? 'grid-cols-1'
                        : shortSpecs.length === 2
                        ? 'grid-cols-1 sm:grid-cols-2'
                        : 'grid-cols-1 sm:grid-cols-3'
                    }`}
                  >
                    {shortSpecs.map((spec) => {
                      const isDimension = spec.key.toLowerCase().includes('dimension') || spec.key.toLowerCase().includes('size');
                      const isWarranty = spec.key.toLowerCase().includes('warranty');

                      return (
                        <div
                          key={spec.key}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-[#0f4b3f]/30 transition-all flex flex-col justify-center h-auto min-h-[74px]"
                        >
                          <span className="font-mono-tag text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            {isDimension ? (
                              <Ruler className="w-3 h-3 text-[#0f4b3f] shrink-0" />
                            ) : isWarranty ? (
                              <ShieldCheck className="w-3 h-3 text-[#0f4b3f] shrink-0" />
                            ) : (
                              <Zap className="w-3 h-3 text-[#0f4b3f] shrink-0" />
                            )}
                            <span>{spec.label}</span>
                          </span>
                          <span className="font-mono-tag font-bold text-[#0f4b3f] text-xs sm:text-sm leading-snug break-words">
                            {spec.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Long specs span full-width underneath cleanly without stretching short cards */}
                {longSpecs.map((spec) => {
                  const isWarranty = spec.key.toLowerCase().includes('warranty');

                  return (
                    <div
                      key={spec.key}
                      className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 shadow-2xs hover:border-[#0f4b3f]/30 transition-all space-y-1.5"
                    >
                      <span className="font-mono-tag text-slate-500 block text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        {isWarranty ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#0f4b3f] shrink-0" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 text-[#0f4b3f] shrink-0" />
                        )}
                        <span>{spec.label}</span>
                      </span>
                      <p className="font-mono-tag font-semibold text-slate-800 text-xs sm:text-sm leading-relaxed break-words">
                        {spec.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Quantity Stepper & Wishlist */}
          <div className="flex items-center gap-4 pt-1">
            <span className="font-mono-tag text-xs font-bold uppercase text-slate-400 tracking-wider">QUANTITY</span>
            
            <div className="flex items-center rounded-2xl border border-slate-200/80 bg-white p-1 shadow-2xs">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold font-mono-tag text-sm transition-colors cursor-pointer"
                title="Decrease quantity"
              >
                -
              </button>
              <span className="w-10 text-center font-mono-tag font-bold text-sm text-slate-900">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold font-mono-tag text-sm transition-colors cursor-pointer"
                title="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              onClick={() => toggleWishlist(product)}
              className={`w-10 h-10 flex items-center justify-center rounded-2xl border transition-all shadow-2xs cursor-pointer ${
                isLiked
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200/80 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50'
              }`}
              title={isLiked ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
            </button>
          </div>

          {/* Add to Cart & Buy Now Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <button
              onClick={() => addToCart(product, qty)}
              className="py-4 px-6 rounded-2xl bg-[#0f4b3f] hover:bg-[#0a352c] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="py-4 px-6 rounded-2xl bg-[#d4a34b] hover:bg-[#c3923a] text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-slate-950" />
              <span>Buy Now</span>
            </button>
          </div>


          {/* Trust Guarantees */}
          <div className="space-y-3 pt-4 border-t border-wagh-border text-xs text-wagh-dark">
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-wagh-teal" />
              <span><strong>Free Express Delivery</strong> on orders over ₹499. Dispatched within 24 hours.</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-wagh-teal" />
              <span><strong>24 Months Replacement Warranty</strong> with doorstep pickup support.</span>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-wagh-teal" />
              <span><strong>7 Days Easy Replacement Policy</strong> if damaged or defective.</span>
            </div>
          </div>

        </div>
      </div>

      {/* TABS SECTION: Description / Specifications / Features / Reviews */}
      {(() => {
        const sectionsList = product?.sections?.filter(Boolean) || [];

        const specSections = sectionsList.filter(s =>
          s.type === 'specifications' || s.type === 'table' || /spec|technical|dimension|size/i.test(s.title || '')
        );

        const featureSections = sectionsList.filter(s =>
          s.type === 'keyFeatures' || s.type === 'list' || /feature|benefit|highlight/i.test(s.title || '')
        );

        const textOverviewSections = sectionsList.filter(s =>
          s.type === 'details' || s.type === 'text' || /overview|description|about/i.test(s.title || '')
        );


        const hasFeatures = featureSections.length > 0 || sectionsList.length === 0;

        const tabs = [
          { id: 'description', label: 'Description' },
          { id: 'specifications', label: 'Specifications' },
          ...(hasFeatures ? [{ id: 'features', label: 'Key Features' }] : []),
          { id: 'reviews', label: `Customer Reviews (${reviews.length})` },
        ];

        return (
          <div className="bg-white rounded-3xl border border-wagh-border shadow-soft overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-wagh-border bg-gray-50/80 px-6 overflow-x-auto">
              {tabs.map((tabObj) => (
                <button
                  key={tabObj.id}
                  onClick={() => setActiveTab(tabObj.id)}
                  className={`py-4 px-6 font-mono-tag text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTab === tabObj.id
                      ? 'border-wagh-teal text-wagh-teal bg-white'
                      : 'border-transparent text-wagh-muted hover:text-wagh-dark'
                  }`}
                >
                  {tabObj.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 sm:p-8">
              {/* TAB 1: DESCRIPTION */}
              {activeTab === 'description' && (
                <div className="space-y-6 text-wagh-dark text-sm sm:text-base leading-relaxed">
                  <FormattedText text={product.description} />
                  
                  {textOverviewSections.filter((sec) => sec && sec.content && sec.content.trim() !== '').length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      {textOverviewSections
                        .filter((sec) => sec && sec.content && sec.content.trim() !== '')
                        .map((sec, sIdx) => (
                          <div key={sIdx} className="space-y-2">
                            {sec.title && sec.title.trim() !== '' && (
                              <h4 className="font-editorial text-lg font-bold text-wagh-dark">{sec.title}</h4>
                            )}
                            <FormattedText text={sec.content} className="text-slate-600 text-sm" />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}


              {/* TAB 2: SPECIFICATIONS */}
              {activeTab === 'specifications' && (
                <div className="space-y-6">
                  {/* Dynamic Product Specifications (Only show specs added by admin) */}
                  {(() => {
                    const validSpecs = getValidAdminSpecs(product);
                    if (validSpecs.length > 0) {
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {validSpecs.map((spec) => (
                            <div
                              key={spec.key}
                              className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-5 py-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-wagh-teal/30 transition-all gap-1.5 sm:gap-4"
                            >
                              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] font-mono-tag shrink-0">
                                {spec.label}
                              </span>
                              <span className="font-bold text-slate-800 text-xs sm:text-sm font-mono-tag text-left sm:text-right break-words flex-1">
                                {spec.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    } else if (specSections.length === 0) {
                      return (
                        <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-slate-500 font-mono-tag text-xs">
                          No technical specifications listed for this product.
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Custom Structured Specification Tables (If Added) */}
                  {specSections.length > 0 && (
                    <div className="space-y-6 pt-4 border-t border-slate-100">
                      {specSections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-3">
                          <h4 className="font-editorial text-lg font-bold text-wagh-dark flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-wagh-teal"></span>
                            <span>{section?.title || 'Additional Specifications'}</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {section?.items?.filter(Boolean).map((item, iIdx) => (
                              <div
                                key={iIdx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-1.5 sm:gap-4"
                              >
                                <span className="font-mono-tag uppercase text-wagh-muted font-bold text-[10px] sm:text-[11px] shrink-0">
                                  {item?.label || 'Spec'}
                                </span>
                                <span className="font-bold text-wagh-dark text-xs sm:text-sm font-mono-tag text-left sm:text-right break-words">
                                  {item?.value || 'Details'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}


              {/* TAB 3: KEY FEATURES */}
              {activeTab === 'features' && (
                <div className="space-y-6">
                  {featureSections.length > 0 ? (
                    <div className="space-y-6">
                      {featureSections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-3">
                          <h4 className="font-editorial text-xl font-bold text-slate-900 mb-3">
                            {section?.title || 'Product Highlights'}
                          </h4>
                          <ul className="space-y-3 pl-1">
                            {section?.items?.filter(Boolean).map((item, iIdx) => {
                              const itemText = item.value
                                ? item.label && item.label.toLowerCase() !== 'feature' && item.label.toLowerCase() !== 'spec'
                                  ? `${item.label}: ${item.value}`
                                  : item.value
                                : item.label;

                              return (
                                <li
                                  key={iIdx}
                                  className="flex items-start gap-3 text-slate-600 text-sm sm:text-base leading-relaxed font-sans"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0 mt-2.5" />
                                  <span className="flex-1 break-words">{itemText}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <FormattedText text={product.description} title="Product Highlights" />
                    </div>
                  )}
                </div>
              )}


              {/* TAB 4: REVIEWS */}
              {activeTab === 'reviews' && (
                <div className="space-y-8">
                  {/* Submit Review Form */}
                  <div className="bg-wagh-teal/5 p-6 rounded-2xl border border-wagh-teal/20 space-y-4">
                    <h4 className="font-editorial text-xl font-bold text-wagh-teal">Write a Customer Review</h4>
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">Your Rating</label>
                        <RatingStars rating={newRating} interactive={true} onRatingChange={(r) => setNewRating(r)} />
                      </div>
                      <div>
                        <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">Your Review</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Share your experience with this product..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="w-full p-3 rounded-xl border border-wagh-border text-sm focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-6 py-2.5 rounded-full bg-wagh-teal text-white font-bold text-xs hover:bg-wagh-teal-dark transition-colors"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>

                  {/* Review List */}
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <p className="text-sm text-wagh-muted">No reviews yet. Be the first to review this product!</p>
                    ) : (
                      reviews.map((rev) => (
                        <div key={rev._id} className="p-4 rounded-xl border border-wagh-border space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-wagh-dark">{rev.userName}</span>
                            <span className="text-xs font-mono-tag text-wagh-muted">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <RatingStars rating={rev.rating} />
                          <p className="text-sm text-wagh-dark/80 leading-relaxed">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-4">
          <h2 className="font-editorial text-2xl font-bold text-wagh-dark">Related Accessories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
