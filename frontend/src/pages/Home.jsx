import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import apiClient from '../api/client';
import { getWishlist, toggleWishlist } from '../utils/wishlistStorage';
import { addToCart, getCartCount } from '../utils/cartStorage';
import { getSellerName, getProductDatePosted } from '../utils/productUtils';
import { realtimeService } from '../services/realtimeService';
import { PostEventModal } from '../components/PostEventModal';

const BANNERS = [
  {
    id: 1,
    title: "👨‍💻 Campus Hackathon '26",
    content: (
      <div className="space-y-1">
        <div className="flex items-center gap-2"><span className="text-xl">⏱️</span><span>48 Hours of Coding.</span></div>
        <div className="flex items-center gap-2"><span className="text-xl">🏆</span><span>Win ₹50,000 Prizes.</span></div>
        <div className="flex items-center gap-2"><span className="text-xl">🍕</span><span>Free Food & Swag.</span></div>
      </div>
    ),
    button: "Register Now",
    bg: "bg-[var(--color-primary-dark)]",
    textColor: "text-[var(--color-text-inverse)]",
    btnBg: "bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] hover:opacity-90 shadow-sm",
    link: "/events/hackathon"
  },
  {
    id: 2,
    title: "🏭 Tech Innovation Expo",
    content: (
      <div className="whitespace-pre-line leading-relaxed">
        {"Showcase your best Maker projects\nto industry leaders and investors."}
      </div>
    ),
    button: "Book a Stall",
    bg: "bg-[var(--color-primary-dark)]",
    textColor: "text-[var(--color-text-inverse)]",
    btnBg: "bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] hover:opacity-90 shadow-sm",
    link: "/events/expo"
  },
  {
    id: 3,
    title: "🤖 Robotics Workshop",
    content: (
      <div className="whitespace-pre-line leading-relaxed">
        {"Learn to build autonomous robots.\nNo prior experience required!"}
      </div>
    ),
    button: "Join Workshop",
    bg: "bg-[var(--color-primary-dark)]",
    textColor: "text-[var(--color-text-inverse)]",
    btnBg: "bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] hover:opacity-90 shadow-sm",
    link: "/events/workshop"
  },
  {
    id: 4,
    title: "🎉 Campus Events",
    content: (
      <div className="space-y-1">
        <div className="font-bold text-lg">Join guest lectures & seminars.</div>
        <div>Stay updated with all campus activities.</div>
      </div>
    ),
    button: "View Calendar",
    bg: "bg-[var(--color-primary-dark)]",
    textColor: "text-[var(--color-text-inverse)]",
    btnBg: "bg-[var(--color-accent-light)] text-[var(--color-primary-dark)] hover:opacity-90 shadow-sm font-bold",
    link: "/events/campus"
  }
];

