import { getSocket } from './socketClient';

export const realtimeService = {
  subscribeToChatsInbox: (callback) => {
    const socket = getSocket();
    socket.on('postgres_changes:chats:INSERT', callback);
    return { event: 'postgres_changes:chats:INSERT', callback };
  },
  
  subscribeToMessagesInbox: (callback) => {
    const socket = getSocket();
    socket.on('postgres_changes:messages:INSERT', callback);
    return { event: 'postgres_changes:messages:INSERT', callback };
  },
  
  subscribeToChatMessages: (chatId, callback) => {
    const socket = getSocket();
    socket.on('postgres_changes:messages:INSERT', callback);
    return { event: 'postgres_changes:messages:INSERT', callback };
  },
  
  subscribeToAdminUsers: (callback) => {
    const socket = getSocket();
    socket.on('postgres_changes:users:UPDATE', callback);
    return { event: 'postgres_changes:users:UPDATE', callback };
  },
  
  subscribeToAdminListings: (callback) => {
    const socket = getSocket();
    socket.on('postgres_changes:components:UPDATE', callback);
    return { event: 'postgres_changes:components:UPDATE', callback };
  },
  
  subscribeToGlobalNotifications: (callback) => {
    const socket = getSocket();
    socket.on('postgres_changes:messages:INSERT', callback);
    return { event: 'postgres_changes:messages:INSERT', callback };
  },
  
  subscribeToBottomNavBadge: (callback) => {
    const socket = getSocket();
    socket.on('postgres_changes:messages:INSERT', callback);
    return { event: 'postgres_changes:messages:INSERT', callback };
  },

  subscribeToAuctionBids: (callback) => {
    const socket = getSocket();
    socket.on('auction:bid_update', callback);
    return { event: 'auction:bid_update', callback };
  },

  subscribeToSellerBids: (callback) => {
    const socket = getSocket();
    socket.on('postgres_changes:bids:INSERT', callback);
    return { event: 'postgres_changes:bids:INSERT', callback };
  },

  subscribeToComponentUpdates: (callback) => {
    const socket = getSocket();
    socket.on('postgres_changes:components:UPDATE', callback);
    return { event: 'postgres_changes:components:UPDATE', callback };
  },
  
  unsubscribe: (subscription) => {
    if (subscription && subscription.event && subscription.callback) {
      const socket = getSocket();
      socket.off(subscription.event, subscription.callback);
    }
  }
};

