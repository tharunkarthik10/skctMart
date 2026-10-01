import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../api/client';

export const AiChatBot = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      text: 'Hi there! 👋 I am your MakerMart AI assistant. Ask me about microcontrollers, pinouts, buying/selling hardware, live auctions, or campus hackathons!' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Quick suggestion chips
  const SUGGESTIONS = [
    "⚡ ESP32 Specs",
    "📦 How to Sell",
    "🔨 Live Auctions",
    "🤖 Arduino Pinouts",
    "💡 SIH Problems"
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), sender: 'user', text: query };
    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      const res = await apiClient.post('/ai/chat', { 
        message: query,
        history: messages.slice(-6).map(m => ({ role: m.sender === 'user' ? 'user' : 'model', content: m.text }))
      });
      
      const replyText = res.data?.reply || "I'm ready to help! What hardware component or MakerMart feature can I assist with?";
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now() + 1, 
          sender: 'bot', 
          text: replyText 
        }
      ]);
    } catch (err) {
      console.error('AI chat request failed:', err);
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now() + 1, 
          sender: 'bot', 
          text: "I couldn't reach the AI engine right now. Please ensure your backend is running or try asking about ESP32, Arduino, Auctions, or Selling!" 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage();
  };

  // Hide AI Chat Bot floating button on Inbox and Chat pages to prevent UI overlap
  const isChatPage = location.pathname.startsWith('/inbox') || location.pathname.startsWith('/chat');
  if (isChatPage) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-4 md:bottom-24 md:right-8 z-[60] bg-[var(--color-primary)] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label="Open AI Assistant"
      >
        <span className="material-symbols-outlined text-3xl">smart_toy</span>
      </button>

      {/* Backdrop overlay (visible on mobile when open) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[90] md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-in Chat Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[90vw] md:w-[400px] bg-[var(--color-background)] border-l border-[var(--color-border)] shadow-2xl z-[100] flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-card)]">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--color-primary)]/10 p-2 rounded-lg">
              <span className="material-symbols-outlined text-[var(--color-primary)]">smart_toy</span>
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-text-primary)]">Maker AI</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Powered by Gemini</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[var(--color-border)] rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.sender === 'user' 
                    ? 'bg-[var(--color-primary)] text-white rounded-tr-sm' 
                    : 'bg-[var(--color-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-tl-sm'
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] p-4 rounded-2xl rounded-tl-sm flex gap-1">
                <div className="w-2 h-2 bg-[var(--color-text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[var(--color-text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[var(--color-text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 flex items-center gap-1.5 overflow-x-auto border-t border-[var(--color-border)]/50 bg-[var(--color-card)]/50 no-scrollbar">
          {SUGGESTIONS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(chip)}
              className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all cursor-pointer shadow-sm"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-background)]">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="w-full bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-full py-3 pl-4 pr-12 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 p-2 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-[var(--color-text-secondary)]">
              AI can make mistakes. Verify important information.
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
