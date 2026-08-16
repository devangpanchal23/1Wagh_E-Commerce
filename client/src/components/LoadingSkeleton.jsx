import React from 'react';

export function LoadingSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-wagh-border p-4 space-y-4 animate-pulse"
        >
          <div className="w-full aspect-square bg-gray-200 rounded-lg" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded-xl w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
