// Utility functions for product seller information and posted dates

export const formatPostedDate = (val) => {
  if (!val) return 'Recently';
  if (typeof val === 'string' && (val.includes('ago') || val.includes('Just') || val.includes('now'))) {
    return val;
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  } catch (e) {}
  return String(val || 'Recently');
};

export const getSellerName = (item) => {
  if (!item) return 'Student';
  if (typeof item.seller === 'string' && item.seller.trim()) return item.seller;
  if (item.seller?.name && item.seller.name.trim()) return item.seller.name;
  if (item.sellerName && item.sellerName.trim()) return item.sellerName;
  if (item.seller?.email) {
    const prefix = item.seller.email.split('@')[0];
    return prefix || 'Student';
  }
  return 'Student';
};

export const getProductDatePosted = (item) => {
  if (!item) return 'Recently';
  const rawDate = item.createdAt || item.created_at || item.postedDate || item.datePosted || item.postedTime || item.time;
  return formatPostedDate(rawDate);
};
