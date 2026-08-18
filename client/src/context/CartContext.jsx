import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { syncCartOnLogin, saveUserCartToFirestore } from '../utils/cartSync';

const CartContext = createContext();

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

  const addToCart = (product, qty = 1) => {
    const pId = product._id || product.id || product;
    let updated;

    setCartItems((prev) => {
      const index = prev.findIndex((item) => {
        const itemId = item.product?._id || item.product?.id || item.product || item.productId;
        return itemId === pId;
      });

      if (index > -1) {
        updated = [...prev];
        updated[index] = {
          ...updated[index],
          qty: updated[index].qty + qty,
        };
      } else {
        updated = [...prev, { product, qty }];
      }

      if (user?.uid) {
        saveUserCartToFirestore(user.uid, updated);
      }
      return updated;
    });

    addToast(`Added "${product.name || 'item'}" to cart`, 'success');
  };

  const updateQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prev) => {
      const updated = prev.map((item) => {
        const pId = item.product?._id || item.product?.id || item.product || item.productId;
        if (pId === productId) {
          return { ...item, qty: newQty };
        }
        return item;
      });

      if (user?.uid) {
        saveUserCartToFirestore(user.uid, updated);
      }
      return updated;
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => {
        const pId = item.product?._id || item.product?.id || item.product || item.productId;
        return pId !== productId;
      });

      if (user?.uid) {
        saveUserCartToFirestore(user.uid, updated);
      }
      return updated;
    });
    addToast('Item removed from cart', 'info');
  };

  const clearCart = () => {
    setCartItems([]);
    if (user?.uid) {
      localStorage.removeItem(`wagh_cart_${user.uid}`);
      saveUserCartToFirestore(user.uid, []);
    }
    localStorage.removeItem('wagh_guest_cart');
    localStorage.removeItem('wagh_cart');
  };

  // Computations
  const totalItemCount = cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price || item.price || 0;
    return sum + price * (item.qty || 1);
  }, 0);

  // Free shipping on orders over ₹499
  const shippingFee = subtotal >= 499 || subtotal === 0 ? 0 : 49;
  const grandTotal = subtotal + shippingFee;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        totalItemCount,
        subtotal,
        shippingFee,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
