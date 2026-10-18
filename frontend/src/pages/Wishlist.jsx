import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { getSellerName, getProductDatePosted } from '../utils/productUtils';
import { getCartCount } from '../utils/cartStorage';

export const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [cartCount, setCartCount] = useState(() => getCartCount());

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadWishlist = () => {
      const stored = localStorage.getItem('wishlist');
      if (stored) {
        try {
          setWishlist(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse wishlist', e);
        }
      }
    };
    
    const handleCartUpdate = () => {
      setCartCount(getCartCount());
    };

    loadWishlist();
    window.addEventListener('wishlistUpdate', loadWishlist);
    window.addEventListener('cartUpdate', handleCartUpdate);
    return () => {
      window.removeEventListener('wishlistUpdate', loadWishlist);
      window.removeEventListener('cartUpdate', handleCartUpdate);
    };
  }, []);

  const removeFromWishlist = (id) => {
    const newWishlist = wishlist.filter(item => item.id !== id);
    setWishlist(newWishlist);
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
    window.dispatchEvent(new Event('wishlistUpdate'));
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative">
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="btn-icon" title="Go back">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">My Wishlist</h1>
          </div>
          <button className="btn-icon relative" onClick={() => navigate('/cart')} title="Shopping Cart">
            <span className="material-symbols-outlined text-[var(--color-primary)]">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--color-primary)] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-[var(--color-surface)] animate-in zoom-in">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] py-8 space-y-6">
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined text-[64px] mb-4 opacity-50 text-[var(--color-primary)]">favorite_border</span>
            <h2 className="text-xl font-bold mb-2 text-[var(--color-text-primary)]">Your wishlist is empty</h2>
            <p className="max-w-xs text-sm mb-6">Save items you like and they will appear here.</p>
            <button onClick={() => navigate('/explore')} className="btn-primary">Explore Products</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map(item => (
              <div 
                key={item.id} 
                className="card-interactive flex flex-col group relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-shadow h-fit"
              >
                <div 
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="w-full aspect-square bg-[var(--color-background)] relative overflow-hidden flex items-center justify-center cursor-pointer border-b border-[var(--color-border)]"
                  style={{ aspectRatio: '1 / 1' }}
                >
                  <img 
                    src={item.image} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    alt={item.name} 
                    onError={(e) => { e.target.src = 'https://placehold.co/400x400/F8FAFC/46A857?text=No+Image'; }} 
                  />
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(item.id);
                  }}
                  className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm text-[var(--color-danger)] hover:bg-white hover:scale-110 active:scale-95 transition-all z-10"
                  title="Remove from wishlist"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
                </button>
                
                <div className="p-4 flex flex-col gap-2 z-10 cursor-pointer" onClick={() => navigate(`/product/${item.id}`)}>
                  <h4 className="font-bold text-[var(--color-text-primary)] truncate text-base group-hover:text-[var(--color-primary)] transition-colors">{item.name}</h4>
                  <span className="text-xl font-black text-[var(--color-primary)]">
                    {String(item.price).startsWith('₹') ? item.price : `₹${item.price}`}
                  </span>

                  {/* Seller & Date Posted */}
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-2.5 border-t border-[var(--color-border)] mt-0.5 font-medium">
                    <span className="flex items-center gap-1.5 truncate max-w-[60%]" title={getSellerName(item)}>
                      <span className="material-symbols-outlined text-[15px] text-[var(--color-primary)]">person</span>
                      <span className="truncate text-[var(--color-text-primary)] font-semibold">{getSellerName(item)}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                      <span>{getProductDatePosted(item)}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
