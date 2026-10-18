import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { EventSidebar } from '../components/EventSidebar';
import { registerEvent, isEventRegistered, getRegistrationById, getRegisteredEvents } from '../utils/eventStorage';
import apiClient from '../api/client';

const WORKSHOPS = [
  {
    id: 'robo-1',
    day: 5,
    title: "🤖 ROS 2 & Autonomous Mobile Robot (AMR) Navigation",
    desc: "Hands-on boot camp covering ROS2 Humble, SLAM navigation with 2D LiDAR, and robot kinematics using simulated & physical differential drive rovers.",
    date: "October 5, 2026",
    college: "PSG College of Technology, Coimbatore",
    department: "Dept. of Robotics & Automation Engineering",
    location: "Advanced Robotics & Kinematics Lab 3",
    perk: "Free TurtleBot Compatible Sensor Kit",
    seatsTotal: 30,
    seatsBooked: 24,
    instructor: "Dr. K. Senthil Kumar (Robotics Club Mentor)"
  },
  {
    id: 'robo-2',
    day: 12,
    title: "⚡ MicroPython, FreeRTOS & Dual-Core ESP32 Masterclass",
    desc: "Build real-time multitasking firmware, read high-speed encoder pulses, control servo clusters, and stream telemetry over Wi-Fi UDP.",
    date: "October 12, 2026",
    college: "Sri Krishna College of Technology (SKCT), Coimbatore",
    department: "Dept. of Electronics & Communication Engineering",
    location: "Embedded IoT Special Lab 1",
    perk: "Free ESP32-WROOM-32D Development Board",
    seatsTotal: 35,
    seatsBooked: 29,
    instructor: "Er. A. Ramanathan (Firmware Architect)"
  },
  {
    id: 'robo-3',
    day: 15,
    title: "🛸 FPV Racing Drone Assembly & Flight Controller Tuning",
    desc: "Assemble 5-inch carbon fiber quadcopter frames, solder BLDC motor ESCs, flash Betaflight firmware, and configure radio transmitters.",
    date: "October 15, 2026",
    college: "Madras Institute of Technology (MIT - Anna University), Chennai",
    department: "Dept. of Aerospace Engineering",
    location: "UAV Research Center & Hangar 1",
    perk: "Flight Simulator Dongle & 4x BLDC Motors",
    seatsTotal: 25,
    seatsBooked: 22,
    instructor: "Aero Team Lead & Drone Pilots"
  },
  {
    id: 'robo-4',
    day: 17,
    title: "👁️ OpenCV & Real-Time Computer Vision on Raspberry Pi",
    desc: "Object tracking, color thresholding, face recognition, and line following algorithms running on Raspberry Pi 4 with camera modules.",
    date: "October 17, 2026",
    college: "National Institute of Technology (NIT) Trichy",
    department: "Dept. of Instrumentation and Control Engineering",
    location: "Siemens Centre of Excellence, Hall B",
    perk: "Wide-Angle Pi Camera v2 Module",
    seatsTotal: 30,
    seatsBooked: 21,
    instructor: "Prof. M. Divya (Computer Vision Research)"
  },
  {
    id: 'robo-5',
    day: 21,
    title: "🔌 Custom PCB Design with KiCad & Hot-Air SMD Soldering",
    desc: "Route 2-layer schematics, generate Gerber files, perform stenciling, solder 0805 SMD components using hot-air rework stations, and debug with digital oscilloscopes.",
    date: "October 21, 2026",
    college: "Coimbatore Institute of Technology (CIT), Coimbatore",
    department: "Dept. of Electrical & Electronics Engineering",
    location: "Hardware Fab Lab & PCB Soldering Hub",
    perk: "Custom Pre-etched PCB Badge & SMD Kit",
    seatsTotal: 28,
    seatsBooked: 25,
    instructor: "MakerMart Tech Lead"
  },
  {
    id: 'robo-6',
    day: 24,
    title: "🦾 Bionic Quadruped & 12-DOF Inverse Kinematics",
    desc: "Build and program a 12-servo four-legged walking robot. Implement trot gait algorithms, gyroscope balance feedback, and Bluetooth app control.",
    date: "October 24, 2026",
    college: "Birla Institute of Technology and Science (BITS Pilani)",
    department: "Dept. of Mechanical & Mechatronics Engineering",
    location: "Mechatronics Prototyping Studio",
    perk: "12x Metal Gear MG90S Servos & Frame",
    seatsTotal: 20,
    seatsBooked: 18,
    instructor: "Robotics Research Group"
  }
];

