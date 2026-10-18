import React from 'react';
import { NavLink } from 'react-router-dom';

export const EventCategoryNav = () => {
  const categories = [
    { name: 'Hackathons', path: '/events/hackathon', icon: 'emoji_events', badge: 'Active' },
    { name: 'Tech Expos', path: '/events/expo', icon: 'storefront', badge: '7 Stalls' },
    { name: 'Robotics Workshops', path: '/events/workshop', icon: 'precision_manufacturing', badge: 'Hands-on' },
    { name: 'Campus Events', path: '/events/campus', icon: 'campaign', badge: 'Symposium' }
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-[var(--color-border)]">
      {categories.map((cat) => (
        <NavLink
          key={cat.path}
          to={cat.path}
          className={({ isActive }) => `
            flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all select-none
            ${isActive 
              ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20 scale-[1.02]' 
              : 'bg-[var(--color-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/50 border border-[var(--color-border)]'
            }
          `}
        >
          <span className="material-symbols-outlined text-base sm:text-lg">{cat.icon}</span>
          <span>{cat.name}</span>
          {cat.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/20 font-semibold hidden md:inline">
              {cat.badge}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  );
};
