import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { syncCartOnLogin, saveUserCartToFirestore } from '../utils/cartSync';

const CartContext = createContext();
const CartActionsContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isHydrated, setIsHydrated] = useState(false);

  const [cartItems, setCartItems] = useState(() => {
    try {
      if (user?.uid || user?._id) {
        const userId = user.uid || user._id;
        const userSaved = localStorage.getItem(`wagh_cart_${userId}`);
        if (userSaved) return JSON.parse(userSaved);
      }
      const guestSaved = localStorage.getItem('wagh_guest_cart');
      return guestSaved ? JSON.parse(guestSaved) : [];
    } catch {
      return [];
    }
  });

  // User-isolated cart synchronization on auth change (login / switch / logout)
  useEffect(() => {
    let isMounted = true;

    if (user?.uid) {
      const performSync = async () => {
        const syncedCart = await syncCartOnLogin(user);
        if (isMounted) {
          setCartItems(syncedCart);
          setIsHydrated(true);
        }
      };
      performSync();
    } else {
      const guestSaved = localStorage.getItem('wagh_guest_cart');
      if (isMounted) {
        setCartItems(guestSaved ? JSON.parse(guestSaved) : []);
        setIsHydrated(true);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Persist cart to user-scoped storage key ONLY AFTER hydration completes
  useEffect(() => {
    if (!isHydrated) return;

    try {
      if (user?.uid) {
        localStorage.setItem(`wagh_cart_${user.uid}`, JSON.stringify(cartItems));
        localStorage.removeItem('wagh_guest_cart');
        localStorage.removeItem('wagh_cart');
      } else {
        localStorage.setItem('wagh_guest_cart', JSON.stringify(cartItems));
        localStorage.removeItem('wagh_cart');
      }
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }, [cartItems, user?.uid, isHydrated]);

  const addToCart = useCallback((product, qty = 1, variantOptions = null) => {
    const pId = product._id || product.id || product;
    const sku = variantOptions?.sku || '';

    setCartItems((prev) => {
      const index = prev.findIndex((item) => {
        const itemId = item.product?._id || item.product?.id || item.product || item.productId;
        const itemSku = item.sku || '';
        return itemId === pId && (sku ? itemSku === sku : !itemSku);
      });

      let updated;
      if (index > -1) {
        updated = [...prev];
        updated[index] = {
          ...updated[index],
          qty: updated[index].qty + qty,
        };
      } else {
        const newItem = {
          product,
          qty,
          variantId: variantOptions?.variantId || null,
          sku: variantOptions?.sku || '',
          colorName: variantOptions?.colorName || '',
          sizeLabel: variantOptions?.sizeLabel || '',
          price: variantOptions?.price !== undefined ? variantOptions.price : (product.price || 0),
        };
        updated = [...prev, newItem];
      }

      if (user?.uid) {
        saveUserCartToFirestore(user.uid, updated);
      }
      return updated;
    });

    const label = variantOptions?.sizeLabel ? `${product.name} (${variantOptions.colorName} / ${variantOptions.sizeLabel})` : (product.name || 'Item');
    addToast(`Added "${label}" to cart`, 'success');
  }, [addToast, user?.uid]);

  const removeFromCart = useCallback((productId, sku = '') => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => {
        const pId = item.product?._id || item.product?.id || item.product || item.productId;
        const itemSku = item.sku || '';
        if (sku) return !(pId === productId && itemSku === sku);
        return pId !== productId;
      });

      if (user?.uid) {
        saveUserCartToFirestore(user.uid, updated);
      }
      return updated;
    });
    addToast('Item removed from cart', 'info');
  }, [addToast, user?.uid]);

  const updateQty = useCallback((productId, newQty, sku = '') => {
    if (newQty <= 0) {
      removeFromCart(productId, sku);
      return;
    }

    setCartItems((prev) => {
      const updated = prev.map((item) => {
        const pId = item.product?._id || item.product?.id || item.product || item.productId;
        const itemSku = item.sku || '';
        return pId === productId && (sku ? itemSku === sku : !itemSku)
          ? { ...item, qty: newQty }
          : item;
      });
      if (user?.uid) saveUserCartToFirestore(user.uid, updated);
      return updated;
    });
  }, [removeFromCart, user?.uid]);

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const applyCouponState = useCallback((couponData) => {
    setAppliedCoupon(couponData);
  }, []);

  const removeCouponState = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    if (user?.uid) {
      localStorage.removeItem(`wagh_cart_${user.uid}`);
      saveUserCartToFirestore(user.uid, []);
    }
    localStorage.removeItem('wagh_guest_cart');
    localStorage.removeItem('wagh_cart');
  }, [user?.uid]);

  // Computations
  const totals = useMemo(() => {
    const totalItemCount = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.price !== undefined ? item.price : (item.product?.price || 0);
      return sum + price * (item.qty || 1);
    }, 0);
    const shippingFee = subtotal >= 499 || subtotal === 0 ? 0 : 49;
    const couponDiscount = appliedCoupon && subtotal >= (appliedCoupon.minCartValue || 0)
      ? (appliedCoupon.discountAmount || 0)
      : 0;
    return { totalItemCount, subtotal, shippingFee, couponDiscount, grandTotal: Math.max(0, subtotal - couponDiscount) + shippingFee };
  }, [cartItems, appliedCoupon]);

  const actions = useMemo(() => ({
    addToCart, updateQty, removeFromCart, clearCart, applyCouponState, removeCouponState,
  }), [addToCart, updateQty, removeFromCart, clearCart, applyCouponState, removeCouponState]);

  const value = useMemo(() => ({
    cartItems,
    ...actions,
    ...totals,
    appliedCoupon: totals.subtotal >= (appliedCoupon?.minCartValue || 0) ? appliedCoupon : null,
    couponDiscount: totals.subtotal >= (appliedCoupon?.minCartValue || 0) ? totals.couponDiscount : 0,
  }), [cartItems, actions, totals, appliedCoupon]);

  return (
    <CartActionsContext.Provider value={actions}>
      <CartContext.Provider value={value}>{children}</CartContext.Provider>
    </CartActionsContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
export const useCartActions = () => useContext(CartActionsContext);
