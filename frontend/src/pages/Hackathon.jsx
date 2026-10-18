import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { EventSidebar } from '../components/EventSidebar';
import { registerEvent, getRegisteredEvents, isEventRegistered, getRegistrationById } from '../utils/eventStorage';
import apiClient from '../api/client';

export const Hackathon = () => {
  const navigate = useNavigate();
  const [externalEvents, setExternalEvents] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Registration and Pass view state
  const [registerModalEvent, setRegisterModalEvent] = useState(null);
  const [viewingPass, setViewingPass] = useState(null);
  const [registeredList, setRegisteredList] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    email: '',
    teamName: '',
    domain: 'Generative AI & LLMs'
  });

  const loadRegistered = () => {
    setRegisteredList(getRegisteredEvents());
  };

  useEffect(() => {
    loadRegistered();
    window.addEventListener('eventRegistered', loadRegistered);
    return () => window.removeEventListener('eventRegistered', loadRegistered);
  }, []);

  useEffect(() => {
    const fetchAllHackathons = async () => {
      try {
        const [extRes, appRes] = await Promise.all([
          apiClient.get('/external-events/hackathons').catch(() => ({ data: [] })),
          apiClient.get('/events/approved?category=hackathon').catch(() => ({ data: [] }))
        ]);

        const approvedFormatted = (appRes.data || []).map(item => ({
          id: item.id,
          title: item.title,
          desc: item.desc,
          date: item.date,
          day: item.day,
          month: item.month,
          year: item.year,
          location: item.location,
          college: item.college || 'Host Campus / Institution',
          department: item.department || item.organizer || 'Host Department',
          prize: item.prize || 'Campus Hackathon',
          source: 'CAMPUS VERIFIED',
          link: item.link || '#',
          posterUrl: item.posterUrl,
          isApprovedCommunityEvent: true
        }));

        setExternalEvents([...approvedFormatted, ...(extRes.data || [])]);
      } catch (err) {
        console.error("Error fetching hackathons", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllHackathons();
  }, []);

  // Filter hackathons by selected date and search query
  const filteredEvents = useMemo(() => {
    return externalEvents.filter((event) => {
      // Date filter
      if (selectedDate) {
        const selDay = typeof selectedDate === 'object' ? selectedDate.day : selectedDate;
        const selMonth = typeof selectedDate === 'object' ? selectedDate.month : null;
        const selYear = typeof selectedDate === 'object' ? selectedDate.year : null;

        if (event.day !== selDay) return false;
        if (selMonth && event.month && event.month !== selMonth) return false;
        if (selYear && event.year && event.year !== selYear) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = event.title?.toLowerCase().includes(q);
        const matchDesc = event.desc?.toLowerCase().includes(q);
        const matchLoc = event.location?.toLowerCase().includes(q);
        const matchSource = event.source?.toLowerCase().includes(q);
        const matchPrize = event.prize?.toLowerCase().includes(q);
        const matchCollege = event.college?.toLowerCase().includes(q);
        const matchDept = event.department?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc && !matchSource && !matchPrize && !matchCollege && !matchDept) {
          return false;
        }
      }

      return true;
    });
  }, [externalEvents, selectedDate, searchQuery]);

  const handleOpenRegister = (event) => {
    const existing = getRegistrationById(event.id);
    if (existing) {
      setViewingPass(existing);
      return;
    }

    setRegisterModalEvent(event);
    setFormData({
      name: '',
      rollNo: '',
      email: '',
      teamName: '',
      domain: 'Generative AI & LLMs'
    });
  };

  const handleSubmitRegistration = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.rollNo.trim()) {
      alert("Please provide your name and student ID / roll number.");
      return;
    }

    const reg = registerEvent({
      id: registerModalEvent.id,
      type: 'hackathon',
      title: registerModalEvent.title,
      date: registerModalEvent.date,
      venue: registerModalEvent.location,
      college: registerModalEvent.college,
      department: registerModalEvent.department,
      attendee: {
        name: formData.name,
        rollNo: formData.rollNo,
        email: formData.email,
        teamName: formData.teamName || 'Solo Maker',
        perk: `${formData.domain} Track`
      }
    });

    setRegisterModalEvent(null);
    setViewingPass(reg);
  };

  const selectedDisplayDate = useMemo(() => {
    if (!selectedDate) return null;
    if (typeof selectedDate === 'number') {
      return `October ${selectedDate}, 2026`;
    }
    return `${selectedDate.monthName || 'Date'} ${selectedDate.day}, ${selectedDate.year || 2026}`;
  }, [selectedDate]);

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative">
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="btn-icon">
              <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--color-primary)]">Hackathons</h1>
              <p className="text-[11px] text-[var(--color-text-secondary)] hidden sm:block">National & collegiate buildathons, AI sprints & hardware jams</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center w-48 md:w-64">
            <span className="material-symbols-outlined absolute left-3.5 text-[var(--color-text-secondary)] text-[18px] pointer-events-none select-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search hackathons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--color-card)] border border-[var(--color-border)] rounded-full focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)] shadow-sm transition-all"
            />
          </div>
        </div>
      </header>

      <main className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <section className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            
            {/* Active Date Filter Notice */}
            {selectedDate && (
              <div className="flex items-center justify-between p-3.5 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-xl animate-fadeIn">
                <span className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">filter_alt</span>
                  Showing hackathons scheduled for: <strong>{selectedDisplayDate}</strong>
                </span>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-xs font-bold text-[var(--color-text-primary)] hover:underline ml-2"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredEvents.length === 0 && (
              <div className="card-standard p-12 text-center text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                <span className="material-symbols-outlined text-5xl mb-3 opacity-40 text-[var(--color-primary)]">event_busy</span>
                <p className="font-bold text-lg text-[var(--color-text-primary)]">
                  {selectedDate ? `No hackathons found scheduled for ${selectedDisplayDate}.` : 'No hackathons found matching your criteria.'}
                </p>
                <p className="text-xs mt-1.5 max-w-md mx-auto">
                  Try clicking a highlighted date with a green dot on the calendar or clearing search filters.
                </p>
                <button 
                  onClick={() => { setSelectedDate(null); setSearchQuery(''); }}
                  className="btn-secondary mt-5 px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Reset Filters & View All
                </button>
              </div>
            )}

            {/* Hackathon Cards */}
            {filteredEvents.slice(0, visibleCount).map((event) => {
              const isRegistered = isEventRegistered(event.id);
              
              return (
                <div 
                  key={event.id} 
                  className="card-standard p-6 md:p-8 flex flex-col relative overflow-hidden border-2 border-transparent hover:border-[var(--color-primary)] transition-all shadow-sm"
                >
                  {/* Event Poster Image - only for student/club submitted events with verified posters */}
                  {event.isApprovedCommunityEvent && event.posterUrl && (
                    <div className="w-full h-44 sm:h-56 mb-5 rounded-2xl overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm">
                      <img 
                        src={event.posterUrl} 
                        alt={event.title} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                      />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="text-xl md:text-2xl font-bold pr-4 text-[var(--color-text-primary)]">{event.title}</h2>
                    <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                      {event.source}
                    </span>
                  </div>

                  <p className="text-sm md:text-base text-[var(--color-text-secondary)] mb-4 flex-1">{event.desc}</p>

                  {/* Event Venue, College & Department - Where the event takes place */}
                  <div className="my-4 p-3.5 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] shadow-sm space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                      <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-[var(--color-primary)]">corporate_fare</span>
                        Event Venue & Hosting Campus
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-[10px] tracking-wide">
                        Where Event Takes Place
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] flex items-center gap-1 mb-0.5">
                          <span className="material-symbols-outlined text-[13px] text-amber-500">account_balance</span>
                          College / Campus
                        </span>
                        <span className="font-bold text-[var(--color-text-primary)] text-xs block truncate" title={event.college}>
                          {event.college || "Host Campus / Institution"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] flex items-center gap-1 mb-0.5">
                          <span className="material-symbols-outlined text-[13px] text-blue-500">school</span>
                          Hosting Department
                        </span>
                        <span className="font-bold text-[var(--color-text-primary)] text-xs block truncate" title={event.department}>
                          {event.department || "Host Department"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] flex items-center gap-1 mb-0.5">
                          <span className="material-symbols-outlined text-[13px] text-red-500">location_on</span>
                          Location / Venue
                        </span>
                        <span className="font-bold text-red-500 text-xs block truncate" title={event.location}>
                          {event.location || "Main Auditorium, Hall 1"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Meta Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-500 text-sm">event</span>
                      <span><strong>Date:</strong> {event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-sm">emoji_events</span>
                      <span className="truncate"><strong>Prize Pool:</strong> {event.prize}</span>
                    </div>
                  </div>

                  {/* Dual Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2.5 mt-auto">
                    {isRegistered ? (
                      <button 
                        onClick={() => {
                          const pass = getRegistrationById(event.id);
                          if (pass) setViewingPass(pass);
                        }}
                        className="flex-1 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-500/25 transition-colors text-xs sm:text-sm"
                      >
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Registered • View Digital Pass
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleOpenRegister(event)}
                        className="btn-primary flex-1 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md"
                      >
                        <span className="material-symbols-outlined text-base">confirmation_number</span>
                        RSVP & Get Free Event Pass
                      </button>
                    )}

                    <a 
                      href={event.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="px-5 py-2.5 bg-[var(--color-card)] hover:bg-[var(--color-border)]/50 text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors text-center"
                    >
                      Apply Externally <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  </div>
                </div>
              );
            })}

            {/* Pagination Button */}
            {!loading && filteredEvents.length > visibleCount && (
              <button
                onClick={() => setVisibleCount(prev => Math.min(prev + 5, filteredEvents.length))}
                className="btn-secondary w-full py-3 mt-2 flex items-center justify-center gap-2 active:scale-95 transition-transform font-bold text-xs sm:text-sm"
              >
                View More Hackathons ({filteredEvents.length - visibleCount} remaining)
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
            )}
            
            {loading && (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
              </div>
            )}
          </section>
          
          {/* Dynamic Sidebar with Calendar & Registered Events */}
          <EventSidebar 
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            activeCategory="hackathon"
            events={externalEvents}
            externalPass={viewingPass}
            onCloseExternalPass={() => setViewingPass(null)}
          />
        </div>
      </main>

      {/* Free Hackathon Pass Registration Modal */}
      {registerModalEvent && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-standard w-[92vw] sm:w-[480px] max-w-md p-6 relative animate-fadeIn shadow-2xl rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <button 
              onClick={() => setRegisterModalEvent(null)}
              className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white p-1 rounded-full hover:bg-[var(--color-border)]"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined">badge</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Get Free Event Pass</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Instant badge confirmation for MakerMart Hackathons</p>
              </div>
            </div>

            <div className="p-3.5 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] mb-4 text-xs space-y-1.5">
              <p className="font-bold text-[var(--color-text-primary)] truncate text-sm">{registerModalEvent.title}</p>
              <div className="pt-1.5 border-t border-[var(--color-border)] space-y-1 text-[11px]">
                <p className="text-[var(--color-text-secondary)] truncate">
                  🏛️ <strong className="text-[var(--color-text-primary)]">Host Campus:</strong> {registerModalEvent.college || 'Host Institution'}
                </p>
                <p className="text-[var(--color-text-secondary)] truncate">
                  🎓 <strong className="text-[var(--color-text-primary)]">Host Dept:</strong> {registerModalEvent.department || 'Computer Science & Engineering'}
                </p>
                <p className="text-[var(--color-text-secondary)] truncate">
                  📍 <strong className="text-red-500">Event Venue:</strong> {registerModalEvent.location} • 📅 {registerModalEvent.date}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitRegistration} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                  Full Name / Lead Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                    Student ID / Roll No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 727824TUIO046"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                    Team Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ByteCrafters"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                  Track / Domain
                </label>
                <select
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)]"
                >
                  <option>Generative AI & LLMs</option>
                  <option>Hardware & Embedded IoT</option>
                  <option>Web3 & Decentralized Protocols</option>
                  <option>CleanTech & Sustainability</option>
                  <option>Open Innovation</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-1.5 mt-2 shadow-md"
              >
                <span className="material-symbols-outlined text-sm">confirmation_number</span>
                Confirm Registration & Generate Pass
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};
