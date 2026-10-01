import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { PRODUCTS } from '../data/products';
import apiClient from '../api/client';
import { supabase } from '../supabaseClient';

export const ComponentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);
  const [error, setError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [highestBid, setHighestBid] = useState(0);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [timeLeftStr, setTimeLeftStr] = useState("Loading...");
  const [auctionEndDate, setAuctionEndDate] = useState(null);

  useEffect(() => {
    if (currentProduct?.isAuction) {
       const created = currentProduct.createdAt ? new Date(currentProduct.createdAt) : new Date(Date.now() - 100000000);
       const end = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
       while (end < new Date()) {
           end.setDate(end.getDate() + 1);
       }
       setAuctionEndDate(end);
    }
  }, [currentProduct]);

  useEffect(() => {
    if (!isBidModalOpen || !auctionEndDate) return;

    const tick = () => {
        const now = new Date();
        const diff = auctionEndDate - now;
        
        if (diff <= 0) {
            setTimeLeftStr("Ended");
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        setTimeLeftStr(`${d}d ${h}h ${m}m ${s}s`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isBidModalOpen, auctionEndDate]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let comp = null;
        let allComps = [];

        try {
          const response = await apiClient.get(`/components/${id}`);
          comp = response.data;
        } catch (apiErr) {
          const staticFallback = PRODUCTS.find(p => String(p.id) === String(id));
          if (staticFallback) {
            comp = staticFallback;
          } else {
            throw apiErr;
          }
        }

        try {
          const allRes = await apiClient.get(`/components`);
          allComps = allRes.data || [];
        } catch (e) {
          allComps = PRODUCTS;
        }

        const rawPrice = comp.price;
        const formattedPrice = typeof rawPrice === 'number' ? `₹${rawPrice}` : (rawPrice || '₹0');
        const formattedOriginal = comp.originalPrice || (typeof rawPrice === 'number' ? `₹${rawPrice + 200}` : '₹999');

        const mappedProduct = {
          id: comp.id,
          name: comp.title || comp.name,
          price: formattedPrice,
          originalPrice: formattedOriginal,
          condition: comp.condition || 'Good',
          availability: comp.status === 'ACTIVE' || comp.availability === 'In Stock' || comp.availability === 'Available' ? 'Available' : 'Sold',
          sellerRating: comp.sellerRating || comp.rating || '5.0',
          sellerCollege: comp.sellerCollege || comp.college || 'SKCT',
          postedTime: comp.postedTime || comp.time || 'Just now',
          description: comp.why_sell || comp.tech_specs || comp.description || '',
          category: comp.category || 'Electronics',
          isAuction: comp.listing_type === 'AUCTION' || comp.isAuction === true,
          createdAt: comp.createdAt,
          images: comp.images?.length > 0 ? comp.images : (comp.image ? [comp.image] : ['https://picsum.photos/800/800?random=99']),
          image: comp.image_url || (comp.images?.length > 0 ? comp.images[0] : (comp.image || 'https://picsum.photos/800/800?random=99')),
          seller: { 
            id: comp.seller_id || comp.seller?.id || 'maker-1',
            name: comp.seller?.name || 'Maker', 
            avatar: comp.seller?.avatar_url || comp.seller?.avatar || 'https://i.pravatar.cc/150?u=maker', 
            role: comp.seller?.role || 'Member',
            college: comp.seller?.college || 'SKCT',
            isVerified: comp.seller?.isVerified ?? true,
            rating: comp.seller?.rating || '4.9',
            responseTime: comp.seller?.responseTime || '< 1 hr'
          },
          specs: comp.specs || [
            { label: 'Category', value: comp.category || 'Electronics' },
            { label: 'Condition', value: comp.condition || 'Good' },
            ...(comp.tech_specs ? [{ label: 'Tech Specs', value: comp.tech_specs }] : [])
          ],
          techSpecs: comp.tech_specs || '',
          whySell: comp.why_sell || ''
        };
        
        const related = (allComps.length > 0 ? allComps : PRODUCTS)
          .filter(c => String(c.id) !== String(id))
          .map(c => ({
            id: c.id,
            name: c.title || c.name,
            price: typeof c.price === 'number' ? `₹${c.price}` : c.price,
            condition: c.condition,
            image: c.image_url || (c.images?.length > 0 ? c.images[0] : c.image)
          }))
          .slice(0, 4);
          
        setCurrentProduct(mappedProduct);
        setActiveImage(mappedProduct.images[0]);
        setRelatedProducts(related);

        const storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setIsInWishlist(storedWishlist.some(item => String(item.id) === String(mappedProduct.id)));
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  const toggleWishlist = () => {
    if (!currentProduct) return;
    const stored = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (isInWishlist) {
      const newWishlist = stored.filter(item => String(item.id) !== String(currentProduct.id));
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      setIsInWishlist(false);
    } else {
      stored.push({
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        image: currentProduct.image,
        condition: currentProduct.condition
      });
      localStorage.setItem('wishlist', JSON.stringify(stored));
      setIsInWishlist(true);
    }
    window.dispatchEvent(new Event('wishlistUpdate'));
  };

  const handleShare = async () => {
    if (!currentProduct) return;
    const shareData = {
      title: `MakerMart - ${currentProduct.name}`,
      text: `Check out ${currentProduct.name} for ${currentProduct.price} on MakerMart!`,
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Product link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
        alert("Failed to copy link.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--color-background)] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (error || !currentProduct) {
    return (
      <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] min-h-screen flex flex-col items-center justify-center p-4 pb-24">
        <div className="w-24 h-24 bg-[var(--color-surface)] rounded-full flex items-center justify-center text-[var(--color-text-secondary)] mb-6 shadow-sm border border-[var(--color-border)]">
           <span className="material-symbols-outlined text-[48px]">search_off</span>
        </div>
        <h1 className="text-h1 mb-2 text-center">Product Not Found</h1>
        <p className="text-body text-[var(--color-text-secondary)] mb-8 text-center max-w-md">The product you are looking for does not exist, has been removed, or was already sold.</p>
        <button onClick={() => navigate(-1)} className="btn-primary">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Go Back
        </button>
      </div>
    );
  }

  const DUMMY_PRODUCT = currentProduct;

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative">
      
      {/* TopAppBar */}
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="btn-icon">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">MakerMart</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-icon" onClick={() => navigate('/wishlist')}>
              <span className="material-symbols-outlined text-[var(--color-danger)]">
                {isInWishlist ? 'favorite' : 'favorite_border'}
              </span>
            </button>
            <button className="btn-icon" onClick={handleShare}>
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Column: Images */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="w-full aspect-square md:max-h-[500px] rounded-[24px] overflow-hidden bg-[var(--color-background)] border border-[var(--color-border)] group relative shadow-sm flex items-center justify-center">
                <img 
                  src={activeImage} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 origin-center"
                  alt="Product Main"
                  onError={(e) => { e.target.src = 'https://placehold.co/800x800/F8FAFC/46A857?text=Image+Not+Found'; }}
                />
              </div>
              
              <div className="flex gap-3 overflow-x-auto hide-scrollbar py-1">
                {DUMMY_PRODUCT.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${activeImage === img ? 'border-[var(--color-primary)] shadow-md opacity-100 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx}`} onError={(e) => { e.target.src = 'https://placehold.co/800x800/F8FAFC/46A857?text=Image+Not+Found'; }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="md:col-span-7 flex flex-col gap-6 md:h-[calc(100vh-180px)] md:overflow-y-auto hide-scrollbar md:pr-4 pb-12">
              
              {/* Header Info */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge-neutral">
                    {DUMMY_PRODUCT.condition}
                  </span>
                  <span className="badge-primary">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
                    {DUMMY_PRODUCT.availability}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] font-medium ml-auto">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {DUMMY_PRODUCT.postedTime}
                  </div>
                </div>
                
                <h1 className="text-h1 leading-tight mt-1">
                  {DUMMY_PRODUCT.name}
                </h1>
                
                <div className="flex items-end gap-3 mt-1">
                  <span className="text-4xl md:text-5xl font-black text-[var(--color-text-primary)] tracking-tight">{DUMMY_PRODUCT.price}</span>
                  {DUMMY_PRODUCT.originalPrice && (
                    <span className="text-lg font-semibold text-[var(--color-text-secondary)] line-through mb-1.5">{DUMMY_PRODUCT.originalPrice}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm font-semibold text-[var(--color-text-secondary)] mt-2 border-b border-[var(--color-border)] pb-5">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px] text-[var(--color-warning)]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    <span className="text-[var(--color-text-primary)]">{DUMMY_PRODUCT.sellerRating}</span> Seller Rating
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-border)]"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px]">school</span>
                    {DUMMY_PRODUCT.sellerCollege}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <h3 className="text-h3">Description</h3>
                <p className="text-body text-[var(--color-text-secondary)]">
                  {DUMMY_PRODUCT.description}
                </p>
              </div>

              {/* Specifications */}
              <div className="flex flex-col gap-3 mt-2">
                <h3 className="text-h3">Specifications</h3>
                <div className="bg-[var(--color-surface)] rounded-[24px] border border-[var(--color-border)] shadow-sm overflow-hidden">
                  {DUMMY_PRODUCT.specs.map((spec, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-5 ${idx !== DUMMY_PRODUCT.specs.length - 1 ? 'border-b border-[var(--color-border)]' : ''} hover:bg-[var(--color-background)] transition-colors`}>
                      <span className="text-[var(--color-text-secondary)] font-semibold">{spec.label}</span>
                      <span className="font-bold text-[var(--color-text-primary)]">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seller Card */}
              <div className="mt-4 bg-[var(--color-surface)] rounded-[24px] border border-[var(--color-border)] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-5">
                  <img src={DUMMY_PRODUCT.seller.avatar} alt={DUMMY_PRODUCT.seller.name} className="w-16 h-16 rounded-full border border-[var(--color-border)] shadow-sm object-cover" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-[var(--color-text-primary)] text-xl">{DUMMY_PRODUCT.seller.name}</h4>
                      {DUMMY_PRODUCT.seller.isVerified && (
                        <span className="material-symbols-outlined text-[var(--color-info)] text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-text-secondary)]">{DUMMY_PRODUCT.seller.college}</span>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium text-[var(--color-text-secondary)]">
                       <span className="flex items-center gap-1.5 badge-neutral"><span className="material-symbols-outlined text-[16px] text-[var(--color-warning)]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>{DUMMY_PRODUCT.seller.rating}</span>
                       <span className="flex items-center gap-1.5 badge-neutral"><span className="material-symbols-outlined text-[16px] text-[var(--color-success)]">bolt</span>{DUMMY_PRODUCT.seller.responseTime}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/user/${DUMMY_PRODUCT.seller.id}`)}
                  className="btn-outline w-full sm:w-auto"
                >
                  View Profile
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {currentProduct.isAuction ? (
                  <button 
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) {
                        alert("Please log in to join the auction.");
                        return;
                      }
                      try {
                        const { data: profile } = await apiClient.get(`/users/${user.id}`);
                        if (!profile.is_profile_verified) {
                          alert("Your profile is pending admin verification. You can only join auctions after verification.");
                          return;
                        }
                        const currentPrice = parseInt(String(currentProduct.price).replace(/[^0-9]/g, ''), 10) || 0;
                        try {
                          const { data: bids } = await apiClient.get(`/components/${currentProduct.id}/bids`);
                          if (bids && bids.length > 0) {
                            setHighestBid(bids[0].amount);
                            setBidAmount((bids[0].amount + 10).toString());
                            setBidHistory(bids);
                          } else {
                            setHighestBid(currentPrice);
                            setBidAmount((currentPrice + 10).toString());
                            setBidHistory([]);
                          }
                        } catch (e) {
                          setHighestBid(currentPrice);
                          setBidAmount((currentPrice + 10).toString());
                        }
                        setBidSuccess(false);
                        setIsBidModalOpen(true);
                      } catch (err) {
                        console.error("Error checking verification:", err);
                      }
                    }}
                    className="btn-auction col-span-1 sm:col-span-2 py-4 text-lg"
                  >
                    <span className="material-symbols-outlined text-[24px]">gavel</span>
                    Join Auction
                  </button>
                ) : (
                  <button 
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) {
                        alert("Please log in to purchase.");
                        return;
                      }
                      if (currentProduct.seller?.id && user.id === currentProduct.seller.id) {
                        alert("This is your own listing! You cannot purchase your own item.");
                        return;
                      }
                      try {
                        const { data: profile } = await apiClient.get(`/users/${user.id}`);
                        if (!profile.is_profile_verified) {
                          alert("Your profile is pending admin verification. You can only buy after verification.");
                          return;
                        }
                        navigate(`/checkout/${currentProduct.id}`);
                      } catch (err) {
                        console.error("Error checking verification:", err);
                      }
                    }} 
                    className="btn-primary col-span-1 sm:col-span-2 py-4 text-lg"
                  >
                    <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
                    Buy Now
                  </button>
                )}
                
                <button onClick={async (e) => {
                  const btn = e.currentTarget;
                  const originalHtml = btn.innerHTML;
                  btn.disabled = true;
                  btn.innerHTML = '<span class="animate-spin material-symbols-outlined text-[20px]">sync</span> Starting...';
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                      alert("Please log in to chat.");
                      btn.disabled = false;
                      btn.innerHTML = originalHtml;
                      return;
                    }
                    if (currentProduct.seller?.id && user.id === currentProduct.seller.id) {
                      alert("This is your own listing! You can manage or edit it from your profile.");
                      btn.disabled = false;
                      btn.innerHTML = originalHtml;
                      return;
                    }
                    const { data: profile } = await apiClient.get(`/users/${user.id}`);
                    if (!profile.is_profile_verified) {
                      alert("Your profile is pending admin verification. You can only chat after verification.");
                      btn.disabled = false;
                      btn.innerHTML = originalHtml;
                      return;
                    }

                    const sellerId = currentProduct.seller?.id || 'maker-1';
                    const res = await apiClient.post('/chats', {
                      seller_id: sellerId,
                      component_id: currentProduct.id
                    });
                    navigate(`/chat/${res.data.id}`);
                  } catch (err) {
                    console.error("Error creating chat:", err);
                    alert("Could not start chat.");
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                  }
                }} className="btn-secondary py-3.5">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  Chat with Seller
                </button>
                <button onClick={toggleWishlist} className={`btn-secondary py-3.5 group ${isInWishlist ? 'text-[var(--color-danger)] border-[var(--color-danger)]' : ''}`}>
                  <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform" style={isInWishlist ? {fontVariationSettings: "'FILL' 1"} : {}}>favorite</span>
                  {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
              </div>

            </div>
          </div>

          {/* Related Products */}
          <section className="mt-16 pt-8 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h2">Related Products</h2>
              <button onClick={() => navigate(currentProduct?.category ? `/products?category=${currentProduct.category}` : '/products')} className="text-[var(--color-primary)] font-bold hover:underline flex items-center gap-1 group bg-[var(--color-primary)]/5 px-4 py-2 rounded-full transition-colors hover:bg-[var(--color-primary)]/10">
                View All 
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
            
            <div className="flex overflow-x-auto gap-5 pb-8 hide-scrollbar snap-x">
              {relatedProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  onClick={() => navigate(`/product/${prod.id}`)}
                  className="snap-start shrink-0 w-[240px] card-interactive flex flex-col group"
                >
                  <div className="w-full aspect-square bg-[var(--color-background)] relative overflow-hidden flex items-center justify-center">
                    {prod.image ? (
                      <img src={prod.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={prod.name} onError={(e) => { e.target.onerror = null; e.target.src = `https://picsum.photos/800/800?random=${prod.id}`; }} />
                    ) : (
                      <span className="material-symbols-outlined text-[64px] text-[var(--color-border)] group-hover:scale-110 transition-transform duration-500">memory</span>
                    )}
                    <div className="absolute top-3 left-3 badge-neutral bg-white/95 backdrop-blur-md">
                      {prod.condition}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-2 bg-[var(--color-surface)] z-10">
                    <h4 className="font-bold text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors text-lg">{prod.name}</h4>
                    <span className="text-2xl font-black text-[var(--color-text-primary)]">{prod.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Bid Modal */}
      {isBidModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsBidModalOpen(false)}></div>
          <div className="relative z-10 w-[90vw] max-w-[450px] bg-[var(--color-surface)] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-warning)] text-[var(--color-primary-dark)]">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">gavel</span>
                Live Auction Room
              </h2>
              <button onClick={() => setIsBidModalOpen(false)} className="p-1 hover:bg-black/10 rounded-full transition-colors flex">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              {bidSuccess ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2 shadow-inner">
                    <span className="material-symbols-outlined text-5xl">verified</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">Bid Placed Successfully!</h3>
                  <p className="text-[var(--color-text-secondary)] text-lg">You are currently the highest bidder with <br/><span className="font-black text-2xl text-[var(--color-primary-dark)] mt-2 inline-block">₹{highestBid}</span></p>
                  <button onClick={() => setIsBidModalOpen(false)} className="btn-primary w-full mt-6">Continue Browsing</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-background)]">
                    <img src={currentProduct?.image} alt={currentProduct?.name} className="w-16 h-16 object-cover rounded-xl shadow-sm" />
                    <div>
                      <h4 className="font-bold text-[var(--color-text-primary)] text-lg line-clamp-1">{currentProduct?.name}</h4>
                      <div className="text-sm font-bold text-[var(--color-warning-dark)] flex items-center gap-1 mt-1 bg-[var(--color-warning)]/20 w-fit px-2 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-[16px]">timer</span>
                        Ends in {timeLeftStr}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center py-4 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] relative">
                    <div className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Current Highest Bid</div>
                    <div className="text-5xl font-black text-[var(--color-primary-dark)]">₹{highestBid}</div>
                    {bidHistory.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-left px-4">
                        <div className="text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase">Recent Bids</div>
                        <div className="max-h-24 overflow-y-auto pr-2 flex flex-col gap-2 custom-scrollbar">
                          {bidHistory.map((b, i) => (
                            <div key={b.id || i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <img src={b.bidder?.avatar_url || 'https://i.pravatar.cc/150?u=' + (b.bidder_id || '1')} className="w-6 h-6 rounded-full" />
                                <span className="font-medium truncate max-w-[120px]">{b.bidder?.name || 'User'}</span>
                              </div>
                              <span className="font-bold text-[var(--color-primary-dark)]">₹{b.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-2">Your Bid Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--color-text-secondary)] text-xl">₹</span>
                      <input 
                        type="number" 
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl py-4 pl-12 pr-4 font-black text-2xl focus:border-[var(--color-primary)] focus:outline-none transition-colors shadow-inner"
                        placeholder={(highestBid + 10).toString()}
                        min={highestBid + 10}
                      />
                    </div>
                    <p className="text-xs font-medium text-[var(--color-text-secondary)] mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      Minimum bid increment is ₹10
                    </p>
                  </div>
                  
                  <button 
                    onClick={async () => {
                      const amount = parseInt(bidAmount, 10);
                      if (amount > highestBid) {
                        try {
                          const res = await apiClient.post(`/components/${currentProduct.id}/bids`, { amount });
                          setHighestBid(amount);
                          setBidSuccess(true);
                          setBidHistory([res.data, ...bidHistory]); // Add new bid to history
                        } catch (err) {
                          alert("Failed to place bid. Please try again.");
                        }
                      } else {
                        alert(`Bid must be higher than current highest bid (₹${highestBid})`);
                      }
                    }}
                    className="btn-auction w-full py-4 text-xl mt-2 shadow-lg"
                  >
                    Place Bid
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};
