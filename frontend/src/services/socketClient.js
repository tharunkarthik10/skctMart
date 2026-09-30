import { io } from 'socket.io-client';
import { supabase } from '../supabaseClient';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socketInstance = null;

export const getSocket = () => {
    if (!socketInstance) {
        socketInstance = io(SOCKET_URL, {
            autoConnect: false,
        });

        supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.access_token) {
                socketInstance.auth = { token: session.access_token };
                if (socketInstance.disconnected) {
                    socketInstance.connect();
                }
            } else {
                if (socketInstance.connected) {
                    socketInstance.disconnect();
                }
            }
        });

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.access_token) {
                socketInstance.auth = { token: session.access_token };
                socketInstance.connect();
            }
        });
    }

    return socketInstance;
};
