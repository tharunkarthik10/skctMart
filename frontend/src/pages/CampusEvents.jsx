import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { EventSidebar } from '../components/EventSidebar';
import { registerEvent, isEventRegistered } from '../utils/eventStorage';

const CAMPUS_EVENTS = [
  {
    id: 'campus-1',
    day: 5,
    title: "🎤 Keynote: Building Scalable Hardware Startups in India",
    desc: "Interactive session with founders of funded IoT & Hardware startups. Learn about sourcing components, navigating PCB fabrication, and raising angel rounds.",
    date: "October 5, 2026",
    time: "02:00 PM - 04:30 PM",
    location: "Main Auditorium",
    host: "Entrepreneurship Development Cell (EDC)",
    attendeesCount: 142
  },
  {
    id: 'campus-2',
    day: 9,
    title: "⚡ ElectroBlitz '26: Annual Technical Symposium",
    desc: "Circuit debugging battles, soldering race competitions, paper presentations, and autonomous line-follower challenges with cash prizes.",
    date: "October 9, 2026",
    time: "09:30 AM - 05:00 PM",
    location: "ECE Block Seminar Hall & Labs",
    host: "ECE Students Association",
    attendeesCount: 260
  },
  {
    id: 'campus-3',
    day: 15,
    title: "🤝 MakerMart Campus Swap Meet & Component Flea",
    desc: "Bring your spare Arduino shields, sensors, jumper wires, motors, and batteries. Swap or sell directly with fellow engineering makers!",
    date: "October 15, 2026",
    time: "03:00 PM - 06:00 PM",
    location: "Central Courtyard & Food Court Lawn",
    host: "MakerMart Student Community",
    attendeesCount: 310
  },
  {
    id: 'campus-4',
    day: 17,
    title: "🌐 Smart India Hackathon (SIH) Internal Ideation Pitch",
    desc: "Present your initial system architecture, hardware schematics, and UI flows to faculty evaluators before final nomination.",
    date: "October 17, 2026",
    time: "10:00 AM - 01:00 PM",
    location: "Conference Hall 2",
    host: "Institutional Innovation Council (IIC)",
    attendeesCount: 95
  },
  {
    id: 'campus-5',
    day: 21,
    title: "🏆 RoboWars: 15kg & 30kg Combat Bot Showdown",
    desc: "Witness metal-crushing combat robots battle it out in the enclosed polycarbonate battle arena. Live commentary and food stalls.",
    date: "October 21, 2026",
    time: "11:00 AM - 04:00 PM",
    location: "Mechanical Workshop Quadrangle",
    host: "Robotics Club",
    attendeesCount: 420
  },
  {
    id: 'campus-6',
    day: 24,
    title: "💡 Patent Filing & Intellectual Property for Student Makers",
    desc: "Workshop on how to file provisional patents for hardware innovations, novel circuits, and mechanical prototypes created in college labs.",
    date: "October 24, 2026",
    time: "02:00 PM - 04:00 PM",
    location: "IPR Cell Seminar Hall",
    host: "Center for IPR Studies",
    attendeesCount: 88
  }
];

