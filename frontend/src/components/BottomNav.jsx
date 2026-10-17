import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiClient from '../api/client';
import { realtimeService } from '../services/realtimeService';

export const BottomNav = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    let chatIds = [];
    
    const fetchUnread = async () => {
      try {
        const res = await apiClient.get('/chats');
        const chats = res.data;
        if (chats) {
          chatIds = chats.map(c => c.id);
          const readReceipts = JSON.parse(localStorage.getItem('chatReadReceipts') || '{}');
          let count = 0;
          
          chats.forEach(chat => {
            const lastRead = readReceipts[chat.id] || 0;
            if (chat.messages) {
              chat.messages.forEach(msg => {
                if (msg.sender_id !== currentUser.id && new Date(msg.createdAt || msg.created_at).getTime() > lastRead) {
                  count++;
                }
              });
            }
          });
          setUnreadCount(count);
        }
      } catch (err) {
        console.error("Error fetching chats for bottom nav:", err);
      }
    };

    fetchUnread();

    const channel = realtimeService.subscribeToBottomNavBadge(payload => {
      const msg = payload.new;
      if (msg.sender_id !== currentUser.id && chatIds.includes(msg.chat_id)) {
        // If we are currently viewing this chat, don't increment badge
        if (location.pathname !== `/chat/${msg.chat_id}`) {
          setUnreadCount(prev => prev + 1);
        }
      }
    });

    // Listen to storage changes to update badge if read receipt changes in another tab
    const handleStorageChange = () => {
      fetchUnread();
    };
    window.addEventListener('storage', handleStorageChange);
    // Also dispatch custom event for same-tab updates
    window.addEventListener('chatReadUpdate', handleStorageChange);

    return () => {
      realtimeService.unsubscribe(channel);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('chatReadUpdate', handleStorageChange);
    };
  }, [currentUser, location.pathname]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getAvatarUrl = (user) => {
    if (!user) return null;
    let url = user.user_metadata?.avatar_url || user.user_metadata?.picture || user.user_metadata?.custom_claims?.picture;
    if (!url && user.identities) {
      const googleIdentity = user.identities.find(id => id.provider === 'google');
      if (googleIdentity && googleIdentity.identity_data) {
        url = googleIdentity.identity_data.avatar_url || googleIdentity.identity_data.picture;
      }
    }
    return url;
  };

  const avatarUrl = getAvatarUrl(currentUser);

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-3 py-2 bg-[var(--color-surface)] border-t border-[var(--color-border)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <Link 
        className={`flex flex-col items-center justify-center p-2 transition-transform duration-150 active:scale-90 ${isActive('/') ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'}`} 
        to="/"
      >
        <span className="material-symbols-outlined">home</span>
        <span className="text-xs font-semibold mt-1">Home</span>
      </Link>
      <Link 
        className={`flex flex-col items-center justify-center p-2 transition-transform duration-150 active:scale-90 ${isActive('/explore') ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'}`} 
        to="/explore"
      >
        <span className="material-symbols-outlined">explore</span>
        <span className="text-xs font-semibold mt-1">Explore</span>
      </Link>
      <Link 
        className={`flex flex-col items-center justify-center p-2 transition-transform duration-150 active:scale-90 ${isActive('/sell') ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'}`} 
        to="/sell"
      >
        <span className="material-symbols-outlined text-[32px]">add_circle</span>
        <span className="text-xs font-semibold mt-1">Sell</span>
      </Link>
      <Link 
        className={`relative flex flex-col items-center justify-center p-2 transition-transform duration-150 active:scale-90 ${isActive('/inbox') ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'}`} 
        to="/inbox"
      >
        <div className="relative">
          <span className="material-symbols-outlined">mail</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-[var(--color-danger)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[var(--color-surface)] animate-in zoom-in">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold mt-1">Inbox</span>
      </Link>
      <Link 
        className={`flex flex-col items-center justify-center p-2 transition-transform duration-150 active:scale-90 ${isActive('/profile') ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'}`} 
        to="/profile"
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt="Profile" 
            referrerPolicy="no-referrer"
            className={`w-6 h-6 rounded-full mb-1 object-cover border-2 ${isActive('/profile') ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`} 
          />
        ) : (
          <span className="material-symbols-outlined">person</span>
        )}
        <span className="text-xs font-semibold mt-1">Profile</span>
      </Link>
    </nav>
  );
};
