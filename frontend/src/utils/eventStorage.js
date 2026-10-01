// Utility to manage user event registrations across the platform
const STORAGE_KEY = 'makermart_registered_events';

export const getRegisteredEvents = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Default sample registered events for immediate rich UX
      const defaults = [
        {
          regId: 'MM-HACK-8491',
          id: 'hack-1',
          type: 'hackathon',
          title: "Campus Hackathon '26",
          date: 'Oct 15, 2026',
          venue: 'Convention Center & Online',
          registeredAt: new Date().toISOString(),
          status: 'Confirmed'
        },
        {
          regId: 'MM-ROBO-3921',
          id: 'workshop-1',
          type: 'workshop',
          title: 'ROS 2 & Robotics Workshop',
          date: 'Dec 12, 2026',
          venue: 'Hardware Lab 3',
          registeredAt: new Date().toISOString(),
          status: 'Confirmed'
        }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading registered events', e);
    return [];
  }
};

export const registerEvent = (event) => {
  const list = getRegisteredEvents();
  const regId = `MM-${event.type ? event.type.substring(0, 4).toUpperCase() : 'EVNT'}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newRegistration = {
    ...event,
    regId,
    registeredAt: new Date().toISOString(),
    status: 'Confirmed'
  };
  
  // Filter out if already registered to avoid duplicates
  const updated = [newRegistration, ...list.filter(e => e.id !== event.id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('eventRegistered'));
  return newRegistration;
};

export const cancelRegistration = (regId) => {
  const list = getRegisteredEvents();
  const updated = list.filter(e => e.regId !== regId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('eventRegistered'));
  return updated;
};

export const isEventRegistered = (eventId) => {
  const list = getRegisteredEvents();
  return list.some(e => e.id === eventId);
};
