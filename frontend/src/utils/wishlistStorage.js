// Shared utility for managing user wishlist
const WISHLIST_KEY = 'wishlist';

export const getWishlist = () => {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed reading wishlist', e);
    return [];
  }
};

export const isInWishlist = (productId) => {
  const list = getWishlist();
  return list.some(item => item.id === productId);
};

export const toggleWishlist = (product) => {
  const list = getWishlist();
  const exists = list.some(item => item.id === product.id);
  let updated;

  if (exists) {
    updated = list.filter(item => item.id !== product.id);
  } else {
    const itemToAdd = {
      id: product.id,
      name: product.name || product.title,
      price: product.price,
      image: product.image || (product.images && product.images[0]) || 'https://picsum.photos/800/800?random=99',
      category: product.category,
      condition: product.condition,
      addedAt: new Date().toISOString()
    };
    updated = [itemToAdd, ...list];
  }

  localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('wishlistUpdate'));
  return !exists;
};
