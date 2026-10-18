import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiClient from '../api/client';
import { getCart, clearCart, parseItemPrice } from '../utils/cartStorage';

export const CheckoutPayment = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isCartCheckout = !id || id === 'cart' || location.search.includes('fromCart=true');

  const [product, setProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [meetupName, setMeetupName] = useState('');
  const [meetupPhone, setMeetupPhone] = useState('');
  const [meetupSpot, setMeetupSpot] = useState('Campus Central Library / Food Court');

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch User Session & Profile
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          try {
            const userRes = await apiClient.get(`/users/${session.user.id}`);
            setUserProfile(userRes.data);
            if (userRes.data?.name) setMeetupName(userRes.data.name);
            if (userRes.data?.mobile_number) setMeetupPhone(userRes.data.mobile_number);
            if (userRes.data?.classroom_no) setMeetupSpot(`Block / Room: ${userRes.data.classroom_no}`);
          } catch (e) {
            console.error('Error fetching user profile:', e);
          }
        }

        // Handle Cart Checkout vs Single Product Checkout
        if (isCartCheckout) {
          const items = getCart();
          setCartItems(items);
        } else if (id) {
          const response = await apiClient.get(`/components/${id}`);
          const comp = response.data;
          const sellerId = comp.seller_id || comp.seller?.id || comp.userId;
          setProduct({
            id: comp.id,
            name: comp.title,
            price: `₹${comp.price}`,
            condition: comp.condition || 'Used',
            images: comp.images?.length > 0 ? comp.images : [comp.image_url || 'https://placehold.co/800x800/F8FAFC/46A857?text=Product'],
            image: comp.image_url || (comp.images?.length > 0 ? comp.images[0] : 'https://placehold.co/800x800/F8FAFC/46A857?text=Product'),
            seller: {
              id: sellerId,
              name: comp.seller?.name || comp.seller?.email?.split('@')[0] || 'Maker',
              college: comp.seller?.college || 'SKCT'
            }
          });
        }
      } catch (err) {
        console.error('Error fetching checkout data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isCartCheckout]);

  if (isLoading) {
    return (
      <div className="bg-[var(--color-background)] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  // If cart checkout and cart is empty
  if (isCartCheckout && cartItems.length === 0) {
    return (
      <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] min-h-screen flex flex-col items-center justify-center p-4 pb-24 font-sans">
        <div className="w-24 h-24 bg-[var(--color-surface)] rounded-full flex items-center justify-center text-[var(--color-text-secondary)] mb-6 shadow-sm border border-[var(--color-border)]">
          <span className="material-symbols-outlined text-[48px]">remove_shopping_cart</span>
        </div>
        <h1 className="text-h1 mb-2 text-center">Your Cart is Empty</h1>
        <p className="text-body text-[var(--color-text-secondary)] mb-8 text-center max-w-md">
          There are no items in your cart to checkout.
        </p>
        <button onClick={() => navigate('/explore')} className="btn-primary">
          <span className="material-symbols-outlined text-[20px]">explore</span>
          Browse Marketplace
        </button>
      </div>
    );
  }

  // If single product checkout and product not found
  if (!isCartCheckout && !product) {
    return (
      <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] min-h-screen flex flex-col items-center justify-center p-4 pb-24 font-sans">
        <div className="w-24 h-24 bg-[var(--color-surface)] rounded-full flex items-center justify-center text-[var(--color-text-secondary)] mb-6 shadow-sm border border-[var(--color-border)]">
          <span className="material-symbols-outlined text-[48px]">search_off</span>
        </div>
        <h1 className="text-h1 mb-2 text-center">Product Not Found</h1>
        <p className="text-body text-[var(--color-text-secondary)] mb-8 text-center max-w-md">The product you are looking for does not exist.</p>
        <button onClick={() => navigate(-1)} className="btn-primary">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Go Back
        </button>
      </div>
    );
  }

  // Calculate Subtotals and Totals
  const platformFee = 20;
  const deliveryFee = 0; // Free campus handover

  const subtotal = isCartCheckout
    ? cartItems.reduce((acc, item) => {
        const p = item.numericPrice || parseItemPrice(item.price);
        return acc + p * (item.quantity || 1);
      }, 0)
    : (parseInt(String(product?.price).replace(/[^0-9]/g, ''), 10) || 0) * quantity;

  const grandTotal = subtotal + platformFee + deliveryFee;

  const handleConfirmPurchase = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const meetupLocation = `${meetupSpot} (Recipient: ${meetupName || userProfile?.name || 'Student'}, Ph: ${meetupPhone || userProfile?.mobile_number || 'N/A'})`;

      if (isCartCheckout) {
        // Multi-item cart checkout
        const response = await apiClient.post('/orders', {
          items: cartItems,
          deliveryAddress: meetupLocation,
          platformFee,
          deliveryFee
        });

        const data = response.data;
        if (data.success) {
          clearCart();
          if (data.chatId) {
            navigate(`/chat/${data.chatId}`);
          } else {
            navigate('/inbox');
          }
        } else {
          setErrorMessage(data.error || 'Failed to confirm purchase. Please try again.');
        }
      } else {
        // Single product checkout
        const response = await apiClient.post('/orders', {
          productId: product.id,
          productName: product.name,
          productImage: product.images[0] || product.image,
          sellerId: product.seller?.id,
          quantity: quantity,
          price: grandTotal,
          subtotal: subtotal,
          platformFee: platformFee,
          deliveryFee: deliveryFee,
          gst: 0,
          deliveryAddress: meetupLocation
        });

        const data = response.data;
        if (data.success) {
          if (data.chatId) {
            navigate(`/chat/${data.chatId}`);
          } else {
            navigate('/inbox');
          }
        } else {
          setErrorMessage(data.error || 'Failed to confirm purchase. Please try again.');
        }
      }
    } catch (error) {
      console.error('Confirm purchase error:', error);
      setErrorMessage(error.response?.data?.error || error.message || 'An error occurred while confirming purchase.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative">
      {/* Error Dialog */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface)] rounded-3xl p-8 max-w-sm w-full min-w-[320px] text-center shadow-xl border border-[var(--color-border)]">
            <div className="w-16 h-16 bg-[var(--color-danger)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[var(--color-danger)] text-[32px]">error</span>
            </div>
            <h3 className="text-h2 mb-2">Order Error</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-8 whitespace-pre-wrap">{errorMessage}</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleConfirmPurchase} className="btn-primary">
                Retry Purchase
              </button>
              <button onClick={() => setErrorMessage(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[var(--color-surface)] sticky top-0 z-40 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="btn-icon">
              <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">
              {isCartCheckout ? 'Cart Checkout' : 'Checkout'}
            </h1>
          </div>
          <span className="badge-primary text-xs py-1 px-3">
            Pay on Handover
          </span>
        </div>
      </header>

      <main className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products Summary Section */}
            <div className="card-standard p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h3">
                  {isCartCheckout ? `Items in Order (${cartItems.length})` : 'Product Details'}
                </h2>
                {isCartCheckout && (
                  <button
                    onClick={() => navigate('/cart')}
                    className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    Modify Cart
                  </button>
                )}
              </div>

              {isCartCheckout ? (
                /* Multi-Item Cart List */
                <div className="space-y-4 divide-y divide-[var(--color-border)]">
                  {cartItems.map((item) => {
                    const itemUnitPrice = item.numericPrice || parseItemPrice(item.price);
                    const itemTotal = itemUnitPrice * (item.quantity || 1);

                    return (
                      <div key={item.id} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover border border-[var(--color-border)] bg-[var(--color-background)] shrink-0"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/200x200/F8FAFC/46A857?text=Product';
                            }}
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-base text-[var(--color-text-primary)] truncate">{item.name}</h4>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                              Seller: <span className="font-semibold text-[var(--color-text-primary)]">{item.sellerName || 'Maker'}</span> • Qty: {item.quantity || 1}
                            </p>
                            <span className="badge-neutral text-[10px] mt-1 inline-block">{item.condition || 'Good'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-[var(--color-primary)]">
                            ₹{itemTotal.toLocaleString('en-IN')}
                          </span>
                          {(item.quantity || 1) > 1 && (
                            <p className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                              ₹{itemUnitPrice} each
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Single Product View */
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-40 h-40 shrink-0 bg-[var(--color-background)] rounded-2xl overflow-hidden border border-[var(--color-border)] flex items-center justify-center">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/800x800/F8FAFC/46A857?text=Image+Not+Found';
                      }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-h2 mb-2">{product.name}</h3>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">{product.price}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="badge-neutral">{product.condition}</span>
                      <span className="badge-neutral">Sold by {product.seller.name} ({product.seller.college})</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-[var(--color-text-secondary)]">Quantity:</span>
                      <div className="flex items-center bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-[var(--color-surface)] transition-colors font-bold text-lg text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-bold text-lg text-[var(--color-text-primary)]">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-[var(--color-surface)] transition-colors font-bold text-lg text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Campus Meetup / Handover Spot Details */}
            <div className="card-standard p-6 md:p-8">
              <h2 className="text-h3 mb-6">On-Campus Handover Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="input-label block">Recipient Full Name</label>
                  <input
                    type="text"
                    value={meetupName}
                    onChange={(e) => setMeetupName(e.target.value)}
                    placeholder="e.g. Kumar"
                    className="input-standard"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="input-label block">Mobile Number (for handover)</label>
                  <input
                    type="text"
                    value={meetupPhone}
                    onChange={(e) => setMeetupPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="input-standard"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="input-label block">Department / Year</label>
                  <input
                    type="text"
                    defaultValue={`${userProfile?.department || 'Engineering'} / ${userProfile?.year || '2026'}`}
                    readOnly
                    className="input-standard bg-[var(--color-background)]/50"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="input-label block">Classroom / Hostel / Preferred Meetup Spot</label>
                  <textarea
                    rows="3"
                    value={meetupSpot}
                    onChange={(e) => setMeetupSpot(e.target.value)}
                    placeholder="e.g. Central Library Lawn, Mech Block 304, or Canteen"
                    className="input-standard resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Payment Method - Pay on Handover (Cash / UPI) */}
            <div className="card-standard p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-h3">Payment Method</h2>
                <span className="badge-primary flex items-center gap-1.5 text-xs font-semibold py-1 px-3">
                  <span className="material-symbols-outlined text-[15px]">handshake</span>
                  Pay on Handover
                </span>
              </div>

              <div className="p-5 rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/5 flex items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[26px]">payments</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[var(--color-text-primary)]">
                        Pay on Handover (Cash / UPI)
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-white font-bold">
                        Selected
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                      Pay directly to the seller via Cash or UPI (GPay/PhonePe/Paytm) during on-campus physical item handover. Inspect items in person before paying.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-[var(--color-primary)]">
                  <span className="material-symbols-outlined text-[26px]">check_circle</span>
                </div>
              </div>

              <div className="mt-4 p-3.5 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] flex items-center gap-3 text-xs text-[var(--color-text-secondary)] font-medium">
                <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)] shrink-0">
                  mark_chat_unread
                </span>
                <span>
                  Automated handover coordination messages will be sent to the seller's inbox immediately upon confirmation.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="card-standard p-6 md:p-8 sticky top-24 border border-[var(--color-border)] shadow-sm">
              <h2 className="text-h3 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-start">
                  <span className="text-[var(--color-text-secondary)] font-semibold text-sm">Order Type</span>
                  <span className="font-bold text-right text-sm text-[var(--color-text-primary)]">
                    {isCartCheckout ? `Cart Order (${cartItems.length} items)` : product.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-secondary)] font-semibold text-sm">Campus Handover</span>
                  <span className="font-bold text-right text-sm text-[var(--color-success)]">FREE (₹0)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-secondary)] font-semibold text-sm">Payment</span>
                  <span className="font-bold text-right text-sm text-[var(--color-primary)]">Pay on Handover</span>
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] pt-5 space-y-3 mb-6">
                <div className="flex justify-between items-center text-[var(--color-text-primary)]">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-[var(--color-text-secondary)] text-sm">
                  <span className="font-semibold">Platform Service Fee</span>
                  <span className="font-bold">₹{platformFee}</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-[var(--color-border)] pt-5 mb-8">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-lg font-bold text-[var(--color-text-primary)] block">Grand Total</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">Due on campus handover</span>
                  </div>
                  <span className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleConfirmPurchase}
                disabled={isProcessing}
                className="btn-primary w-full py-4 text-lg justify-center gap-2.5 font-bold disabled:opacity-70 disabled:hover:translate-y-0 disabled:active:scale-100 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
              >
                {isProcessing ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span>
                    <span>Confirming Order...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[22px]">handshake</span>
                    <span>Confirm Pay on Handover</span>
                  </>
                )}
              </button>

              <p className="text-center text-xs font-semibold text-[var(--color-text-secondary)] mt-5 flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[var(--color-success)]">verified</span>
                Campus Meetup • Pay on Handover (Cash / UPI)
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