export const Home = () => {
  const navigate = useNavigate();
  const [activeBanner, setActiveBanner] = useState(0);
  const [events, setEvents] = useState([]);
  const [components, setComponents] = useState([]);
  const [userCount, setUserCount] = useState('1,256');
  const [wishlistIds, setWishlistIds] = useState(() => getWishlist().map(item => item.id));
  const [cartCount, setCartCount] = useState(() => getCartCount());
  const [toastProduct, setToastProduct] = useState(null);
  const [showPostEventModal, setShowPostEventModal] = useState(false);

  useEffect(() => {
    const handleWishlistUpdate = () => {
      setWishlistIds(getWishlist().map(item => item.id));
    };
    const handleCartUpdate = () => {
      setCartCount(getCartCount());
    };
    window.addEventListener('wishlistUpdate', handleWishlistUpdate);
    window.addEventListener('cartUpdate', handleCartUpdate);
    return () => {
      window.removeEventListener('wishlistUpdate', handleWishlistUpdate);
      window.removeEventListener('cartUpdate', handleCartUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, compRes, usersRes] = await Promise.all([
          apiClient.get('/events').catch(() => ({ data: [] })),
          apiClient.get('/components').catch(() => ({ data: [] })),
          apiClient.get('/users').catch(() => ({ data: [] }))
        ]);
        
        setEvents(eventsRes.data || []);
        if (usersRes.data && usersRes.data.length > 0) {
          const totalMakers = Math.max(usersRes.data.length, 1200 + usersRes.data.length);
          setUserCount(totalMakers.toLocaleString());
        }
        
        // Map backend components to frontend format
        const mappedComponents = (compRes.data || []).map(comp => ({
          id: comp.id,
          name: comp.title,
          price: `₹${comp.price}`,
          originalPrice: `₹${comp.price + 200}`,
          currentBid: `₹${comp.price}`,
          marketPrice: `₹${comp.price + 200}`,
          timeLeft: 'Live',
          heat: 'Trending',
          heatIcon: '🔥',
          bidders: comp.bids?.length ? `${comp.bids.length}` : '3',
          condition: comp.condition,
          status: comp.status === 'ACTIVE' ? 'Available' : 'Sold',
          rating: '5.0',
          college: comp.seller?.college || 'SKCT',
          seller: comp.seller,
          sellerName: getSellerName(comp),
          createdAt: comp.createdAt,
          datePosted: getProductDatePosted(comp),
          time: getProductDatePosted(comp),
          description: comp.why_sell || comp.tech_specs || '',
          category: comp.category,
          isAuction: comp.listing_type === 'AUCTION',
          images: comp.images?.length > 0 ? comp.images : ['https://picsum.photos/800/800?random=99'],
          image: comp.image_url || (comp.images?.length > 0 ? comp.images[0] : 'https://picsum.photos/800/800?random=99')
        }));
        setComponents(mappedComponents);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const bidSub = realtimeService.subscribeToAuctionBids((payload) => {
      if (payload.componentId && payload.newPrice) {
        setComponents(prev => prev.map(c => {
          if (c.id === payload.componentId) {
            return {
              ...c,
              price: `₹${payload.newPrice}`,
              originalPrice: `₹${payload.newPrice + 200}`
            };
          }
          return c;
        }));
      }
    });

    const compSub = realtimeService.subscribeToComponentUpdates((payload) => {
      const updated = payload.new;
      if (updated?.id) {
        setComponents(prev => prev.map(c => {
          if (c.id === updated.id) {
            return {
              ...c,
              price: `₹${updated.price}`,
              status: updated.status === 'ACTIVE' ? 'Available' : 'Sold'
            };
          }
          return c;
        }));
      }
    });

    return () => {
      realtimeService.unsubscribe(bidSub);
      realtimeService.unsubscribe(compSub);
    };
  }, []);

  const getCategoryCount = (categoryName) => {
    const firstWord = categoryName.split(' ')[0].toLowerCase();
    const count = components.filter(c => c.category && c.category.toLowerCase().includes(firstWord)).length;
    if (count > 0) return `${count} ${count === 1 ? 'Item' : 'Items'}`;
    return 'Browse';
  };

  const allRecent = components.filter(c => !c.isAuction && c.status !== 'Sold');

  const allAuctions = components.filter(c => c.isAuction && c.status !== 'Sold');

  const displayBanners = events.length > 0 ? events.map(e => ({
    id: e.id,
    title: e.title,
    content: (
      <div className="space-y-1">
        {e.description && e.description.map((desc, i) => (
          <div key={i} className="flex items-center gap-2"><span>{desc}</span></div>
        ))}
      </div>
    ),
    button: e.buttonText,
    bg: e.bgClass,
    textColor: e.textClass,
    btnBg: e.btnClass,
    link: e.link
  })) : BANNERS;
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour === 12) return 'Good Noon';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 20) return 'Good Evening';
    return 'Good Night';
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchSuggestions = searchQuery.trim() ? components.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) : [];
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');

  const applyFilters = () => {
    let url = '/products?';
    const params = new URLSearchParams();
    if (filterCategory) params.append('category', filterCategory);
    if (filterType) params.append('type', filterType);
    
    navigate(url + params.toString());
    setIsFilterOpen(false);
  };

  const handleBannerScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const itemWidth = e.target.firstElementChild?.offsetWidth || e.target.offsetWidth;
    const index = Math.round(scrollLeft / itemWidth);
    if (index !== activeBanner && index >= 0 && index < displayBanners.length) {
      setActiveBanner(index);
    }
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative">

      {/* TopAppBar */}
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[var(--color-primary)] flex items-center justify-center text-white font-black text-xl">M</div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-[var(--color-primary)] leading-tight tracking-tight">MakerMart</span>
              <div className="flex items-center gap-0.5 text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                <span className="text-xs font-medium line-clamp-1 max-w-[150px]">Sri Krishna Institutions</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-icon" onClick={() => navigate('/wishlist')} title="Wishlist">
              <span className="material-symbols-outlined text-[var(--color-danger)]">favorite</span>
            </button>
            <button className="btn-icon relative" onClick={() => navigate('/cart')} title="Shopping Cart">
              <span className="material-symbols-outlined text-[var(--color-primary)]">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--color-primary)] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full border-2 border-[var(--color-surface)] animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </button>
            <button className="btn-icon" onClick={() => setIsFilterOpen(true)} title="Filter">
              <span className="material-symbols-outlined">tune</span>
            </button>
          </div>
        </div>
      </header>

      {/* Filter Slide-over */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
          <div className="absolute top-0 right-0 w-full md:w-[450px] h-full bg-[var(--color-surface)] shadow-2xl flex flex-col z-10">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--color-text-primary)]">
                <span className="material-symbols-outlined text-[var(--color-primary)]">tune</span>
                Filter Products
              </h2>
              <button onClick={() => setIsFilterOpen(false)} className="btn-icon">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-8">
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-3">Category</label>
                <div className="relative">
                  <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full appearance-none bg-[var(--color-background)] border-2 border-[var(--color-border)] rounded-xl px-4 py-3.5 text-[var(--color-text-primary)] font-medium focus:border-[var(--color-primary)] focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    <option value="Processing Units">Processing Units</option>
                    <option value="Sensors">Sensors</option>
                    <option value="Actuators and Displays">Actuators and Displays</option>
                    <option value="Communication Modules">Communication Modules</option>
                    <option value="Power Management">Power Management</option>
                    <option value="Discrete & Analog Components">Discrete & Analog</option>
                    <option value="Prototyping & Manufacturing Gear">Prototyping Gear</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none">expand_more</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[var(--color-text-secondary)] mb-3">Listing Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setFilterType('')} className={`py-3 rounded-xl font-bold border-2 transition-all ${filterType === '' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] shadow-sm' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]'}`}>All Types</button>
                  <button onClick={() => setFilterType('recent')} className={`py-3 rounded-xl font-bold border-2 transition-all ${filterType === 'recent' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] shadow-sm' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]'}`}>Recently Added</button>
                  <button onClick={() => setFilterType('auction')} className={`py-3 rounded-xl font-bold border-2 transition-all col-span-2 flex items-center justify-center gap-2 ${filterType === 'auction' ? 'border-[var(--color-warning)] bg-[var(--color-warning)]/10 text-[var(--color-warning-dark)] shadow-sm' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]'}`}>
                    <span className="material-symbols-outlined text-[20px]">gavel</span>
                    Live Auctions
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-[var(--color-border)] flex gap-4 bg-[var(--color-surface)]">
              <button 
                onClick={() => { setFilterCategory(''); setFilterType(''); }}
                className="flex-1 py-3.5 rounded-xl font-bold text-[var(--color-text-secondary)] bg-[var(--color-background)] border border-[var(--color-border)] hover:bg-gray-100 transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={applyFilters}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[var(--color-primary)] shadow-md shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-95 transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] py-6 space-y-12">
        {/* Hero Section */}
        <section className="animate-in fade-in duration-700">
          {/* Main Hero Card */}
          <div className="bg-zinc-100 dark:bg-zinc-900 text-[var(--color-text-primary)] rounded-3xl p-6 md:p-8 shadow-sm border border-[var(--color-border)] relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--color-accent-light)] rounded-full mix-blend-multiply filter blur-3xl opacity-30 group-hover:scale-105 transition-transform duration-700 -translate-y-1/4 translate-x-1/4"></div>

            <div className="relative z-10 flex flex-col gap-3 w-full md:w-3/4 lg:w-2/3">
              <p className="text-base md:text-lg text-[var(--color-text-secondary)] font-medium tracking-wide">
                {getGreeting()}, Engineer 👋
              </p>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight">
                The Trusted Campus Marketplace<br className="hidden md:block" /> for Electronics.
              </h1>

              <div className="mt-2">
                <p className="text-base md:text-lg text-[var(--color-primary-dark)] bg-[var(--color-accent-light)] inline-block px-5 py-2.5 rounded-xl font-bold shadow-sm">
                  Buy. Sell. Reuse. <span className="font-medium text-[var(--color-primary-dark)]/80 ml-1">Safely inside your campus.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Featured Banner Carousel */}
          <div className="mt-8 mb-8">
            <h2 className="text-h3 mb-4">📅 Upcoming Events</h2>
            <div className="relative">
              <div
                onScroll={handleBannerScroll}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2 pt-2 px-1 -mx-1"
              >
                {displayBanners.map((banner) => (
                  <div
                    key={banner.id}
                    className="snap-center shrink-0 w-[85vw] md:w-[60vw] lg:w-[45vw] max-w-[500px]"
                  >
                    <div 
                      onClick={() => {
                        if (banner.isHostEventCard) {
                          setShowPostEventModal(true);
                          return;
                        }
                        if (banner.link && banner.link.startsWith('http')) {
                          window.open(banner.link, '_blank', 'noopener,noreferrer');
                        } else if (banner.link) {
                          navigate(banner.link);
                        }
                      }}
                      className={`h-full ${banner.bg} ${banner.textColor} rounded-3xl p-6 md:p-8 flex flex-col justify-between gap-6 min-h-[220px] relative overflow-hidden group border border-[var(--color-border)] shadow-sm cursor-pointer transition-transform hover:-translate-y-1`}
                    >
                      <div className="relative z-10 flex flex-col gap-2">
                        <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{banner.title}</h3>
                        <div className="text-base md:text-lg opacity-90 font-medium">
                          {banner.content}
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (banner.isHostEventCard) {
                            setShowPostEventModal(true);
                            return;
                          }
                          if (banner.link && banner.link.startsWith('http')) {
                            window.open(banner.link, '_blank', 'noopener,noreferrer');
                          } else if (banner.link) {
                            navigate(banner.link);
                          }
                        }}
                        className={`relative z-10 w-fit px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 ${banner.btnBg}`}
                      >
                        {banner.button}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Indicator Dots */}
              <div className="flex justify-center gap-2 mt-4">
                {displayBanners.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${activeBanner === idx ? 'w-6 bg-[var(--color-primary)]' : 'w-2 bg-[var(--color-border)]'}`}
                  />
                ))}
              </div>

              {/* Post New Event Action Callout */}
              <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:border-[var(--color-primary)]/40 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center font-bold shrink-0">
                    <span className="material-symbols-outlined text-2xl">campaign</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)]">
                      Organizing a Hackathon, Expo or Workshop?
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      Submit your event proposal, posters & registration links. Admin will review and feature it live!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPostEventModal(true)}
                  className="btn-primary py-2.5 px-6 text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap shadow-md active:scale-95 shrink-0"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Post New Event
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { label: 'Products', value: components.length > 0 ? components.length.toLocaleString() : '2,348', icon: 'inventory_2' },
              { label: 'Students', value: userCount, icon: 'school' },
              { label: 'Live Auctions', value: components.length > 0 ? components.filter(c => c.isAuction).length.toString() : '18', icon: 'gavel', color: 'var(--color-primary)' },
              { label: 'E-Waste Saved', value: '1.8T', icon: 'recycling' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-[var(--color-surface)] rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-[var(--color-border)] group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300" style={{ backgroundColor: stat.color ? `${stat.color}15` : 'var(--color-primary)15', color: stat.color || 'var(--color-primary)' }}>
                  <span className="material-symbols-outlined text-[26px]">{stat.icon}</span>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] leading-none mb-1">{stat.value}</div>
                  <div className="text-xs text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Search Bar & Categories */}
        <section>
          <div className="w-full mb-8 relative">
            <div className="relative w-full flex items-center bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl shadow-sm focus-within:ring-4 focus-within:ring-[var(--color-primary)]/20 focus-within:border-[var(--color-primary)] transition-all hover:border-[var(--color-primary)]/50 hover:shadow-md">
              <span className="material-symbols-outlined text-[var(--color-text-secondary)] pl-5 pr-2 text-2xl">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="flex-1 bg-transparent border-none focus:ring-0 py-4 pr-4 text-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/60 focus:outline-none w-full"
                placeholder="Search components, microcontrollers, and vintage electronics..."
                type="text"
              />
              <button 
                onClick={() => {
                  if (searchQuery.trim()) {
                    navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="bg-[var(--color-primary-dark)] text-[var(--color-text-inverse)] px-8 py-3 rounded-xl mr-2 font-bold hover:bg-[var(--color-primary)] transition-colors text-base shadow-sm"
              >
                Search
              </button>
            </div>
            
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg overflow-hidden">
                {searchSuggestions.map((suggestion) => (
                  <div 
                    key={suggestion.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchQuery(suggestion.name);
                      setShowSuggestions(false);
                    }}
                    className="px-5 py-3 hover:bg-[var(--color-background)] cursor-pointer flex items-center gap-3 border-b border-[var(--color-border)] last:border-b-0 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[var(--color-text-secondary)]">search</span>
                    <div>
                      <div className="font-medium text-[var(--color-text-primary)]">{suggestion.name}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">{suggestion.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h2 className="text-h3 mb-4">⚡ Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4 pb-4 pt-2">
            {[
              { name: 'Processing Units', count: getCategoryCount('Processing Units'), icon: 'memory' },
              { name: 'Sensors', count: getCategoryCount('Sensors'), icon: 'sensors' },
              { name: 'Actuators and Displays', count: getCategoryCount('Actuators and Displays'), icon: 'smart_display' },
              { name: 'Communication Modules', count: getCategoryCount('Communication Modules'), icon: 'router' },
              { name: 'Power Management Electronics', count: getCategoryCount('Power Management'), icon: 'battery_full' },
              { name: 'Discrete & Analog Components', count: getCategoryCount('Discrete & Analog'), icon: 'electric_bolt' },
              { name: 'Prototyping & Manufacturing Gear', count: getCategoryCount('Prototyping'), icon: 'precision_manufacturing' },
              { name: 'Enclosures & Mechanical Shells', count: getCategoryCount('Enclosures'), icon: 'inventory_2' },
            ].map((cat, idx) => (
              <div
                key={idx}
                onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                className="card-interactive p-4 flex flex-col items-center justify-start text-center gap-3 group cursor-pointer h-full"
              >
                <div className="w-14 h-14 rounded-full bg-[var(--color-background)] flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary-dark)] group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-[28px]">{cat.icon}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight mb-1">{cat.name}</h3>
                  <p className="text-xs font-medium text-[var(--color-text-secondary)]">{cat.count}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recently Added */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3">🆕 Recently Added</h2>
            <button onClick={() => navigate('/products?type=recent')} className="text-[var(--color-primary)] font-bold text-sm hover:underline flex items-center gap-1 group">
              View All
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>

          {allRecent.length > 0 ? (
          <div className="flex overflow-x-auto gap-5 pb-4 pt-2 px-1 -mx-1 hide-scrollbar snap-x">
            {allRecent.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="snap-start shrink-0 w-[280px] card-interactive flex flex-col overflow-hidden group"
              >
                {/* Image Section */}
                <div className="w-full aspect-square bg-[var(--color-background)] relative overflow-hidden flex items-center justify-center border-b border-[var(--color-border)]">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://picsum.photos/800/800?random=${product.id}`; }} 
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[64px] text-[var(--color-border)] group-hover:scale-110 transition-transform duration-500">memory</span>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <div className="badge-neutral bg-white/90 backdrop-blur-md">
                      <span className={`w-2 h-2 rounded-full ${product.status === 'Available' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-primary)]'}`}></span>
                      {product.status}
                    </div>
                  </div>

                  {/* Wishlist Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product);
                    }}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-all z-10 ${
                      wishlistIds.includes(product.id)
                        ? 'bg-rose-50 text-red-500 scale-105'
                        : 'bg-white/90 text-[var(--color-text-secondary)] hover:text-red-500 hover:scale-110 active:scale-95'
                    }`}
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

                {/* Details Section */}
                <div className="p-4 flex flex-col flex-1 gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider bg-[var(--color-background)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                      {product.condition}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 font-medium" title="Date of Posted">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {product.datePosted || getProductDatePosted(product)}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">{product.name}</h3>

                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-[var(--color-text-primary)] leading-none">{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-[var(--color-text-secondary)] line-through leading-none font-medium">{product.originalPrice}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product, 1);
                        setToastProduct(product);
                        setTimeout(() => setToastProduct(null), 4000);
                      }}
                      className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
                      title="Add to Cart"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    </button>
                  </div>

                  {/* Seller Name & College */}
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-2.5 mt-auto border-t border-[var(--color-border)] font-medium">
                    <div className="flex items-center gap-1.5 truncate max-w-[130px]" title={`Seller: ${product.sellerName || getSellerName(product)}`}>
                      <span className="material-symbols-outlined text-[15px] text-[var(--color-primary)]">person</span>
                      <span className="truncate text-[var(--color-text-primary)] font-semibold">{product.sellerName || getSellerName(product)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--color-text-secondary)] font-medium shrink-0">
                      <span className="material-symbols-outlined text-[14px]">school</span>
                      <span>{product.college || 'SKCT'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-[var(--color-text-secondary)] mb-2">inventory_2</span>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">No products listed yet</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">Be the first student to list a component!</p>
              <button onClick={() => navigate('/list')} className="btn-primary mt-3 text-xs py-1.5 px-4 inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">add</span>
                List a Component
              </button>
            </div>
          )}
        </section>

        {/* Live Auctions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 flex items-center gap-2">
              <span className="text-[var(--color-primary)] material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              Live Auctions
            </h2>
            <button onClick={() => navigate('/products?type=auction')} className="text-[var(--color-primary)] font-bold text-sm hover:underline flex items-center gap-1 group">
              View All
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>

          {allAuctions.length > 0 ? (
          <div className="flex overflow-x-auto gap-5 pb-4 pt-2 px-1 -mx-1 hide-scrollbar snap-x">
            {allAuctions.map((auction) => (
              <div
                key={auction.id}
                onClick={() => navigate(`/product/${auction.id}`)}
                className="snap-start shrink-0 w-[300px] card-auction flex flex-col group"
              >
                {/* Gold Accent Top Border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)] z-20"></div>

                {/* Image Section */}
                <div className="w-full aspect-square bg-[var(--color-background)] relative overflow-hidden flex items-center justify-center border-b border-[var(--color-border)]">
                  {auction.image ? (
                    <img 
                      src={auction.image} 
                      alt={auction.name} 
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://picsum.photos/800/800?random=${auction.id}`; }} 
                    />
                  ) : (
                    <span className="material-symbols-outlined text-[64px] text-[var(--color-border)] group-hover:scale-110 transition-transform duration-500">memory</span>
                  )}

                  {/* Heat Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className="badge-neutral bg-white/90 backdrop-blur-md text-[var(--color-primary)]">
                      <span>{auction.heatIcon}</span>
                      {auction.heat}
                    </div>
                  </div>

                  {/* Countdown Badge */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-max z-10">
                    <div className="px-3 py-1 rounded-full bg-[var(--color-warning)] shadow-md text-xs font-bold text-[var(--color-primary-dark)] flex items-center gap-1.5 backdrop-blur-md">
                      <span className="material-symbols-outlined text-[14px]">timer</span>
                      {auction.timeLeft} Left
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 flex flex-col flex-1 gap-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">{auction.name}</h3>
                    <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 font-semibold bg-[var(--color-background)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                      <span className="material-symbols-outlined text-[14px]">group</span>
                      {auction.bidders || '3'}
                    </div>
                  </div>

                  {/* Seller Name and Date Posted */}
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] font-medium">
                    <div className="flex items-center gap-1.5 truncate max-w-[130px]" title={`Seller: ${auction.sellerName || getSellerName(auction)}`}>
                      <span className="material-symbols-outlined text-[15px] text-[var(--color-primary)]">person</span>
                      <span className="truncate text-[var(--color-text-primary)] font-semibold">{auction.sellerName || getSellerName(auction)}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" title="Date of Posted">
                      <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                      <span>{auction.datePosted || getProductDatePosted(auction)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mt-1 bg-[var(--color-primary)]/5 p-3 rounded-xl border border-[var(--color-primary)]/20">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Current Bid</span>
                      <span className="text-2xl font-black text-[var(--color-text-primary)]">{auction.currentBid}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">Market Price</span>
                      <span className="text-sm font-semibold text-[var(--color-text-secondary)] line-through">{auction.marketPrice}</span>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${auction.id}`);
                    }}
                    className="btn-auction w-full mt-2 h-10 text-sm"
                  >
                    Join Auction
                    <span className="material-symbols-outlined text-[18px]">gavel</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-[var(--color-text-secondary)] mb-2">gavel</span>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">No live auctions right now</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">Check back soon or list your own auction!</p>
            </div>
          )}
        </section>
      </main>

      {/* Added to Cart Toast Notification */}
      {toastProduct && (
        <div className="fixed top-20 right-4 sm:right-8 z-[9999] w-[92vw] max-w-md bg-[var(--color-surface)] border-2 border-[var(--color-primary)] rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-[22px]">check</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">Added to Cart!</p>
              <p className="text-xs text-[var(--color-text-secondary)] truncate max-w-[200px]">{toastProduct.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/cart')}
              className="btn-primary py-2 px-3.5 text-xs font-bold shadow-sm whitespace-nowrap"
            >
              View Cart
            </button>
            <button
              onClick={() => setToastProduct(null)}
              className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors rounded-lg hover:bg-[var(--color-background)]"
              title="Close"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Post Event Modal */}
      <PostEventModal
        isOpen={showPostEventModal}
        onClose={() => setShowPostEventModal(false)}
      />

      <BottomNav />
    </div>
  );
};
