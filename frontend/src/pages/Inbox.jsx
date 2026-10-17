import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiClient from '../api/client';
import { realtimeService } from '../services/realtimeService';
import { BottomNav } from '../components/BottomNav';
import { getPremiumImageUrl } from '../utils/imageUtils';
import { getRandomEmptyMessage } from '../utils/emptyStates';
import { isProfileComplete } from '../utils/profileUtils';
import EmojiPicker from 'emoji-picker-react';

export const Inbox = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  const [nowTime] = useState(() => Date.now());
  
  // Sidebar state
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [readReceipts, setReadReceipts] = useState({});

  // Active chat state
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userChatIds, setUserChatIds] = useState([]);
  const [orderActions, setOrderActions] = useState({});
  const [actionPendingId, setActionPendingId] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatThreadRef = useRef(null);

  const handleOrderAction = async (action, orderData, msgId) => {
    const orderKey = orderData.orderId || msgId;
    if (action === 'cancel') {
      const confirmCancel = window.confirm("Are you sure you want to cancel this sale and relist the item as available?");
      if (!confirmCancel) return;
    }
    try {
      setActionPendingId(orderKey);
      const res = await apiClient.post('/orders/respond', {
        action,
        orderId: orderData.orderId,
        productId: orderData.productId || chatInfo?.component_id,
        chatId: chatId
      });

      if (res.data.success) {
        setOrderActions(prev => ({ ...prev, [orderKey]: action }));
        if (res.data.message) {
          setMessages(prev => {
            if (prev.some(m => m.id === res.data.message.id)) return prev;
            return [...prev, res.data.message];
          });
        }
        if (action === 'sell' && chatInfo?.components) {
          setChatInfo(prev => ({
            ...prev,
            components: { ...prev.components, status: 'SOLD' }
          }));
        } else if (action === 'cancel' && chatInfo?.components) {
          setChatInfo(prev => ({
            ...prev,
            components: { ...prev.components, status: 'ACTIVE' }
          }));
        }
      }
    } catch (err) {
      console.error('Order response action error:', err);
      alert(err.response?.data?.error || 'Failed to process order action');
    } finally {
      setActionPendingId(null);
    }
  };

  // Helper for user avatar background coloring
  const getAvatarBg = (name) => {
    const colors = [
      'from-teal-500 to-emerald-600',
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-violet-600',
      'from-pink-500 to-rose-600',
      'from-amber-500 to-orange-600',
      'from-cyan-500 to-blue-600',
      'from-indigo-500 to-purple-600',
      'from-emerald-500 to-teal-600'
    ];
    const code = (name || 'U').charCodeAt(0);
    return colors[code % colors.length];
  };

  // Helper to parse order card metadata from message content
  const parseOrderCard = (content) => {
    if (!content || typeof content !== 'string') return null;
    if (content.startsWith('{') && content.includes('"ORDER_CONFIRMATION"')) {
      try {
        return JSON.parse(content);
      } catch (e) {
        return null;
      }
    }
    if (content.includes('New Order Placed') && (content.includes('Cash on Delivery') || content.includes('purchased'))) {
      const productMatch = content.match(/"([^"]+)"/);
      const priceMatch = content.match(/₹([0-9]+)/);
      const meetupMatch = content.match(/(?:Preferred Meetup|Meetup):\s*([^\n]+)/);
      return {
        type: 'ORDER_CONFIRMATION',
        productName: productMatch ? productMatch[1] : null,
        grandTotal: priceMatch ? priceMatch[1] : null,
        deliveryAddress: meetupMatch ? meetupMatch[1] : null,
        paymentMethod: 'Cash on Delivery',
        note: content
      };
    }
    return null;
  };


  // Helper for formatting times in message bubbles
  const formatMsgTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Helper for formatting dates in headers/chat list
  const formatChatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      
      const isToday = date.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (isYesterday) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
      }
    } catch (e) {
      return '';
    }
  };

  const getDayLabel = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();

      if (isToday) return 'Today';
      if (isYesterday) return 'Yesterday';
      return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  // Autoscroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all chats for the user (Sidebar list)
  useEffect(() => {
    const fetchChats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      try {
        const res = await apiClient.get('/chats');
        const data = res.data.map(chat => ({
          ...chat,
          created_at: chat.createdAt || chat.created_at,
          components: chat.component ? {
            title: chat.component.title,
            price: chat.component.price,
            images: chat.component.image_url ? [chat.component.image_url] : []
          } : null,
          messages: (chat.messages || []).map(m => ({ ...m, created_at: m.createdAt || m.created_at }))
        }));

        // Group chats by the other user's ID to keep a single thread per contact
        const groups = {};
        data.forEach(chat => {
          const isBuyer = chat.buyer_id === user.id;
          const otherId = isBuyer ? chat.seller_id : chat.buyer_id;
          if (!groups[otherId]) {
            groups[otherId] = [];
          }
          groups[otherId].push(chat);
        });

        const consolidatedChats = Object.values(groups).map(userChats => {
          let allMessages = [];
          userChats.forEach(c => {
            if (c.messages) allMessages.push(...c.messages);
          });
          
          // Sort messages descending to get latest message at index 0
          allMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          userChats.sort((a, b) => {
             const lastActA = a.messages && a.messages.length > 0 ? new Date(Math.max(...a.messages.map(m => new Date(m.created_at).getTime()))) : new Date(a.created_at).getTime();
             const lastActB = b.messages && b.messages.length > 0 ? new Date(Math.max(...b.messages.map(m => new Date(m.created_at).getTime()))) : new Date(b.created_at).getTime();
             return lastActB - lastActA;
          });
          
          const repChat = { ...userChats[0] };
          repChat.messages = allMessages;
          repChat.lastActivity = allMessages.length > 0 ? new Date(allMessages[0].created_at).getTime() : new Date(repChat.created_at).getTime();
          
          return repChat;
        });

        consolidatedChats.sort((a, b) => b.lastActivity - a.lastActivity);
        setChats(consolidatedChats);
        setReadReceipts(JSON.parse(localStorage.getItem('chatReadReceipts') || '{}'));
      } catch (err) {
        console.error('Error fetching chats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [refreshTrigger]);

  // Fetch active chat details and messages when chatId parameter changes
  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!chatId || !currentUserId) return;
      setMessagesLoading(true);
      setShowEmojiPicker(false);
      setShowMenu(false);
      
      try {
        const res = await apiClient.get(`/chats/${chatId}`);
        if (res.data) {
          const chatData = {
            ...res.data,
            components: res.data.component ? { 
              id: res.data.component.id,
              title: res.data.component.title, 
              price: res.data.component.price,
              image_url: res.data.component.image_url
            } : null
          };
          setChatInfo(chatData);
          
          const otherUserId = chatData.buyer_id === currentUserId ? chatData.seller_id : chatData.buyer_id;
          
          // Find related chats for this user pair
          let chatIds = [chatId];
          const chatsRes = await apiClient.get('/chats');
          const relatedChats = chatsRes.data.filter(c => 
            (c.buyer_id === currentUserId && c.seller_id === otherUserId) || 
            (c.buyer_id === otherUserId && c.seller_id === currentUserId)
          );
          if (relatedChats.length > 0) {
            chatIds = relatedChats.map(c => c.id);
          }
          setUserChatIds(chatIds);

          // Fetch messages across all these related chats
          const msgsRes = await apiClient.get(`/messages/chat/${chatIds.join(',')}`);
          if (msgsRes.data) {
            setMessages(msgsRes.data.map(m => ({ ...m, created_at: m.createdAt || m.created_at })));
          }
        }
      } catch (err) {
        console.error("Error loading chat detail messages:", err);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchChatDetails();
  }, [chatId, currentUserId]);

  // Real-time socket events for chat list updates and active chat message streams
  useEffect(() => {
    if (!currentUserId) return;

    // Refresh chats list on new insertion of chats
    const chatChannel = realtimeService.subscribeToChatsInbox(payload => {
      if (payload.new.buyer_id === currentUserId || payload.new.seller_id === currentUserId) {
        setRefreshTrigger(prev => prev + 1);
      }
    });
      
    // Append message in real-time if it belongs to current active conversation
    const msgChannel = realtimeService.subscribeToMessagesInbox(payload => {
      setRefreshTrigger(prev => prev + 1);
      
      if (chatId && userChatIds.includes(payload.new.chat_id)) {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, { ...payload.new, created_at: payload.new.createdAt || payload.new.created_at }];
        });
        
        // Update read receipt locally
        const receipts = JSON.parse(localStorage.getItem('chatReadReceipts') || '{}');
        receipts[chatId] = Date.now();
        localStorage.setItem('chatReadReceipts', JSON.stringify(receipts));
        window.dispatchEvent(new Event('chatReadUpdate'));
      }
    });
      
    return () => {
      realtimeService.unsubscribe(chatChannel);
      realtimeService.unsubscribe(msgChannel);
    };
  }, [currentUserId, chatId, userChatIds]);

  // Update read receipt whenever we see/read new messages in this chat
  useEffect(() => {
    if (chatId && messages.length > 0) {
      const receipts = JSON.parse(localStorage.getItem('chatReadReceipts') || '{}');
      receipts[chatId] = Date.now();
      localStorage.setItem('chatReadReceipts', JSON.stringify(receipts));
      window.dispatchEvent(new Event('chatReadUpdate'));
    }
  }, [messages, chatId]);

  // Send text message action
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !chatInfo) return;
    
    // Check if user profile details are complete before letting them message
    let profile = null;
    try {
      const profileRes = await apiClient.get(`/users/${currentUserId}`);
      profile = profileRes.data;
    } catch (err) {
      console.warn("Failed to fetch profile in handleSendMessage:", err);
    }
    if (!isProfileComplete(profile)) {
      alert('Please complete your profile details (Name, Register No, Department, Year, Mobile Number) and save them for verification before sending a message.');
      navigate('/profile');
      return;
    }
    if (!profile.is_profile_verified) {
      alert('Your profile details are pending admin verification. You can only chat once verified.');
      navigate('/profile');
      return;
    }

    try {
      const receiverId = chatInfo.buyer_id === currentUserId ? chatInfo.seller_id : chatInfo.buyer_id;
      const res = await apiClient.post('/messages', {
        chat_id: chatId,
        receiver_id: receiverId,
        content: newMessage
      });
      
      const sentMsg = { ...res.data, created_at: res.data.createdAt || res.data.created_at };
      setNewMessage('');
      setMessages(prev => {
        if (prev.some(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Failed to send message:", err);
      alert('Error sending message. Please try again.');
    }
  };

  // Upload image attachment to Cloudflare R2 bucket and send message
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !chatInfo) return;
    
    setUploadingImage(true);
    try {
      // 1. Fetch presigned S3/R2 upload URL
      const presignRes = await apiClient.post('/upload/presigned-url', { prefix: 'chat' });
      const { uploadUrl, publicUrl } = presignRes.data;

      // 2. Perform direct PUT upload to R2
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'image/webp'
        }
      });
      
      // 3. Create message reference in chat
      const receiverId = chatInfo.buyer_id === currentUserId ? chatInfo.seller_id : chatInfo.buyer_id;
      const res = await apiClient.post('/messages', {
        chat_id: chatId,
        receiver_id: receiverId,
        content: publicUrl
      });

      const sentMsg = { ...res.data, created_at: res.data.createdAt || res.data.created_at };
      setMessages(prev => {
        if (prev.some(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert('Failed to send image attachment.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add emoji to message input box
  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Download entire conversation history to file
  const handleDownloadChat = () => {
    if (!chatInfo || messages.length === 0) return;
    let chatContent = `MakerMart Chat History - ${chatInfo?.components?.title || 'Unknown Item'}\n`;
    chatContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    
    const isBuyer = chatInfo?.buyer_id === currentUserId;
    const otherUserEmail = isBuyer ? chatInfo?.seller?.email : chatInfo?.buyer?.email;
    const otherUserName = isBuyer ? chatInfo?.seller?.name : chatInfo?.buyer?.name;
    const otherUserFallback = otherUserEmail ? otherUserEmail.split('@')[0] : 'Unknown User';
    const otherName = otherUserName || otherUserFallback;

    messages.forEach(msg => {
      const isMe = msg.sender_id === currentUserId;
      const senderName = isMe ? "You" : otherName;
      const timeStr = new Date(msg.created_at).toLocaleString();
      chatContent += `[${timeStr}] ${senderName}: ${msg.content}\n`;
    });

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `makermart_chat_${chatId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowMenu(false);
  };

  // Filter chats matching active categorization tab and search queries
  const filteredChats = chats.filter(chat => {
    const isBuyer = chat.buyer_id === currentUserId;
    
    // Categorization filter
    if (filter === 'unread') {
      const lastRead = readReceipts[chat.id] || 0;
      const isUnread = chat.messages && chat.messages.some(msg => msg.sender_id !== currentUserId && new Date(msg.created_at).getTime() > lastRead);
      if (!isUnread) return false;
    } else if (filter === 'buying') {
      if (!isBuyer) return false;
    } else if (filter === 'selling') {
      if (isBuyer) return false;
    }
    
    // Search query matching
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const otherUserEmail = isBuyer ? chat.seller?.email : chat.buyer?.email;
      const otherUserName = isBuyer ? chat.seller?.name : chat.buyer?.name;
      const otherUserFallback = otherUserEmail ? otherUserEmail.split('@')[0] : '';
      const nameMatch = (otherUserName || '').toLowerCase().includes(query) || otherUserFallback.toLowerCase().includes(query);
      const productMatch = (chat.components?.title || '').toLowerCase().includes(query);
      
      return nameMatch || productMatch;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col font-sans">
        <div className="flex-grow flex flex-col items-center justify-center text-[var(--color-text-secondary)] gap-3">
          <span className="material-symbols-outlined animate-spin text-[32px] text-[var(--color-primary)]">progress_activity</span>
          <span>Loading MakerMarT Chats...</span>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col font-sans">
        <header className="bg-[var(--color-surface)] sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 w-full h-16 border-b border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="btn-icon">
              <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">Inbox</h1>
          </div>
        </header>
        <div className="flex-grow flex flex-col items-center justify-center text-[var(--color-text-secondary)] py-12 px-4 text-center">
          <span className="material-symbols-outlined text-[64px] mb-4 opacity-40">lock</span>
          <p className="font-semibold text-lg mb-2">Access Denied</p>
          <p className="max-w-xs text-sm mb-6">Please log in with your account to view your messages and chat history.</p>
          <button onClick={() => navigate('/login')} className="bg-[var(--color-primary)] text-white hover:opacity-90 transition-all font-bold px-6 py-2.5 rounded-full shadow-sm">Log In</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const getOtherUserDisplay = () => {
    if (!chatInfo) return { name: 'User', initial: 'U' };
    const isBuyer = chatInfo.buyer_id === currentUserId;
    const otherUser = isBuyer ? chatInfo.seller : chatInfo.buyer;
    
    const email = otherUser?.email || '';
    const emailFallback = email ? email.split('@')[0] : 'User';
    const name = otherUser?.name || emailFallback;
    const initial = name ? name[0].toUpperCase() : 'U';
    
    return { name, initial };
  };

  const { name: otherUserName, initial: otherUserInitial } = getOtherUserDisplay();

  return (
    <div className={`bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans overflow-hidden flex flex-col relative ${chatId ? 'h-screen md:h-[calc(100vh-64px)]' : 'h-[calc(100vh-64px)]'}`}>
      
      {/* Redesigned Dashboard Split Layout Wrapper */}
      <div className="flex flex-grow w-full h-full overflow-hidden relative">
        
        {/* Left Column: Chats List panel */}
        <aside className={`flex flex-col h-full bg-[var(--color-card)] border-r border-[var(--color-border)] ${chatId ? 'hidden md:flex md:w-[350px] lg:w-[410px] flex-shrink-0' : 'w-full md:w-[350px] lg:w-[410px] flex-shrink-0'}`}>
          
          {/* List panel Header */}
          <div className="bg-[var(--color-surface)] px-5 py-4 flex justify-between items-center h-16 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-all">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <h2 className="font-bold text-lg text-[var(--color-text-primary)] tracking-tight">Chats</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/')} title="Browse Listings" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                <span className="material-symbols-outlined text-[22px]">chat_add_on</span>
              </button>
              <button onClick={() => setRefreshTrigger(p => p+1)} title="Refresh Chats" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                <span className="material-symbols-outlined text-[22px]">sync</span>
              </button>
            </div>
          </div>
 
          {/* Search bar Container */}
          <div className="bg-[var(--color-card)] p-3 border-b border-[var(--color-border)] flex items-center gap-2">
            <div className="flex-grow bg-[var(--color-surface)] rounded-xl px-4 py-2 flex items-center gap-3 border border-[var(--color-border)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30 focus-within:border-[var(--color-primary)] transition-all">
              <span className="material-symbols-outlined text-[18px] text-[var(--color-text-secondary)] select-none">search</span>
              <input
                type="text"
                placeholder="Search by name or item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-sm outline-none w-full text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/50 p-0 focus:ring-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
 
          {/* Filter tabs */}
          <div className="px-4 py-3 bg-[var(--color-card)] border-b border-[var(--color-border)] flex gap-2 overflow-x-auto select-none no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'buying', label: 'Buying' },
              { id: 'selling', label: 'Selling' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-[var(--color-primary-dark)] text-white border-[var(--color-primary-dark)] shadow-sm'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface)]/80 hover:text-[var(--color-text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
 
          {/* Scrollable list items */}
          <div className="flex-1 overflow-y-auto bg-[var(--color-card)] scroll-smooth">
            {filteredChats.length === 0 ? (
              <div className="py-12 px-6 text-center text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined text-[48px] opacity-35 mb-2">chat_bubble</span>
                <p className="text-sm font-medium">{getRandomEmptyMessage('messages')}</p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isBuyer = chat.buyer_id === currentUserId;
                const otherUserEmail = isBuyer ? chat.seller?.email : chat.buyer?.email;
                const otherUserName = isBuyer ? chat.seller?.name : chat.buyer?.name;
                const otherUserFallback = otherUserEmail ? otherUserEmail.split('@')[0] : 'Unknown User';
                const otherName = otherUserName || otherUserFallback;
                
                const productTitle = chat.components?.title || 'Unknown Item';
                const latestMessage = chat.messages?.[0] || null;
                let snippet = 'Click to start chatting.';
                if (latestMessage) {
                  if (latestMessage.content.startsWith('http')) {
                    snippet = '📷 Photo';
                  } else {
                    const parsedOrder = parseOrderCard(latestMessage.content);
                    if (parsedOrder) {
                      snippet = `📦 Order: ${parsedOrder.productName || productTitle} (₹${parsedOrder.grandTotal || ''})`;
                    } else {
                      snippet = latestMessage.content;
                    }
                  }
                }
                
                const timestamp = latestMessage ? formatChatDate(latestMessage.created_at) : formatChatDate(chat.created_at);
                
                const lastRead = readReceipts[chat.id] || 0;
                let unreadCount = 0;
                if (chat.messages) {
                  for (let msg of chat.messages) {
                    if (msg.sender_id !== currentUserId && new Date(msg.created_at).getTime() > lastRead) {
                      unreadCount++;
                    } else {
                      break;
                    }
                  }
                }
                const isUnread = unreadCount > 0;
                const isMe = latestMessage && latestMessage.sender_id === currentUserId;
                const isRead = latestMessage && isMe && (new Date(latestMessage.created_at).getTime() < lastRead || nowTime - new Date(latestMessage.created_at).getTime() > 120000);
                const isActiveChat = chat.id === chatId;
 
                return (
                  <div
                    key={chat.id}
                    onClick={() => navigate(`/chat/${chat.id}`)}
                    className={`flex items-center gap-4 px-5 py-4 border-b border-[var(--color-border)] cursor-pointer transition-all duration-200 select-none relative hover:bg-[var(--color-surface)]/50 ${isActiveChat ? 'bg-[var(--color-surface)] hover:bg-[var(--color-surface)]' : ''}`}
                  >
                    {/* User initial avatar circle */}
                    <div className={`w-12 h-12 rounded-full flex-shrink-0 bg-gradient-to-br ${getAvatarBg(otherName)} text-white font-extrabold text-lg flex items-center justify-center shadow-inner border border-black/5`}>
                      {otherName[0].toUpperCase()}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-sm text-[var(--color-text-primary)] truncate">{otherName}</span>
                        <span className={`text-[10px] font-bold ${isUnread ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}>{timestamp}</span>
                      </div>
                      
                      {/* Product details indicator context */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${isBuyer ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'bg-[var(--color-accent-light)]/20 text-[var(--color-primary-dark)] border border-[var(--color-accent-light)]/30'}`}>
                          {isBuyer ? 'Buying' : 'Selling'}
                        </span>
                        <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] truncate">{productTitle}</span>
                      </div>
                      
                      {/* Snippet text */}
                      <p className={`text-xs truncate flex items-center ${isUnread ? 'text-[var(--color-text-primary)] font-bold' : 'text-[var(--color-text-secondary)]'}`}>
                        {isMe && (
                          <span className={`material-symbols-outlined text-[15px] mr-1 select-none flex-shrink-0 ${isRead ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
                            done_all
                          </span>
                        )}
                        <span className="truncate">{snippet}</span>
                      </p>
                    </div>
 
                    {/* Unread badge */}
                    {isUnread && (
                      <div className="absolute right-5 bottom-4 w-5 h-5 flex items-center justify-center bg-[var(--color-primary)] text-white rounded-full text-[10px] font-bold shadow-sm">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>
 
        {/* Right Column: Chat Window or Placeholder Empty State */}
        <main className={`flex flex-col h-full bg-gradient-to-b from-[var(--color-background)] to-[var(--color-surface)] relative ${chatId ? 'flex-grow min-w-0' : 'hidden md:flex md:flex-grow md:items-center md:justify-center'}`}>
          
          {chatId ? (
            // ACTIVE CONVERSATION CONTAINER
            <div className="flex flex-col h-full w-full relative">
              
              {/* Redesigned Active Chat Header */}
              <header className="bg-[var(--color-surface)] px-5 py-3 border-b border-[var(--color-border)] h-16 flex justify-between items-center z-30 shadow-sm">
                
                {/* Contact information */}
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => navigate('/inbox')} className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 text-[var(--color-text-secondary)]">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  
                  {chatInfo && (
                    <Link to={`/user/${chatInfo.buyer_id === currentUserId ? chatInfo.seller_id : chatInfo.buyer_id}`} className="flex items-center gap-3 min-w-0 hover:opacity-85 transition-opacity">
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-br ${getAvatarBg(otherUserName)} text-white font-extrabold text-base flex items-center justify-center border border-black/5 shadow-inner`}>
                        {otherUserInitial}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-[var(--color-text-primary)] truncate">
                          {otherUserName}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--color-success)] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse"></span> Active now
                        </span>
                      </div>
                    </Link>
                  )}
                </div>
 
                {/* Redesigned mini product preview card */}
                <div className="flex items-center gap-3">
                  {chatInfo?.components && (
                    <div className="hidden sm:flex items-center gap-3 bg-[var(--color-card)] px-4 py-1.5 rounded-2xl border border-[var(--color-border)] shadow-sm select-none hover:border-[var(--color-primary)] transition-all">
                      {chatInfo.components.image_url ? (
                        <img 
                          src={chatInfo.components.image_url} 
                          alt={chatInfo.components.title} 
                          className="w-8 h-8 rounded-lg object-cover border border-[var(--color-border)]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-primary)]">
                          <span className="material-symbols-outlined text-base">memory</span>
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[var(--color-text-primary)] truncate max-w-[150px]">{chatInfo.components.title}</span>
                        <span className="text-[11px] font-black text-[var(--color-primary)]">₹{chatInfo.components.price}</span>
                      </div>
                      <Link to={`/product/${chatInfo.component_id}`} className="text-[10px] font-black text-white bg-[var(--color-primary)] px-3 py-1 rounded-xl hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all ml-1">
                        View
                      </Link>
                    </div>
                  )}
                  
                  {/* Option Dropdown Trigger */}
                  <div className="relative">
                    <button onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                      <span className="material-symbols-outlined text-[22px]">more_vert</span>
                    </button>
                    {showMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-lg shadow-xl border border-[var(--color-border)] z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        {chatInfo?.component_id && (
                          <Link to={`/product/${chatInfo.component_id}`} className="sm:hidden w-full text-left px-4 py-2.5 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors flex items-center gap-2 border-b border-[var(--color-border)]">
                            <span className="material-symbols-outlined text-[16px] text-[var(--color-text-secondary)]">shopping_bag</span> View Listing Details
                          </Link>
                        )}
                        <button onClick={handleDownloadChat} className="w-full text-left px-4 py-2.5 text-xs font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-[var(--color-text-secondary)]">download</span> Download Chat History
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </header>
 
              {/* Refreshed Sticky Info Alert */}
              <div className="bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] py-2 px-4 flex items-center justify-center gap-2 text-[10px] font-bold tracking-wider uppercase border-b border-[var(--color-border)] shadow-inner select-none">
                <span className="material-symbols-outlined text-base">verified_user</span>
                <span>Security Notice: Meet in safe campus zones. Chats expire in 15 days.</span>
              </div>

              {/* Linked Product Banner */}
              {chatInfo?.components && (
                <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-2 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {chatInfo.components.image_url ? (
                      <img 
                        src={getPremiumImageUrl(chatInfo.components.image_url)} 
                        alt={chatInfo.components.title} 
                        className="w-9 h-9 rounded-lg object-cover border border-[var(--color-border)] shrink-0 bg-white"
                        onError={(e) => { e.target.src = 'https://placehold.co/200x200/F8FAFC/46A857?text=Product'; }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">memory</span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                        {chatInfo.components.title}
                      </span>
                      <span className="text-[11px] font-black text-[var(--color-primary)]">
                        ₹{chatInfo.components.price}
                      </span>
                    </div>
                  </div>
                  {chatInfo.component_id && (
                    <Link 
                      to={`/product/${chatInfo.component_id}`}
                      className="shrink-0 text-[11px] font-bold px-3 py-1 rounded-xl bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all shadow-xs flex items-center gap-1"
                    >
                      <span>View</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </Link>
                  )}
                </div>
              )}
 
              {/* Chat messages list wrapper with subtle geometric pattern */}
              <div 
                ref={chatThreadRef}
                className="flex-1 w-full overflow-y-auto px-4 md:px-8 py-6 space-y-4 bg-[var(--color-background)] relative"
                style={{
                  backgroundImage: `radial-gradient(var(--color-border) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }}
              >
                {messagesLoading ? (
                  <div className="h-full w-full flex flex-col justify-center items-center text-[var(--color-text-secondary)] gap-2">
                    <span className="material-symbols-outlined animate-spin text-[24px] text-[var(--color-primary)]">progress_activity</span>
                    <span className="text-xs font-semibold">Retrieving message log...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full w-full flex flex-col justify-center items-center text-[var(--color-text-secondary)] select-none text-center p-8 py-24">
                    <div className="w-[260px] md:w-[320px] flex flex-col items-center">
                      <span className="material-symbols-outlined text-[48px] opacity-25 mb-3 text-[var(--color-primary)]">chat</span>
                      <p className="font-bold text-sm mb-1">No messages yet</p>
                      <p className="text-xs leading-relaxed opacity-75">
                        Send a message to introduce yourself and start discussing this listing details!
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.sender_id === currentUserId;
                    const timeStr = formatMsgTime(msg.created_at);
                    
                    // Group messages by day headers
                    const currentMsgDate = getDayLabel(msg.created_at);
                    const prevMsgDate = index > 0 ? getDayLabel(messages[index - 1].created_at) : null;
                    const showDateSeparator = currentMsgDate !== prevMsgDate;
 
                    const lastRead = readReceipts[chatId] || 0;
                    const isRead = isMe && (new Date(msg.created_at).getTime() < lastRead || nowTime - new Date(msg.created_at).getTime() > 120000);
 
                    return (
                      <React.Fragment key={msg.id}>
                        {showDateSeparator && (
                          <div className="flex justify-center my-4 select-none">
                            <span className="bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-[10px] font-black px-3.5 py-1 rounded-lg border border-[var(--color-border)] shadow-sm uppercase tracking-wider">
                              {currentMsgDate}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                          <div className="max-w-[85%] md:max-w-[70%] relative group">
                            
                            {/* Modern redesigned speech bubble */}
                            <div 
                              className={`p-4 rounded-[20px] shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-[14px] leading-relaxed relative ${
                                isMe 
                                  ? 'bg-[var(--color-primary-dark)] text-[var(--color-text-inverse)] rounded-tr-none' 
                                  : 'bg-[var(--color-card)] text-[var(--color-text-primary)] rounded-tl-none border border-[var(--color-border)]'
                              }`}
                              style={{ 
                                wordBreak: 'break-word',
                                paddingBottom: '24px', 
                                paddingRight: '48px' 
                              }}
                            >
                              {(() => {
                                const orderData = parseOrderCard(msg.content);
                                if (orderData) {
                                  const prodImg = orderData.productImage || chatInfo?.components?.image_url;
                                  const prodTitle = orderData.productName || chatInfo?.components?.title || 'Component';
                                  const prodPrice = orderData.grandTotal || chatInfo?.components?.price;
                                  const prodQty = orderData.quantity || 1;
                                  const targetCompId = orderData.productId || chatInfo?.component_id;
                                  const orderKey = orderData.orderId || msg.id;

                                  // Determine status: local user interaction takes priority, then message history
                                  let currentActionState = orderActions[orderKey];
                                  if (!currentActionState) {
                                    const statusMessages = messages.filter(m => 
                                      m.content && (
                                        m.content.includes('Deal Confirmed') || 
                                        m.content.includes('Sale Cancelled') || 
                                        m.content.includes('cancelled this sale') || 
                                        m.content.includes('unable to fulfill') || 
                                        m.content.includes('unavailable. Apologies') ||
                                        (m.content.includes('marked') && m.content.includes('Sold'))
                                      )
                                    );
                                    if (statusMessages.length > 0) {
                                      const lastMsg = statusMessages[statusMessages.length - 1];
                                      if (lastMsg.content.includes('Sale Cancelled') || lastMsg.content.includes('cancelled this sale')) {
                                        currentActionState = 'cancel';
                                      } else if (lastMsg.content.includes('Deal Confirmed') || (lastMsg.content.includes('marked') && lastMsg.content.includes('Sold'))) {
                                        currentActionState = 'sell';
                                      } else if (lastMsg.content.includes('unable to fulfill') || lastMsg.content.includes('unavailable. Apologies')) {
                                        currentActionState = 'ignore';
                                      }
                                    } else if (chatInfo?.components?.status === 'SOLD') {
                                      currentActionState = 'sell';
                                    }
                                  }

                                  const hasAccepted = currentActionState === 'sell';
                                  const hasCancelled = currentActionState === 'cancel';
                                  const hasIgnored = currentActionState === 'ignore';

                                  return (
                                    <div className="space-y-3 min-w-[240px] sm:min-w-[290px] pt-1">
                                      {/* Order Header Badge */}
                                      <div className="flex items-center justify-between pb-2.5 border-b border-black/10 dark:border-white/10">
                                        <div className="flex items-center gap-1.5">
                                          <span className={`material-symbols-outlined text-[18px] ${isMe ? 'text-white' : 'text-[var(--color-primary)]'}`}>
                                            shopping_bag
                                          </span>
                                          <span className="text-xs font-black tracking-wide uppercase">Order Confirmed</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMe ? 'bg-white/20 text-white' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                                          COD
                                        </span>
                                      </div>

                                      {/* Embedded Product Card */}
                                      <div className={`p-2.5 rounded-xl flex items-center gap-3 border transition-all ${
                                        isMe 
                                          ? 'bg-white/10 border-white/20 text-white' 
                                          : 'bg-[var(--color-background)] border-[var(--color-border)] shadow-sm'
                                      }`}>
                                        {prodImg ? (
                                          <img 
                                            src={getPremiumImageUrl(prodImg)} 
                                            alt={prodTitle} 
                                            className="w-14 h-14 rounded-lg object-cover border border-black/10 shrink-0 bg-white"
                                            onError={(e) => { e.target.src = 'https://placehold.co/200x200/F8FAFC/46A857?text=Product'; }}
                                          />
                                        ) : (
                                          <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${isMe ? 'bg-white/15' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                                            <span className="material-symbols-outlined text-[24px]">memory</span>
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-sm truncate leading-snug">
                                            {prodTitle}
                                          </h4>
                                          <div className="flex items-baseline gap-2 mt-0.5">
                                            <span className={`text-sm font-black ${isMe ? 'text-white' : 'text-[var(--color-primary)]'}`}>
                                              ₹{prodPrice}
                                            </span>
                                            <span className={`text-[11px] font-semibold ${isMe ? 'text-white/75' : 'text-[var(--color-text-secondary)]'}`}>
                                              • Qty: {prodQty}
                                            </span>
                                          </div>
                                          {targetCompId && (
                                            <Link 
                                              to={`/product/${targetCompId}`}
                                              className={`inline-flex items-center gap-1 text-[10px] font-bold mt-1 underline hover:opacity-85 transition-opacity ${isMe ? 'text-white' : 'text-[var(--color-primary)]'}`}
                                            >
                                              <span>View Product</span>
                                              <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                                            </Link>
                                          )}
                                        </div>
                                      </div>

                                      {/* Meetup Address info */}
                                      {orderData.deliveryAddress && (
                                        <div className={`px-2.5 py-1.5 rounded-lg text-xs flex items-start gap-2 ${isMe ? 'bg-black/15' : 'bg-[var(--color-surface)] border border-[var(--color-border)]'}`}>
                                          <span className={`material-symbols-outlined text-[16px] shrink-0 mt-0.5 ${isMe ? 'text-white/90' : 'text-[var(--color-primary)]'}`}>location_on</span>
                                          <div className="min-w-0">
                                            <span className={`font-bold block text-[9px] uppercase tracking-wider ${isMe ? 'text-white/70' : 'text-[var(--color-text-secondary)]'}`}>Meetup Spot</span>
                                            <span className="font-semibold break-words leading-tight block text-[11px]">{orderData.deliveryAddress}</span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Note / Message */}
                                      {orderData.note && (
                                        <p className="font-medium text-xs leading-relaxed whitespace-pre-wrap pt-0.5 opacity-95">
                                          {orderData.note}
                                        </p>
                                      )}

                                      {/* Seller Action Buttons or Status Badge */}
                                      {!isMe && (
                                        <div className="pt-2.5 border-t border-[var(--color-border)]">
                                          {hasAccepted ? (
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold">
                                              <div className="flex items-center gap-1.5 px-1.5 select-none py-0.5">
                                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                                <span>Marked as Sold & Accepted</span>
                                              </div>
                                              <button
                                                onClick={() => handleOrderAction('cancel', orderData, msg.id)}
                                                disabled={actionPendingId === orderKey}
                                                className="py-1 px-2.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950 dark:hover:bg-red-900/60 dark:text-red-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs"
                                                title="Cancel this sale and relist item as available"
                                              >
                                                {actionPendingId === orderKey ? (
                                                  <span className="material-symbols-outlined animate-spin text-[13px]">progress_activity</span>
                                                ) : (
                                                  <span className="material-symbols-outlined text-[13px]">cancel</span>
                                                )}
                                                <span>Cancel Sale</span>
                                              </button>
                                            </div>
                                          ) : hasCancelled ? (
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 text-xs font-bold">
                                              <div className="flex items-center gap-1.5 px-1.5 select-none py-0.5">
                                                <span className="material-symbols-outlined text-[16px]">info</span>
                                                <span>Sale Cancelled (Item Relisted)</span>
                                              </div>
                                              <button
                                                onClick={() => handleOrderAction('sell', orderData, msg.id)}
                                                disabled={actionPendingId === orderKey}
                                                className="py-1 px-2.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs"
                                                title="Mark as Sold again"
                                              >
                                                {actionPendingId === orderKey ? (
                                                  <span className="material-symbols-outlined animate-spin text-[13px]">progress_activity</span>
                                                ) : (
                                                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                                )}
                                                <span>Sell Again</span>
                                              </button>
                                            </div>
                                          ) : hasIgnored ? (
                                            <div className="flex items-center gap-1.5 py-1 px-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-xs font-bold select-none">
                                              <span className="material-symbols-outlined text-[16px]">close</span>
                                              <span>Order Ignored / Declined</span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => handleOrderAction('sell', orderData, msg.id)}
                                                disabled={actionPendingId === orderKey}
                                                className="flex-1 py-2 px-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                                title="Mark product as Sold and accept order"
                                              >
                                                {actionPendingId === orderKey ? (
                                                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                                ) : (
                                                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                                )}
                                                <span>Sell</span>
                                              </button>
                                              <button
                                                onClick={() => handleOrderAction('ignore', orderData, msg.id)}
                                                disabled={actionPendingId === orderKey}
                                                className="py-2 px-4 rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-900/50 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                                title="Decline order and send automated apology message"
                                              >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                                <span>Ignore</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Buyer Side Status Indicator */}
                                      {isMe && hasAccepted && (
                                        <div className="pt-2 border-t border-white/15">
                                          <span className="text-[11px] font-bold text-emerald-200 flex items-center gap-1 select-none">
                                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                            Seller accepted & marked as Sold
                                          </span>
                                        </div>
                                      )}
                                      {isMe && hasCancelled && (
                                        <div className="pt-2 border-t border-white/15">
                                          <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1 select-none">
                                            <span className="material-symbols-outlined text-[14px]">cancel</span>
                                            Sale cancelled by seller (Item relisted as available)
                                          </span>
                                        </div>
                                      )}
                                      {isMe && hasIgnored && (
                                        <div className="pt-2 border-t border-white/15">
                                          <span className="text-[11px] font-bold text-red-200 flex items-center gap-1 select-none">
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                            Seller declined this request
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                if (msg.content.startsWith('http') && (msg.content.includes('r2.dev') || msg.content.includes('r2.cloudflarestorage.com'))) {
                                  return (
                                    <div className="rounded-lg overflow-hidden border border-[var(--color-border)] bg-black/5 mb-1 max-w-full">
                                      <img 
                                        src={getPremiumImageUrl(msg.content)} 
                                        alt="Chat attachment" 
                                        className="max-w-full max-h-[300px] object-contain hover:scale-[1.01] transition-transform duration-200 cursor-zoom-in"
                                        onClick={() => window.open(msg.content, '_blank')}
                                      />
                                    </div>
                                  );
                                }

                                return <p className="font-semibold whitespace-pre-wrap">{msg.content}</p>;
                              })()}
                              
                              {/* Bubble metadata bottom right */}
                              <div className="absolute bottom-1 right-3 flex items-center gap-1 select-none">
                                <span className={`text-[9px] font-semibold ${isMe ? 'text-white/75' : 'text-[var(--color-text-secondary)]'}`}>{timeStr}</span>
                                {isMe && (
                                  <span className={`material-symbols-outlined text-[15px] leading-none ${isRead ? 'text-[var(--color-accent-light)]' : 'text-white/40'}`}>
                                    done_all
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
 
              {/* Redesigned modern bottom message input footer */}
              <footer className="bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-4 md:px-6 md:pb-8 flex items-center gap-3 relative z-20 shadow-md">
                {/* Emoji toggle & file attachments */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--color-primary)]/10 transition-colors ${showEmojiPicker ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'}`}
                    title="Emojis"
                  >
                    <span className="material-symbols-outlined text-[24px]">sentiment_satisfied</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current.click()} 
                    disabled={uploadingImage} 
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] disabled:opacity-50 transition-colors"
                    title="Attach Image"
                  >
                    <span className="material-symbols-outlined text-[24px]">{uploadingImage ? 'hourglass_empty' : 'add'}</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageSelect} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                
                {/* Input Text Area Container */}
                <div className="flex-grow relative">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-full px-6 py-3 text-sm outline-none text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/50 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all shadow-inner"
                  />
                  {showEmojiPicker && (
                    <div className="absolute bottom-[calc(100%+14px)] left-0 shadow-2xl rounded-xl overflow-hidden border border-[var(--color-border)] z-50">
                      <EmojiPicker onEmojiClick={onEmojiClick} />
                    </div>
                  )}
                </div>
 
                {/* Send Button or Mic button */}
                <div className="flex-shrink-0">
                  {newMessage.trim() ? (
                    <button 
                      onClick={handleSendMessage} 
                      className="w-10 h-10 rounded-full bg-[var(--color-primary-dark)] text-white hover:bg-[var(--color-primary)] flex items-center justify-center shadow-md active:scale-90 transition-all duration-150"
                    >
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => alert('Voice notes coming soon!')}
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                      title="Voice Message"
                    >
                      <span className="material-symbols-outlined text-[22px]">mic</span>
                    </button>
                  )}
                </div>
              </footer>
 
            </div>
          ) : (
            // DEFAULT EMPTY/UNSELECTED STATE LAYOUT
            <div className="h-full w-full bg-[var(--color-surface)] flex flex-col justify-center items-center text-center p-8 select-none border-l border-[var(--color-border)]">
              <div className="w-[280px] md:w-[320px] max-w-full flex flex-col items-center justify-center">
                {/* Decorative icon wrapper */}
                <div className="w-24 h-24 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-6 shadow-sm border border-[var(--color-primary)]/20">
                  <span className="material-symbols-outlined text-[48px] animate-pulse">forum</span>
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2.5">MakerMarT Inbox</h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6 font-medium">
                  Select a chat conversation from the list to start messaging. Discuss component listings, align prices, and negotiate secure on-campus deliveries instantly.
                </p>
                <div className="flex items-center gap-1.5 justify-center py-1.5 bg-[var(--color-background)] px-4 rounded-full border border-[var(--color-border)]">
                  <span className="material-symbols-outlined text-[14px] text-[var(--color-text-secondary)]">lock</span>
                  <span className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">Secure On-Campus Messaging</span>
                </div>
              </div>
            </div>
          )}
          
        </main>
        
      </div>
      
      {/* Hide Bottom Nav on mobile inside active chat view */}
      {(!chatId || window.innerWidth >= 768) && <BottomNav />}
      
    </div>
  );
};
