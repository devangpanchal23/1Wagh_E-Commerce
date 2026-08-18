import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, Zap, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CheckoutButton } from '../components/CheckoutButton';
import { ProductImage } from '../components/ProductImage';
import { fetchApi } from '../api';

export function Cart() {
  const {
    cartItems,
    updateQty,
    removeFromCart,
    clearCart,
    subtotal,
    shippingFee,
    grandTotal,
    appliedCoupon,
    couponDiscount,
    applyCouponState,
    removeCouponState,
  } = useCart();
  const { user, getToken } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    setApplyingCoupon(true);

    try {
      const formattedItems = cartItems.map((item) => ({
        product: item.product?._id || item.product?.id || item.product,
        price: item.product?.price || item.price,
        qty: item.qty || 1,
      }));

      const res = await fetchApi('/coupons/apply', {
        method: 'POST',
        body: JSON.stringify({
          couponCode: couponInput.trim(),
          items: formattedItems,
          cartTotal: subtotal,
        }),
        getToken,
      });

      if (res.success && res.data) {
        applyCouponState(res.data);
        setCouponInput('');
        addToast(res.message || `Coupon '${res.data.couponCode}' applied!`, 'success');
      }
    } catch (err) {
      removeCouponState();
      setCouponError(err.message || 'Invalid coupon code');
      addToast(err.message || 'Failed to apply coupon', 'error');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const finalTotal = grandTotal;

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-wagh-teal/10 text-wagh-teal rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="font-editorial text-3xl font-bold text-wagh-dark">Your Cart is Empty</h2>
        <p className="text-wagh-muted max-w-md mx-auto text-sm">
          Looks like you haven't added any premium WAGH accessories to your cart yet.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-wagh-teal text-white font-extrabold text-sm shadow-md hover:bg-wagh-teal-dark transition-all"
        >
          <span>Explore Collection</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="border-b border-wagh-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl font-extrabold text-wagh-dark">
            Shopping Cart ({cartItems.reduce((acc, i) => acc + i.qty, 0)} Items)
          </h1>
          <p className="text-xs text-wagh-muted font-mono-tag">Review and adjust your selected items</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => {
              clearCart();
              addToast('Shopping cart cleared', 'info');
            }}
            className="px-3.5 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-mono-tag font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Clear all items from cart"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Items</span>
          </button>

          {!user && (
            <span className="px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono-tag font-bold text-xs shrink-0">
              Guest Session
            </span>
          )}
        </div>
      </div>

      {!user && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs font-sans">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              <strong>Shopping as Guest:</strong> Sign in to sync your cart across devices and save delivery preferences.
            </span>
          </div>
          <Link
            to="/profile"
            className="px-4 py-2 rounded-xl bg-amber-600 text-white font-extrabold text-xs whitespace-nowrap hover:bg-amber-700 transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            Sign In / Register
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CART LINE ITEMS */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((item) => {
            const product = item.product;
            const price = product.price || item.price || 0;
            const pId = product._id || product;

            return (
              <div
                key={pId}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-wagh-border shadow-soft hover:shadow-soft-hover transition-all duration-300 space-y-3.5 w-full max-w-full overflow-hidden"
              >
                {/* ROW 1: Product Thumbnail (Left) + Brand & Full Title (Right) */}
                <div className="flex items-start gap-3.5 sm:gap-4 w-full min-w-0">
                  <Link
                    to={`/product/${pId}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 block"
                  >
                    <ProductImage
                      src={product.images}
                      alt={product.name}
                      variant="thumbnail"
                      className="w-full h-full"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono-tag uppercase tracking-wider text-wagh-muted font-bold truncate">
                        {product.brand || 'WAGH'}
                      </span>
                      <span className="font-mono-tag text-xs text-wagh-muted shrink-0">
                        ₹{price} / unit
                      </span>
                    </div>

                    <Link to={`/product/${pId}`} className="block">
                      <h3 className="font-bold text-wagh-dark text-sm sm:text-base hover:text-wagh-teal transition-colors line-clamp-2 leading-snug break-words">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="text-xs text-wagh-muted line-clamp-1 leading-relaxed font-sans pt-0.5">
                      {product.description || product.specs?.outputPower || 'High quality WAGH mobile accessory with fast charging capability.'}
                    </p>
                  </div>
                </div>

                {/* ROW 2: Bottom Actions Bar (Quantity Stepper, Remove Button, Item Total Price) */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono-tag text-wagh-muted font-semibold hidden xs:inline">Qty:</span>
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-wagh-border p-1 rounded-xl">
                      <button
                        onClick={() => updateQty(pId, item.qty - 1)}
                        className="w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
                        title="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-mono-tag font-extrabold text-xs sm:text-sm text-wagh-dark">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(pId, item.qty + 1)}
                        className="w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(pId)}
                      className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono-tag font-semibold"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>

                  <div className="text-right shrink-0 font-mono-tag">
                    <span className="text-[10px] text-wagh-muted block uppercase font-bold">Total</span>
                    <span className="text-base sm:text-lg font-extrabold text-wagh-teal">
                      ₹{price * item.qty}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ORDER SUMMARY */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-wagh-border shadow-soft space-y-6">
          <h3 className="font-editorial text-xl font-bold text-wagh-dark border-b border-wagh-border pb-3">
            Order Summary
          </h3>

          {/* Coupon Code Input */}
          {!appliedCoupon ? (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-wagh-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Coupon (e.g. SAVE20)"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    if (couponError) setCouponError('');
                  }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-wagh-border text-xs font-mono-tag uppercase focus:outline-none focus:ring-2 focus:ring-wagh-teal"
                />
              </div>
              <button
                type="submit"
                disabled={applyingCoupon}
                className="px-4 py-2 rounded-xl bg-wagh-dark text-white font-mono-tag text-xs font-bold hover:bg-wagh-teal transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {applyingCoupon ? 'Checking...' : 'Apply'}
              </button>
            </form>
          ) : (
            <div className="text-xs font-mono-tag text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-900 block">✓ Code {appliedCoupon.couponCode} Applied</span>
                <span className="text-[11px] text-emerald-700">You save ₹{appliedCoupon.discountAmount} on this order</span>
              </div>
              <button
                type="button"
                onClick={removeCouponState}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 underline ml-2 cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {couponError && (
            <div className="text-xs font-mono-tag text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              ⚠️ {couponError}
            </div>
          )}

          {/* Pricing Breakdown */}
          <div className="space-y-3 text-sm font-mono-tag text-wagh-dark border-t border-wagh-border pt-4">
            <div className="flex justify-between">
              <span className="text-wagh-muted">Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-wagh-muted">Shipping</span>
              <span>
                {shippingFee === 0 ? (
                  <span className="text-wagh-success font-bold">FREE</span>
                ) : (
                  `₹${shippingFee}`
                )}
              </span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between text-wagh-success font-bold">
                <span>Discount ({appliedCoupon?.couponCode})</span>
                <span>-₹{couponDiscount}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold text-wagh-teal border-t border-wagh-border pt-3">
              <span>Total</span>
              <span>₹{grandTotal}</span>
            </div>
          </div>

          <CheckoutButton />

          <div className="pt-2 text-center text-xs text-wagh-muted space-y-1">
            <p className="flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-wagh-teal" />
              <span>Safe & Encrypted Checkout</span>
            </p>
            <p>Free shipping applies on orders over ₹499</p>
          </div>
        </div>

      </div>
    </div>
  );
}
