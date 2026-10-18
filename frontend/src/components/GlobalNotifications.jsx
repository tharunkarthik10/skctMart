import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import apiClient from '../api/client';
import { realtimeService } from '../services/realtimeService';
import { useNavigate, useLocation } from 'react-router-dom';

export const GlobalNotifications = () => {
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const lastBidRef = useRef(null);

  useEffect(() => {
    let chatIds = [];
    let currentUserId = null;
    let chatsData = [];
    let msgChannel = null;
    let chatChannel = null;
    let bidChannel = null;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      currentUserId = user.id;

      try {
        const res = await apiClient.get('/chats');
        const data = res.data;
        if (data) {
          chatsData = data;
          chatIds = data.map(c => c.id);
        }
      } catch (err) {
        console.error("Error fetching chats for notifications", err);
      }

      // 1. Keep chatIds up to date if a new chat is created
      chatChannel = realtimeService.subscribeToChatsInbox(payload => {
        const newChat = payload.new;
        if (newChat && !chatIds.includes(newChat.id)) {
          chatIds.push(newChat.id);
          chatsData.push(newChat);
        }
      });
      
      // 2. Listen to incoming messages (chat & order & bid notifications)
      msgChannel = realtimeService.subscribeToGlobalNotifications(payload => {
        const msg = payload.new;
        if (msg.sender_id !== currentUserId && (chatIds.includes(msg.chat_id) || msg.receiver_id === currentUserId)) {
          // If the user is currently viewing this exact chat, let chat page show it
          if (location.pathname === `/chat/${msg.chat_id}`) return;

          // Check for specialized JSON payload
          let isBid = false;
          let isOrder = false;
          let title = '';
          let body = msg.content;
          let compId = null;

          if (typeof msg.content === 'string' && msg.content.startsWith('{')) {
            try {
              const parsed = JSON.parse(msg.content);
              if (parsed.type === 'NEW_BID') {
                isBid = true;
                lastBidRef.current = parsed.bidId || Date.now();
                title = `🔥 New Bid: ₹${Number(parsed.bidAmount || 0).toLocaleString('en-IN')}`;
                body = `${parsed.bidderName || 'A student maker'} placed a new highest bid on "${parsed.componentTitle}"!`;
                compId = parsed.componentId;
              } else if (parsed.type === 'ORDER_CONFIRMATION') {
                isOrder = true;
                title = `📦 New Order Placed!`;
                body = `Order for "${parsed.productName}" (₹${parsed.grandTotal}) via ${parsed.paymentMethod || 'Pay on Handover'}`;
                compId = parsed.productId;
              }
            } catch (e) {}
          }

          if (!isBid && !isOrder) {
            // Find chat to get sender name
            const chat = chatsData.find(c => c.id === msg.chat_id);
            let senderName = 'Someone';
            if (chat) {
              const isBuyer = chat.buyer_id === msg.sender_id;
              const email = isBuyer ? chat.buyer?.email : chat.seller?.email;
              if (email) senderName = email.split('@')[0];
            }
            title = `New message from ${senderName}`;
          }

          setToast({
            chatId: msg.chat_id,
            componentId: compId,
            title,
            message: body,
            isBid,
            isOrder
          });

          setTimeout(() => {
            setToast(null);
          }, 6000);
        }
      });

      // 3. Directly listen to seller bid updates for live auction alerts
      bidChannel = realtimeService.subscribeToSellerBids(payload => {
        const bid = payload.new;
        const comp = payload.component;
        if (!bid || !comp) return;

        // Prevent duplicate toast if message handler already showed it
        if (lastBidRef.current === bid.id) return;
        lastBidRef.current = bid.id;

        const bidderName = bid.bidder?.name || (bid.bidder?.email ? bid.bidder.email.split('@')[0] : 'A student maker');

        setToast({
          chatId: null,
          componentId: comp.id,
          title: `🔥 New Bid: ₹${Number(bid.amount).toLocaleString('en-IN')}`,
          message: `${bidderName} placed a new highest bid on your auction "${comp.title}"!`,
          isBid: true
        });

        setTimeout(() => {
          setToast(null);
        }, 6500);
      });
    };

    setup();
    
    return () => {
      if (msgChannel) realtimeService.unsubscribe(msgChannel);
      if (chatChannel) realtimeService.unsubscribe(chatChannel);
      if (bidChannel) realtimeService.unsubscribe(bidChannel);
    };
  }, [location.pathname]);

  if (!toast) return null;

  return (
    <div className={`fixed top-20 right-4 z-[9999] rounded-2xl shadow-2xl p-4 max-w-sm w-[92vw] sm:w-[380px] border transition-all animate-bounce-in backdrop-blur-md ${
      toast.isBid 
        ? 'bg-amber-950/90 dark:bg-amber-950/95 border-amber-500/40 text-white shadow-amber-500/10' 
        : toast.isOrder 
          ? 'bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/40 text-white shadow-emerald-500/10'
          : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]'
    }`}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            toast.isBid 
              ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white' 
              : toast.isOrder 
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                : 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
          }`}>
            <span className="material-symbols-outlined text-[20px]">
              {toast.isBid ? 'gavel' : toast.isOrder ? 'shopping_bag' : 'chat'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black truncate leading-snug">
              {toast.title}
            </h4>
            <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed opacity-90">
              {toast.message}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setToast(null)} 
          className="text-white/60 hover:text-white p-1 rounded-lg transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {toast.componentId && (
          <button 
            onClick={() => {
              setToast(null);
              navigate(`/product/${toast.componentId}`);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
              toast.isBid 
                ? 'bg-amber-500 hover:bg-amber-400 text-black font-black' 
                : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {toast.isBid ? 'gavel' : 'visibility'}
            </span>
            <span>{toast.isBid ? 'View Live Auction' : 'View Product'}</span>
          </button>
        )}

        {toast.chatId && (
          <button 
            onClick={() => {
              setToast(null);
              navigate(`/chat/${toast.chatId}`);
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
              toast.isBid || toast.isOrder
                ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] border-transparent'
            } ${!toast.componentId ? 'w-full' : ''}`}
          >
            <span className="material-symbols-outlined text-[15px]">chat</span>
            <span>{toast.componentId ? 'Inbox' : 'View Message'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
