import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80';

// Helper to normalize and sanitize image URLs
export const normalizeImageUrl = (raw) => {
  if (!raw) return null;

  let url = null;
  if (typeof raw === 'string') {
    url = raw;
  } else if (typeof raw === 'object' && raw !== null) {
    url = raw.url || raw.src || null;
  }

  if (!url || typeof url !== 'string') return null;
  url = url.trim();
  if (!url) return null;

  // If it's a full URL containing /product-images/, convert to relative /product-images/...
  if (url.includes('/product-images/')) {
    const idx = url.indexOf('/product-images/');
    return url.substring(idx);
  }

  // If it's product-images/... missing leading slash, add /
  if (url.startsWith('product-images/')) {
    return `/${url}`;
  }

  // If it's a localhost or backend upload link that has a .webp file name, redirect to /product-images/
  if ((url.includes('localhost:') || url.includes('/uploads/')) && url.endsWith('.webp')) {
    const filename = url.split('/').pop();
    if (filename) return `/product-images/${filename}`;
  }

  return url;
};

export function ProductImage({
  src,
  alt = 'Product image',
  variant = 'card', // 'thumbnail' | 'card' | 'detail'
  aspectRatio = '1:1', // '1:1' | '4:5' | '16:9'
  className = '',
  imgClassName = '',
  onClick,
  priority = false,
  ...props
}) {
  // Extract primary image candidate
  const getInitialUrl = () => {
    if (!src) return null;
    if (Array.isArray(src) && src.length > 0) {
      const primaryItem = src.find((i) => typeof i === 'object' && i?.isPrimary);
      const chosen = primaryItem || src[0];
      return normalizeImageUrl(chosen);
    }
    return normalizeImageUrl(src);
  };

  const initialUrl = getInitialUrl() || FALLBACK_IMAGE;
  const [currentSrc, setCurrentSrc] = useState(initialUrl);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [hasFallenBack, setHasFallenBack] = useState(false);

  useEffect(() => {
    const newUrl = getInitialUrl() || FALLBACK_IMAGE;
    setCurrentSrc(newUrl);
    setLoaded(false);
    setError(false);
    setHasFallenBack(false);
  }, [src]);

  const handleError = () => {
    if (!hasFallenBack && currentSrc !== FALLBACK_IMAGE) {
      setHasFallenBack(true);
      setCurrentSrc(FALLBACK_IMAGE);
    } else {
      setError(true);
    }
  };

  // Aspect ratio class mapping
  const aspectClassMap = {
    '1:1': 'aspect-square',
    '4:5': 'aspect-[4/5]',
    '16:9': 'aspect-video',
    'auto': 'aspect-auto',
  };

  const aspectClass = aspectClassMap[aspectRatio] || 'aspect-square';

  // Variant size/style presets
  const variantStyles = {
    thumbnail: 'p-0.5 rounded-xl bg-white border border-slate-200/60',
    card: 'p-0 rounded-2xl bg-white border border-slate-200/60 overflow-hidden',
    detail: 'p-0 rounded-3xl bg-white border border-slate-200/60 overflow-hidden shadow-2xs',
  };

  const containerPreset = variantStyles[variant] || variantStyles.card;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden flex items-center justify-center ${aspectClass} ${containerPreset} ${className}`}
      {...props}
    >
      {/* Loading Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-slate-200/70 animate-pulse rounded-inherit z-10 flex items-center justify-center text-slate-400">
          <ImageIcon className="w-6 h-6 opacity-40" />
        </div>
      )}

      {/* Image element */}
      {!error ? (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`max-h-full max-w-full object-contain transition-all duration-300 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } ${imgClassName}`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-3 text-center text-slate-400 text-xs font-medium space-y-1">
          <AlertCircle className="w-5 h-5 text-slate-300" />
          <span className="text-[10px]">Image Unavailable</span>
        </div>
      )}
    </div>
  );
}

export default ProductImage;
