import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/eventProposals.json');

// Initial seeded proposals so admin and event sections have realistic data immediately
const INITIAL_PROPOSALS = [
  {
    id: 'prop-101',
    title: '⚡ DevPulse 2026: Campus AI & Web3 Jam',
    category: 'hackathon',
    date: 'October 29, 2026',
    day: 29,
    month: 10,
    year: 2026,
    time: '09:00 AM - 06:00 PM',
    college: 'Sri Krishna College of Technology (SKCT), Coimbatore',
    department: 'Dept. of Computer Science & Engineering (AI & ML)',
    location: 'Convention Center, Hall 2',
    desc: 'An intense 24-hour sprint focused on campus AI automation, decentralized protocols, and student dev tools. Open to all engineering departments.',
    organizer: 'Google Developer Student Clubs & ECE Association',
    contactName: 'Tharun Karthik',
    contactEmail: '727824tuio046@skct.edu.in',
    contactPhone: '+91 94883 21901',
    posterUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    link: 'https://unstop.com/',
    prize: '₹50,000 Prize Pool',
    status: 'APPROVED',
    adminNotes: 'Verified with Institutional Innovation Council (IIC). Permitted for Convention Center Hall 2.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'prop-102',
    title: '🏎️ Autonomous RC Rover & Drone Grand Prix',
    category: 'workshop',
    date: 'October 24, 2026',
    day: 24,
    month: 10,
    year: 2026,
    time: '10:00 AM - 04:30 PM',
    college: 'Sri Krishna College of Technology (SKCT), Coimbatore',
    department: 'Dept. of Robotics & Automation Engineering',
    location: 'Mechanical Quadrangle & Drone Cage',
    desc: 'Hands-on assembly of 4WD differential drive rovers with Arduino and nRF24L01 wireless controllers. Obstacle avoidance time trials.',
    organizer: 'Robotics Club SKCT',
    contactName: 'A. Ramanathan',
    contactEmail: 'robotics@skct.edu.in',
    contactPhone: '+91 98421 11200',
    posterUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    link: 'https://forms.gle/',
    perk: 'Free 4WD Chassis + Motor Shield',
    status: 'PENDING',
    adminNotes: '',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'prop-103',
    title: '🌱 CleanTech & Renewable Energy Hardware Showcase',
    category: 'expo',
    date: 'October 28, 2026',
    day: 28,
    month: 10,
    year: 2026,
    time: '09:30 AM - 05:00 PM',
    college: 'Sri Krishna College of Technology (SKCT), Coimbatore',
    department: 'Dept. of Electrical & Electronics Engineering (EEE)',
    location: 'Main Auditorium Quadrangle',
    desc: 'Student exhibition of MPPT solar charge controllers, lithium battery packs, and IoT energy meters. Angel investors and faculty jury in attendance.',
    organizer: 'Department of Electrical & Electronics',
    contactName: 'Prof. K. Venkatesh',
    contactEmail: 'eee.events@skct.edu.in',
    contactPhone: '+91 97500 23412',
    posterUrl: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?auto=format&fit=crop&w=800&q=80',
    link: 'https://unstop.com/',
    stallsTotal: 18,
    stallsBooked: 10,
    partners: '10+ GreenTech Incubators',
    status: 'PENDING',
    adminNotes: '',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

// Ensure data file exists
const loadProposals = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_PROPOSALS, null, 2));
      return INITIAL_PROPOSALS;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_PROPOSALS;
  } catch (err) {
    console.error('Error loading event proposals:', err);
    return INITIAL_PROPOSALS;
  }
};

const saveProposals = (proposals) => {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(proposals, null, 2));
  } catch (err) {
    console.error('Error saving event proposals:', err);
  }
};

export const getAllProposals = () => {
  return loadProposals();
};

export const createEventProposal = (data) => {
  const proposals = loadProposals();
  
  // Calculate day, month, year if date is provided
  let day = data.day;
  let month = data.month;
  let year = data.year;

  if (data.date) {
    const parsed = new Date(data.date);
    if (!isNaN(parsed.getTime())) {
      day = parsed.getDate();
      month = parsed.getMonth() + 1;
      year = parsed.getFullYear();
    }
  }

  const newProposal = {
    id: `prop-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    title: data.title || 'Untitled Event',
    category: (data.category || 'campus').toLowerCase(),
    date: data.date || 'TBA',
    day: day || 28,
    month: month || 10,
    year: year || 2026,
    time: data.time || '10:00 AM - 04:00 PM',
    college: data.college || 'Sri Krishna College of Technology (SKCT), Coimbatore',
    department: data.department || data.organizer || 'Inter-Departmental / Campus Innovation Cell',
    location: data.location || 'Campus Auditorium',
    desc: data.desc || data.description || '',
    organizer: data.organizer || 'Student Maker Group',
    contactName: data.contactName || '',
    contactEmail: data.contactEmail || '',
    contactPhone: data.contactPhone || '',
    posterUrl: data.posterUrl || '',
    link: data.link || '',
    prize: data.prize || '',
    perk: data.perk || '',
    stallsTotal: Number(data.stallsTotal) || 20,
    stallsBooked: 0,
    partners: data.partners || '',
    instructor: data.instructor || data.contactName || 'Faculty / Club Mentor',
    attendeesCount: 0,
    status: 'PENDING', // PENDING, APPROVED, REJECTED, EDIT_SUGGESTED
    adminNotes: '',
    createdAt: new Date().toISOString()
  };

  proposals.unshift(newProposal);
  saveProposals(proposals);
  return newProposal;
};

export const updateProposalStatus = (id, { status, adminNotes = '', editedData = null }) => {
  const proposals = loadProposals();
  const index = proposals.findIndex(p => p.id === id);
  if (index === -1) {
    return null;
  }

  const existing = proposals[index];
  const updated = {
    ...existing,
    ...(editedData || {}),
    status: status || existing.status,
    adminNotes: adminNotes !== undefined ? adminNotes : existing.adminNotes,
    updatedAt: new Date().toISOString()
  };

  proposals[index] = updated;
  saveProposals(proposals);
  return updated;
};

export const deleteProposal = (id) => {
  const proposals = loadProposals();
  const filtered = proposals.filter(p => p.id !== id);
  saveProposals(filtered);
  return true;
};

export const getApprovedEvents = (category = null) => {
  const proposals = loadProposals();
  let approved = proposals.filter(p => p.status === 'APPROVED');
  if (category) {
    approved = approved.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  return approved;
};
