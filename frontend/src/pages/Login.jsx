import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const toggleMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setError(null);
    setPassword('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const isSignUp = isSignUpMode;
    setLoading(true);
    setError(null);

    const isAdminEmail = email === '727824tuio046@skct.edu.in';
    const isCollegeEmail = email.endsWith('.edu') || email.endsWith('.edu.in') || isAdminEmail;
    if (!isCollegeEmail) {
      setError('Only college domains (like @skct.edu.in or .edu) or Admin emails are allowed.');
      setLoading(false);
      return;
    }

    if (isAdminEmail) {
      if (password !== 'tharunkarthik10') {
        setError('Invalid login credentials');
        setLoading(false);
        return;
      }
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/admin');
        setLoading(false);
        return;
      } catch (err) {
        const demoSession = {
          user: {
            id: 'admin-user-001',
            email: '727824tuio046@skct.edu.in',
            user_metadata: { name: 'Admin' }
          }
        };
        localStorage.setItem('demo_user_session', JSON.stringify(demoSession));
        navigate('/admin');
        window.location.reload();
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data?.session) {
          navigate('/profile');
        } else {
          alert('Account created successfully! You can now sign in with your credentials.');
          setIsSignUpMode(false);
          setError(null);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/profile');
      }
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        setError('Cannot connect to Supabase authentication server. Please check your Supabase project URL in .env file or use Demo Mode.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const isAdmin = email === '727824tuio046@skct.edu.in';
    const userEmail = isAdmin ? '727824tuio046@skct.edu.in' : (email || '727824tuio032@skct.edu.in');
    const userId = isAdmin ? 'admin-user-001' : '87650734-b92a-4465-b397-325f392c0267';
    
    const demoSession = {
      user: {
        id: userId,
        email: userEmail,
        user_metadata: { name: isAdmin ? 'Admin' : 'Maker Student' }
      }
    };
    localStorage.setItem('demo_user_session', JSON.stringify(demoSession));
    navigate(isAdmin ? '/admin' : '/');
    window.location.reload();
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) {
        if (error.message === 'Failed to fetch' || error.message?.includes('fetch')) {
          setError("Cannot connect to Supabase authentication server. Please check VITE_SUPABASE_URL in .env.");
        } else {
          setError(error.message);
        }
      }
    } catch (err) {
      console.error("Google login failed:", err);
      setError("Unable to connect to authentication server. Please check your Supabase project URL in .env file.");
    }
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary)]/5 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--color-primary)]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-y-1/4 -translate-x-1/4 pointer-events-none"></div>
      
      {/* Top Navigation Bar */}
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 w-full h-16 border-b border-[var(--color-border)] shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} aria-label="Go back" className="btn-icon">
            <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[var(--color-primary)] tracking-tight">Login</h1>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-center relative px-4 md:px-8 py-12">
        <div className="w-full max-w-[440px] relative z-10">
          
          {/* Hero / Header Section */}
          <header className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 mb-6 flex items-center justify-center bg-[var(--color-surface)] rounded-[24px] shadow-sm border border-[var(--color-border)]">
              <span className="text-[var(--color-primary)] font-black text-4xl">M</span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-3">
              Join the Campus Maker Community
            </h1>
            <p className="text-body text-[var(--color-text-secondary)]">
              Connect, trade, and build with verified engineering students from your university.
            </p>
          </header>
          
          {/* Login Form Container */}
          <div className="card-standard p-8 md:p-10 shadow-lg relative overflow-hidden">
            {/* Structural Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)]"></div>
            
            <form action="#" className="space-y-6" method="POST" onSubmit={(e) => handleAuth(e)}>
              {error && (
                <div className="bg-[var(--color-danger)]/10 text-[var(--color-danger)] p-4 rounded-xl text-sm font-semibold border border-[var(--color-danger)]/20 shadow-sm flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{error}</span>
                </div>
              )}
              
              {/* Email Input */}
              <div className="space-y-2 group">
                <label className="input-label block flex items-center gap-2" htmlFor="email">
                  <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                  College Email Address
                </label>
                <div className="relative transition-all duration-200">
                  <input className="input-standard h-14" id="email" name="email" placeholder="yourname@college.edu" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] font-medium flex items-start gap-1 mt-2">
                  <span className="material-symbols-outlined text-[14px] mt-0.5">info</span>
                  Only students with verified college emails can access MakerMart.
                </p>
              </div>
              
              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="input-label block flex items-center gap-2" htmlFor="password">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    {isSignUpMode ? 'Set New Password' : 'Password'}
                  </label>
                  {!isSignUpMode && <a className="text-xs font-bold text-[var(--color-primary)] hover:underline transition-all" href="#">Forgot Password?</a>}
                </div>
                <div className="relative transition-all duration-200">
                  <input className="input-standard h-14 pr-12" id="password" name="password" placeholder="••••••••" required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center" onClick={() => setShowPassword(!showPassword)} type="button">
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {isSignUpMode && (
                  <p className="text-xs text-[var(--color-text-secondary)] font-medium flex items-start gap-1 mt-2">
                    <span className="material-symbols-outlined text-[14px] mt-0.5">info</span>
                    Set a secure password for your new account.
                  </p>
                )}
              </div>
              
              {/* Primary Action */}
              <button className="btn-primary w-full h-14 text-lg justify-center group disabled:opacity-50 mt-4" type="submit" disabled={loading}>
                {loading ? 'Processing...' : (isSignUpMode ? 'Create Account' : 'Sign In')}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
              
              {/* Divider */}
              <div className="flex items-center gap-4 py-4">
                <div className="flex-grow h-px bg-[var(--color-border)]"></div>
                <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">OR CONTINUE WITH</span>
                <div className="flex-grow h-px bg-[var(--color-border)]"></div>
              </div>

              {/* Google Login Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={handleGoogleLogin} className="btn-secondary w-full h-12 text-sm justify-center shadow-sm" type="button">
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button onClick={handleDemoLogin} className="btn-secondary w-full h-12 text-sm justify-center shadow-sm border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10" type="button">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  Demo Access
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 py-4">
                <div className="flex-grow h-px bg-[var(--color-border)]"></div>
                <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">{isSignUpMode ? 'ALREADY A MEMBER?' : 'NEW USER?'}</span>
                <div className="flex-grow h-px bg-[var(--color-border)]"></div>
              </div>
              
              {/* Secondary Action */}
              <button className="btn-outline w-full h-14 text-base justify-center disabled:opacity-50" type="button" onClick={toggleMode} disabled={loading}>
                {isSignUpMode ? 'Sign In Instead' : 'Register as New User'}
              </button>
            </form>
            
            {/* Technical Footer Accent */}
            <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse shadow-[0_0_8px_var(--color-success)]"></span>
                <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">SYSTEM STATUS: NOMINAL</span>
              </div>
              <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">v2.4.0-STABLE</span>
            </div>
          </div>
          
          {/* Global Footer Links */}
          <footer className="mt-10 flex flex-wrap justify-center gap-6 text-sm font-semibold text-[var(--color-text-secondary)]">
            <a className="hover:text-[var(--color-primary)] transition-colors flex items-center gap-1.5" href="#">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Terms of Service
            </a>
            <a className="hover:text-[var(--color-primary)] transition-colors flex items-center gap-1.5" href="#">
              <span className="material-symbols-outlined text-[16px]">shield_lock</span>
              Privacy Policy
            </a>
            <a className="hover:text-[var(--color-primary)] transition-colors flex items-center gap-1.5" href="#">
              <span className="material-symbols-outlined text-[16px]">help</span>
              Support Center
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
};
