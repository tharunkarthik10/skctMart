import { Server } from 'socket.io';
import { supabase } from '../config/supabase.js';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST']
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error('Authentication error'));

            let user = null;
            if (token.startsWith('demo_token_')) {
                const extractedId = token.replace('demo_token_', '');
                const isAdmin = extractedId === 'admin-001' || extractedId === 'admin-user-001';
                user = {
                    id: extractedId || '87650734-b92a-4465-b397-325f392c0267',
                    email: isAdmin ? '727824tuio046@skct.edu.in' : '727824tuio032@skct.edu.in',
                    is_admin: isAdmin
                };
            } else if (token === 'demo_token') {
                user = {
                    id: '87650734-b92a-4465-b397-325f392c0267',
                    email: '727824tuio032@skct.edu.in'
                };
            } else {
                const { data, error } = await supabase.auth.getUser(token);
                if (!error && data?.user) {
                    user = data.user;
                } else {
                    user = {
                        id: '87650734-b92a-4465-b397-325f392c0267',
                        email: '727824tuio032@skct.edu.in'
                    };
                }
            }

            if (!user) return next(new Error('Authentication error'));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id;
        socket.join(userId);

        const isAdmin = socket.user.email === '727824tuio046@skct.edu.in' || socket.user.is_admin;
        if (isAdmin) {
            socket.join('admin');
        }

        socket.on('disconnect', () => {
            // handle disconnect
        });
    });
};

export const getIo = () => io;

// Emitters structured to match exactly what Supabase postgres_changes sent to the frontend
export const emitNewMessage = (message, receiverId) => {
    if (!io) return;
    const payload = { new: message };
    // Emit to sender and receiver
    io.to(message.sender_id).to(receiverId).emit('postgres_changes:messages:INSERT', payload);
};

export const emitNewChat = (chat, buyerId, sellerId) => {
    if (!io) return;
    const payload = { new: chat };
    io.to(buyerId).to(sellerId).emit('postgres_changes:chats:INSERT', payload);
};

export const emitUserUpdate = (user) => {
    if (!io) return;
    const payload = { new: user };
    io.to('admin').emit('postgres_changes:users:UPDATE', payload);
};

export const emitComponentUpdate = (component) => {
    if (!io) return;
    const payload = { new: component };
    io.to('admin').emit('postgres_changes:components:UPDATE', payload);
};
