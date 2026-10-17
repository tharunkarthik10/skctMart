import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiClient from '../api/client';
import { getRandomEmptyMessage } from '../utils/emptyStates';

export const PublicProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [stats, setStats] = useState({ listed: 0, sold: 0 });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserDomain = user?.email?.split('@')[1];

      // Fetch current user's admin status
      const ADMIN_EMAILS = ['tharunkarthikav21@gmail.com', '727824tuio046@skct.edu.in', 'tharunkarthik21112006@gmail.com'];
      let isAdmin = ADMIN_EMAILS.includes(user?.email);
      if (user && !isAdmin) {
        try {
          const res = await apiClient.get(`/users/${user.id}`);
          isAdmin = res.data?.is_admin || false;
        } catch (err) {
          console.error('Error fetching admin status:', err);
        }
      }

      // Fetch user profile
      let profile = null;
      try {
        const res = await apiClient.get(`/users/${userId}`);
        profile = res.data;
      } catch (err) {
        if (err.response?.status !== 404) console.error('Error fetching profile:', err);
      }
      
      if (profile) {
        const profileDomain = profile.email?.split('@')[1];
        if (!isAdmin && currentUserDomain && profileDomain && currentUserDomain !== profileDomain) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }
        setUserData(profile);
      }

      // Fetch basic stats and recent activity
      let components = null;
      try {
        const res = await apiClient.get('/components', { params: { seller_id: userId } });
        components = res.data;
      } catch (err) {
        console.error('Error fetching components:', err);
      }

      if (components) {
        const listedCount = components.length;
        const soldCount = components.filter(c => c.status === 'SOLD').length;
        setStats({ listed: listedCount, sold: soldCount });
        // Only show active listings on public profile
        setRecentActivity(components.filter(c => c.status === 'ACTIVE' || c.status === 'AVAILABLE'));
      }

      setLoading(false);
    };

    if (userId) fetchProfile();
  }, [userId]);

  if (loading) return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col font-sans">
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 w-full h-16 border-b border-[var(--color-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="btn-icon">
            <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">User Profile</h1>
        </div>
      </header>
      <div className="flex-grow flex items-center justify-center text-[var(--color-text-secondary)]">Loading Profile...</div>
    </div>
  );

  if (unauthorized) return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-8 text-[var(--color-text-primary)] font-sans">
      <span className="material-symbols-outlined text-[64px] text-[var(--color-danger)] mb-4">lock</span>
      <h2 className="text-h1 text-[var(--color-danger)] mb-4">Access Restricted</h2>
      <p className="text-body text-[var(--color-text-secondary)] w-full max-w-[400px] text-center mb-8">
        This profile belongs to a student from a different college. You can only view profiles within your own college domain.
      </p>
      <button onClick={() => navigate('/')} className="btn-primary">
        Return to Home
      </button>
    </div>
  );

  if (!userData) return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col font-sans">
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 w-full h-16 border-b border-[var(--color-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="btn-icon">
            <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">User Profile</h1>
        </div>
      </header>
      <div className="flex-grow flex items-center justify-center text-[var(--color-text-secondary)]">User not found.</div>
    </div>
  );

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24">
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="btn-icon">
              <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">Public Profile</h1>
          </div>
        </div>
      </header>
      
      <main className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <aside className="lg:col-span-4 flex flex-col gap-6">
            <div className="card-standard p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-[var(--color-primary)]/10"></div>
              
              <div className="relative mb-4 mt-6 z-10">
                <div className="w-32 h-32 rounded-full border-4 border-[var(--color-surface)] flex items-center justify-center bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-black text-5xl shadow-md">
                  {userData.name ? userData.name[0].toUpperCase() : 'U'}
                </div>
                <div className="absolute bottom-1 right-1 bg-[var(--color-success)] text-white p-1 rounded-full flex items-center justify-center border-4 border-[var(--color-surface)]" title="Verified Student">
                  <span className="material-symbols-outlined text-[16px]" >verified</span>
                </div>
              </div>
              <h2 className="text-h2 line-clamp-1 px-4 z-10">{userData.name || 'Unknown User'}</h2>
              <p className="text-body text-[var(--color-text-secondary)] z-10 mt-1">{userData.department || 'Engineering'}</p>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-6 z-10">Year {userData.year || 'N/A'}</p>
              
              <div className="w-full flex flex-col gap-2 pt-4 border-t border-[var(--color-border)] mb-2"></div>
              <div className="grid grid-cols-2 w-full gap-4">
                <div className="flex flex-col border-r border-[var(--color-border)] items-center">
                  <span className="text-3xl font-black text-[var(--color-text-primary)]">{stats.listed}</span>
                  <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-center">Listed</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-black text-[var(--color-text-primary)]">{stats.sold}</span>
                  <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider text-center">Sold</span>
                </div>
              </div>
            </div>
          </aside>
          
          <section className="lg:col-span-8 flex flex-col gap-6">
            <div className="card-standard overflow-hidden">
              <div className="px-8 py-5 border-b border-[var(--color-border)] bg-[var(--color-background)]/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[var(--color-primary)] text-[24px]">person_outline</span>
                  <h3 className="text-h3">About</h3>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase block mb-1">Name</label>
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">{userData.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase block mb-1">Register No.</label>
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">{userData.register_no || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase block mb-1">Department</label>
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">{userData.department || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase block mb-1">Year</label>
                  <p className="text-base font-semibold text-[var(--color-text-primary)]">{userData.year || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase block mb-1">Account Status</label>
                  <div className="flex items-center gap-1.5 text-[var(--color-success)]">
                    <span className="material-symbols-outlined text-[20px]">verified_user</span>
                    <p className="text-sm font-bold">Active &amp; Verified</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-standard overflow-hidden">
              <div className="px-8 py-5 border-b border-[var(--color-border)] bg-[var(--color-background)]/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[var(--color-primary)] text-[24px]">inventory_2</span>
                  <h3 className="text-h3">Active Listings</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--color-background)] border-b border-[var(--color-border)]">
                      <th className="px-8 py-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Part Name</th>
                      <th className="px-8 py-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Category</th>
                      <th className="px-8 py-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.length > 0 ? (
                      recentActivity.map((item) => (
                        <tr key={item.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)] transition-colors">
                          <td className="px-8 py-5 text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</td>
                          <td className="px-8 py-5 text-sm text-[var(--color-text-secondary)]">{item.category}</td>
                          <td className="px-8 py-5 flex items-center gap-2">
                            <Link to={`/product/${item.id}`} className="text-[var(--color-primary)] font-bold text-sm hover:underline transition-colors p-1" title="View Listing">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-8 py-12 text-center text-[var(--color-text-secondary)] font-medium text-sm">
                          {getRandomEmptyMessage('items')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
