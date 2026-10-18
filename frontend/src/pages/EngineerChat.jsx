import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiClient from '../api/client';
import { realtimeService } from '../services/realtimeService';
import { isProfileComplete } from '../utils/profileUtils';
import { compressImage } from '../utils/imageCompressor';
import EmojiPicker from 'emoji-picker-react';

export const EngineerChat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = React.useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = React.useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userChatIds, setUserChatIds] = useState([]);

  const handleDownloadChat = () => {
    let chatContent = `MakerMart Chat History - ${chatInfo?.components?.title || 'Unknown Item'}\n`;
    chatContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    
    const isBuyer = chatInfo?.buyer_id === currentUserId;
    const otherUserEmail = isBuyer ? chatInfo?.seller?.email : chatInfo?.buyer?.email;
    const otherUserName = otherUserEmail ? otherUserEmail.split('@')[0] : 'Unknown User';

    messages.forEach(msg => {
      const isMe = msg.sender_id === currentUserId;
      const senderName = isMe ? "You" : otherUserName;
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

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      // Automatically compress image before upload
      let compressed;
      try {
        compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.75 });
      } catch (cErr) {
        console.warn('Compression fallback in engineer chat:', cErr);
      }

      const fileToUpload = compressed?.file || file;
      let finalContent = null;

      try {
        // 1. Get presigned URL
        const presignRes = await apiClient.post('/upload/presigned-url', { prefix: 'chat' });
        const { uploadUrl, publicUrl } = presignRes.data;

        // 2. Upload file directly to R2
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: fileToUpload,
          headers: {
            'Content-Type': fileToUpload.type || 'image/webp'
          }
        });

        if (uploadRes.ok) {
          finalContent = publicUrl;
        }
      } catch (uploadErr) {
        console.warn("R2 presigned upload unavailable, using optimized data URL:", uploadErr);
      }

      if (!finalContent) {
        finalContent = compressed?.dataUrl;
      }

      if (!finalContent) {
        throw new Error("Could not process image attachment.");
      }
      
      const receiverId = chatInfo.buyer_id === currentUserId ? chatInfo.seller_id : chatInfo.buyer_id;
      await apiClient.post('/messages', {
        chat_id: chatId,
        receiver_id: receiverId,
        content: finalContent
      });
    } catch (err) {
      console.error(err);
      alert('Failed to upload image.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChatData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      // Fetch chat info
      let chatData = null;
      try {
        const res = await apiClient.get(`/chats/${chatId}`);
        if (res.data) {
          chatData = {
            ...res.data,
            components: res.data.component ? { title: res.data.component.title, price: res.data.component.price } : null
          };
        }
      } catch (err) {
        console.error("Error fetching chat info:", err);
      }
        
      if (chatData) {
        setChatInfo(chatData);
        
        const otherUserId = chatData.buyer_id === currentUserId ? chatData.seller_id : chatData.buyer_id;
        
        // Find ALL chats between these two users
        let chatIds = [chatId];
        try {
          const chatsRes = await apiClient.get('/chats');
          const relatedChats = chatsRes.data.filter(c => 
            (c.buyer_id === currentUserId && c.seller_id === otherUserId) || 
            (c.buyer_id === otherUserId && c.seller_id === currentUserId)
          );
          if (relatedChats.length > 0) {
            chatIds = relatedChats.map(c => c.id);
          }
        } catch (err) {
          console.error("Error fetching related chats:", err);
        }
        setUserChatIds(chatIds);

        // Fetch existing messages from ALL those chats
        try {
          const msgsRes = await apiClient.get(`/messages/chat/${chatIds.join(',')}`);
          if (msgsRes.data) {
            setMessages(msgsRes.data.map(m => ({ ...m, created_at: m.createdAt || m.created_at })));
          }
        } catch (err) {
          console.error("Error fetching messages:", err);
        }
      }
      setLoading(false);
    };

    if (chatId) fetchChatData();
  }, [chatId]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!chatId || userChatIds.length === 0) return;
    
    const channel = realtimeService.subscribeToChatMessages(chatId, payload => {
        if (userChatIds.includes(payload.new.chat_id)) {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, { ...payload.new, created_at: payload.new.createdAt || payload.new.created_at }];
          });
        }
    });
      
    return () => {
      realtimeService.unsubscribe(channel);
    };
  }, [chatId, userChatIds]);

  // Update read receipt whenever we view new messages in this chat
  useEffect(() => {
    if (chatId && messages.length > 0) {
      const receipts = JSON.parse(localStorage.getItem('chatReadReceipts') || '{}');
      receipts[chatId] = Date.now();
      localStorage.setItem('chatReadReceipts', JSON.stringify(receipts));
      window.dispatchEvent(new Event('chatReadUpdate'));
    }
  }, [messages, chatId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;
    
    let profile = null;
    try {
      const profileRes = await apiClient.get(`/users/${currentUserId}`);
      profile = profileRes.data;
    } catch (err) {}
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

    let newMsg = null;
    let error = null;
    try {
      const receiverId = chatInfo.buyer_id === currentUserId ? chatInfo.seller_id : chatInfo.buyer_id;
      const res = await apiClient.post('/messages', {
        chat_id: chatId,
        receiver_id: receiverId,
        content: newMessage
      });
      newMsg = [{ ...res.data, created_at: res.data.createdAt || res.data.created_at }];
    } catch (err) {
      error = err;
    }
      
    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage('');
      if (newMsg && newMsg.length > 0) {
        setMessages(prev => {
          // Prevent duplicates if realtime also caught it
          if (prev.find(m => m.id === newMsg[0].id)) return prev;
          return [...prev, newMsg[0]];
        });
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-[var(--color-background)] flex justify-center items-center font-sans text-[var(--color-text-primary)]">Loading Chat...</div>;
  if (!chatInfo || !currentUserId) return <div className="min-h-screen bg-[var(--color-background)] flex justify-center items-center font-sans text-[var(--color-text-primary)]">Chat not found or access denied.</div>;

  const isBuyer = chatInfo.buyer_id === currentUserId;
  const otherUserEmail = isBuyer ? chatInfo.seller?.email : chatInfo.buyer?.email;
  const otherUserName = otherUserEmail ? otherUserEmail.split('@')[0] : 'Unknown User';
  const otherUserId = isBuyer ? chatInfo.seller_id : chatInfo.buyer_id;

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative flex flex-col">
      
      {/* Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-50 w-full h-16 flex justify-between items-center px-4 md:px-8 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn-icon">
            <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
          </button>
          <Link to={`/user/${otherUserId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-black text-xl border border-[var(--color-primary)]/20 shadow-sm">
              {otherUserName[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight text-[var(--color-text-primary)]">{otherUserName}</span>
              <span className="text-xs font-semibold text-[var(--color-success)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]"></span> Active now
              </span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-[var(--color-background)] px-4 py-1.5 rounded-xl border border-[var(--color-border)] shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider truncate max-w-[150px]">{chatInfo.components?.title}</span>
              <span className="text-sm font-black text-[var(--color-primary)]">₹{chatInfo.components?.price}</span>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="btn-icon">
              <span className="material-symbols-outlined text-[var(--color-text-secondary)]">more_vert</span>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-surface)] rounded-xl shadow-lg border border-[var(--color-border)] z-50 overflow-hidden">
                <button onClick={handleDownloadChat} className="w-full text-left px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">download</span> Download Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-4xl mx-auto flex flex-col relative">
        
        {/* Sticky Warning Banner */}
        <div className="w-full bg-[var(--color-success)]/10 text-[var(--color-text-primary)] p-2 px-4 border-b border-[var(--color-success)]/20 flex items-center justify-center gap-2 text-xs font-bold text-center z-40 shadow-sm">
          <span className="material-symbols-outlined text-sm text-[var(--color-success)]">info</span>
          Messages automatically delete after 15 days
        </div>

        {/* Chat Thread Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          
          {/* Date Separator & Warning */}
          <div className="flex flex-col items-center gap-4">
            <span className="text-xs font-bold text-[var(--color-text-secondary)] bg-[var(--color-surface)] px-4 py-1.5 rounded-full border border-[var(--color-border)] shadow-sm uppercase tracking-wider">Start of Conversation</span>
          </div>

          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (isMe) {
              return (
                <div key={msg.id} className="flex justify-end animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="max-w-[85%] md:max-w-[70%]">
                    <div className="bg-[var(--color-primary)] text-white p-4 rounded-2xl rounded-tr-none shadow-sm">
                      {msg.content.startsWith('http') && (msg.content.includes('r2.dev') || msg.content.includes('r2.cloudflarestorage.com')) ? (
                         <img src={msg.content} alt="Uploaded" className="max-w-full rounded-xl border border-white/20" />
                      ) : (
                         <p className="font-medium whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                    <div className="flex justify-end mt-1.5 gap-1">
                      <span className="text-[10px] font-bold text-[var(--color-text-secondary)]">You • {timeStr}</span>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={msg.id} className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="max-w-[85%] md:max-w-[70%]">
                    <div className="bg-[var(--color-surface)] text-[var(--color-text-primary)] p-4 rounded-2xl rounded-tl-none border border-[var(--color-border)] shadow-sm">
                      {msg.content.startsWith('http') && (msg.content.includes('r2.dev') || msg.content.includes('r2.cloudflarestorage.com')) ? (
                         <img src={msg.content} alt="Uploaded" className="max-w-full rounded-xl border border-[var(--color-border)]" />
                      ) : (
                         <p className="font-medium whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                    <div className="flex justify-start mt-1.5 gap-1">
                      <span className="text-[10px] font-bold text-[var(--color-text-secondary)]">{otherUserName} • {timeStr}</span>
                    </div>
                  </div>
                </div>
              );
            }
          })}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Bottom Input Bar */}
      <footer className="fixed bottom-0 left-0 w-full bg-[var(--color-surface)] border-t border-[var(--color-border)] p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => fileInputRef.current.click()} disabled={uploadingImage} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-primary)] transition-all active:scale-95 shadow-sm">
            <span className="material-symbols-outlined text-[24px]">{uploadingImage ? 'hourglass_empty' : 'add'}</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
          
          <div className="flex-1 relative group">
            <input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] rounded-full pl-6 pr-12 py-3.5 text-base font-medium text-[var(--color-text-primary)] transition-all outline-none shadow-inner" 
              placeholder="Type your message..." 
              type="text"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                <span className="material-symbols-outlined">sentiment_satisfied</span>
              </button>
            </div>
            {showEmojiPicker && (
              <div className="absolute bottom-[calc(100%+10px)] right-0 shadow-xl rounded-xl overflow-hidden border border-[var(--color-border)]">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>
          
          <button onClick={handleSendMessage} className="bg-[var(--color-primary)] text-white hover:opacity-90 transition-all active:scale-95 px-6 py-3.5 rounded-full flex items-center gap-2 shadow-md">
            <span className="text-sm font-bold uppercase tracking-wider hidden md:inline">Send</span>
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
