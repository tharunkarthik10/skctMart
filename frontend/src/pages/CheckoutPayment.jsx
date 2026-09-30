import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiClient from '../api/client';

export const CheckoutPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const response = await apiClient.get(`/components/${id}`);
        const comp = response.data;
        setProduct({
          id: comp.id,
          name: comp.title,
          price: `₹${comp.price}`,
          images: comp.images?.length > 0 ? comp.images : ['https://picsum.photos/800/800?random=99'],
          image: comp.image_url || (comp.images?.length > 0 ? comp.images[0] : 'https://picsum.photos/800/800?random=99'),
          seller: {
            name: comp.seller?.name || comp.seller?.email?.split('@')[0] || 'Maker',
            college: comp.seller?.college || 'SKCET'
          }
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const userRes = await apiClient.get(`/users/${session.user.id}`);
          setUserProfile(userRes.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      console.log('Loading Razorpay SDK dynamically...');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => console.log('✓ Razorpay SDK Loaded');
      script.onerror = () => console.error('Failed to load Razorpay SDK');
      document.body.appendChild(script);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="bg-[var(--color-background)] min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!product) {
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

  // Parse price (remove currency symbol and commas)
  const basePrice = parseInt(product.price.replace(/[^0-9]/g, '')) || 0;
  const platformFee = 20;
  const deliveryFee = 0;
  const subtotal = basePrice * quantity;
  const grandTotal = subtotal + platformFee + deliveryFee;

  const handlePlaceOrder = async () => {
    try {
      setIsProcessing(true);
      setPaymentFailed(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      let token = session?.access_token;
      if (!token) {
        const demoUserStr = localStorage.getItem('demo_user_session');
        if (demoUserStr) {
           try {
             const parsed = JSON.parse(demoUserStr);
             token = `demo_token_${parsed.user?.id || '87650734-b92a-4465-b397-325f392c0267'}`;
           } catch(e) {}
        }
      }
      if (!token) token = 'demo_token';

      const res = await apiClient.post('/payment/create-order', { amount: grandTotal }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const orderData = res.data;
      
      if (!orderData || !orderData.orderId) {
        throw new Error('Invalid response from server: Missing Order ID');
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MakerMart',
        description: product.name,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await apiClient.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              productId: product.id,
              productName: product.name,
              productImage: product.images[0],
              quantity: quantity,
              price: grandTotal,
              subtotal: subtotal,
              platformFee: platformFee,
              deliveryFee: deliveryFee,
              gst: 0,
              deliveryAddress: 'Block B, Room 304, SKCET Mens Hostel' 
            }, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const verifyData = verifyRes.data;
            
            if (verifyData.success) {
              navigate('/order-success', {
                state: {
                  productName: product.name,
                  productImage: product.images[0],
                  sellerName: product.seller.name,
                  amountPaid: grandTotal,
                  paymentId: response.razorpay_payment_id
                }
              });
            } else {
              setPaymentFailed(verifyData.error || 'Payment verification failed on the server.');
            }
          } catch (err) {
            console.error('Verification network error:', err);
            setPaymentFailed(err.response?.data?.error || err.message || 'Network error during verification.');
          }
        },
        prefill: {
          name: userProfile?.name || "John Doe",
          contact: userProfile?.mobile_number || "9876543210"
        },
        theme: {
          color: '#46A857' // Green primary color
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        console.error('Razorpay Payment Failed Event:', response.error);
        setPaymentFailed(response.error.description || 'Payment was declined by the gateway.');
      });
      rzp.open();

    } catch (error) {
      console.error('Checkout Flow Error:', error);
      setPaymentFailed(error.response?.data?.error || error.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative">
      
      {/* Payment Failed Dialog */}
      {paymentFailed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-surface)] rounded-3xl p-8 max-w-sm w-full min-w-[320px] text-center shadow-xl border border-[var(--color-border)]">
            <div className="w-16 h-16 bg-[var(--color-danger)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <span className="material-symbols-outlined text-[var(--color-danger)] text-[32px]">error</span>
            </div>
            <h3 className="text-h2 mb-2">Payment Failed</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-8 whitespace-pre-wrap">{paymentFailed}</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handlePlaceOrder}
                className="btn-primary"
              >
                Retry Payment
              </button>
              <button 
                onClick={() => setPaymentFailed(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[var(--color-surface)] sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 w-full h-16 border-b border-[var(--color-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn-icon">
            <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">Checkout</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Product Summary Section */}
            <div className="card-standard p-6 md:p-8">
              <h2 className="text-h3 mb-6">Product Details</h2>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-40 h-40 shrink-0 bg-[var(--color-background)] rounded-2xl overflow-hidden border border-[var(--color-border)] flex items-center justify-center">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/800x800/F8FAFC/46A857?text=Image+Not+Found'; }} />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-h2 mb-2">{product.name}</h3>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-base text-[var(--color-text-secondary)] line-through font-semibold">{product.originalPrice}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="badge-neutral">{product.condition}</span>
                    <span className="badge-neutral">Sold by {product.seller.name} ({product.seller.college})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-[var(--color-text-secondary)]">Quantity:</span>
                    <div className="flex items-center bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-[var(--color-surface)] transition-colors font-bold text-lg text-[var(--color-text-primary)] hover:text-[var(--color-primary)]">-</button>
                      <span className="w-12 text-center font-bold text-lg text-[var(--color-text-primary)]">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-[var(--color-surface)] transition-colors font-bold text-lg text-[var(--color-text-primary)] hover:text-[var(--color-primary)]">+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Meetup Information */}
            <div className="card-standard p-6 md:p-8">
              <h2 className="text-h3 mb-6">Meetup Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="input-label block">Full Name</label>
                  <input type="text" defaultValue={userProfile?.name || ''} className="input-standard" />
                </div>
                <div className="space-y-1.5">
                  <label className="input-label block">Phone Number</label>
                  <input type="tel" defaultValue={userProfile?.mobile_number || ''} className="input-standard" />
                </div>
                <div className="space-y-1.5">
                  <label className="input-label block">College</label>
                  <input type="text" defaultValue="SKCET" className="input-standard" />
                </div>
                <div className="space-y-1.5">
                  <label className="input-label block">Department / Year</label>
                  <input type="text" defaultValue={`${userProfile?.department || ''} / ${userProfile?.year || ''}`} className="input-standard" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="input-label block">Classroom / Hostel / Preferred Meetup Spot</label>
                  <textarea rows="3" defaultValue={userProfile?.classroom_no || ''} className="input-standard resize-none"></textarea>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="card-standard p-6 md:p-8">
              <h2 className="text-h3 mb-6">Payment Method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['UPI', 'Credit Card', 'Debit Card', 'Net Banking'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${paymentMethod === method ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 bg-[var(--color-background)]'}`}
                  >
                    <span className={`font-bold ${paymentMethod === method ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}>{method}</span>
                    {paymentMethod === method && <span className="material-symbols-outlined text-[var(--color-primary)]">check_circle</span>}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="card-standard p-6 md:p-8 sticky top-24">
              <h2 className="text-h3 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-start">
                  <span className="text-[var(--color-text-secondary)] font-semibold text-sm">Product</span>
                  <span className="font-bold text-right max-w-[150px] truncate text-sm text-[var(--color-text-primary)]">{product.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-secondary)] font-semibold text-sm">Seller</span>
                  <span className="font-bold text-right text-sm text-[var(--color-text-primary)]">{product.seller.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-text-secondary)] font-semibold text-sm">Quantity</span>
                  <span className="font-bold text-right text-sm text-[var(--color-text-primary)]">{quantity}</span>
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] pt-5 space-y-3 mb-6">
                <div className="flex justify-between items-center text-[var(--color-text-primary)]">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-[var(--color-text-secondary)] text-sm">
                  <span className="font-semibold">Platform Fee</span>
                  <span className="font-bold">₹{platformFee}</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-[var(--color-border)] pt-5 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">Grand Total</span>
                  <span className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="btn-primary w-full py-4 text-lg justify-center disabled:opacity-70 disabled:hover:translate-y-0 disabled:active:scale-100 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                   <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                   <span className="material-symbols-outlined">lock</span>
                )}
                {isProcessing ? 'Processing...' : 'Proceed to Payment'}
              </button>

              <p className="text-center text-xs font-semibold text-[var(--color-text-secondary)] mt-5 flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[var(--color-success)]">verified_user</span>
                Secure Checkout Process
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
