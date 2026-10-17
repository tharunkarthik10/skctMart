import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { EventSidebar } from '../components/EventSidebar';
import apiClient from '../api/client';

export const Hackathon = () => {
  const navigate = useNavigate();
  const [externalEvents, setExternalEvents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const fetchExternal = async () => {
      try {
        const res = await apiClient.get('/external-events/hackathons');
        setExternalEvents(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExternal();
  }, []);

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative">
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="btn-icon">
              <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
            </button>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--color-primary)]">Hackathons</h1>
          </div>
        </div>
      </header>
      <main className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <section className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          
          {!loading && externalEvents.length === 0 && (
            <div className="card-standard p-8 text-center text-[var(--color-text-secondary)]">
              No upcoming hackathons found at the moment. Please check back later.
            </div>
          )}

          {externalEvents.slice(0, visibleCount).map((event) => (
            <div key={event.id} className="card-standard p-8 flex flex-col relative overflow-hidden border-2 border-transparent hover:border-[var(--color-primary)] transition-colors">
              <div className="absolute top-4 right-4 bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                {event.source}
              </div>
              <h2 className="text-2xl font-bold mb-4 pr-24">{event.title}</h2>
              <p className="text-base text-[var(--color-text-secondary)] mb-6 flex-1">{event.desc}</p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-500">event</span>
                  <span className="font-semibold text-sm">{event.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-500">public</span>
                  <span className="font-semibold text-sm">{event.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-yellow-500">emoji_events</span>
                  <span className="font-semibold text-sm">{event.prize}</span>
                </div>
              </div>
              <a href={event.link} target="_blank" rel="noopener noreferrer" className="btn-primary w-full mt-auto text-center !bg-zinc-800 hover:!bg-zinc-700 flex justify-center items-center gap-2">
                Apply Externally <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          ))}

          {!loading && externalEvents.length > visibleCount && (
            <button
              onClick={() => setVisibleCount(prev => Math.min(prev + 5, externalEvents.length))}
              className="btn-secondary w-full py-3 mt-2 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              View More Hackathons
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          )}
          
          {loading && (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            </div>
          )}
          </section>
          
          <EventSidebar 
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            activeCategory="hackathon"
          />
        </div>
      </main>
      <BottomNav />
    </div>
  );
};
