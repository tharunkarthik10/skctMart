import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const res = await fetch('http://localhost:5000/api/orders/my-orders', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch orders');
      
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to cancel order');
      
      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: 'Cancelled' } : o));
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Pending': return 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20';
      case 'Confirmed': return 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/30';
      case 'Packed': return 'bg-[var(--color-primary)]/30 text-[var(--color-primary)] border-[var(--color-primary)]/40';
      case 'Shipped': return 'bg-[var(--color-primary)]/40 text-[var(--color-primary)] border-[var(--color-primary)]/50';
      case 'Out for Delivery': return 'bg-[var(--color-primary)]/50 text-[var(--color-primary)] border-[var(--color-primary)]/60';
      case 'Delivered': return 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20';
      case 'Cancelled': return 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/20';
      default: return 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]';
    }
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24">
      <header className="bg-[var(--color-surface)] sticky top-0 z-40 flex justify-between items-center px-4 md:px-8 w-full h-16 border-b border-[var(--color-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn-icon">
            <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">My Orders</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-8 pt-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="material-symbols-outlined animate-spin text-4xl text-[var(--color-primary)]">progress_activity</span>
          </div>
        ) : error ? (
          <div className="text-center text-[var(--color-danger)] p-4 font-bold">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
             <span className="material-symbols-outlined text-[64px] text-[var(--color-text-secondary)] mb-4">shopping_bag</span>
             <h2 className="text-h2 mb-2">No orders found</h2>
             <p className="text-body text-[var(--color-text-secondary)] mb-6">Looks like you haven't placed any orders yet.</p>
             <button onClick={() => navigate('/')} className="btn-primary">Start Shopping</button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="card-standard p-6 flex flex-col md:flex-row gap-6">
                <img src={order.product_image} alt={order.product_name} className="w-full md:w-32 h-32 object-cover rounded-xl border border-[var(--color-border)]" onError={(e) => { e.target.src = 'https://placehold.co/400x400/F8FAFC/46A857?text=Image+Not+Found'; }} />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-h3">{order.product_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4 font-semibold">Order ID: <span className="font-mono text-[var(--color-text-primary)]">{order.order_id}</span></p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs font-bold uppercase text-[var(--color-text-secondary)] mb-1">Total Paid</p>
                      <p className="font-bold text-[var(--color-primary)]">₹{order.grand_total}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-[var(--color-text-secondary)] mb-1">Date</p>
                      <p className="font-semibold text-[var(--color-text-primary)]">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-[var(--color-text-secondary)] mb-1">Payment</p>
                      <p className="font-semibold text-[var(--color-text-primary)]">{order.payment_status}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-[var(--color-text-secondary)] mb-1">Est. Delivery</p>
                      <p className="font-semibold text-[var(--color-text-primary)]">3 Days</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => navigate(`/orders/${order.id}`)} className="btn-primary py-2 px-4 text-sm">View Details</button>
                    {(order.order_status === 'Pending' || order.order_status === 'Confirmed') && (
                      <button onClick={() => handleCancelOrder(order.id)} className="btn-outline py-2 px-4 text-sm text-[var(--color-danger)] border-[var(--color-danger)]/50 hover:bg-[var(--color-danger)]/5 hover:border-[var(--color-danger)]">Cancel Order</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
