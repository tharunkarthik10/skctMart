import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const res = await fetch(`http://localhost:5000/api/orders/${id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!res.ok) {
          if (res.status === 403) throw new Error('You do not have permission to view this order.');
          throw new Error('Failed to fetch order details.');
        }
        
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex justify-center items-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-[var(--color-primary)]">progress_activity</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] font-sans text-[var(--color-text-primary)] flex flex-col justify-center items-center p-4">
        <span className="material-symbols-outlined text-[64px] text-[var(--color-danger)] mb-4">error</span>
        <h2 className="text-h2 mb-2">Order Not Found</h2>
        <p className="text-body text-[var(--color-text-secondary)] mb-6">{error || "The requested order could not be loaded."}</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    );
  }

  const isCancelled = order.order_status === 'Cancelled';

  return (
    <div className="bg-[var(--color-background)] min-h-screen pb-24 font-sans text-[var(--color-text-primary)]">
      <header className="bg-[var(--color-surface)] sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 w-full h-16 border-b border-[var(--color-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn-icon">
            <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">Order Details</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 pt-8 space-y-6">
        
        {/* Order Header */}
        <div className="card-standard p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-h2 mb-1">Order #{order.order_id.substring(0,10)}...</h2>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">Placed on {new Date(order.created_at).toLocaleString()}</p>
          </div>
          {isCancelled ? (
            <span className="px-4 py-2 bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/20 rounded-xl font-bold flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined">cancel</span> Cancelled
            </span>
          ) : (
            <span className="px-4 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 rounded-xl font-bold flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined">handshake</span> {order.order_status}
            </span>
          )}
        </div>

        {/* Two Column Layout for Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Col: Product & Delivery */}
          <div className="md:col-span-2 space-y-6">
            
            <div className="card-standard p-6">
              <h3 className="text-h3 mb-4">Item Ordered</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <img src={order.product_image} alt={order.product_name} className="w-full sm:w-28 h-28 object-cover rounded-xl border border-[var(--color-border)]" onError={(e) => { e.target.src = 'https://placehold.co/400x400/F8FAFC/46A857?text=Image+Not+Found'; }} />
                <div>
                  <h4 className="text-h3 mb-1">{order.product_name}</h4>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2 font-semibold">Qty: <span className="font-bold text-[var(--color-text-primary)]">{order.quantity}</span></p>
                  <p className="text-xl font-black text-[var(--color-primary)]">₹{order.price}</p>
                </div>
              </div>
            </div>

            <div className="card-standard p-6">
              <h3 className="text-h3 mb-4">Meetup / Delivery Spot</h3>
              <div className="flex gap-3 text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined mt-0.5">location_on</span>
                <p className="whitespace-pre-wrap leading-relaxed font-semibold">{order.delivery_address || 'No address provided.'}</p>
              </div>
            </div>

          </div>

          {/* Right Col: Payment Summary */}
          <div className="md:col-span-1 space-y-6">
            
            <div className="card-standard p-6">
              <h3 className="text-h3 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--color-text-secondary)] font-semibold">Subtotal</span>
                  <span className="font-bold text-[var(--color-text-primary)]">₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--color-text-secondary)] font-semibold">Platform Fee</span>
                  <span className="font-bold text-[var(--color-text-primary)]">₹{order.platform_fee}</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-[var(--color-border)] pt-4 mb-6">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-[var(--color-text-primary)]">Grand Total</span>
                  <span className="text-2xl font-black text-[var(--color-primary)]">₹{order.grand_total}</span>
                </div>
              </div>

              <div className="bg-[var(--color-background)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm">
                 <p className="text-xs font-bold uppercase text-[var(--color-text-secondary)] mb-1">Payment Status</p>
                 <div className="flex items-center gap-2">
                   <span className="material-symbols-outlined text-[var(--color-success)] text-[18px]">verified</span>
                   <span className="font-bold text-[var(--color-success)]">{order.payment_status}</span>
                 </div>
                 <p className="text-xs text-[var(--color-text-secondary)] font-mono mt-2 break-all">{order.payment_id}</p>
              </div>
            </div>

            <button className="btn-outline w-full py-3.5 border-2 text-base justify-center gap-2">
              <span className="material-symbols-outlined">download</span> Download Invoice
            </button>
            
          </div>
          
        </div>

      </main>
    </div>
  );
};
