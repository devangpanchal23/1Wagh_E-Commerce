import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { fetchApi } from '../api';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user, updateUserProfile } = useAuth();
  const { addToast } = useToast();

  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Synchronize wishlistIds state with user's profile data
  useEffect(() => {
    if (user && Array.isArray(user.wishlist)) {
      setWishlistIds(user.wishlist.map(String));
    } else if (!user) {
      setWishlistIds([]);
      setWishlistProducts([]);
    }
  }, [user?.wishlist]);

  // Fetch product objects matching wishlistIds
  useEffect(() => {
    if (wishlistIds.length === 0) {
      setWishlistProducts([]);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;
    const loadWishlistProducts = async () => {
      setLoading(true);
      try {
        // Load only products the customer has saved; fetching a full catalog here
        // made a wishlist update increasingly expensive as the catalog grew.
        const ids = wishlistIds.slice(0, 60).join(',');
        const res = await fetchApi(`/products?ids=${encodeURIComponent(ids)}&limit=${Math.min(wishlistIds.length, 60)}`, {
          signal: controller.signal,
        });
        if (res && res.success && res.data?.products && isMounted) {
          const allProds = res.data.products;
          const matched = allProds.filter((p) => wishlistIds.includes(String(p._id)));
          setWishlistProducts(matched);
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error fetching wishlist products:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadWishlistProducts();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [wishlistIds]);

  const isInWishlist = useCallback((productId) => {
    if (!productId) return false;
    return wishlistIds.includes(String(productId));
  }, [wishlistIds]);

  const toggleWishlist = useCallback(async (product) => {
    if (!user) {
      addToast('Please sign in to save items to your wishlist.', 'info');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('wagh:open-auth-modal'));
      }
      return;
    }

    const productId = String(product._id || product.id || product);
    const productName = product.name || 'Item';
    const isCurrentlyLiked = wishlistIds.includes(productId);

    // Optimistic UI update: toggle heart icon immediately
    const prevIds = [...wishlistIds];
    const newIds = isCurrentlyLiked
      ? prevIds.filter((id) => id !== productId)
      : [...prevIds, productId];

    setWishlistIds(newIds);
    if (isCurrentlyLiked) {
      addToast(`Removed "${productName}" from wishlist`, 'info');
    } else {
      addToast(`Added "${productName}" to wishlist`, 'success');
    }

    // Save updated wishlist array to MongoDB profile
    try {
      if (updateUserProfile) {
        await updateUserProfile({ wishlist: newIds });
      }
    } catch (err) {
      console.error('Wishlist sync error:', err);
      setWishlistIds(prevIds);
      addToast('Failed to sync wishlist.', 'error');
    }
  }, [addToast, updateUserProfile, user, wishlistIds]);

  const value = useMemo(() => ({
    wishlist: wishlistProducts,
    wishlistIds,
    loading,
    toggleWishlist,
    isInWishlist,
  }), [wishlistProducts, wishlistIds, loading, toggleWishlist, isInWishlist]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
