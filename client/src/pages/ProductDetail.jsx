import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Zap, ShieldCheck, Truck, RefreshCw, Heart, ChevronRight, ChevronLeft,
  Maximize2, X, Ruler, Star, CheckCircle2, FileText, MessageSquare, Info, Award
} from 'lucide-react';
import { RatingStars } from '../components/RatingStars';
import { ProductImage } from '../components/ProductImage';
import { ProductCard } from '../components/ProductCard';
import { fetchApi } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

// Formatted Multi-Line & Bullet Text Component
function FormattedText({ text, title = null, className = '' }) {
  if (!text || typeof text !== 'string') return null;

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
        <h4 className="font-editorial text-lg sm:text-xl font-bold text-slate-900 mb-3">
          {title}
        </h4>
      )}
      <div className="space-y-3">
        {rawLines.map((line, idx) => {
          const cleanLine = line.replace(/^([•\-*▪]|(\d+[\.\)]))\s*/, '');

          return (
            <div
              key={idx}
              className="flex items-start gap-3 text-slate-700 text-sm sm:text-base leading-relaxed font-sans"
            >
              <span className="w-2 h-2 rounded-full bg-[#0f4b3f] shrink-0 mt-2" />
              <span className="flex-1 break-words">{cleanLine}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to extract only specs added by admin or defaults
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
    batteryLife: 'BATTERY LIFE',
  };

  const valid = [];
  const keys = Object.keys(product.specs);

  for (const key of keys) {
    const rawVal = product.specs[key];
    if (typeof rawVal === 'string' && rawVal.trim() !== '') {
      const val = rawVal.trim();
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

// Minimum horizontal travel (px) that counts as a swipe instead of a tap/click
const SWIPE_THRESHOLD = 40;

// Robust fallback description to guarantee Product Details are ALWAYS visible
function getProductDescriptionFallback(product) {
  if (product?.description && product.description.trim().length > 10) {
    return product.description;
  }
  const brand = product?.brand || 'WAGH';
  const name = product?.name || 'Mobile Accessory';
  const categoryName = typeof product?.category === 'object' ? product.category.name : 'Mobile Accessories';
  const warranty = product?.specs?.warranty || '6 Months Replacement Warranty';
  const output = product?.specs?.outputPower ? ` with ${product.specs.outputPower}` : '';

  return `${name} is engineered by ${brand} for maximum reliability, speed, and safety. Designed specifically for ${categoryName}${output}, this product undergoes 48 hours of stress testing before leaving our facility. Backed by a ${warranty} with doorstep pickup support.`;
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
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Swipe/drag gesture tracking for the image slider.
  // Kept in refs so moving a finger/mouse never triggers a re-render.
  const swipeRef = useRef({ pointerId: null, startX: 0, deltaX: 0 });
  const swipedRef = useRef(false);

  // Variant selection state
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);

  const [qty, setQty] = useState(1);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const loadProductAndRelated = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchApi(`/products/${id}`);
        if (res && res.data) {
          const loadedProduct = res.data;
          setProduct(loadedProduct);
          setSelectedImage(0);

          // Handle variant initialization from URL query parameters (?color=...&size=...)
          if (loadedProduct.hasVariants && Array.isArray(loadedProduct.variants) && loadedProduct.variants.length > 0) {
            const searchParams = new URLSearchParams(window.location.search);
            const colorParam = searchParams.get('color')?.toLowerCase();
            const sizeParam = searchParams.get('size')?.toLowerCase();

            let colorIdx = 0;
            if (colorParam) {
              const foundCIdx = loadedProduct.variants.findIndex(
                (v) => v.color?.name?.toLowerCase() === colorParam
              );
              if (foundCIdx > -1) colorIdx = foundCIdx;
            }

            const currentVariant = loadedProduct.variants[colorIdx] || loadedProduct.variants[0];
            let sizeIdx = 0;
            if (sizeParam && Array.isArray(currentVariant.sizes)) {
              const foundSIdx = currentVariant.sizes.findIndex(
                (s) => s.label?.toLowerCase() === sizeParam || s.sku?.toLowerCase() === sizeParam
              );
              if (foundSIdx > -1) sizeIdx = foundSIdx;
            } else if (Array.isArray(currentVariant.sizes)) {
              const inStockIdx = currentVariant.sizes.findIndex((s) => s.stock > 0);
              if (inStockIdx > -1) sizeIdx = inStockIdx;
            }

            setSelectedColorIdx(colorIdx);
            setSelectedSizeIdx(sizeIdx);
          }

          // Fetch reviews
          try {
            const revRes = await fetchApi(`/products/${id}/reviews`);
            if (revRes && revRes.data) {
              setReviews(Array.isArray(revRes.data) ? revRes.data : (revRes.data.reviews || []));
            }
          } catch (e) {
            console.error('Failed to load reviews:', e);
          }

          // Fetch related products
          if (loadedProduct.category) {
            try {
              const catId = typeof loadedProduct.category === 'object' ? loadedProduct.category._id : loadedProduct.category;
              const relRes = await fetchApi(`/products?category=${catId}&limit=5`);
              if (relRes && relRes.data) {
                const relList = Array.isArray(relRes.data) ? relRes.data : (relRes.data.products || []);
                setRelatedProducts(relList.filter((p) => String(p._id) !== String(id)));
              }
            } catch (e) {
              console.error('Failed to load related products:', e);
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

  // Derived variant computations
  const hasVariants = Boolean(product?.hasVariants && Array.isArray(product.variants) && product.variants.length > 0);
  const activeColorVariant = hasVariants ? (product.variants[selectedColorIdx] || product.variants[0]) : null;
  const activeSizes = hasVariants && activeColorVariant ? (activeColorVariant.sizes || []) : [];
  const activeSize = hasVariants && activeSizes.length > 0 ? (activeSizes[selectedSizeIdx] || activeSizes[0]) : null;

  const currentImages = hasVariants && activeColorVariant?.images?.length > 0 ? activeColorVariant.images : (product?.images || []);
  const currentPrice = hasVariants && activeSize ? activeSize.price : (product?.price || 0);
  const currentMrp = hasVariants && activeSize ? activeSize.mrp : (product?.mrp || 0);
  const currentStock = hasVariants && activeSize ? activeSize.stock : (product?.stock || 0);
  const isOutOfStock = currentStock <= 0;

  const discountPercent = currentMrp > currentPrice
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
    : 0;

  // Swipe gesture handlers (touch on mobile, click-drag on desktop)
  const imageCount = Array.isArray(currentImages) ? currentImages.length : 0;

  // Steps the gallery by one image and stops at the first/last one (no wrap-around)
  const shiftImage = (step) => {
    if (imageCount <= 1) return;
    setSelectedImage((prev) => {
      const next = prev + step;
      return next < 0 || next > imageCount - 1 ? prev : next;
    });
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // A second pointer means pinch-zoom or similar: abort instead of jumping
    if (swipeRef.current.pointerId !== null) {
      swipeRef.current.pointerId = null;
      return;
    }
    swipedRef.current = false;
    swipeRef.current = { pointerId: e.pointerId, startX: e.clientX, deltaX: 0 };
  };

  const handlePointerMove = (e) => {
    if (swipeRef.current.pointerId !== e.pointerId) return;
    swipeRef.current.deltaX = e.clientX - swipeRef.current.startX;
  };

  const handlePointerUp = (e) => {
    if (swipeRef.current.pointerId !== e.pointerId) return;
    const { deltaX } = swipeRef.current;
    swipeRef.current.pointerId = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    swipedRef.current = true; // a swipe must not be treated as a click
    shiftImage(deltaX < 0 ? 1 : -1); // drag left -> next, drag right -> previous
  };

  // Vertical page scroll (pointercancel) or leaving the gallery mid-drag aborts the swipe
  const handlePointerAbort = (e) => {
    if (swipeRef.current.pointerId === e.pointerId) swipeRef.current.pointerId = null;
  };

  const handleGalleryClick = () => {
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    setLightboxOpen(true);
  };

  const updateUrlParams = (colorName, sizeLabel) => {
    const params = new URLSearchParams(window.location.search);
    if (colorName) params.set('color', colorName.toLowerCase());
    if (sizeLabel) params.set('size', sizeLabel.toLowerCase());
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  };

  const handleColorChange = (newColorIdx) => {
    setSelectedColorIdx(newColorIdx);
    setSelectedImage(0);

    const newVariant = product.variants[newColorIdx];
    let newSizeIdx = 0;
    if (newVariant?.sizes?.length) {
      const inStockIdx = newVariant.sizes.findIndex((s) => s.stock > 0);
      if (inStockIdx > -1) newSizeIdx = inStockIdx;
    }
    setSelectedSizeIdx(newSizeIdx);

    const colorName = newVariant?.color?.name || '';
    const sizeLabel = newVariant?.sizes?.[newSizeIdx]?.label || '';
    updateUrlParams(colorName, sizeLabel);
  };

  const handleSizeChange = (newSizeIdx) => {
    const targetSize = activeSizes[newSizeIdx];
    if (!targetSize || targetSize.stock <= 0) return;

    setSelectedSizeIdx(newSizeIdx);
    const colorName = activeColorVariant?.color?.name || '';
    const sizeLabel = targetSize.label || '';
    updateUrlParams(colorName, sizeLabel);
  };

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;

    if (hasVariants && activeColorVariant && activeSize) {
      addToCart(product, qty, {
        variantId: activeColorVariant.variantId,
        sku: activeSize.sku,
        colorName: activeColorVariant.color?.name || '',
        sizeLabel: activeSize.label || '',
        price: activeSize.price,
      });
    } else {
      addToCart(product, qty);
    }
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;
    handleAddToCart();
    navigate('/cart');
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
  const descriptionText = getProductDescriptionFallback(product);
  const validSpecs = getValidAdminSpecs(product);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs font-mono-tag text-wagh-muted uppercase tracking-wider overflow-x-auto py-1">
        <Link to="/" className="hover:text-wagh-teal shrink-0">Home</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <Link to="/shop" className="hover:text-wagh-teal shrink-0">Shop</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <span className="text-wagh-dark font-bold truncate max-w-[180px] sm:max-w-xs">{product.name}</span>
      </nav>

      {/* PRODUCT MAIN HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* IMAGE GALLERY WITH TOUCH/DRAG SWIPE & LIGHTBOX */}
        <div className="lg:col-span-6 space-y-4">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerAbort}
            onPointerLeave={handlePointerAbort}
            onDragStart={(e) => e.preventDefault()}
            onClick={handleGalleryClick}
            className="relative cursor-zoom-in group rounded-3xl overflow-hidden border border-slate-200/80 bg-white shadow-sm touch-pan-y select-none"
            title="Swipe left/right or click to view fullscreen"
          >
            <ProductImage
              key={selectedImage}
              src={currentImages?.[selectedImage] || currentImages}
              alt={product.name}
              variant="detail"
              className="w-full h-full border-0 p-0 object-contain max-h-[480px]"
            />

            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-wagh-gold text-wagh-dark font-mono-tag font-bold text-xs shadow-md z-20">
                {discountPercent}% OFF
              </span>
            )}

            {/* Left & Right Overlay Arrows for Swipe/Click Navigation */}
            {currentImages?.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) => (prev - 1 + currentImages.length) % currentImages.length);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-white/85 text-slate-800 shadow-md hover:bg-[#0f4b3f] hover:text-white transition-all cursor-pointer border border-slate-200"
                  title="Previous Image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) => (prev + 1) % currentImages.length);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-white/85 text-slate-800 shadow-md hover:bg-[#0f4b3f] hover:text-white transition-all cursor-pointer border border-slate-200"
                  title="Next Image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-md text-slate-700 opacity-80 group-hover:opacity-100 transition-all duration-200 group-hover:scale-110 group-hover:bg-[#0f4b3f] group-hover:text-white z-20">
              <Maximize2 className="w-4 h-4" />
            </div>

            {/* Bottom Swipe Hint & Pagination Counter */}
            {currentImages?.length > 1 ? (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/75 backdrop-blur-xs text-white font-mono-tag text-[11px] font-semibold flex items-center gap-2 z-20">
                <span>Swipe or tap arrows</span>
                <span className="text-slate-400">•</span>
                <span className="text-wagh-gold">{selectedImage + 1} / {currentImages.length}</span>
              </div>
            ) : (
              <div className="absolute bottom-3 right-4 px-3 py-1 rounded-full bg-slate-900/60 backdrop-blur-xs text-white font-mono-tag text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                Click to Expand
              </div>
            )}
          </div>

          {/* Image Dots for Mobile & Thumbnails Grid */}
          {currentImages && currentImages.length > 1 && (
            <div className="space-y-3">
              {/* Mobile Dots */}
              <div className="flex items-center justify-center gap-2 sm:hidden py-1">
                {currentImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-2 rounded-full transition-all ${
                      selectedImage === idx ? 'w-6 bg-[#0f4b3f]' : 'w-2 bg-slate-300'
                    }`}
                    title={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Thumbnails grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                {currentImages.map((img, idx) => {
                  const isSelected = selectedImage === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative aspect-square rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer p-0 bg-white ${
                        isSelected
                          ? 'border-2 border-[#0f4b3f] ring-2 ring-[#0f4b3f]/20 shadow-xs scale-105 z-10'
                          : 'border border-slate-200/70 hover:border-slate-400 opacity-80 hover:opacity-100'
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
            </div>
          )}
        </div>

        {/* FULLSCREEN LIGHTBOX MODAL WITH SWIPE GESTURES */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in"
            onClick={() => setLightboxOpen(false)}
          >
            <div
              className="flex items-center justify-between text-white font-mono-tag text-xs sm:text-sm z-10 max-w-7xl w-full mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-700/80">
                <span className="font-bold text-wagh-teal">{selectedImage + 1}</span>
                <span className="text-slate-400">/</span>
                <span>{currentImages?.length || 1}</span>
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

            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerAbort}
              onPointerLeave={handlePointerAbort}
              onDragStart={(e) => e.preventDefault()}
              className="relative flex-1 flex items-center justify-center p-2 sm:p-4 my-auto w-full max-w-7xl mx-auto touch-pan-y select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {currentImages?.length > 1 && (
                <button
                  onClick={() => setSelectedImage((prev) => (prev - 1 + currentImages.length) % currentImages.length)}
                  className="absolute left-2 sm:left-6 z-30 p-3 rounded-full bg-slate-900/90 hover:bg-wagh-teal text-white transition-all border border-slate-700/80 hover:scale-110 shadow-2xl cursor-pointer"
                  title="Previous Image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <div className="max-w-4xl max-h-[75vh] flex items-center justify-center p-2 sm:p-4 rounded-3xl bg-white shadow-2xl border border-slate-800 overflow-hidden">
                <ProductImage
                  key={selectedImage}
                  src={currentImages?.[selectedImage] || currentImages}
                  alt={`${product.name} Fullscreen`}
                  variant="detail"
                  className="max-h-[70vh] max-w-full border-0 p-0 shadow-none object-contain"
                />
              </div>

              {currentImages?.length > 1 && (
                <button
                  onClick={() => setSelectedImage((prev) => (prev + 1) % currentImages.length)}
                  className="absolute right-2 sm:right-6 z-30 p-3 rounded-full bg-slate-900/90 hover:bg-wagh-teal text-white transition-all border border-slate-700/80 hover:scale-110 shadow-2xl cursor-pointer"
                  title="Next Image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {currentImages && currentImages.length > 1 && (
              <div
                className="flex items-center justify-center gap-3 overflow-x-auto py-2 z-10 custom-scrollbar max-w-7xl w-full mx-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {currentImages.map((img, idx) => {
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
            <h1 className="font-editorial text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight break-words">
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
                ₹{currentPrice}
              </span>
              {currentMrp > currentPrice && (
                <span className="font-mono-tag text-sm text-slate-400 line-through font-medium">
                  MRP ₹{currentMrp}
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

          {/* VARIANT SELECTORS (COLOR + SIZE/LENGTH) */}
          {hasVariants && (
            <div className="space-y-5 p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-2xs">
              {/* 1. COLOR SWATCHES ROW */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tag text-xs font-bold uppercase text-slate-700 tracking-wider">
                    COLOR: <span className="text-[#0f4b3f] font-extrabold">{activeColorVariant?.color?.name || 'Standard'}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {product.variants.map((v, idx) => {
                    const isSelected = selectedColorIdx === idx;
                    const hexColor = v.color?.hex || '#0f4b3f';
                    return (
                      <button
                        key={v.variantId || idx}
                        onClick={() => handleColorChange(idx)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0f4b3f] bg-white text-[#0f4b3f] ring-2 ring-[#0f4b3f]/20 shadow-xs scale-105'
                            : 'border-slate-200 bg-white/70 text-slate-700 hover:border-slate-400'
                        }`}
                        title={`Select Color: ${v.color?.name}`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                          style={{ backgroundColor: hexColor }}
                        />
                        <span>{v.color?.name || `Color ${idx + 1}`}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. SIZE / LENGTH CHIPS ROW */}
              {activeSizes.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tag text-xs font-bold uppercase text-slate-700 tracking-wider">
                      SIZE / LENGTH: <span className="text-[#0f4b3f] font-extrabold">{activeSize?.label || ''}</span>
                    </span>
                    {activeSize && (
                      <span className={`font-mono-tag text-[11px] font-bold ${activeSize.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {activeSize.stock > 0 ? `${activeSize.stock} in stock` : 'Out of Stock'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {activeSizes.map((s, idx) => {
                      const isSelected = selectedSizeIdx === idx;
                      const isSizeAvailable = s.stock > 0;

                      return (
                        <button
                          key={s.sku || idx}
                          disabled={!isSizeAvailable}
                          onClick={() => handleSizeChange(idx)}
                          className={`relative px-4 py-2.5 rounded-xl text-xs font-mono-tag font-bold transition-all ${
                            !isSizeAvailable
                              ? 'line-through opacity-40 cursor-not-allowed bg-slate-200/60 text-slate-400 border border-slate-300'
                              : isSelected
                              ? 'border-2 border-[#0f4b3f] bg-teal-50 text-[#0f4b3f] shadow-xs scale-105 cursor-pointer'
                              : 'border border-slate-200 bg-white text-slate-800 hover:border-slate-400 cursor-pointer'
                          }`}
                          title={isSizeAvailable ? `Select Size: ${s.label}` : `${s.label} - Out of Stock`}
                        >
                          <span>{s.label}</span>
                          {!isSizeAvailable && (
                            <span className="block text-[9px] font-normal no-underline text-rose-600">Out of stock</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Specs Pills */}
          {(() => {
            if (validSpecs.length === 0) return null;

            const shortSpecs = validSpecs.filter((s) => !s.isLong);

            return (
              <div className="space-y-3 pt-1">
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
                    {shortSpecs.slice(0, 3).map((spec) => {
                      const isDimension = spec.key.toLowerCase().includes('dimension') || spec.key.toLowerCase().includes('size');
                      const isWarranty = spec.key.toLowerCase().includes('warranty');

                      return (
                        <div
                          key={spec.key}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-center h-auto min-h-[74px]"
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
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-[#0f4b3f] hover:bg-[#0a352c] text-white shadow-md hover:shadow-lg active:scale-[0.98]'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>
            <button
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className={`py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-[#d4a34b] hover:bg-[#c3923a] text-slate-950 shadow-md hover:shadow-lg active:scale-[0.98]'
              }`}
            >
              <Zap className="w-5 h-5 fill-slate-950" />
              <span>Buy Now</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="space-y-3 pt-4 border-t border-wagh-border text-xs text-wagh-dark">
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-wagh-teal shrink-0" />
              <span><strong>Free Express Delivery</strong> on orders over ₹499. Dispatched within 24 hours.</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-wagh-teal shrink-0" />
              <span><strong>6 Months Replacement Warranty</strong> with doorstep pickup support.</span>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-wagh-teal shrink-0" />
              <span><strong>7 Days Easy Replacement Policy</strong> if damaged or defective.</span>
            </div>
          </div>
        </div>
      </div>

      {/* TASK 01 PERMANENT FIX: PRODUCT INFORMATION & DETAILS TABS SECTION */}
      <div className="pt-12 border-t border-slate-200/80 space-y-8">
        {/* TABS NAVIGATION BAR */}
        <div className="flex items-center justify-start border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto custom-scrollbar pb-px">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-4 px-3 sm:px-5 font-editorial font-bold text-base sm:text-lg transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeTab === 'description'
                ? 'border-[#0f4b3f] text-[#0f4b3f]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Description & Details</span>
          </button>

          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-4 px-3 sm:px-5 font-editorial font-bold text-base sm:text-lg transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeTab === 'specs'
                ? 'border-[#0f4b3f] text-[#0f4b3f]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Technical Specifications</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 px-3 sm:px-5 font-editorial font-bold text-base sm:text-lg transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeTab === 'reviews'
                ? 'border-[#0f4b3f] text-[#0f4b3f]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Customer Reviews ({reviews.length})</span>
          </button>
        </div>

        {/* TAB 1: DESCRIPTION & DETAILS */}
        {activeTab === 'description' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
              <h3 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900">
                Product Overview
              </h3>
              
              <FormattedText text={descriptionText} />

              {/* Render Admin Custom Sections if available */}
              {product.sections && Array.isArray(product.sections) && product.sections.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-slate-200/60">
                  {product.sections.map((sec, idx) => (
                    <div key={idx} className="space-y-3">
                      <h4 className="font-editorial text-lg font-bold text-slate-900">
                        {sec.title}
                      </h4>
                      {sec.content && <FormattedText text={sec.content} />}
                      {sec.items && sec.items.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {sec.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                              <span className="block text-xs font-bold font-mono-tag uppercase text-[#0f4b3f]">
                                {item.label}
                              </span>
                              <span className="text-sm font-sans text-slate-700 break-words">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quality & Performance Guarantee Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-start gap-3.5">
                <ShieldCheck className="w-6 h-6 text-[#0f4b3f] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">6 Months Warranty</h4>
                  <p className="text-xs text-slate-600 mt-1">Full replacement coverage with doorstep pickup.</p>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-3.5">
                <Zap className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Certified Fast Charging</h4>
                  <p className="text-xs text-slate-600 mt-1">Engineered with smart multi-layer heat dissipation.</p>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                <RefreshCw className="w-6 h-6 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">7-Day Easy Return</h4>
                  <p className="text-xs text-slate-600 mt-1">Hassle-free replacement if damaged or defective.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TECHNICAL SPECIFICATIONS */}
        {activeTab === 'specs' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6 animate-fade-in">
            <h3 className="font-editorial text-xl sm:text-2xl font-bold text-slate-900">
              Technical Specifications
            </h3>

            {validSpecs.length > 0 ? (
              <div className="divide-y divide-slate-200/80 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50">
                {validSpecs.map((spec, idx) => (
                  <div
                    key={spec.key}
                    className={`grid grid-cols-1 sm:grid-cols-3 p-4 gap-2 sm:gap-4 items-center ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    <span className="font-mono-tag text-xs font-bold uppercase text-slate-500 tracking-wider">
                      {spec.label}
                    </span>
                    <span className="sm:col-span-2 font-mono-tag font-semibold text-slate-800 text-sm break-words">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 font-sans">No additional specifications listed for this product.</p>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOMER REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-8 animate-fade-in">
            {/* Rating Summary Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 text-center md:text-left space-y-2">
                <span className="font-mono-tag text-5xl font-extrabold text-slate-900">
                  {product.ratingAvg || 4.8}
                </span>
                <div className="flex items-center justify-center md:justify-start gap-1">
                  <RatingStars rating={product.ratingAvg || 4.8} count={product.ratingCount || reviews.length} />
                </div>
                <p className="text-xs text-slate-500 font-mono-tag">Based on verified customer orders</p>
              </div>

              {/* Form to submit review */}
              <div className="md:col-span-8 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200/80 space-y-4">
                <h4 className="font-editorial text-lg font-bold text-slate-900">Write a Customer Review</h4>
                {user ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold font-mono-tag uppercase text-slate-600 mb-1">Your Rating</label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewRating(star)}
                            className="p-1 cursor-pointer hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-mono-tag uppercase text-slate-600 mb-1">Review Comment</label>
                      <textarea
                        required
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your experience with this charger/accessory..."
                        className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f4b3f] bg-white font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-2.5 rounded-full bg-[#0f4b3f] hover:bg-[#0a352c] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-slate-600">
                    Please{' '}
                    <Link to="/signin" className="text-[#0f4b3f] font-bold underline">
                      log in
                    </Link>{' '}
                    to leave a review for this product.
                  </p>
                )}
              </div>
            </div>

            {/* Existing Reviews List */}
            <div className="space-y-4">
              <h4 className="font-editorial text-lg sm:text-xl font-bold text-slate-900">Verified Customer Feedback</h4>
              {reviews && reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((rev, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{rev.user?.name || rev.name || 'Verified Buyer'}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed break-words">{rev.comment}</p>
                      <span className="block text-[10px] text-slate-400 font-mono-tag">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent Purchase'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic bg-white p-6 rounded-2xl border border-slate-200/80 text-center">
                  No customer reviews yet. Be the first to leave a review!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RELATED PRODUCTS SECTION */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-2xl font-bold text-slate-900">You May Also Like</h3>
            <Link to="/shop" className="text-xs font-mono-tag font-bold text-[#0f4b3f] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((relProduct) => (
              <ProductCard key={relProduct._id} product={relProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
