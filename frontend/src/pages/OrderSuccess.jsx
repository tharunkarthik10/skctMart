import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderDetails = location.state;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!orderDetails) {
    return (
      <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] min-h-screen flex flex-col items-center justify-center p-4 font-sans">
        <h1 className="text-h2 mb-6">No order details found</h1>
        <button onClick={() => navigate('/')} className="btn-primary">
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 flex items-center justify-center p-4">
      <div className="card-standard p-8 sm:p-12 w-full max-w-2xl flex flex-col items-center text-center">
        
        <div className="w-24 h-24 bg-[var(--color-success)]/10 rounded-full flex items-center justify-center mb-6 border border-[var(--color-success)]/20 shadow-sm animate-bounce-short">
          <span className="material-symbols-outlined text-[var(--color-success)] text-[48px]">check_circle</span>
        </div>
        
        <h1 className="text-h1 mb-2">Order Confirmed!</h1>
        <p className="text-body text-[var(--color-text-secondary)] mb-8 text-lg">
          Your Pay on Handover order is placed. An automated message was sent to the seller's inbox.
        </p>

        {/* Product Details Card */}
        <div className="w-full bg-[var(--color-background)] rounded-2xl p-6 border border-[var(--color-border)] mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-left shadow-sm">
          <img 
            src={orderDetails.productImage} 
            alt={orderDetails.productName} 
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-cover border border-[var(--color-border)] shrink-0"
            onError={(e) => { e.target.src = 'https://placehold.co/800x800/F8FAFC/46A857?text=Image+Not+Found'; }}
          />
          <div className="flex-1 space-y-2">
            <h3 className="text-h3">{orderDetails.productName}</h3>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Seller: <span className="font-bold text-[var(--color-text-primary)]">{orderDetails.sellerName}</span>
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
               <div>
                 <p className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider mb-1">Total Due on Handover</p>
                 <p className="text-xl font-black text-[var(--color-text-primary)] tracking-tight">₹{orderDetails.amountPaid?.toLocaleString('en-IN')}</p>
               </div>
               <div>
                 <p className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider mb-1">Payment Method</p>
                 <p className="text-sm font-bold text-[var(--color-primary)]">Pay on Handover (Cash / UPI)</p>
               </div>
            </div>
            {orderDetails.orderId && (
              <p className="text-xs text-[var(--color-text-secondary)] font-mono pt-1">
                Order ID: {orderDetails.orderId}
              </p>
            )}
          </div>
        </div>

        {/* Automated Message Notice Banner */}
        <div className="w-full bg-[var(--color-primary)]/10 rounded-2xl p-4 border border-[var(--color-primary)]/20 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-sm">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-[24px]">mark_chat_unread</span>
             </div>
             <div>
               <p className="font-bold text-[var(--color-primary)]">Automated Message Sent to Seller</p>
               <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                 We've automatically messaged {orderDetails.sellerName} with your order details and meetup spot.
               </p>
             </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row w-full gap-3">
          <button 
            onClick={() => navigate(orderDetails.chatId ? `/chat/${orderDetails.chatId}` : '/inbox')}
            className="btn-primary flex-1 py-3.5 text-base justify-center gap-2 font-bold shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            Chat with Seller
          </button>
          <button 
            onClick={() => navigate('/my-orders')}
            className="btn-secondary flex-1 py-3.5 text-base justify-center gap-2 font-bold"
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            View My Orders
          </button>
          <button 
            onClick={() => navigate('/')}
            className="btn-outline py-3.5 px-5 text-base font-semibold"
          >
            Home
          </button>
        </div>

      </div>
    </div>
  );
};
