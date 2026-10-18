import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import {
  getCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  parseItemPrice
} from '../utils/cartStorage';
import { supabase } from '../supabaseClient';
import apiClient from '../api/client';

export const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const loadCart = () => {
    setCartItems(getCart());
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadCart();
    window.addEventListener('cartUpdate', loadCart);
    return () => window.removeEventListener('cartUpdate', loadCart);
  }, []);

  const handleQuantityChange = (id, newQty) => {
    updateCartQuantity(id, newQty);
  };

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to remove all items from your cart?')) {
      clearCart();
    }
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const unitPrice = item.numericPrice || parseItemPrice(item.price);
    return acc + unitPrice * (item.quantity || 1);
  }, 0);

  const platformFee = cartItems.length > 0 ? 20 : 0;
  const deliveryFee = 0; // Free campus handover
  const grandTotal = subtotal + platformFee + deliveryFee;

  const handleProceedToCheckout = async () => {
    try {
      setIsCheckingOut(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to proceed to checkout.');
        navigate('/login');
        return;
      }

      // Check if user is blocked or needs verification
      try {
        const { data: profile } = await apiClient.get(`/users/${user.id}`);
        if (profile?.is_blocked) {
          alert('Your account is disabled. Please contact the administrator.');
          return;
        }
        if (!profile?.is_profile_verified) {
          alert('Your student profile is pending verification. You can place orders after verification.');
          return;
        }
      } catch (err) {
        console.error('Error verifying user status:', err);
      }

      // Navigate to checkout with cart state
      navigate('/checkout?fromCart=true');
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-28 relative">
      {/* Top Header */}
      <header className="bg-[var(--color-surface)] sticky top-0 z-40 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="btn-icon" title="Go back">
              <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">Shopping Cart</h1>
              {cartItems.length > 0 && (
                <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} items
                </span>
              )}
            </div>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs font-bold text-[var(--color-danger)] hover:underline flex items-center gap-1 transition-opacity hover:opacity-80"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              Clear All
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] py-8">
        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="card-standard p-12 max-w-xl mx-auto flex flex-col items-center justify-center text-center my-8 shadow-sm">
            <div className="w-24 h-24 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-6 shadow-inner">
              <span className="material-symbols-outlined text-[52px]">shopping_cart</span>
            </div>
            <h2 className="text-2xl font-black mb-2 text-[var(--color-text-primary)]">Your cart is empty</h2>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-sm mb-8 leading-relaxed">
              Explore hardware components, modules, and project essentials from fellow campus makers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => navigate('/explore')}
                className="btn-primary py-3.5 px-6 font-bold flex items-center justify-center gap-2 shadow-md"
              >
                <span className="material-symbols-outlined text-[20px]">explore</span>
                Browse Marketplace
              </button>
              <button
                onClick={() => navigate('/wishlist')}
                className="btn-secondary py-3.5 px-6 font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px] text-[var(--color-danger)]">favorite</span>
                View Wishlist
              </button>
            </div>
          </div>
        ) : (
          /* Cart Items and Summary Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                <span className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Items ({cartItems.length})
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                  Pay on Handover (Cash / UPI)
                </span>
              </div>

              {cartItems.map((item) => {
                const unitPrice = item.numericPrice || parseItemPrice(item.price);
                const lineTotal = unitPrice * (item.quantity || 1);

                return (
                  <div
                    key={item.id}
                    className="card-standard p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-md border border-[var(--color-border)] group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        onClick={() => navigate(`/product/${item.id}`)}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[var(--color-background)] border border-[var(--color-border)] overflow-hidden shrink-0 cursor-pointer flex items-center justify-center group-hover:border-[var(--color-primary)]/50 transition-colors"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/400x400/F8FAFC/46A857?text=Product';
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge-neutral text-[10px] py-0.5 px-2">{item.condition || 'Good'}</span>
                          {item.category && (
                            <span className="text-[11px] font-medium text-[var(--color-text-secondary)] truncate">
                              {item.category}
                            </span>
                          )}
                        </div>

                        <h3
                          onClick={() => navigate(`/product/${item.id}`)}
                          className="text-base font-bold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer truncate mb-1"
                        >
                          {item.name}
                        </h3>

                        <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mb-2">
                          <span className="material-symbols-outlined text-[13px] text-[var(--color-primary)]">person</span>
                          <span>Seller: <span className="font-semibold text-[var(--color-text-primary)]">{item.sellerName || 'Maker'}</span> ({item.college || 'SKCT'})</span>
                        </p>

                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-black text-[var(--color-primary)]">
                            ₹{unitPrice.toLocaleString('en-IN')}
                          </span>
                          {(item.quantity || 1) > 1 && (
                            <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                              (₹{unitPrice} each)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls and Action Buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]/60">
                      <div className="flex items-center bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
                        <button
                          onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors font-bold text-base"
                          title="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-9 text-center font-bold text-sm text-[var(--color-text-primary)]">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors font-bold text-base"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-black text-[var(--color-text-primary)] sm:hidden">
                          ₹{lineTotal.toLocaleString('en-IN')}
                        </span>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-2 text-[var(--color-danger)]/80 hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-xl transition-all"
                          title="Remove item"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2 flex justify-between items-center">
                <Link
                  to="/explore"
                  className="text-sm font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add More Items
                </Link>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
              <div className="card-standard p-6 border border-[var(--color-border)] shadow-sm">
                <h2 className="text-lg font-bold mb-4 pb-3 border-b border-[var(--color-border)] flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="badge-primary text-[11px] font-semibold py-0.5 px-2.5">
                    Pay on Handover
                  </span>
                </h2>

                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between text-[var(--color-text-secondary)]">
                    <span>Items Subtotal</span>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-[var(--color-text-secondary)]">
                    <span>Platform Service Fee</span>
                    <span className="font-bold text-[var(--color-text-primary)]">
                      ₹{platformFee}
                    </span>
                  </div>

                  <div className="flex justify-between text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1">
                      Campus Handover
                      <span className="text-[10px] px-1.5 py-0.2 bg-[var(--color-success)]/10 text-[var(--color-success)] font-bold rounded">FREE</span>
                    </span>
                    <span className="font-bold text-[var(--color-success)]">₹0</span>
                  </div>

                  <div className="border-t-2 border-dashed border-[var(--color-border)] pt-4 flex justify-between items-end">
                    <div>
                      <span className="text-base font-bold text-[var(--color-text-primary)] block">Grand Total</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">Due on campus handover</span>
                    </div>
                    <span className="text-2xl font-black text-[var(--color-primary)] tracking-tight">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Payment Method Details Box */}
                <div className="mb-6 p-4 rounded-2xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
                  <div className="flex items-center gap-2 mb-1.5 text-[var(--color-primary)] font-bold text-sm">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                    Pay on Handover (Cash / UPI)
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Pay directly to each seller via Cash or UPI (GPay/PhonePe/Paytm) when meeting on campus. No online payment required!
                  </p>
                </div>

                {/* Checkout CTA */}
                <button
                  onClick={handleProceedToCheckout}
                  disabled={isCheckingOut}
                  className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/25 hover:shadow-xl hover:shadow-[var(--color-primary)]/30 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isCheckingOut ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin material-symbols-outlined text-[20px]">sync</span>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                      Proceed to Checkout
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-[var(--color-text-secondary)] mt-3">
                  Campus Handover Coordination messages will be sent to the sellers automatically.
                </p>
              </div>

              {/* Campus Trust Features */}
              <div className="card-standard p-5 space-y-3.5 border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </div>
                  <span><strong>Inspect Before You Pay:</strong> Check physical working condition of hardware before paying.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                  </div>
                  <span><strong>Direct Campus Handover:</strong> Coordinate convenient spot in library, lab, or hostel.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">currency_rupee</span>
                  </div>
                  <span><strong>Cash or UPI:</strong> Flexible payment options when meeting in person.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
