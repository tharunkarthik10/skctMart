import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Resilient Auth Wrapper for Offline / Campus / Demo Mode
const rawAuth = supabase.auth;

const getLocalSession = () => {
  try {
    const raw = localStorage.getItem('demo_user_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.user) return null;
    return {
      access_token: `demo_token_${parsed.user.id}`,
      token_type: 'bearer',
      user: parsed.user,
      ...parsed
    };
  } catch (e) {
    return null;
  }
};

const listeners = new Set();

const origGetSession = rawAuth.getSession.bind(rawAuth);
rawAuth.getSession = async () => {
  const local = getLocalSession();
  if (local) {
    return { data: { session: local }, error: null };
  }
  try {
    const res = await origGetSession();
    return res;
  } catch (err) {
    return { data: { session: null }, error: null };
  }
};

const origGetUser = rawAuth.getUser.bind(rawAuth);
rawAuth.getUser = async (jwt) => {
  const local = getLocalSession();
  if (local?.user) {
    return { data: { user: local.user }, error: null };
  }
  try {
    return await origGetUser(jwt);
  } catch (err) {
    return { data: { user: null }, error: null };
  }
};

const origSignOut = rawAuth.signOut.bind(rawAuth);
rawAuth.signOut = async () => {
  localStorage.removeItem('demo_user_session');
  listeners.forEach((cb) => {
    try { cb('SIGNED_OUT', null); } catch (e) {}
  });
  try {
    return await origSignOut();
  } catch (err) {
    return { error: null };
  }
};

const origOnAuthStateChange = rawAuth.onAuthStateChange.bind(rawAuth);
rawAuth.onAuthStateChange = (callback) => {
  listeners.add(callback);
  const local = getLocalSession();
  if (local) {
    setTimeout(() => {
      try { callback('SIGNED_IN', local); } catch (e) {}
    }, 0);
  }
  let sub;
  try {
    sub = origOnAuthStateChange((event, session) => {
      const active = getLocalSession() || session;
      callback(event, active);
    });
  } catch (e) {
    sub = { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
  }
  return {
    data: {
      subscription: {
        unsubscribe: () => {
          listeners.delete(callback);
          if (sub?.data?.subscription?.unsubscribe) {
            sub.data.subscription.unsubscribe();
          }
        }
      }
    }
  };
};

