import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { getCartCount } from '../utils/cartStorage';

export const ExploreCategories = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(() => getCartCount());

  useEffect(() => {
    const handleCartUpdate = () => setCartCount(getCartCount());
    window.addEventListener('cartUpdate', handleCartUpdate);
    return () => window.removeEventListener('cartUpdate', handleCartUpdate);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24">
      
      {/* TopAppBar */}
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="btn-icon">
              <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">Explore Categories</h1>
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

      <main className="flex-grow w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] pt-8 pb-32">
        {/* Search Hero Section */}
        <section className="mb-12">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm rounded-3xl p-6 md:p-10 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest">Component Directory</span>
              <h2 className="text-h1">Find your next build</h2>
            </div>
            <div className="relative w-full max-w-2xl">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">search</span>
              <input 
                className="input-standard pl-12 h-14 text-lg" 
                placeholder="Search components, boards, sensors..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center mt-2">
              <span className="text-sm font-semibold text-[var(--color-text-secondary)] mr-2">Trending:</span>
              {['ESP32', 'Lidar', 'LiPo', 'Raspberry Pi 5'].map(term => (
                <div 
                  key={term}
                  onClick={() => navigate(`/products?q=${term}`)} 
                  className="px-4 py-1.5 bg-[var(--color-background)] rounded-full text-sm font-semibold text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer transition-colors"
                >
                  {term}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-[var(--color-border)] pb-4">
            <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">category</span>
              Hardware Ecosystem
            </h3>
            <span className="text-sm font-semibold text-[var(--color-text-secondary)]">18 Categories Available</span>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Large Featured Category */}
            <div onClick={() => navigate('/products?category=Development Boards')} className="md:col-span-2 card-interactive p-8 flex flex-col justify-between group overflow-hidden relative min-h-[220px]">
              <div className="relative z-10 max-w-[60%]">
                <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-md mb-3 inline-block">Popular Choice</span>
                <h4 className="text-h2 mb-2 group-hover:text-[var(--color-primary)] transition-colors">Development Boards</h4>
                <p className="text-body text-[var(--color-text-secondary)]">Arduino, Raspberry Pi, ESP32, and high-performance FPGA modules for your prototype.</p>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-[160px]">memory</span>
              </div>
              <div className="flex gap-2 mt-6 relative z-10 items-center">
                <span className="material-symbols-outlined text-[var(--color-primary)]">developer_board</span>
                <span className="text-sm font-bold text-[var(--color-text-primary)] hover:underline decoration-[var(--color-border)] underline-offset-4">Explore Series</span>
              </div>
            </div>

            {/* Robotics Card */}
            <div onClick={() => navigate('/products?category=Robotics Components')} className="card-interactive p-6 flex flex-col gap-4 group min-h-[220px]">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-background)] flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-border)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[32px]">smart_toy</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-primary)] transition-colors">Robotics Components</h4>
                <p className="text-sm text-[var(--color-text-secondary)]">Chassis, controllers, and specialized hardware for autonomous systems.</p>
              </div>
            </div>

            {/* Grid Items */}
            {[
              { name: 'Sensors', desc: 'Env, Motion, Biometric', icon: 'sensors' },
              { name: 'Communication Modules', desc: 'LoRa, Wi-Fi, Bluetooth', icon: 'settings_input_component' },
              { name: 'Motors & Actuators', desc: 'Servo, Stepper, DC', icon: 'bolt' },
              { name: 'Power & Batteries', desc: 'BMS, Li-Po, AC/DC', icon: 'battery_full' },
              { name: 'Displays', desc: 'OLED, TFT, E-Ink', icon: 'monitor' },
              { name: 'Electronic Components', desc: 'SMD Passive, ICs', icon: 'electric_bolt' },
            ].map((cat, idx) => (
              <div key={idx} onClick={() => navigate(`/products?category=${cat.name}`)} className="card-interactive p-5 flex items-center gap-4 group">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/10 transition-colors">
                  <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
                </div>
                <div>
                  <h5 className="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">{cat.name}</h5>
                  <p className="text-xs text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">{cat.desc}</p>
                </div>
              </div>
            ))}

            {/* Sustainable Highlight */}
            <div onClick={() => navigate('/products?category=Refurbished Gear')} className="md:col-span-1 bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 p-6 rounded-[24px] flex flex-col gap-3 group cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-success)] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">eco</span>
                </div>
                <span className="text-[10px] font-bold text-[var(--color-success)] uppercase bg-white px-2 py-1 rounded-md shadow-sm">Sustainable</span>
              </div>
              <h5 className="font-bold text-lg text-[var(--color-text-primary)] group-hover:text-[var(--color-success)] mt-2">Refurbished Gear</h5>
              <p className="text-sm text-[var(--color-text-secondary)]">Quality-tested used lab equipment and components for circular engineering.</p>
            </div>

            {/* Remaining Grid Items */}
            {[
              { name: 'Cameras & Vision', desc: 'CSI, Thermal, CV', icon: 'camera' },
              { name: 'Mechanical Parts', desc: 'Bearings, Extrusions', icon: 'hardware' },
            ].map((cat, idx) => (
              <div key={idx} onClick={() => navigate(`/products?category=${cat.name}`)} className="card-interactive p-5 flex items-center gap-4 group">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/10 transition-colors">
                  <span className="material-symbols-outlined text-[24px]">{cat.icon}</span>
                </div>
                <div>
                  <h5 className="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">{cat.name}</h5>
                  <p className="text-xs text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final Category Grid Wrap-up */}
        <section className="mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: '3D Printing', icon: 'print' },
              { name: 'Drone Components', icon: 'flight' },
              { name: 'AI Hardware', icon: 'psychology' },
              { name: 'Networking', icon: 'lan' },
              { name: 'Lab Equipment', icon: 'science' },
              { name: 'Project Assets', icon: 'library_books' },
              { name: 'Project Kits', icon: 'card_giftcard' },
              { name: 'Driver Modules', icon: 'build' },
            ].map((cat, idx) => (
              <div key={idx} onClick={() => navigate(`/products?category=${cat.name}`)} className="p-4 border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)] flex flex-col items-center gap-2 text-center hover:border-[var(--color-primary)] hover:shadow-md transition-all cursor-pointer group">
                <span className="material-symbols-outlined text-[32px] text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors">{cat.icon}</span>
                <span className="text-sm font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
      
      <BottomNav />
    </div>
  );
};
