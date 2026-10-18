import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { EventSidebar } from '../components/EventSidebar';
import { registerEvent, isEventRegistered, getRegistrationById, getRegisteredEvents } from '../utils/eventStorage';
import apiClient from '../api/client';

const EXPOS = [
  {
    id: 'expo-1',
    day: 5,
    title: "🏭 Hardware & Embedded IoT Expo '26",
    desc: "Showcase your microcontrollers, PCB designs, and connected IoT prototypes to hardware angels and college tech leads.",
    date: "October 5, 2026",
    college: "PSG College of Technology, Coimbatore",
    department: "Dept. of Embedded Systems & Electronics Engineering",
    location: "GRD Convention Center, Hall A",
    partners: "18+ Hardware Incubators",
    stallsTotal: 25,
    stallsBooked: 19
  },
  {
    id: 'expo-2',
    day: 9,
    title: "🌱 GreenTech & EV Prototyping Showcase",
    desc: "Dedicated to electric vehicles, battery management systems, renewable energy inverters, and clean energy devices.",
    date: "October 9, 2026",
    college: "Indian Institute of Technology (IIT) Madras",
    department: "Centre for Battery Engineering & Electric Vehicles (C-BEEV)",
    location: "IITM Research Park Atrium, Chennai",
    partners: "12+ EV & CleanTech Brands",
    stallsTotal: 20,
    stallsBooked: 16
  },
  {
    id: 'expo-3',
    day: 15,
    title: "🤖 Autonomous Robotics & Drone Arena",
    desc: "Live demonstration grounds for quadrupeds, autonomous rovers, agricultural spray drones, and robotic arms.",
    date: "October 15, 2026",
    college: "Sri Krishna College of Technology (SKCT), Coimbatore",
    department: "Dept. of Robotics & Automation Engineering",
    location: "Indoor Sports Complex & Drone Arena",
    partners: "24+ Robotics Labs",
    stallsTotal: 30,
    stallsBooked: 27
  },
  {
    id: 'expo-4',
    day: 17,
    title: "🩺 MedTech & Assistive Devices Pavilion",
    desc: "Prosthetics, smart health monitoring wearables, ECG patches, and assistive tech prototypes created by student makers.",
    date: "October 17, 2026",
    college: "Vellore Institute of Technology (VIT), Vellore",
    department: "School of Bio Sciences and Technology (SBST)",
    location: "Technology Tower Amphitheater",
    partners: "8+ Hospital Tech Partners",
    stallsTotal: 15,
    stallsBooked: 11
  },
  {
    id: 'expo-5',
    day: 21,
    title: "🌾 AgriTech & Smart Farming Innovation Summit",
    desc: "Automated drip irrigation, soil NPK sensors, pest detection vision systems, and farm automation gear.",
    date: "October 21, 2026",
    college: "Tamil Nadu Agricultural University (TNAU), Coimbatore",
    department: "Dept. of Agricultural Machinery & Farm Power",
    location: "Dr. Babu Hall & Demo Farmland",
    partners: "10+ Agritech VCs",
    stallsTotal: 20,
    stallsBooked: 14
  },
  {
    id: 'expo-6',
    day: 24,
    title: "🥽 AR/VR & Cyber-Physical Systems Expo",
    desc: "Haptic feedback gloves, spatial computing headsets, digital twin simulations, and immersive campus experiments.",
    date: "October 24, 2026",
    college: "Coimbatore Institute of Technology (CIT), Coimbatore",
    department: "Dept. of Computing & Spatial AR/VR Lab",
    location: "CIT Golden Jubilee Auditorium",
    partners: "15+ Metaverse Studios",
    stallsTotal: 18,
    stallsBooked: 15
  },
  {
    id: 'expo-7',
    day: 28,
    title: "🚀 Aerospace, CanSat & Avionics Fair",
    desc: "High-altitude balloons, CanSats, telemetry systems, rocket motor telemetry test stands, and aerospace avionics.",
    date: "October 28, 2026",
    college: "Indian Institute of Space Science and Technology (IIST), Thiruvananthapuram",
    department: "Dept. of Aerospace Engineering & Avionics Lab",
    location: "Satish Dhawan Hall & Launch Grounds",
    partners: "9+ SpaceTech Incubators",
    stallsTotal: 16,
    stallsBooked: 12
  }
];

