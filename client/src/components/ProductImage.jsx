import React, { useState } from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';

export function ProductImage({
  src,
  alt = 'Product image',
  variant = 'card', // 'thumbnail' | 'card' | 'detail'
  aspectRatio = '1:1', // '1:1' | '4:5' | '16:9'
  className = '',
  imgClassName = '',
  onClick,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Extract string URL if src is a string, object, or array of objects
  const getSingleUrl = (item) => {
    if (!item) return null;
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item.url) return item.url;
    return null;
  };

  let rawUrl = getSingleUrl(src);

  if (!rawUrl && Array.isArray(src) && src.length > 0) {
    const primaryItem = src.find(i => typeof i === 'object' && i?.isPrimary);
    rawUrl = getSingleUrl(primaryItem) || getSingleUrl(src[0]);
  }

  const fallbackUrl = 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80';
  const imageUrl = rawUrl || fallbackUrl;

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
          src={imageUrl}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`max-h-full max-w-full object-contain transition-all duration-300 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } ${imgClassName}`}
          loading="lazy"
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
