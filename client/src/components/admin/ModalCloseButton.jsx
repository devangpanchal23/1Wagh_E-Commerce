import React from 'react';
import { X } from 'lucide-react';

// Single close affordance shared by every admin modal. The circular chip
// carries its own neutral background at rest (not just on hover) so it never
// blends into a white modal card the way a bare icon-on-hover button can —
// that washed-out, hard-to-spot look was the root cause behind every modal's
// close button being inconsistent (or, on the product form, missing outright).
export function ModalCloseButton({ onClick, className = '', label = 'Close' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`shrink-0 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer ${className}`}
    >
      <X className="w-4 h-4" />
    </button>
  );
}
