import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';
import { ASSET_ORIGIN } from '../api';

// Local inline placeholder — no external network dependency, so a slow/blocked
// third-party host can never leave the loading skeleton stuck indefinitely.
const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
  '<rect width="400" height="400" fill="#f1f5f9"/>' +
  '<path d="M140 240 L180 190 L220 220 L260 160 L300 240 Z" fill="#cbd5e1"/>' +
  '<circle cx="160" cy="160" r="18" fill="#cbd5e1"/>' +
  '</svg>'
);

// Hard ceiling on how long a single image is allowed to sit in the loading
// state before we treat it as failed — guards against a request that never
// fires load/error (blocked, hung, or dropped by the network) leaving the
// skeleton on screen forever.
const LOAD_TIMEOUT_MS = 8000;

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

  // Our own uploaded files are always served from /uploads/<filename>, no
  // matter what host the URL was stored with — older records may carry an
  // absolute dev-only host (e.g. http://localhost:5050/...) baked in at
  // upload time. Strip down to the relative path and resolve it against
  // *this* environment's API origin, so the same database record renders
  // correctly in dev, staging, and production without a data migration.
  const uploadsIdx = url.indexOf('/uploads/');
  if (uploadsIdx !== -1) {
    return `${ASSET_ORIGIN}${url.substring(uploadsIdx)}`;
  }

  // Any other absolute URL (external CDN, third-party placeholder) is used as-is.
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
  const timeoutRef = useRef(null);

  useEffect(() => {
    const newUrl = getInitialUrl() || FALLBACK_IMAGE;
    setCurrentSrc(newUrl);
    setLoaded(false);
    setError(false);
    setHasFallenBack(false);
  }, [src]);

  // Belt-and-braces: if neither onLoad nor onError fires within the timeout
  // (a hung/blocked request), stop showing an indefinite loading skeleton.
  useEffect(() => {
    if (loaded || error) return undefined;
    timeoutRef.current = setTimeout(() => {
      setError((prevError) => {
        if (prevError) return prevError;
        if (!hasFallenBack && currentSrc !== FALLBACK_IMAGE) {
          setHasFallenBack(true);
          setCurrentSrc(FALLBACK_IMAGE);
          return false;
        }
        return true;
      });
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeoutRef.current);
  }, [currentSrc, loaded, error, hasFallenBack]);

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
          fetchpriority={priority ? 'high' : 'auto'}
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