export const CampusEvents = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rsvpModalEvent, setRsvpModalEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    email: '',
    department: 'Electronics & Communication (ECE)'
  });
  const [rsvpSuccess, setRsvpSuccess] = useState(null);

  const filteredEvents = CAMPUS_EVENTS.filter(ev => {
    const matchesDate = selectedDate ? ev.day === selectedDate : true;
    const matchesQuery = searchQuery
      ? ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || ev.desc.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesDate && matchesQuery;
  });

  const handleOpenRsvp = (event) => {
    setRsvpModalEvent(event);
    setRsvpSuccess(null);
    setFormData({
      name: '',
      rollNo: '',
      email: '',
      department: 'Electronics & Communication (ECE)'
    });
  };

  const handleSubmitRsvp = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.rollNo) {
      alert("Please fill in your name and roll number.");
      return;
    }

    const reg = registerEvent({
      id: rsvpModalEvent.id,
      type: 'campus',
      title: rsvpModalEvent.title,
      date: rsvpModalEvent.date,
      venue: rsvpModalEvent.location,
      attendee: {
        name: formData.name,
        rollNo: formData.rollNo,
        email: formData.email,
        department: formData.department
      }
    });

    setRsvpSuccess(reg);
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative">
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="btn-icon">
              <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--color-primary)]">Campus Events</h1>
              <p className="text-[11px] text-[var(--color-text-secondary)] hidden sm:block">Seminars, technical symposiums, flea markets & guest lectures</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-44 md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[var(--color-text-secondary)] text-sm">search</span>
            <input
              type="text"
              placeholder="Search campus events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--color-card)] border border-[var(--color-border)] rounded-full focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Events List */}
          <section className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            {selectedDate && (
              <div className="flex items-center justify-between p-3 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-xl">
                <span className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">filter_alt</span>
                  Showing campus events on October {selectedDate}, 2026
                </span>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-xs font-bold text-[var(--color-text-primary)] hover:underline"
                >
                  Show All
                </button>
              </div>
            )}

            {filteredEvents.length === 0 ? (
              <div className="card-standard p-12 text-center text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                <p className="font-bold">No campus events found for this selection.</p>
                <p className="text-xs mt-1">Try selecting another date from the calendar or resetting your search filter.</p>
                <button 
                  onClick={() => { setSelectedDate(null); setSearchQuery(''); }}
                  className="btn-secondary mt-4 px-4 py-2 text-xs"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const isRsvpd = isEventRegistered(event.id);

                return (
                  <div key={event.id} className="card-standard p-6 md:p-8 flex flex-col relative border-2 border-transparent hover:border-[var(--color-primary)] transition-all">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="text-xl md:text-2xl font-bold">{event.title}</h2>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 whitespace-nowrap">
                        {event.attendeesCount}+ Attending
                      </span>
                    </div>

                    <p className="text-sm md:text-base text-[var(--color-text-secondary)] mb-4">{event.desc}</p>
                    
                    <div className="text-xs text-[var(--color-text-secondary)] mb-5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">groups</span>
                      <span>Organized by: <strong className="text-[var(--color-text-primary)]">{event.host}</strong></span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-sm">event</span>
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-500 text-sm">schedule</span>
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500 text-sm">location_on</span>
                        <span>{event.location}</span>
                      </div>
                    </div>

                    {isRsvpd ? (
                      <button 
                        onClick={() => handleOpenRsvp(event)}
                        className="w-full py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        RSVP Confirmed • View Digital Pass
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleOpenRsvp(event)}
                        className="btn-primary w-full mt-auto flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">confirmation_number</span>
                        RSVP & Get Free Campus Pass
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </section>

          {/* Dynamic Sidebar with Calendar & Registered Events */}
          <EventSidebar 
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            activeCategory="campus"
          />
        </div>
      </main>

      {/* RSVP Modal */}
      {rsvpModalEvent && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-standard w-[92vw] sm:w-[500px] max-w-lg p-6 relative shadow-2xl border border-[var(--color-primary)]">
            <button 
              onClick={() => { setRsvpModalEvent(null); setRsvpSuccess(null); }}
              className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {!rsvpSuccess ? (
              <form onSubmit={handleSubmitRsvp} className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl">
                    <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Campus Event RSVP</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">{rsvpModalEvent.title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tharun Karthik"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Roll / Register No *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 727824TUIO046"
                      value={formData.rollNo}
                      onChange={(e) => setFormData({...formData, rollNo: e.target.value})}
                      className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">College Email ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. tharunkarthikav21@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    <option>Electronics & Communication (ECE)</option>
                    <option>Electrical & Electronics (EEE)</option>
                    <option>Computer Science & Engg (CSE)</option>
                    <option>Information Technology (IT)</option>
                    <option>Artificial Intelligence & Data Science (AIDS)</option>
                    <option>Mechanical Engineering</option>
                    <option>Mechatronics</option>
                  </select>
                </div>

                <div className="p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                  📍 <strong>Venue:</strong> {rsvpModalEvent.location} • ⏰ <strong>Time:</strong> {rsvpModalEvent.time}
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRsvpModalEvent(null)}
                    className="btn-secondary flex-1 py-2.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 py-2.5 text-xs font-bold"
                  >
                    Confirm RSVP & Generate Pass
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">verified</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">RSVP Confirmed!</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Your entrance pass has been generated and linked to your student profile.
                  </p>
                </div>

                <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)] text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Pass ID:</span>
                    <span className="font-mono font-bold text-[var(--color-primary)]">{rsvpSuccess.regId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Event:</span>
                    <span className="font-bold">{rsvpSuccess.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Date & Venue:</span>
                    <span>{rsvpSuccess.date} • {rsvpSuccess.venue}</span>
                  </div>
                </div>

                <button
                  onClick={() => { setRsvpModalEvent(null); setRsvpSuccess(null); }}
                  className="btn-primary w-full py-2.5 text-xs font-bold"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};
