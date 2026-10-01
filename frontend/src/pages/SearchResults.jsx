import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../data/products';
import { BottomNav } from '../components/BottomNav';
import apiClient from '../api/client';
import { getWishlist, toggleWishlist } from '../utils/wishlistStorage';

export const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';
  const categoryFilter = queryParams.get('category') || '';
  const typeFilter = queryParams.get('type') || ''; // 'recent' or 'auction'

  const [allProducts, setAllProducts] = useState(PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(() => getWishlist().map(item => item.id));

  useEffect(() => {
    const handleWishlistUpdate = () => {
      setWishlistIds(getWishlist().map(item => item.id));
    };
    window.addEventListener('wishlistUpdate', handleWishlistUpdate);
    return () => window.removeEventListener('wishlistUpdate', handleWishlistUpdate);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const compRes = await apiClient.get('/components').catch(() => ({ data: [] }));
        
        const mappedComponents = (compRes.data || []).map(comp => ({
          id: comp.id,
          name: comp.title || comp.name,
          price: typeof comp.price === 'number' ? `₹${comp.price}` : comp.price,
          originalPrice: `₹${(comp.price || 0) + 200}`,
          condition: comp.condition || 'Used',
          status: comp.status === 'ACTIVE' || comp.availability === 'In Stock' || comp.availability === 'Available' ? 'Available' : 'Sold',
          rating: '5.0',
          college: 'SKCT',
          time: 'Just now',
          description: comp.why_sell || comp.tech_specs || comp.description || '',
          category: comp.category,
          isAuction: comp.listing_type === 'AUCTION' || comp.isAuction === true,
          images: comp.images?.length > 0 ? comp.images : (comp.image ? [comp.image] : ['https://picsum.photos/800/800?random=99']),
          image: comp.image_url || (comp.images?.length > 0 ? comp.images[0] : (comp.image || 'https://picsum.photos/800/800?random=99'))
        }));
        
        setAllProducts([...mappedComponents, ...PRODUCTS]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      let match = true;

      // Filter by Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const inName = product.name?.toLowerCase().includes(query);
        const inDesc = product.description?.toLowerCase().includes(query);
        const inCategory = product.category?.toLowerCase().includes(query);
        if (!inName && !inDesc && !inCategory) {
          match = false;
        }
      }

      // Filter by Category
      if (categoryFilter && match) {
        const catFilterLow = categoryFilter.toLowerCase();
        const prodCatLow = (product.category || '').toLowerCase();
        
        if (!catFilterLow.includes(prodCatLow) && !prodCatLow.includes(catFilterLow)) {
          match = false;
        }
      }

      // Filter by Type (recent vs auction)
      if (typeFilter && match) {
        if (typeFilter === 'auction' && !product.isAuction) match = false;
        if (typeFilter === 'recent' && product.isAuction) match = false;
      }

      return match;
    });
  }, [allProducts, searchQuery, categoryFilter, typeFilter]);

  const getPageTitle = () => {
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    if (categoryFilter) return `${categoryFilter} Products`;
    if (typeFilter === 'auction') return 'Live Auctions';
    if (typeFilter === 'recent') return 'Recently Added';
    return 'All Products';
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative">
      {/* Header */}
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-background)] rounded-full transition-colors active:scale-95">
            <span className="material-symbols-outlined text-[var(--color-text-primary)]">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight line-clamp-1">{getPageTitle()}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Showing {isLoading ? '...' : filteredProducts.length} items
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined text-4xl animate-spin text-[var(--color-primary)]">progress_activity</span>
            <span className="mt-4 font-semibold text-sm">Searching...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-20 h-20 bg-[var(--color-surface)] rounded-full flex items-center justify-center border border-[var(--color-border)]">
              <span className="material-symbols-outlined text-4xl text-[var(--color-text-secondary)]">search_off</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">No products found</h3>
              <p className="text-[var(--color-text-secondary)]">Try adjusting your filters or search query.</p>
            </div>
            <button 
              onClick={() => navigate('/')} 
              className="mt-4 px-6 py-2.5 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 xl:gap-5">
            {filteredProducts.map((product) => (
              product.isAuction ? (
                // AUCTION CARD
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="w-full card-auction flex flex-col group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)] z-20"></div>
                  <div className="w-full aspect-square md:aspect-[4/3] bg-[var(--color-background)] relative overflow-hidden flex items-center justify-center border-b border-[var(--color-border)]">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="material-symbols-outlined text-[64px] text-[var(--color-border)] group-hover:scale-110 transition-transform duration-500">memory</span>
                    )}
                    <div className="absolute top-3 left-3 z-10">
                      <div className="badge-neutral bg-white/90 backdrop-blur-md text-[var(--color-primary)]">
                        <span>{product.heatIcon}</span>
                        {product.heat}
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-max z-10">
                      <div className="px-3 py-1 rounded-full bg-[var(--color-warning)] shadow-md text-xs font-bold text-[var(--color-primary-dark)] flex items-center gap-1.5 backdrop-blur-md">
                        <span className="material-symbols-outlined text-[14px]">timer</span>
                        {product.timeLeft} Left
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1 gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm md:text-base font-bold text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">{product.name}</h3>
                      <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 font-semibold bg-[var(--color-background)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                        <span className="material-symbols-outlined text-[14px]">group</span>
                        {product.bidders}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 mt-1 bg-[var(--color-primary)]/5 p-3 rounded-xl border border-[var(--color-primary)]/20">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">Current Bid</span>
                        <span className="text-lg md:text-xl font-black text-[var(--color-text-primary)]">{product.currentBid || product.price}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">Market Price</span>
                        <span className="text-xs font-semibold text-[var(--color-text-secondary)] line-through">{product.marketPrice || product.originalPrice}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${product.id}`);
                      }}
                      className="btn-auction w-full mt-1 h-8 md:h-10 text-xs md:text-sm"
                    >
                      Join Auction
                      <span className="material-symbols-outlined text-[16px] md:text-[18px]">gavel</span>
                    </button>
                  </div>
                </div>
              ) : (
                // NORMAL PRODUCT CARD
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="w-full card-interactive flex flex-col overflow-hidden group"
                >
                  <div className="w-full aspect-square md:aspect-[4/3] bg-[var(--color-background)] relative overflow-hidden flex items-center justify-center border-b border-[var(--color-border)]">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="material-symbols-outlined text-[64px] text-[var(--color-border)] group-hover:scale-110 transition-transform duration-500">memory</span>
                    )}
                    <div className="absolute top-3 left-3">
                      <div className="badge-neutral bg-white/90 backdrop-blur-md">
                        <span className={`w-2 h-2 rounded-full ${product.status === 'Available' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-primary)]'}`}></span>
                        {product.status || 'Available'}
                      </div>
                    </div>
                    <button 
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-all z-10 ${
                        wishlistIds.includes(product.id)
                          ? 'bg-rose-50 text-red-500 scale-105'
                          : 'bg-white/90 text-[var(--color-text-secondary)] hover:text-red-500 hover:scale-110 active:scale-95'
                      }`} 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      title={wishlistIds.includes(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      <span 
                        className="material-symbols-outlined text-[18px]"
                        style={wishlistIds.includes(product.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        favorite
                      </span>
                    </button>
                  </div>
                  <div className="p-3 flex flex-col flex-1 gap-1.5 md:gap-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider bg-[var(--color-background)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                        {product.condition}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {product.time || product.postedTime}
                      </div>
                    </div>
                    <h3 className="text-sm md:text-base font-bold text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">{product.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg md:text-xl font-bold text-[var(--color-text-primary)] leading-none">{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-[var(--color-text-secondary)] line-through leading-none font-medium">{product.originalPrice}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-[var(--color-border)]">
                      <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-primary)]">
                        <span className="material-symbols-outlined text-[16px] text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {product.rating || product.sellerRating}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-[var(--color-border)]"></div>
                      <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] font-medium line-clamp-1">
                        <span className="material-symbols-outlined text-[14px]">school</span>
                        {product.college || product.sellerCollege}
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