export const TechExpo = () => {
  const navigate = useNavigate();
  const [allExpos, setAllExpos] = useState(EXPOS);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingModalEvent, setBookingModalEvent] = useState(null);
  const [viewingPass, setViewingPass] = useState(null);
  const [registeredList, setRegisteredList] = useState([]);
  const [formData, setFormData] = useState({
    projectName: '',
    leadName: '',
    email: '',
    rollNo: '',
    stallType: 'Standard 6x6 Table',
    needsPower: true
  });
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    setRegisteredList(getRegisteredEvents());
    const sync = () => setRegisteredList(getRegisteredEvents());
    window.addEventListener('eventRegistered', sync);
    return () => window.removeEventListener('eventRegistered', sync);
  }, []);

  useEffect(() => {
    const fetchApprovedExpos = async () => {
      try {
        const res = await apiClient.get('/events/approved?category=expo').catch(() => ({ data: [] }));
        const approvedFormatted = (res.data || []).map(item => ({
          id: item.id,
          day: item.day || 15,
          month: item.month,
          year: item.year,
          title: item.title,
          desc: item.desc,
          date: item.date,
          college: item.college || 'Host Institution',
          department: item.department || item.organizer || 'Host Department',
          location: item.location,
          partners: item.prize || item.club || 'Campus Innovation Cell',
          stallsTotal: item.stallsTotal || 20,
          stallsBooked: item.stallsBooked || 4,
          posterUrl: item.posterUrl,
          link: item.link,
          isApprovedCommunityEvent: true
        }));
        setAllExpos([...approvedFormatted, ...EXPOS]);
      } catch (err) {
        console.error("Error loading approved expos:", err);
      }
    };
    fetchApprovedExpos();
  }, []);

  const filteredExpos = useMemo(() => {
    return allExpos.filter(expo => {
      let matchesDate = true;
      if (selectedDate) {
        const selDay = typeof selectedDate === 'object' ? selectedDate.day : selectedDate;
        const selMonth = typeof selectedDate === 'object' ? selectedDate.month : null;
        matchesDate = expo.day === selDay && (!selMonth || selMonth === 10);
      }
      const matchesQuery = searchQuery 
        ? expo.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          expo.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (expo.college || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (expo.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (expo.location || '').toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesDate && matchesQuery;
    });
  }, [allExpos, selectedDate, searchQuery]);

  const selectedDisplayDate = useMemo(() => {
    if (!selectedDate) return null;
    if (typeof selectedDate === 'number') return `October ${selectedDate}, 2026`;
    return `${selectedDate.monthName || 'October'} ${selectedDate.day}, ${selectedDate.year || 2026}`;
  }, [selectedDate]);

  const handleOpenBooking = (event) => {
    const existing = getRegistrationById(event.id);
    if (existing) {
      setViewingPass(existing);
      return;
    }

    setBookingModalEvent(event);
    setBookingSuccess(null);
    setFormData({
      projectName: '',
      leadName: '',
      email: '',
      rollNo: '',
      stallType: 'Standard 6x6 Table',
      needsPower: true
    });
  };

  const handleSubmitBooking = (e) => {
    e.preventDefault();
    if (!formData.projectName || !formData.leadName) {
      alert("Please fill in the project title and team lead name.");
      return;
    }

    const reg = registerEvent({
      id: bookingModalEvent.id,
      type: 'expo',
      title: bookingModalEvent.title,
      date: bookingModalEvent.date,
      venue: bookingModalEvent.location,
      college: bookingModalEvent.college,
      department: bookingModalEvent.department,
      attendee: {
        name: formData.leadName,
        rollNo: formData.rollNo,
        email: formData.email,
        projectName: formData.projectName,
        stallType: formData.stallType
      }
    });

    setBookingSuccess(reg);
    setViewingPass(reg);
  };

  return (
    <div className="bg-[var(--color-background)] text-[var(--color-text-primary)] font-sans min-h-screen pb-24 relative">
      <header className="bg-[var(--color-surface)] sticky top-0 z-50 w-full border-b border-[var(--color-border)] shadow-sm">
        <div className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} aria-label="Go back" className="btn-icon">
              <span className="material-symbols-outlined text-[var(--color-primary)]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--color-primary)]">Tech Innovation Expo</h1>
              <p className="text-[11px] text-[var(--color-text-secondary)] hidden sm:block">Reserve project stalls & showcase hardware to investors</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center w-48 md:w-64">
            <span className="material-symbols-outlined absolute left-3.5 text-[var(--color-text-secondary)] text-[18px] pointer-events-none select-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search expos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--color-card)] border border-[var(--color-border)] rounded-full focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)] shadow-sm transition-all"
            />
          </div>
        </div>
      </header>

      <main className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Events List */}
          <section className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            {selectedDate && (
              <div className="flex items-center justify-between p-3.5 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-xl animate-fadeIn">
                <span className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">filter_alt</span>
                  Showing expos scheduled for: <strong>{selectedDisplayDate}</strong>
                </span>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-xs font-bold text-[var(--color-text-primary)] hover:underline ml-2"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {filteredExpos.length === 0 ? (
              <div className="card-standard p-12 text-center text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                <span className="material-symbols-outlined text-5xl mb-3 opacity-40 text-[var(--color-primary)]">event_busy</span>
                <p className="font-bold text-lg text-[var(--color-text-primary)]">
                  {selectedDate ? `No expos found scheduled for ${selectedDisplayDate}.` : 'No expos match your criteria.'}
                </p>
                <p className="text-xs mt-1.5 max-w-md mx-auto">Try selecting a highlighted date with a green dot on the calendar or clearing search filters.</p>
                <button 
                  onClick={() => { setSelectedDate(null); setSearchQuery(''); }}
                  className="btn-secondary mt-5 px-5 py-2 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Reset Filters & View All
                </button>
              </div>
            ) : (
              filteredExpos.map((event) => {
                const isBooked = isEventRegistered(event.id);
                const remainingStalls = event.stallsTotal - event.stallsBooked;

                return (
                  <div key={event.id} className="card-standard p-6 md:p-8 flex flex-col relative border-2 border-transparent hover:border-[var(--color-primary)] transition-all shadow-sm">
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
                      <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">{event.title}</h2>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        remainingStalls <= 3 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {remainingStalls} Stalls Left
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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-sm">event</span>
                        <span><strong>Date:</strong> {event.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-sm">handshake</span>
                        <span className="truncate"><strong>Partners:</strong> {event.partners}</span>
                      </div>
                    </div>

                    {isBooked ? (
                      <button 
                        onClick={() => {
                          const pass = getRegistrationById(event.id);
                          if (pass) setViewingPass(pass);
                          else handleOpenBooking(event);
                        }}
                        className="w-full py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-500/25 transition-colors text-xs sm:text-sm"
                      >
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Stall Reserved • View Digital Pass
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleOpenBooking(event)}
                        className="btn-primary w-full mt-auto flex items-center justify-center gap-2 shadow-md text-xs sm:text-sm py-3 font-bold"
                      >
                        <span className="material-symbols-outlined text-base">storefront</span>
                        Book a Stall (Free for Students)
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
            activeCategory="expo"
            events={allExpos}
            externalPass={viewingPass}
            onCloseExternalPass={() => setViewingPass(null)}
          />
        </div>
      </main>

      {/* Booking Stall Modal */}
      {bookingModalEvent && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-standard w-[92vw] sm:w-[500px] max-w-lg p-6 relative shadow-2xl border border-[var(--color-primary)]">
            <button 
              onClick={() => { setBookingModalEvent(null); setBookingSuccess(null); }}
              className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {!bookingSuccess ? (
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl">
                    <span className="material-symbols-outlined text-2xl">storefront</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Reserve Project Stall</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">{bookingModalEvent.title}</p>
                  </div>
                </div>

                <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] text-xs space-y-1">
                  <p className="text-[var(--color-text-secondary)] truncate">
                    🏛️ <strong className="text-[var(--color-text-primary)]">Host Campus:</strong> {bookingModalEvent.college || 'Sri Krishna College of Technology (SKCT), Coimbatore'}
                  </p>
                  <p className="text-[var(--color-text-secondary)] truncate">
                    🎓 <strong className="text-[var(--color-text-primary)]">Department:</strong> {bookingModalEvent.department || 'Dept. of Electronics & Communication'}
                  </p>
                  <p className="text-[var(--color-text-secondary)] truncate">
                    📍 <strong className="text-red-500">Event Venue:</strong> {bookingModalEvent.location} • 📅 {bookingModalEvent.date}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Project / Prototype Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smart IoT Soil Sensor Node"
                    value={formData.projectName}
                    onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                    className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Team Lead Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tharun Karthik"
                      value={formData.leadName}
                      onChange={(e) => setFormData({...formData, leadName: e.target.value})}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Stall Space</label>
                    <select
                      value={formData.stallType}
                      onChange={(e) => setFormData({...formData, stallType: e.target.value})}
                      className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      <option>Standard 6x6 Table</option>
                      <option>Large 10x10 Booth</option>
                      <option>Wall Mount Display</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={formData.needsPower}
                        onChange={(e) => setFormData({...formData, needsPower: e.target.checked})}
                        className="rounded text-[var(--color-primary)] focus:ring-0"
                      />
                      <span>Needs 230V Power Socket</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingModalEvent(null)}
                    className="btn-secondary flex-1 py-2.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 py-2.5 text-xs font-bold"
                  >
                    Confirm Stall Registration
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">verified</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Stall Successfully Booked!</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Your allocation pass has been generated and saved to your profile.
                  </p>
                </div>

                <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)] text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Pass ID:</span>
                    <span className="font-mono font-bold text-[var(--color-primary)]">{bookingSuccess.regId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Project:</span>
                    <span className="font-bold">{bookingSuccess.attendee?.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Venue & Date:</span>
                    <span>{bookingSuccess.venue} • {bookingSuccess.date}</span>
                  </div>
                </div>

                <button
                  onClick={() => { setBookingModalEvent(null); setBookingSuccess(null); }}
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
