import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const fetchSellerOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const res = await fetch('http://localhost:5000/api/orders/seller-orders', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch seller orders');
      
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error('Failed to update status');
      
      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
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
          <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">Seller Dashboard</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
        <h2 className="text-h2 mb-6">Order Management</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="material-symbols-outlined animate-spin text-4xl text-[var(--color-primary)]">progress_activity</span>
          </div>
        ) : error ? (
          <div className="text-center text-[var(--color-danger)] p-4 font-bold">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 card-standard">
             <span className="material-symbols-outlined text-[64px] text-[var(--color-text-secondary)] mb-4">storefront</span>
             <h2 className="text-h2 mb-2">No orders yet</h2>
             <p className="text-body text-[var(--color-text-secondary)]">When buyers purchase your items, they will appear here.</p>
          </div>
        ) : (
          <div className="card-standard overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)]">
                  <th className="p-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Order ID</th>
                  <th className="p-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Product</th>
                  <th className="p-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Amount</th>
                  <th className="p-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)]/50 transition-colors">
                    <td className="p-4 font-mono text-sm text-[var(--color-text-secondary)] font-semibold">{order.order_id.substring(0,12)}...</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={order.product_image} alt={order.product_name} className="w-12 h-12 rounded object-cover border border-[var(--color-border)]" onError={(e) => { e.target.src = 'https://placehold.co/400x400/F8FAFC/46A857?text=Image+Not+Found'; }} />
                        <div>
                          <p className="font-bold text-[var(--color-text-primary)]">{order.product_name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)] font-semibold">Qty: {order.quantity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-[var(--color-primary)]">₹{order.grand_total}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-text-secondary)] font-semibold">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right space-x-2">
                       <button onClick={() => navigate(`/orders/${order.id}`)} className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-surface)] rounded-full transition-colors" title="View Details">
                         <span className="material-symbols-outlined text-[20px]">visibility</span>
                       </button>
                       {order.order_status !== 'Cancelled' && order.order_status !== 'Delivered' && (
                         <select 
                           value={order.order_status} 
                           onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                           className="text-sm border border-[var(--color-border)] rounded-lg px-2 py-1 bg-[var(--color-background)] font-bold text-[var(--color-text-primary)] focus:border-[var(--color-primary)] outline-none cursor-pointer"
                         >
                           <option value="Pending">Pending</option>
                           <option value="Confirmed">Confirmed</option>
                           <option value="Packed">Packed</option>
                           <option value="Shipped">Shipped</option>
                           <option value="Out for Delivery">Out for Delivery</option>
                           <option value="Delivered">Delivered</option>
                         </select>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
