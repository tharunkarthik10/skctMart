import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Home } from './pages/Home';
import { ComponentDetails } from './pages/ComponentDetails';
import { ListComponent } from './pages/ListComponent';
import { EditComponent } from './pages/EditComponent';
import { CheckoutPayment } from './pages/CheckoutPayment';
import { OrderSuccess } from './pages/OrderSuccess';
import { MyOrders } from './pages/MyOrders';
import { SellerOrders } from './pages/SellerOrders';
import { OrderDetails } from './pages/OrderDetails';
import { Inbox } from './pages/Inbox';
import { Login } from './pages/Login';
import { PersonalProfile } from './pages/PersonalProfile';
import { PublicProfile } from './pages/PublicProfile';
import { Explore } from './pages/Explore';
import { ExploreCategories } from './pages/ExploreCategories';
import { SearchResults } from './pages/SearchResults';
import { Hackathon } from './pages/Hackathon';
import { TechExpo } from './pages/TechExpo';
import { RoboticsWorkshop } from './pages/RoboticsWorkshop';
import { CampusEvents } from './pages/CampusEvents';
import { AiChatBot } from './components/AiChatBot';
import { supabase } from './supabaseClient';
import apiClient from './api/client';
import { Wishlist } from './pages/Wishlist';
import { Cart } from './pages/Cart';
import { AdminRoute } from './components/AdminRoute';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminListings } from './pages/admin/AdminListings';
import { AdminEvents } from './pages/admin/AdminEvents';
import { GlobalNotifications } from './components/GlobalNotifications';

const ProtectedRoute = () => {
  const [session, setSession] = useState(undefined);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const handleAuthChange = async (sessionData) => {
      if (!sessionData) {
        const demoUserStr = localStorage.getItem('demo_user_session');
        if (demoUserStr) {
          try {
            const parsed = JSON.parse(demoUserStr);
            setSession(parsed);
            return;
          } catch (e) {}
        }
        setSession(null);
        return;
      }
      
      const user = sessionData.user;
      
      if (user) {
        try {
          // Ensure user exists in public.users table immediately on login
          try {
            await apiClient.post('/users/upsert', { id: user.id, email: user.email });
          } catch (e) {
            console.error("Upsert error", e);
          }

          // Fetch their public profile to check if blocked
          let profile = null;
          try {
            const res = await apiClient.get(`/users/${user.id}`);
            profile = res.data;
          } catch (err) {
            // Profile might not exist yet or other error
          }
            
          if (profile?.is_blocked) {
            alert('Account has been disabled by the admin contact admin for more details');
            await supabase.auth.signOut();
            setIsBlocked(true);
            setSession(null);
            return;
          }

          // Admin Bootstrap Logic
          const ADMIN_EMAILS = ['tharunkarthikav21@gmail.com', '727824tuio046@skct.edu.in', 'tharunkarthik21112006@gmail.com'];
          const isAdminEmail = ADMIN_EMAILS.includes(sessionData.user.email);
          if (isAdminEmail && !profile?.is_admin) {
            try {
              await apiClient.put(`/users/${sessionData.user.id}`, { is_admin: true, role: 'Admin', is_profile_verified: true });
            } catch (err) {
              console.error("Error bootstrapping admin", err);
            }
          }

          setSession(sessionData);
        } catch (err) {
          console.error("Error fetching user profile in ProtectedRoute", err);
          setSession(sessionData); // fallback
        }
      } else {
        setSession(sessionData);
      }
    };

    let isMounted = true;

    const timer = setTimeout(() => {
      if (isMounted) {
        setSession((prev) => (prev === undefined ? null : prev));
      }
    }, 1500);

    supabase.auth.getSession()
      .then(({ data }) => {
        clearTimeout(timer);
        if (isMounted) handleAuthChange(data?.session || null);
      })
      .catch((err) => {
        console.error("Session error:", err);
        clearTimeout(timer);
        if (isMounted) setSession(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) handleAuthChange(currentSession);
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  if (session === undefined) {
    return <div className="min-h-screen bg-[var(--color-background)] flex justify-center items-center text-[var(--color-text-primary)]">Loading...</div>;
  }

  if (isBlocked) {
    return <Navigate to="/login" replace />;
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <GlobalNotifications />
      <AiChatBot />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/categories" element={<ExploreCategories />} />
          <Route path="/products" element={<SearchResults />} />
          <Route path="/product/:id" element={<ComponentDetails />} />
          <Route path="/sell" element={<ListComponent />} />
          <Route path="/edit-component/:id" element={<EditComponent />} />
          <Route path="/checkout/:id" element={<CheckoutPayment />} />
          <Route path="/checkout" element={<CheckoutPayment />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/seller-orders" element={<SellerOrders />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/chat/:chatId" element={<Inbox />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<PersonalProfile />} />
          <Route path="/user/:userId" element={<PublicProfile />} />
          <Route path="/events/hackathon" element={<Hackathon />} />
          <Route path="/events/expo" element={<TechExpo />} />
          <Route path="/events/workshop" element={<RoboticsWorkshop />} />
          <Route path="/events/campus" element={<CampusEvents />} />
        </Route>
        
        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="events" element={<AdminEvents />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
