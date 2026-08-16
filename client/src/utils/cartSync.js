/**
 * Normalizes a product identifier from item object or string
 */
function getProductId(item) {
  if (!item) return null;
  if (typeof item.product === 'string') return item.product;
  if (item.product && item.product._id) return item.product._id;
  if (item.product && item.product.id) return item.product.id;
  if (item.productId) return item.productId;
  if (item._id) return item._id;
  if (item.id) return item.id;
  return null;
}

/**
 * Merges guest cart items with user cart items.
 * Ensures no duplicate items and aggregates quantities.
 */
export function mergeCartArrays(guestItems = [], userItems = []) {
  const mergedMap = new Map();

  const processItem = (item) => {
    const pId = getProductId(item);
    if (!pId) return;

    if (mergedMap.has(pId)) {
      const existing = mergedMap.get(pId);
      // Use Math.max so duplicate initialization or refreshes never double or multiply quantity!
      mergedMap.set(pId, {
        ...existing,
        qty: Math.max(existing.qty || 1, item.qty || 1),
      });
    } else {
      mergedMap.set(pId, {
        product: item.product || item,
        qty: item.qty || 1,
        price: item.price || item.product?.price || 0,
      });
    }
  };

  userItems.forEach(processItem);
  guestItems.forEach(processItem);

  return Array.from(mergedMap.values());
}

/**
 * Saves current cart to local storage for authenticated user or guest
 */
export async function saveUserCartToFirestore(uid, cartItems) {
  try {
    if (uid) {
      localStorage.setItem(`wagh_cart_${uid}`, JSON.stringify(cartItems));
      // Remove legacy shared key to prevent cross-user pollution
      localStorage.removeItem('wagh_cart');
    } else {
      localStorage.setItem('wagh_guest_cart', JSON.stringify(cartItems));
    }
  } catch (error) {
    console.error('Error saving cart to local storage:', error);
  }
}

/**
 * Fetches user's cart from local storage strictly bound to uid
 */
export async function getUserCartFromFirestore(uid) {
  try {
    if (uid) {
      const saved = localStorage.getItem(`wagh_cart_${uid}`);
      return saved ? JSON.parse(saved) : [];
    } else {
      const guestSaved = localStorage.getItem('wagh_guest_cart');
      return guestSaved ? JSON.parse(guestSaved) : [];
    }
  } catch (error) {
    return [];
  }
}

/**
 * Main sync function called when user completes authentication.
 * Merges guest cart items added during session into user's account cart.
 */
export async function syncCartOnLogin(user) {
  if (!user || !user.uid) return [];

  try {
    const userKey = `wagh_cart_${user.uid}`;
    const userSaved = localStorage.getItem(userKey);
    const userCart = userSaved ? JSON.parse(userSaved) : [];

    // Check if there is a pending guest cart from pre-login browsing
    const guestSaved = localStorage.getItem('wagh_guest_cart');
    if (guestSaved) {
      try {
        const guestCart = JSON.parse(guestSaved);
        if (Array.isArray(guestCart) && guestCart.length > 0) {
          const mergedCart = mergeCartArrays(guestCart, userCart);
          localStorage.setItem(userKey, JSON.stringify(mergedCart));
          localStorage.removeItem('wagh_guest_cart');
          localStorage.removeItem('wagh_cart');
          return mergedCart;
        }
      } catch (e) {
        console.error('Error parsing guest cart:', e);
      }
    }

    // No pending guest cart -> Purge temp keys and return saved user cart as-is (NEVER duplicate or multiply)
    localStorage.removeItem('wagh_guest_cart');
    localStorage.removeItem('wagh_cart');
    return userCart;
  } catch (error) {
    console.error('Error syncing cart on login:', error);
    return [];
  }
}

