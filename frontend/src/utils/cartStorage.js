import { getSellerName, getProductDatePosted } from './productUtils';

const CART_KEY = 'maker_cart';

export const parseItemPrice = (price) => {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  const cleaned = String(price).replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
};

export const getCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed reading cart from localStorage', e);
    return [];
  }
};

export const getCartCount = () => {
  const items = getCart();
  return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
};

export const getCartTotal = () => {
  const items = getCart();
  return items.reduce((sum, item) => {
    const p = item.numericPrice || parseItemPrice(item.price);
    return sum + p * (item.quantity || 1);
  }, 0);
};

export const isInCart = (productId) => {
  const cart = getCart();
  return cart.some((item) => String(item.id) === String(productId));
};

export const addToCart = (product, quantity = 1) => {
  const cart = getCart();
  const existingIdx = cart.findIndex((item) => String(item.id) === String(product.id));
  const numericPrice = parseItemPrice(product.price);

  let updated;
  if (existingIdx >= 0) {
    updated = [...cart];
    updated[existingIdx] = {
      ...updated[existingIdx],
      quantity: (updated[existingIdx].quantity || 1) + quantity
    };
  } else {
    const itemToAdd = {
      id: product.id,
      name: product.name || product.title,
      price: product.price,
      numericPrice,
      image: product.image || (product.images && product.images[0]) || 'https://placehold.co/400x400/F8FAFC/46A857?text=Product',
      category: product.category || 'General',
      condition: product.condition || 'Good',
      seller: product.seller || null,
      sellerName: getSellerName(product),
      sellerId: product.seller?.id || product.seller_id || null,
      college: product.seller?.college || product.college || 'SKCT',
      quantity: Math.max(1, quantity),
      addedAt: new Date().toISOString()
    };
    updated = [itemToAdd, ...cart];
  }

  localStorage.setItem(CART_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('cartUpdate'));
  return updated;
};

export const updateCartQuantity = (productId, quantity) => {
  const cart = getCart();
  let updated;
  if (quantity <= 0) {
    updated = cart.filter((item) => String(item.id) !== String(productId));
  } else {
    updated = cart.map((item) => {
      if (String(item.id) === String(productId)) {
        return { ...item, quantity };
      }
      return item;
    });
  }

  localStorage.setItem(CART_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('cartUpdate'));
  return updated;
};

export const removeFromCart = (productId) => {
  const cart = getCart();
  const updated = cart.filter((item) => String(item.id) !== String(productId));
  localStorage.setItem(CART_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('cartUpdate'));
  return updated;
};

export const clearCart = () => {
  localStorage.setItem(CART_KEY, JSON.stringify([]));
  window.dispatchEvent(new Event('cartUpdate'));
  return [];
};
