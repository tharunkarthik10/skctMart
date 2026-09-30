import axios from 'axios';
import { supabase } from '../supabaseClient';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const demoUserStr = localStorage.getItem('demo_user_session');
      if (demoUserStr) {
        try {
          const parsed = JSON.parse(demoUserStr);
          const userId = parsed.user?.id || '87650734-b92a-4465-b397-325f392c0267';
          if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set('Authorization', `Bearer demo_token_${userId}`);
          } else {
            config.headers.Authorization = `Bearer demo_token_${userId}`;
          }
          return config;
        } catch (e) {}
      }

      let session = null;
      try {
        const sessionPromise = supabase.auth.getSession().catch(() => null);
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 300));
        const res = await Promise.race([sessionPromise, timeoutPromise]);
        session = res?.data?.session || null;
      } catch (e) {
        session = null;
      }

      const token = session?.access_token;
      
      if (token) {
        if (config.headers && typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        if (config.headers && typeof config.headers.set === 'function') {
          config.headers.set('Authorization', 'Bearer demo_token');
        } else {
          config.headers.Authorization = 'Bearer demo_token';
        }
      }
    } catch (err) {
      // Gracefully ignore session errors
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
