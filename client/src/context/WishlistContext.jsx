import React, { createContext, useContext, useState, useEffect } from 'react';
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
  }, [user?.wishlist, user]);

  // Fetch product objects matching wishlistIds
  useEffect(() => {
    if (wishlistIds.length === 0) {
      setWishlistProducts([]);
      return;
    }

    let isMounted = true;
    const loadWishlistProducts = async () => {
      setLoading(true);
      try {
        const res = await fetchApi('/products?limit=100');
        if (res && res.success && res.data?.products && isMounted) {
          const allProds = res.data.products;
          const matched = allProds.filter((p) => wishlistIds.includes(String(p._id)));
          setWishlistProducts(matched);
        }
      } catch (err) {
        console.error('Error fetching wishlist products:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadWishlistProducts();
    return () => {
      isMounted = false;
    };
  }, [wishlistIds]);

  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlistIds.includes(String(productId));
  };

  const toggleWishlist = async (product) => {
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
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist: wishlistProducts,
        wishlistIds,
        loading,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