export const RoboticsWorkshop = () => {
  const navigate = useNavigate();
  const [allWorkshops, setAllWorkshops] = useState(WORKSHOPS);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingModalEvent, setBookingModalEvent] = useState(null);
  const [viewingPass, setViewingPass] = useState(null);
  const [registeredList, setRegisteredList] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    email: '',
    experienceLevel: 'Beginner',
    wantsHardwareKit: true
  });
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    setRegisteredList(getRegisteredEvents());
    const sync = () => setRegisteredList(getRegisteredEvents());
    window.addEventListener('eventRegistered', sync);
    return () => window.removeEventListener('eventRegistered', sync);
  }, []);

  useEffect(() => {
    const fetchApprovedWorkshops = async () => {
      try {
        const res = await apiClient.get('/events/approved?category=workshop').catch(() => ({ data: [] }));
        const approvedFormatted = (res.data || []).map(item => ({
          id: item.id,
          day: item.day || 15,
          month: item.month,
          year: item.year,
          title: item.title,
          desc: item.desc,
          date: item.date,
          college: item.college || 'Host Campus / Institution',
          department: item.department || item.organizer || 'Host Department',
          location: item.location,
          perk: item.prize || 'Workshop Hardware Kit & Certificate',
          seatsTotal: item.stallsTotal || 30,
          seatsBooked: item.stallsBooked || 5,
          instructor: item.club || 'Campus Robotics Society',
          posterUrl: item.posterUrl,
          link: item.link,
          isApprovedCommunityEvent: true
        }));
        setAllWorkshops([...approvedFormatted, ...WORKSHOPS]);
      } catch (err) {
        console.error("Error loading approved workshops:", err);
      }
    };
    fetchApprovedWorkshops();
  }, []);

  const filteredWorkshops = useMemo(() => {
    return allWorkshops.filter(ws => {
      let matchesDate = true;
      if (selectedDate) {
        const selDay = typeof selectedDate === 'object' ? selectedDate.day : selectedDate;
        const selMonth = typeof selectedDate === 'object' ? selectedDate.month : null;
        matchesDate = ws.day === selDay && (!selMonth || selMonth === 10);
      }
      const matchesQuery = searchQuery
        ? ws.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          ws.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (ws.college || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (ws.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (ws.location || '').toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesDate && matchesQuery;
    });
  }, [allWorkshops, selectedDate, searchQuery]);

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
      name: '',
      rollNo: '',
      email: '',
      experienceLevel: 'Beginner',
      wantsHardwareKit: true
    });
  };

  const handleSubmitBooking = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.rollNo) {
      alert("Please fill in your name and roll number.");
      return;
    }

    const reg = registerEvent({
      id: bookingModalEvent.id,
      type: 'workshop',
      title: bookingModalEvent.title,
      date: bookingModalEvent.date,
      venue: bookingModalEvent.location,
      college: bookingModalEvent.college,
      department: bookingModalEvent.department,
      attendee: {
        name: formData.name,
        rollNo: formData.rollNo,
        email: formData.email,
        experienceLevel: formData.experienceLevel,
        perk: bookingModalEvent.perk
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
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--color-primary)]">Robotics Workshops</h1>
              <p className="text-[11px] text-[var(--color-text-secondary)] hidden sm:block">Hands-on microcontrollers, ROS 2, PCB design & autonomous robotics</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center w-48 md:w-64">
            <span className="material-symbols-outlined absolute left-3.5 text-[var(--color-text-secondary)] text-[18px] pointer-events-none select-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search workshops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--color-card)] border border-[var(--color-border)] rounded-full focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-text-primary)] shadow-sm transition-all"
            />
          </div>
        </div>
      </header>

      <main className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto px-3 md:px-[22px] py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Workshops List */}
          <section className="lg:col-span-8 flex flex-col gap-6 min-w-0">
            {selectedDate && (
              <div className="flex items-center justify-between p-3.5 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-xl animate-fadeIn">
                <span className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">filter_alt</span>
                  Showing workshops scheduled for: <strong>{selectedDisplayDate}</strong>
                </span>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-xs font-bold text-[var(--color-text-primary)] hover:underline ml-2"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {filteredWorkshops.length === 0 ? (
              <div className="card-standard p-12 text-center text-[var(--color-text-secondary)] border border-[var(--color-border)]">
                <span className="material-symbols-outlined text-5xl mb-3 opacity-40 text-[var(--color-primary)]">event_busy</span>
                <p className="font-bold text-lg text-[var(--color-text-primary)]">
                  {selectedDate ? `No workshops found scheduled for ${selectedDisplayDate}.` : 'No workshops match your criteria.'}
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
              filteredWorkshops.map((ws) => {
                const isBooked = isEventRegistered(ws.id);
                const seatsRemaining = ws.seatsTotal - ws.seatsBooked;

                return (
                  <div key={ws.id} className="card-standard p-6 md:p-8 flex flex-col relative border-2 border-transparent hover:border-[var(--color-primary)] transition-all shadow-sm">
                    {/* Event Poster Image - only for student/club submitted events with verified posters */}
                    {ws.isApprovedCommunityEvent && ws.posterUrl && (
                      <div className="w-full h-44 sm:h-56 mb-5 rounded-2xl overflow-hidden bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm">
                        <img 
                          src={ws.posterUrl} 
                          alt={ws.title} 
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">{ws.title}</h2>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                        seatsRemaining <= 3 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {seatsRemaining} Seats Remaining
                      </span>
                    </div>

                    <p className="text-sm md:text-base text-[var(--color-text-secondary)] mb-4">{ws.desc}</p>

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
                          <span className="font-bold text-[var(--color-text-primary)] text-xs block truncate" title={ws.college}>
                            {ws.college || "Host Campus / Institution"}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] flex items-center gap-1 mb-0.5">
                            <span className="material-symbols-outlined text-[13px] text-blue-500">school</span>
                            Hosting Department
                          </span>
                          <span className="font-bold text-[var(--color-text-primary)] text-xs block truncate" title={ws.department}>
                            {ws.department || "Host Department"}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] flex items-center gap-1 mb-0.5">
                            <span className="material-symbols-outlined text-[13px] text-red-500">location_on</span>
                            Location / Venue
                          </span>
                          <span className="font-bold text-red-500 text-xs block truncate" title={ws.location}>
                            {ws.location || "Hardware Robotics Lab 2"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-[var(--color-text-secondary)] mb-4 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-[var(--color-primary)]">person</span>
                      <span>Instructor: <strong className="text-[var(--color-text-primary)]">{ws.instructor}</strong></span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-sm">event</span>
                        <span><strong>Date:</strong> {ws.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-500 text-sm">card_giftcard</span>
                        <span className="truncate"><strong>Hardware:</strong> {ws.perk}</span>
                      </div>
                    </div>

                    {isBooked ? (
                      <button 
                        onClick={() => {
                          const pass = getRegistrationById(ws.id);
                          if (pass) setViewingPass(pass);
                          else handleOpenBooking(ws);
                        }}
                        className="w-full py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-500/25 transition-colors text-xs sm:text-sm"
                      >
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Workshop Confirmed • View Digital Pass
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleOpenBooking(ws)}
                        className="btn-primary w-full mt-auto flex items-center justify-center gap-2 shadow-md text-xs sm:text-sm py-3 font-bold"
                      >
                        <span className="material-symbols-outlined text-base">precision_manufacturing</span>
                        Join Workshop & Reserve Hardware Kit
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
            activeCategory="workshop"
            events={allWorkshops}
            externalPass={viewingPass}
            onCloseExternalPass={() => setViewingPass(null)}
          />
        </div>
      </main>

      {/* Workshop Registration Modal */}
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
                    <span className="material-symbols-outlined text-2xl">precision_manufacturing</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Workshop Registration</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">{bookingModalEvent.title}</p>
                  </div>
                </div>

                <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] text-xs space-y-1">
                  <p className="text-[var(--color-text-secondary)] truncate">
                    🏛️ <strong className="text-[var(--color-text-primary)]">Host Campus:</strong> {bookingModalEvent.college || 'Sri Krishna College of Technology (SKCT), Coimbatore'}
                  </p>
                  <p className="text-[var(--color-text-secondary)] truncate">
                    🎓 <strong className="text-[var(--color-text-primary)]">Department:</strong> {bookingModalEvent.department || 'Dept. of Robotics & Automation'}
                  </p>
                  <p className="text-[var(--color-text-secondary)] truncate">
                    📍 <strong className="text-red-500">Event Venue:</strong> {bookingModalEvent.location} • 📅 {bookingModalEvent.date}
                  </p>
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">Skill / Experience Level</label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                      className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      <option>Beginner (First Time)</option>
                      <option>Intermediate (Built Basic Projects)</option>
                      <option>Advanced (Know C++/Python & ROS)</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={formData.wantsHardwareKit}
                        onChange={(e) => setFormData({...formData, wantsHardwareKit: e.target.checked})}
                        className="rounded text-[var(--color-primary)] focus:ring-0"
                      />
                      <span>Reserve Hardware Takeaway Kit</span>
                    </label>
                  </div>
                </div>

                <div className="p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                  🎁 <strong>Included Kit:</strong> {bookingModalEvent.perk}. Kits will be provided at the entrance desk of {bookingModalEvent.location}.
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
                    Confirm Registration
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl">verified</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">You're Registered for the Workshop!</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Your seat and hardware kit have been reserved.
                  </p>
                </div>

                <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-border)] text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Pass ID:</span>
                    <span className="font-mono font-bold text-[var(--color-primary)]">{bookingSuccess.regId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Workshop:</span>
                    <span className="font-bold">{bookingSuccess.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Venue & Date:</span>
                    <span>{bookingSuccess.venue} • {bookingSuccess.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Kit Perk:</span>
                    <span className="text-purple-400 font-semibold">{bookingSuccess.attendee?.perk}</span>
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
