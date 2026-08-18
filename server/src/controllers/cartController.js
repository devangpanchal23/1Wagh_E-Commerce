const Cart = require('../models/Cart');

// A cart line needs product details and variants for price/stock calculation
const CART_PRODUCT_FIELDS = 'name slug price mrp images stock brand hasVariants variants';

const POPULATE_ITEMS = { path: 'items.product', select: CART_PRODUCT_FIELDS };

const withProducts = async (cart) => {
  await cart.populate(POPULATE_ITEMS);
  return cart;
};

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate(POPULATE_ITEMS)
      .lean();

    if (!cart) {
      const created = await Cart.create({ user: req.user._id, items: [] });
      cart = created.toObject();
    }

    res.json({
      success: true,
      data: cart,
      message: 'Cart fetched'
    });
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, qty = 1, price, variantId, sku, colorName, sizeLabel } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => {
      const sameProduct = item.product.toString() === productId;
      if (sku) return sameProduct && item.sku === sku;
      return sameProduct && !item.sku;
    });

    if (itemIndex > -1) {
      cart.items[itemIndex].qty += qty;
    } else {
      cart.items.push({
        product: productId,
        qty,
        priceAtAdd: price,
        variantId: variantId || null,
        sku: sku || '',
        colorName: colorName || '',
        sizeLabel: sizeLabel || '',
      });
    }

    await cart.save();
    await withProducts(cart);

    res.json({
      success: true,
      data: cart,
      message: 'Item added to cart'
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCartQty = async (req, res, next) => {
  try {
    const { productId, sku, qty } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => {
      const sameProduct = item.product.toString() === productId;
      if (sku) return sameProduct && item.sku === sku;
      return sameProduct && !item.sku;
    });

    if (itemIndex > -1) {
      if (qty <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].qty = qty;
      }
      await cart.save();
    }

    await withProducts(cart);

    res.json({
      success: true,
      data: cart,
      message: 'Cart updated'
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { sku } = req.query;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(item => {
      const sameProduct = item.product.toString() === productId;
      if (sku) return !(sameProduct && item.sku === sku);
      return !sameProduct;
    });

    await cart.save();
    await withProducts(cart);

    res.json({
      success: true,
      data: cart,
      message: 'Item removed from cart'
    });
  } catch (error) {
    next(error);
  }
};

exports.syncCart = async (req, res, next) => {
  try {
    const { items } = req.body; // array of { productId, qty, price, variantId, sku, colorName, sizeLabel }
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    if (Array.isArray(items)) {
      items.forEach(localItem => {
        const idx = cart.items.findIndex(i => {
          const sameProduct = i.product.toString() === localItem.productId;
          if (localItem.sku) return sameProduct && i.sku === localItem.sku;
          return sameProduct && !i.sku;
        });

        if (idx > -1) {
          cart.items[idx].qty = Math.max(cart.items[idx].qty, localItem.qty);
        } else {
          cart.items.push({
            product: localItem.productId,
            qty: localItem.qty,
            priceAtAdd: localItem.price,
            variantId: localItem.variantId || null,
            sku: localItem.sku || '',
            colorName: localItem.colorName || '',
            sizeLabel: localItem.sizeLabel || '',
          });
        }
      });
      await cart.save();
    }

    await withProducts(cart);

    res.json({
      success: true,
      data: cart,
      message: 'Cart synced'
    });
  } catch (error) {
    next(error);
  }
};
