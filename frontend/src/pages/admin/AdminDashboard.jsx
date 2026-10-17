import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export const AdminDashboard = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin/users', label: 'Users', icon: 'group' },
    { path: '/admin/listings', label: 'Listings', icon: 'inventory_2' }
  ];

  return (
    <div className="flex min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col shrink-0">
        <div className="p-6 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold text-[var(--color-primary)] flex items-center gap-2">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            Admin Portal
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold ${isActive ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'hover:bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[var(--color-border)]">
          <Link to="/" className="flex items-center justify-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors py-2 font-bold">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center px-3 md:px-[22px] shrink-0 shadow-sm z-10">
          <h1 className="text-h2 text-[var(--color-text-primary)]">
            {navItems.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard'}
          </h1>
        </header>
        <div className="flex-1 overflow-auto py-8 px-3 md:px-[22px] bg-[var(--color-background)]">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
