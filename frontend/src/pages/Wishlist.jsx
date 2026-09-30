import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

export const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);

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
    
    loadWishlist();
    window.addEventListener('wishlistUpdate', loadWishlist);
    return () => window.removeEventListener('wishlistUpdate', loadWishlist);
  }, []);

  const removeFromWishlist = (id) => {
    const newWishlist = wishlist.filter(item => item.id !== id);
    setWishlist(newWishlist);
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
    window.dispatchEvent(new Event('wishlistUpdate'));
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative">
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 w-full h-16 border-b border-[var(--color-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn-icon">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">My Wishlist</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined text-[64px] mb-4 opacity-50 text-[var(--color-primary)]">favorite_border</span>
            <h2 className="text-xl font-bold mb-2 text-[var(--color-text-primary)]">Your wishlist is empty</h2>
            <p className="max-w-xs text-sm mb-6">Save items you like and they will appear here.</p>
            <button onClick={() => navigate('/explore')} className="btn-primary">Explore Products</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wishlist.map(item => (
              <div key={item.id} className="card-interactive flex flex-col group relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div 
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="w-full aspect-square bg-[var(--color-background)] relative flex items-center justify-center cursor-pointer"
                >
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.name} onError={(e) => { e.target.src = 'https://placehold.co/400x400/F8FAFC/46A857?text=No+Image'; }} />
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(item.id);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm text-[var(--color-danger)] hover:bg-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
                </button>
                
                <div className="p-4 flex flex-col gap-1 z-10 cursor-pointer" onClick={() => navigate(`/product/${item.id}`)}>
                  <h4 className="font-bold text-[var(--color-text-primary)] line-clamp-1 text-sm">{item.name}</h4>
                  <span className="text-lg font-black text-[var(--color-primary)]">{item.price}</span>
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
