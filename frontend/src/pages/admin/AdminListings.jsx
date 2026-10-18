import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import apiClient from '../../api/client';
import { realtimeService } from '../../services/realtimeService';

export const AdminListings = () => {
  const navigate = useNavigate();
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/components');
      setComponents(res.data);
    } catch (err) {
      console.error('Error fetching components:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComponents();

    const subscription = realtimeService.subscribeToAdminListings(() => {
        fetchComponents();
    });

    return () => {
      realtimeService.unsubscribe(subscription);
    };
  }, []);

  const handleArchivePost = async (componentId) => {
    const confirmed = window.confirm("Are you sure you want to ARCHIVE this post? It will be hidden from the public feed, and a warning will be issued to the seller.");
    if (!confirmed) return;

    // Optimistic UI update
    setComponents(components.map(c => c.id === componentId ? { ...c, status: 'ARCHIVED' } : c));

    try {
      await apiClient.put(`/components/${componentId}`, { status: 'ARCHIVED' });
      alert('Post archived. A warning has been simulated for the seller.');
    } catch (err) {
      alert('Failed to archive post. Make sure you have admin rights.');
      fetchComponents(); // revert
    }
  };

  const handlePermanentDelete = async (componentId) => {
    const confirmed = window.confirm("DANGER: Are you absolutely sure you want to PERMANENTLY DELETE this post? This action cannot be undone.");
    if (!confirmed) return;

    // Optimistic UI update
    setComponents(components.filter(c => c.id !== componentId));

    try {
      await apiClient.delete(`/components/${componentId}`);
      alert('Post permanently deleted.');
    } catch (err) {
      alert('Failed to delete post.');
      fetchComponents(); // revert
    }
  };

  const filteredComponents = components.filter(c => 
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="text-center py-12 text-[var(--color-text-secondary)] font-bold">Loading listings...</div>;

  return (
    <div className="flex flex-col gap-6 font-sans text-[var(--color-text-primary)]">
      <div className="card-standard p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h2 className="text-h2">Moderate Listings</h2>
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">search</span>
            <input 
              type="text"
              placeholder="Search by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-standard pl-12 h-12"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-xs font-bold uppercase text-[var(--color-text-secondary)] tracking-wider">
                <th className="py-4 px-6">Component</th>
                <th className="py-4 px-6 whitespace-nowrap">Category</th>
                <th className="py-4 px-6 whitespace-nowrap">Status</th>
                <th className="py-4 px-6 whitespace-nowrap">Date Listed</th>
                <th className="py-4 px-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComponents.map((comp) => (
                <tr key={comp.id} className={`border-b border-[var(--color-border)] hover:bg-[var(--color-background)]/50 transition-colors ${comp.status === 'REMOVED' ? 'opacity-50' : ''}`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      {comp.image_url ? (
                        <img src={comp.image_url} alt={comp.title} className="w-14 h-14 rounded-xl object-cover border border-[var(--color-border)]" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-[var(--color-background)] flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                          <span className="material-symbols-outlined text-[24px]">image_not_supported</span>
                        </div>
                      )}
                      <div>
                        <div 
                          className="font-bold text-[var(--color-primary)] hover:underline cursor-pointer text-base mb-1"
                          onClick={() => navigate(`/user/${comp.seller_id}`)}
                        >
                          {comp.seller?.name || comp.seller?.email || 'Unknown Seller'}
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)] font-medium">
                          <span className="text-[var(--color-text-primary)]">{comp.title}</span>
                          <br />
                          <span className="text-xs">{comp.seller?.email || 'No Email Provided'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] shadow-sm text-xs font-bold text-[var(--color-text-primary)] whitespace-nowrap">
                      {comp.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    {comp.status === 'ARCHIVED' ? (
                      <span className="text-[var(--color-danger)] font-bold text-sm inline-flex items-center gap-1.5 bg-[var(--color-danger)]/10 px-3 py-1 rounded-full border border-[var(--color-danger)]/20 shadow-sm whitespace-nowrap">
                        <span className="material-symbols-outlined text-[16px]">inventory_2</span> Archived
                      </span>
                    ) : (
                      <span className="text-[var(--color-primary)] font-bold text-sm inline-flex items-center gap-1.5 bg-[var(--color-primary)]/10 px-3 py-1 rounded-full border border-[var(--color-primary)]/20 shadow-sm whitespace-nowrap">
                        <span className="material-symbols-outlined text-[16px]">public</span> {comp.status || 'Active'}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm font-semibold text-[var(--color-text-secondary)] whitespace-nowrap">
                    {new Date(comp.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3">
                      {comp.status !== 'ARCHIVED' && (
                        <button 
                          onClick={() => handleArchivePost(comp.id)}
                          className="btn-outline px-4 py-2 text-xs shadow-sm gap-1.5 bg-white hover:bg-[var(--color-background)]"
                        >
                          <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                          Archive
                        </button>
                      )}
                      <button 
                        onClick={() => handlePermanentDelete(comp.id)}
                        className="btn-outline px-4 py-2 text-xs text-[var(--color-danger)] border-[var(--color-danger)]/50 hover:bg-[var(--color-danger)]/10 hover:border-[var(--color-danger)] gap-1.5 shadow-sm bg-white"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredComponents.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-[var(--color-text-secondary)] font-bold text-lg">No listings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
