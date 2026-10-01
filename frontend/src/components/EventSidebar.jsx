import React, { useState, useEffect } from 'react';
import { getRegisteredEvents, cancelRegistration } from '../utils/eventStorage';

export const EventSidebar = ({ selectedDate, onSelectDate, activeCategory }) => {
  const [registered, setRegistered] = useState([]);
  const [activePass, setActivePass] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);

  const loadEvents = () => {
    setRegistered(getRegisteredEvents());
  };

  useEffect(() => {
    loadEvents();
    window.addEventListener('eventRegistered', loadEvents);
    return () => window.removeEventListener('eventRegistered', loadEvents);
  }, []);

  const handleCancel = (regId) => {
    if (window.confirm("Are you sure you want to cancel this event registration?")) {
      cancelRegistration(regId);
      loadEvents();
      if (activePass && activePass.regId === regId) {
        setActivePass(null);
      }
    }
  };

  // Calendar dates with active event markers
  const EVENT_DAYS = [5, 9, 12, 15, 16, 17, 21, 24, 28];

  return (
    <>
      <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24 lg:h-[calc(100vh-160px)] lg:overflow-y-auto min-w-0 pr-1 pb-20">
      {/* Interactive Calendar Card */}
      <div className="card-standard p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span>📅</span> Calendar
          </h3>
          <div className="flex items-center gap-2">
            {selectedDate && (
              <button 
                onClick={() => onSelectDate(null)}
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
              >
                Clear Filter
              </button>
            )}
            <span className="text-xs font-bold px-2 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-md">
              Oct 2026
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[var(--color-text-secondary)] mb-2">
          <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {/* Days from previous month */}
          <div className="p-1.5 opacity-30 text-xs">27</div>
          <div className="p-1.5 opacity-30 text-xs">28</div>
          <div className="p-1.5 opacity-30 text-xs">29</div>
          <div className="p-1.5 opacity-30 text-xs">30</div>

          {/* Current Month Days 1-31 */}
          {Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            const hasEvent = EVENT_DAYS.includes(day);
            const isSelected = selectedDate === day;

            return (
              <button
                key={day}
                onClick={() => onSelectDate(isSelected ? null : day)}
                className={`relative p-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center ${
                  isSelected 
                    ? 'bg-[var(--color-primary)] text-white shadow-md scale-105' 
                    : hasEvent
                      ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/25'
                      : 'hover:bg-[var(--color-border)]/50 text-[var(--color-text-primary)]'
                }`}
                title={hasEvent ? `Events scheduled on Oct ${day}` : `Oct ${day}`}
              >
                {day}
                {hasEvent && !isSelected && (
                  <span className="w-1 h-1 bg-[var(--color-primary)] rounded-full mt-0.5"></span>
                )}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <p className="mt-3 text-xs text-center text-[var(--color-text-secondary)] bg-[var(--color-card)] py-1.5 rounded-lg border border-[var(--color-border)]">
            Filtering events on: <span className="font-bold text-[var(--color-primary)]">October {selectedDate}, 2026</span>
          </p>
        )}
      </div>

      {/* Dynamic Registered Events Tracker */}
      <div className="card-standard p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span>📌</span> My Events
          </h3>
          <span className="text-xs px-2 py-0.5 bg-[var(--color-border)] font-bold rounded-full">
            {registered.length}
          </span>
        </div>

        {registered.length === 0 ? (
          <div className="text-center py-6 text-sm text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined text-3xl opacity-40 mb-1">event_busy</span>
            <p>No event passes yet.</p>
            <p className="text-xs mt-1">Register for an event or workshop to get your pass!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {registered.slice(0, 3).map((item) => (
              <div 
                key={item.regId}
                onClick={() => setActivePass(item)}
                className="flex gap-3 items-center p-3 bg-[var(--color-surface)] hover:bg-[var(--color-background)] cursor-pointer rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all group"
              >
                <div className="bg-[var(--color-success)]/10 text-[var(--color-success)] p-2 rounded-lg material-symbols-outlined text-lg">
                  verified
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                    <span>{item.date}</span> • <span className="font-mono text-[10px] text-[var(--color-primary)]">{item.regId}</span>
                  </p>
                </div>
                <span className="material-symbols-outlined text-[var(--color-text-secondary)] text-sm group-hover:translate-x-0.5 transition-transform">
                  confirmation_number
                </span>
              </div>
            ))}
          </div>
        )}

        {registered.length > 0 && (
          <button 
            onClick={() => setShowAllModal(true)}
            className="w-full mt-4 py-2.5 text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl border border-[var(--color-primary)]/30 transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">badge</span>
            View All Registrations ({registered.length})
          </button>
        )}
      </div>
    </aside>

    {/* Single Digital Pass Modal */}
    {activePass && (
      <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="card-standard w-[92vw] sm:w-[460px] max-w-md p-6 relative animate-fadeIn shadow-2xl border-2 border-[var(--color-primary)]">
          <button 
            onClick={() => setActivePass(null)}
            className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)]">
              <span className="material-symbols-outlined">qr_code_2</span>
            </div>
            <div>
              <h4 className="font-black text-lg">Official Event Pass</h4>
              <p className="text-xs text-[var(--color-text-secondary)]">MakerMart Verified Registration</p>
            </div>
          </div>

          <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)] mb-4 space-y-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">Event Name</span>
              <p className="font-bold text-sm text-[var(--color-text-primary)]">{activePass.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border)]/50">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Date & Venue</span>
                <p className="text-xs font-semibold">{activePass.date}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{activePass.venue || activePass.location || 'Campus Auditorium'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Pass ID</span>
                <p className="text-xs font-mono font-bold text-[var(--color-primary)]">{activePass.regId}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold text-[10px] rounded">
                  Active Pass
                </span>
              </div>
            </div>
            {activePass.attendee && (
              <div className="pt-2 border-t border-[var(--color-border)]/50 text-xs">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Registered To</span>
                <p className="font-medium">{activePass.attendee.name} ({activePass.attendee.rollNo || 'Maker'})</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                alert(`Pass ${activePass.regId} ready! Take a screenshot or show this pass at the entrance desk.`);
              }}
              className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Download Pass
            </button>
            <button
              onClick={() => handleCancel(activePass.regId)}
              className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* All Registrations Modal */}
    {showAllModal && (
      <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="card-standard w-[92vw] sm:w-[500px] max-w-lg max-h-[85vh] flex flex-col p-6 relative shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
            <div>
              <h3 className="font-bold text-lg">All Registered Events</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Your confirmed event badges and workshop passes</p>
            </div>
            <button 
              onClick={() => setShowAllModal(false)}
              className="p-1 hover:bg-[var(--color-border)] rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {registered.map((item) => (
              <div 
                key={item.regId} 
                className="p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{item.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    📅 {item.date} • 📍 {item.venue || item.location || 'Campus'}
                  </p>
                  <span className="text-[10px] font-mono text-[var(--color-primary)] font-semibold mt-1 inline-block">
                    ID: {item.regId}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setShowAllModal(false);
                      setActivePass(item);
                    }}
                    className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleCancel(item.regId)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-xs"
                    title="Cancel Registration"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--color-border)] text-right">
            <button
              onClick={() => setShowAllModal(false)}
              className="btn-secondary px-5 py-2 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};
