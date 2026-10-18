import React, { useState, useEffect, useMemo } from 'react';
import { getRegisteredEvents, cancelRegistration } from '../utils/eventStorage';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const EventSidebar = ({ 
  selectedDate, 
  onSelectDate, 
  activeCategory = 'all', 
  events = [],
  externalPass = null,
  onCloseExternalPass = null
}) => {
  const [registered, setRegistered] = useState([]);
  const [activePass, setActivePass] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Month navigation: default to October 2026
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October
  const [currentYear, setCurrentYear] = useState(2026);

  const loadEvents = () => {
    setRegistered(getRegisteredEvents());
  };

  useEffect(() => {
    loadEvents();
    window.addEventListener('eventRegistered', loadEvents);
    return () => window.removeEventListener('eventRegistered', loadEvents);
  }, []);

  // Sync external pass requests from parent cards
  useEffect(() => {
    if (externalPass) {
      setActivePass(externalPass);
    }
  }, [externalPass]);

  const handleClosePass = () => {
    setActivePass(null);
    setDownloadSuccess(false);
    if (onCloseExternalPass) {
      onCloseExternalPass();
    }
  };

  const handleCancel = (regId) => {
    if (window.confirm("Are you sure you want to cancel this event registration?")) {
      cancelRegistration(regId);
      loadEvents();
      if (activePass && activePass.regId === regId) {
        handleClosePass();
      }
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Calendar dates with active event markers
  const activeEventDays = useMemo(() => {
    const days = new Set();
    
    // Check passed events list first
    if (events && events.length > 0) {
      events.forEach(ev => {
        let evDay = ev.day;
        let evMonth = ev.month;
        let evYear = ev.year || 2026;

        if (!evDay && ev.date) {
          const parsed = new Date(ev.date);
          if (!isNaN(parsed.getTime())) {
            evDay = parsed.getDate();
            evMonth = parsed.getMonth() + 1;
            evYear = parsed.getFullYear();
          }
        }

        // Match current month (1-indexed vs 0-indexed)
        if (evDay && (!evMonth || evMonth === currentMonth + 1) && evYear === currentYear) {
          days.add(evDay);
        }
      });
    }

    // Default calendar event markers for rich October & November schedules
    if (days.size === 0) {
      if (currentYear === 2026 && currentMonth === 9) { // October 2026
        if (activeCategory === 'hackathon') [21, 23, 24, 26, 28, 29, 30].forEach(d => days.add(d));
        else if (activeCategory === 'expo') [5, 9, 15, 17, 21, 24, 28].forEach(d => days.add(d));
        else if (activeCategory === 'workshop') [5, 12, 15, 17, 21, 24].forEach(d => days.add(d));
        else if (activeCategory === 'campus') [5, 9, 15, 17, 21, 24].forEach(d => days.add(d));
        else [5, 9, 12, 15, 17, 21, 24, 28, 29, 30].forEach(d => days.add(d));
      } else if (currentYear === 2026 && currentMonth === 10) { // November 2026
        if (activeCategory === 'hackathon') [1, 2, 5, 9, 12, 19, 22, 27].forEach(d => days.add(d));
        else if (activeCategory === 'expo') [4, 11, 18, 25].forEach(d => days.add(d));
        else if (activeCategory === 'workshop') [3, 10, 17, 24].forEach(d => days.add(d));
        else if (activeCategory === 'campus') [6, 13, 20, 27].forEach(d => days.add(d));
        else [1, 2, 5, 9, 12, 19, 22, 27].forEach(d => days.add(d));
      }
    }

    return days;
  }, [events, currentMonth, currentYear, activeCategory]);

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

  // Helper to determine if a day is currently selected
  const isDaySelected = (day) => {
    if (!selectedDate) return false;
    if (typeof selectedDate === 'number') {
      return selectedDate === day && currentMonth === 9 && currentYear === 2026;
    }
    return (
      selectedDate.day === day &&
      (!selectedDate.month || selectedDate.month === currentMonth + 1) &&
      (!selectedDate.year || selectedDate.year === currentYear)
    );
  };

  const handleDayClick = (day) => {
    if (isDaySelected(day)) {
      onSelectDate(null);
    } else {
      onSelectDate({
        day,
        month: currentMonth + 1,
        year: currentYear,
        monthName: MONTH_NAMES[currentMonth]
      });
    }
  };

  const handleDownloadPass = (pass) => {
    setDownloadSuccess(true);
    // Copy pass details to clipboard
    const passSummary = `MakerMart Verified Event Pass
Event: ${pass.title}
Hosting College / Campus (Where Event Takes Place): ${pass.college || 'Sri Krishna College of Technology (SKCT), Coimbatore'}
Hosting Department: ${pass.department || 'Campus Technology Cell'}
Date: ${pass.date}
Event Location / Venue: ${pass.venue || pass.location || 'Campus Auditorium'}
Pass ID: ${pass.regId}
Status: Verified Active`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(passSummary).catch(() => {});
    }

    // Trigger browser print dialog for immediate ticket print/save as PDF
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const selectedDisplayDate = useMemo(() => {
    if (!selectedDate) return null;
    if (typeof selectedDate === 'number') {
      return `October ${selectedDate}, 2026`;
    }
    const mName = selectedDate.monthName || MONTH_NAMES[(selectedDate.month || 10) - 1];
    return `${mName} ${selectedDate.day}, ${selectedDate.year || 2026}`;
  }, [selectedDate]);

  return (
    <>
      <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24 lg:h-[calc(100vh-160px)] lg:overflow-y-auto min-w-0 pr-1 pb-20">
        
        {/* Interactive Dynamic Calendar Card */}
        <div className="card-standard p-6 border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">calendar_month</span> 
              Calendar
            </h3>
            
            <div className="flex items-center gap-1.5">
              {selectedDate && (
                <button 
                  onClick={() => onSelectDate(null)}
                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline mr-1"
                >
                  Clear Filter
                </button>
              )}
              
              {/* Month Navigation */}
              <div className="flex items-center bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] p-0.5">
                <button 
                  onClick={handlePrevMonth}
                  aria-label="Previous Month"
                  className="p-1 hover:bg-[var(--color-border)]/50 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="text-xs font-bold px-2 text-[var(--color-primary)] select-none min-w-[70px] text-center">
                  {MONTH_NAMES[currentMonth].substring(0, 3)} {currentYear}
                </span>
                <button 
                  onClick={handleNextMonth}
                  aria-label="Next Month"
                  className="p-1 hover:bg-[var(--color-border)]/50 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[var(--color-text-secondary)] mb-2 select-none">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {/* Days from previous month */}
            {Array.from({ length: firstDayOfWeek }, (_, i) => {
              const day = prevMonthTotalDays - firstDayOfWeek + i + 1;
              return (
                <div key={`prev-${day}`} className="p-1.5 opacity-25 text-xs select-none">
                  {day}
                </div>
              );
            })}

            {/* Current Month Days */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const hasEvent = activeEventDays.has(day);
              const isSelected = isDaySelected(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`relative p-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center ${
                    isSelected 
                      ? 'bg-[var(--color-primary)] text-white shadow-md scale-105 z-10' 
                      : hasEvent
                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/25 font-bold'
                        : 'hover:bg-[var(--color-border)]/50 text-[var(--color-text-primary)]'
                  }`}
                  title={hasEvent ? `Events scheduled on ${MONTH_NAMES[currentMonth]} ${day}` : `${MONTH_NAMES[currentMonth]} ${day}`}
                >
                  {day}
                  {hasEvent && !isSelected && (
                    <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full mt-0.5"></span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedDisplayDate && (
            <div className="mt-3.5 flex items-center justify-between text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] p-2 rounded-lg border border-[var(--color-primary)]/20 animate-fadeIn">
              <span className="font-semibold flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-sm">filter_alt</span>
                Filtering: <strong className="font-bold">{selectedDisplayDate}</strong>
              </span>
              <button 
                onClick={() => onSelectDate(null)}
                className="hover:underline font-bold text-[11px] ml-2 flex-shrink-0"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Registered Events Tracker */}
        <div className="card-standard p-6 border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">confirmation_number</span> 
              My Passes
            </h3>
            <span className="text-xs px-2.5 py-0.5 bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold rounded-full">
              {registered.length} Active
            </span>
          </div>

          {registered.length === 0 ? (
            <div className="text-center py-6 text-sm text-[var(--color-text-secondary)]">
              <span className="material-symbols-outlined text-3xl opacity-40 mb-1">event_busy</span>
              <p className="font-medium">No event passes yet.</p>
              <p className="text-xs mt-1">Register for an event or workshop to get your official pass!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {registered.slice(0, 3).map((item) => (
                <div 
                  key={item.regId}
                  onClick={() => setActivePass(item)}
                  className="flex gap-3 items-center p-3 bg-[var(--color-surface)] hover:bg-[var(--color-background)] cursor-pointer rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all group shadow-sm"
                >
                  <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">verified</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5 mt-0.5">
                      <span>{item.date}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-[var(--color-primary)] font-bold">{item.regId}</span>
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[var(--color-text-secondary)] text-sm group-hover:translate-x-0.5 transition-transform">
                    chevron_right
                  </span>
                </div>
              ))}
            </div>
          )}

          {registered.length > 0 && (
            <button 
              onClick={() => setShowAllModal(true)}
              className="w-full mt-4 py-2.5 text-xs sm:text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl border border-[var(--color-primary)]/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">badge</span>
              View All Passes ({registered.length})
            </button>
          )}
        </div>
      </aside>

      {/* Official Verified Digital Pass Modal */}
      {activePass && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-standard w-[92vw] sm:w-[480px] max-w-md p-6 relative animate-fadeIn shadow-2xl border-2 border-[var(--color-primary)] rounded-2xl bg-[var(--color-surface)]">
            <button 
              onClick={handleClosePass}
              className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white p-1 rounded-full hover:bg-[var(--color-border)] transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            {/* Pass Header */}
            <div className="flex items-center gap-3 mb-5 border-b border-[var(--color-border)] pb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[var(--color-primary)] to-emerald-400 flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined text-2xl">qr_code_2</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-lg text-[var(--color-text-primary)]">Official Event Pass</h4>
                  <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-500 font-bold text-[10px] rounded-full uppercase tracking-wider">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">MakerMart Campus Pass Network</p>
              </div>
            </div>

            {/* Pass Body (Printable area) */}
            <div id="printable-event-pass" className="bg-[var(--color-card)] p-5 rounded-2xl border border-[var(--color-border)] mb-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-full blur-2xl pointer-events-none"></div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)] tracking-wider">Event Name</span>
                <p className="font-bold text-base text-[var(--color-text-primary)] mt-0.5">{activePass.title}</p>
                
                {/* Event Venue & Hosting Campus (Where Event Takes Place) */}
                <div className="mt-2.5 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-border)]">
                    <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-[var(--color-primary)]">corporate_fare</span>
                      Event Venue & Hosting Campus
                    </span>
                    <span className="text-[9px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded">
                      Where Event Takes Place
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[var(--color-text-secondary)] block">🏛️ College / Campus</span>
                      <p className="font-bold text-[var(--color-text-primary)] text-xs truncate" title={activePass.college}>
                        {activePass.college || 'Sri Krishna College of Technology (SKCT), Coimbatore'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[var(--color-text-secondary)] block">🎓 Hosting Department</span>
                      <p className="font-semibold text-[var(--color-text-primary)] text-xs truncate" title={activePass.department || activePass.organizer}>
                        {activePass.department || activePass.organizer || 'Campus Innovation Cell'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-[var(--color-border)]">
                    <span className="text-[9px] uppercase font-bold text-[var(--color-text-secondary)] block">📍 Event Location / Specific Venue</span>
                    <p className="font-bold text-red-500 text-xs truncate" title={activePass.venue || activePass.location}>
                      {activePass.venue || activePass.location || 'Campus Main Auditorium'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--color-border)]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Date & Schedule</span>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] mt-0.5">📅 {activePass.date}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Pass ID</span>
                  <p className="text-xs font-mono font-bold text-[var(--color-primary)] mt-0.5">{activePass.regId}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 font-bold text-[10px] rounded">
                    Active Pass
                  </span>
                </div>
              </div>

              {activePass.attendee && (
                <div className="pt-3 border-t border-[var(--color-border)] text-xs">
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Registered Attendee</span>
                  <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">
                    {activePass.attendee.name} {activePass.attendee.rollNo ? `(${activePass.attendee.rollNo})` : ''}
                  </p>
                  {activePass.attendee.projectName && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      Project: <strong className="text-[var(--color-text-primary)]">{activePass.attendee.projectName}</strong>
                    </p>
                  )}
                  {activePass.attendee.stallType && (
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Stall: {activePass.attendee.stallType}
                    </p>
                  )}
                  {activePass.attendee.perk && (
                    <p className="text-xs text-purple-400 mt-0.5">
                      🎁 Includes: {activePass.attendee.perk}
                    </p>
                  )}
                </div>
              )}

              {/* Barcode & Hologram Aesthetic */}
              <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex gap-1 h-7 items-center opacity-80">
                    <span className="w-0.5 h-full bg-[var(--color-text-primary)]"></span>
                    <span className="w-1 h-full bg-[var(--color-text-primary)]"></span>
                    <span className="w-0.5 h-full bg-[var(--color-text-primary)]"></span>
                    <span className="w-1.5 h-full bg-[var(--color-text-primary)]"></span>
                    <span className="w-0.5 h-full bg-[var(--color-text-primary)]"></span>
                    <span className="w-2 h-full bg-[var(--color-text-primary)]"></span>
                    <span className="w-0.5 h-full bg-[var(--color-text-primary)]"></span>
                    <span className="w-1 h-full bg-[var(--color-text-primary)]"></span>
                    <span className="w-1.5 h-full bg-[var(--color-text-primary)]"></span>
                    <span className="w-0.5 h-full bg-[var(--color-text-primary)]"></span>
                    <span className="w-1 h-full bg-[var(--color-text-primary)]"></span>
                    <span className="w-2 h-full bg-[var(--color-text-primary)]"></span>
                  </div>
                  <span className="text-[9px] font-mono text-[var(--color-text-secondary)]">VERIFY-{activePass.regId}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-[var(--color-text-secondary)] block">Scannable Entry</span>
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 justify-end">
                    <span className="material-symbols-outlined text-xs">shield_check</span>
                    TAMPER PROOF
                  </span>
                </div>
              </div>
            </div>

            {downloadSuccess && (
              <div className="mb-4 p-2.5 bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Pass printed & details copied to clipboard!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleDownloadPass(activePass)}
                className="btn-primary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Download / Print Pass
              </button>
              <button
                onClick={() => handleCancel(activePass.regId)}
                className="px-4 py-2.5 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                title="Cancel Registration"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Registrations Modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-standard w-[92vw] sm:w-[520px] max-w-lg max-h-[85vh] flex flex-col p-6 relative shadow-2xl rounded-2xl bg-[var(--color-surface)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <div>
                <h3 className="font-bold text-lg text-[var(--color-text-primary)]">All Registered Events</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">Your confirmed event badges and workshop passes</p>
              </div>
              <button 
                onClick={() => setShowAllModal(false)}
                className="p-1 hover:bg-[var(--color-border)] rounded-full transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {registered.length === 0 ? (
                <p className="text-center py-8 text-xs text-[var(--color-text-secondary)]">No registered events.</p>
              ) : (
                registered.map((item) => (
                  <div 
                    key={item.regId} 
                    className="p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] flex items-center justify-between gap-3 shadow-sm hover:border-[var(--color-primary)]/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate text-[var(--color-text-primary)]">{item.title}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">
                        📅 {item.date} • 🏛️ {item.college || 'Host Campus'} • 📍 {item.venue || item.location || 'Main Auditorium'}
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
                        className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 shadow-sm"
                      >
                        View Pass
                      </button>
                      <button
                        onClick={() => handleCancel(item.regId)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-xs transition-colors"
                        title="Cancel Registration"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[var(--color-border)] text-right">
              <button
                onClick={() => setShowAllModal(false)}
                className="btn-secondary px-5 py-2 text-xs font-bold"
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
