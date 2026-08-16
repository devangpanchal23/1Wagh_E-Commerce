import React, { useState, useEffect } from 'react';

export function PriceRangeFilter({
  minPrice = '',
  maxPrice = '',
  minLimit = 0,
  maxLimit = 2000,
  currencySymbol = '₹',
  onApply,
  isStandaloneCard = false,
}) {
  const effectiveMax = Math.max(minLimit + 10, maxLimit || 2000);
  
  const [localMin, setLocalMin] = useState(minPrice !== '' ? Number(minPrice) : minLimit);
  const [localMax, setLocalMax] = useState(maxPrice !== '' ? Number(maxPrice) : effectiveMax);

  useEffect(() => {
    setLocalMin(minPrice !== '' && minPrice !== undefined ? Number(minPrice) : minLimit);
  }, [minPrice, minLimit]);

  useEffect(() => {
    setLocalMax(maxPrice !== '' && maxPrice !== undefined ? Number(maxPrice) : effectiveMax);
  }, [maxPrice, effectiveMax]);

  const minPercent = Math.max(0, Math.min(100, ((localMin - minLimit) / (effectiveMax - minLimit)) * 100));
  const maxPercent = Math.max(0, Math.min(100, ((localMax - minLimit) / (effectiveMax - minLimit)) * 100));

  const handleMinSliderChange = (e) => {
    const val = Math.min(Number(e.target.value), localMax - 10);
    setLocalMin(val);
  };

  const handleMaxSliderChange = (e) => {
    const val = Math.max(Number(e.target.value), localMin + 10);
    setLocalMax(val);
  };

  const handleMinInputChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setLocalMin('');
      return;
    }
    const val = Math.max(minLimit, Math.min(Number(raw), localMax || effectiveMax));
    setLocalMin(val);
  };

  const handleMaxInputChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setLocalMax('');
      return;
    }
    const val = Math.min(effectiveMax * 2, Math.max(Number(raw), localMin || minLimit));
    setLocalMax(val);
  };

  const triggerApply = () => {
    const minVal = localMin === minLimit || localMin === '' ? '' : localMin.toString();
    const maxVal = localMax === effectiveMax || localMax === '' ? '' : localMax.toString();
    if (onApply) {
      onApply({ minPrice: minVal, maxPrice: maxVal });
    }
  };

  const content = (
    <div className="space-y-4 w-full">
      {/* Title */}
      <h3 className="font-editorial text-lg sm:text-xl tracking-tight text-wagh-dark leading-tight">
        <span className="font-bold text-slate-900">Price</span>{' '}
        <span className="font-light text-slate-600">Range</span>
      </h3>

      {/* Dual Range Slider Track */}
      <div className="space-y-2 pt-1">
        <div className="relative w-full h-6 flex items-center select-none">
          {/* Base Inactive Track */}
          <div className="absolute w-full h-[2px] bg-gray-200 rounded-full" />

          {/* Active Dark Segment */}
          <div
            className="absolute h-[2.5px] bg-slate-900 rounded-full transition-all duration-75"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(0, maxPercent - minPercent)}%`,
            }}
          />

          {/* Min Handle */}
          <input
            type="range"
            min={minLimit}
            max={effectiveMax}
            step={5}
            value={localMin === '' ? minLimit : localMin}
            onChange={handleMinSliderChange}
            onMouseUp={triggerApply}
            onTouchEnd={triggerApply}
            className="price-range-thumb absolute w-full appearance-none bg-transparent pointer-events-none z-20 cursor-pointer"
          />

          {/* Max Handle */}
          <input
            type="range"
            min={minLimit}
            max={effectiveMax}
            step={5}
            value={localMax === '' ? effectiveMax : localMax}
            onChange={handleMaxSliderChange}
            onMouseUp={triggerApply}
            onTouchEnd={triggerApply}
            className="price-range-thumb absolute w-full appearance-none bg-transparent pointer-events-none z-30 cursor-pointer"
          />
        </div>

        {/* Labels under slider track */}
        <div className="flex items-center justify-between text-xs text-gray-400 font-mono-tag px-0.5">
          <span>{currencySymbol}{minLimit}</span>
          <span>{currencySymbol}{effectiveMax.toLocaleString()}</span>
        </div>
      </div>

      {/* From and To Input Boxes (Responsive 2-Column Grid Layout) */}
      <div className="grid grid-cols-2 gap-2.5 pt-1 w-full">
        <div className="flex flex-col space-y-1">
          <span className="text-[11px] font-mono-tag font-bold uppercase tracking-wider text-gray-400">From</span>
          <div className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white flex items-center gap-1 shadow-2xs focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 transition-all">
            <span className="text-xs text-gray-500 font-bold shrink-0">{currencySymbol}</span>
            <input
              type="number"
              value={localMin}
              onChange={handleMinInputChange}
              onBlur={triggerApply}
              onKeyDown={(e) => e.key === 'Enter' && triggerApply()}
              placeholder={minLimit.toString()}
              className="w-full min-w-0 text-xs font-bold text-slate-800 focus:outline-none bg-transparent"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-1">
          <span className="text-[11px] font-mono-tag font-bold uppercase tracking-wider text-gray-400">To</span>
          <div className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white flex items-center gap-1 shadow-2xs focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 transition-all">
            <span className="text-xs text-gray-500 font-bold shrink-0">{currencySymbol}</span>
            <input
              type="number"
              value={localMax}
              onChange={handleMaxInputChange}
              onBlur={triggerApply}
              onKeyDown={(e) => e.key === 'Enter' && triggerApply()}
              placeholder={effectiveMax.toString()}
              className="w-full min-w-0 text-xs font-bold text-slate-800 focus:outline-none bg-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (isStandaloneCard) {
    return (
      <div className="bg-white rounded-3xl border border-wagh-border p-5 sm:p-6 shadow-soft relative z-10 w-full overflow-hidden">
        {content}
      </div>
    );
  }

  return content;
}

export default PriceRangeFilter;


