import React from 'react';
import { Star } from 'lucide-react';

export function RatingStars({ rating = 5, count, interactive = false, onRatingChange }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5 text-wagh-gold">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
            className={`${interactive ? 'hover:scale-115 transition-transform cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`w-4 h-4 ${
                star <= rating
                  ? 'fill-wagh-gold text-wagh-gold'
                  : star - 0.5 <= rating
                  ? 'fill-wagh-gold/50 text-wagh-gold'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <span className="font-mono-tag font-bold text-xs text-wagh-dark">
        {rating.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className="text-xs text-wagh-muted font-sans">
          ({count})
        </span>
      )}
    </div>
  );
}
