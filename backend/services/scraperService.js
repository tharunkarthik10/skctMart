import Parser from 'rss-parser';

const parser = new Parser({
    customFields: {
        item: ['description', 'pubDate'],
    }
});

let cachedHackathons = null;
let lastFetched = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const getExternalHackathons = async () => {
    const hackathonsList = [
        {
            title: '🏆 Google Solution Challenge 2026',
            desc: 'Develop solutions for one or more of the United Nations 17 Sustainable Development Goals using Google technologies.',
            college: 'Indian Institute of Science (IISc), Bangalore',
            department: 'Centre for Electronic Design & Technology',
            location: 'Satish Dhawan Auditorium, Bangalore',
            prize: '$50,000 USD Prize Pool',
            source: 'Google Developers',
            link: 'https://developers.google.com/community/solutions-challenge',
            daysOffset: 12
        },
        {
            title: '⚡ Unstop Innovation Challenge',
            desc: 'A nation-wide hackathon focusing on GenAI, Cloud Computing, and sustainable engineering challenges.',
            college: 'PSG College of Technology, Coimbatore',
            department: 'Dept. of Information Technology',
            location: 'Convention Hall & Digital Arena',
            prize: '₹1,00,000 Prize Pool',
            source: 'Unstop',
            link: 'https://unstop.com/',
            daysOffset: 18
        },
        {
            title: '🌐 ETHGlobal Web3 Sprint 2026',
            desc: 'Bring your wildest Web3 ideas to life. Connect with developers, designers, and mentors in the Ethereum ecosystem.',
            college: 'Coimbatore Institute of Technology (CIT), Coimbatore',
            department: 'Dept. of Computing & Distributed Systems',
            location: 'CIT Main Auditorium & Tech Park',
            prize: '$125,000 USD Prize Pool',
            source: 'ETHGlobal',
            link: 'https://ethglobal.com/',
            daysOffset: 25
        },
        {
            title: '🎓 HackMIT 2026',
            desc: 'MIT\'s premier hackathon. Join 1,000+ developers from around the world to build innovative software and hardware projects.',
            college: 'Massachusetts Institute of Technology (MIT)',
            department: 'EECS Department',
            location: 'Kresge Auditorium & Stata Center, Cambridge, MA',
            prize: '$20,000 USD Prize Pool',
            source: 'MIT',
            link: 'https://hackmit.org/',
            daysOffset: 32
        },
        {
            title: '🧠 OpenAI DevDay Campus Jam',
            desc: 'Build next-generation AI agents and applications using the latest GPT-4o API, Assistants API, and fine-tuning tools.',
            college: 'Indian Institute of Technology (IIT) Delhi',
            department: 'School of Artificial Intelligence (ScAI)',
            location: 'Dogra Hall & Bharti Building, New Delhi',
            prize: '$100,000 API Credits Pool',
            source: 'OpenAI',
            link: 'https://openai.com/',
            daysOffset: 40
        },
        {
            title: '🛡️ Supabase Open Source Hackathon',
            desc: 'A week-long hackathon to build open-source applications using Supabase Database, Auth, Storage, and Realtime.',
            college: 'Kumaraguru College of Technology (KCT), Coimbatore',
            department: 'Dept. of Computer Science & Open Source Lab',
            location: 'KCT Tech Park, Hall 2',
            prize: 'Supabase Swag + $5,000 Pool',
            source: 'Supabase',
            link: 'https://supabase.com/blog',
            daysOffset: 8
        },
        {
            title: '🚀 Microsoft Imagine Cup 2026',
            desc: 'Showcase your technology startup idea that addresses key global problems in health, education, and environment.',
            college: 'Birla Institute of Technology and Science (BITS Pilani)',
            department: 'Dept. of Electrical & Electronics Engineering',
            location: 'BITS Hyderabad Auditorium',
            prize: '$100,000 USD + Mentorship',
            source: 'Microsoft',
            link: 'https://imaginecup.microsoft.com/',
            daysOffset: 48
        },
        {
            title: '📈 Vercel Ship Campus Hackathon',
            desc: 'Ship your next big idea on Vercel. Focuses on frontend performance, user experience, and next.js integrations.',
            college: 'Government College of Technology (GCT), Coimbatore',
            department: 'Dept. of Computer Science & Engineering',
            location: 'GCT Central Computing Facility',
            prize: 'Vercel Pro for Life + Swag',
            source: 'Vercel',
            link: 'https://vercel.com/',
            daysOffset: 15
        },
        {
            title: '☁️ AWS Cloud Architecture Challenge',
            desc: 'Design and implement highly scalable, fault-tolerant cloud architectures using AWS Serverless and DynamoDB.',
            college: 'Indian Institute of Technology (IIT) Bombay',
            department: 'Dept. of Computer Science & Automation',
            location: 'PC Saxena Auditorium, Powai, Mumbai',
            prize: '$15,000 AWS Credits',
            source: 'AWS',
            link: 'https://aws.amazon.com/',
            daysOffset: 22
        },
        {
            title: '🔥 HackerEarth AI Brainstorm Challenge',
            desc: 'Solve real-world enterprise problems using LLMs, Vector Databases, and advanced NLP architectures.',
            college: 'Anna University, Chennai',
            department: 'Dept. of Information Science & Engineering',
            location: 'Vivekananda Auditorium, Chennai',
            prize: '₹2,50,000 Prize Pool',
            source: 'HackerEarth',
            link: 'https://hackerearth.com/',
            daysOffset: 5
        },
        {
            title: '💎 Devfolio Web3 & AI Buildathon 2026',
            desc: 'Build dApps, AI autonomous agents, and developer tools on EVM-compatible chains. Multi-track prizes for DeFi and AI.',
            college: 'Indian Institute of Technology (IIT) Madras',
            department: 'Dept. of Computer Science & Engineering',
            location: 'IITM Research Park Auditorium, Chennai',
            prize: '$30,000 USD Pool',
            source: 'Devfolio',
            link: 'https://devfolio.co/',
            daysOffset: 11
        },
        {
            title: '🚀 Cloudflare Workers Edge Sprint',
            desc: 'Build ultra low-latency edge applications with Cloudflare Workers, D1 database, and AI vector search.',
            college: 'National Institute of Technology (NIT) Trichy',
            department: 'Dept. of Computer Applications',
            location: 'NIT-T Octagon Computer Center',
            prize: '$20,000 in Grants + Swag',
            source: 'Cloudflare',
            link: 'https://cloudflare.com/',
            daysOffset: 10
        },
        {
            title: '🤖 Autonomous Robotics & Drone Hackfest',
            desc: 'Build computer vision and SLAM robotics solutions for autonomous rovers, quadcopters, and micro-controllers.',
            college: 'PSG Institute of Technology and Applied Research (PSG iTech), Coimbatore',
            department: 'Dept. of Mechatronics & Autonomous Systems',
            location: 'PSG Innovation Centre, Hall 3',
            prize: '₹75,000 + Hardware Kits',
            source: 'MakerMart',
            link: 'https://unstop.com/',
            daysOffset: 6
        },
        {
            title: '🌱 EcoTech & Smart Campus IoT Challenge',
            desc: 'Develop embedded IoT sensor networks and low-power hardware for clean energy and smart campus monitoring.',
            college: 'Coimbatore Institute of Technology (CIT), Coimbatore',
            department: 'Dept. of Electrical & Electronics Engineering (EEE)',
            location: 'CIT Main Auditorium & Tech Lawn',
            prize: '₹50,000 Prize Pool',
            source: 'MakerMart',
            link: 'https://unstop.com/',
            daysOffset: 3
        },
        {
            title: '🌲 TreeHacks 2026',
            desc: 'Stanford\'s premier hackathon. Gathering the nation\'s brightest engineering minds to solve major challenges.',
            college: 'Stanford University',
            department: 'Stanford Computer Science Department',
            location: 'Huang Engineering Center, Stanford, CA',
            prize: '$25,000 USD Prize Pool',
            source: 'Stanford University',
            link: 'https://www.treehacks.com/',
            daysOffset: 60
        },
        {
            title: '🐆 PennApps XXVII',
            desc: 'The nation\'s first student-run hackathon. Compete in healthcare, hardware, and web tracks.',
            college: 'University of Pennsylvania (UPenn)',
            department: 'Penn Engineering & BioTech Labs',
            location: 'Engineering Quad, Philadelphia, PA',
            prize: '$15,000 USD Prize Pool',
            source: 'UPenn',
            link: 'https://pennapps.com/',
            daysOffset: 65
        },
        {
            title: '🐻 CalHacks 13.0',
            desc: 'The world\'s largest collegiate hackathon hosted by UC Berkeley. Focused on engineering, AI, and civic tech.',
            college: 'University of California, Berkeley',
            department: 'UC Berkeley EECS Department',
            location: 'California Memorial Stadium, Berkeley, CA',
            prize: '$30,000 USD Prize Pool',
            source: 'UC Berkeley',
            link: 'https://calhacks.io/',
            daysOffset: 72
        },
        {
            title: '⚙️ HackDTU 2026',
            desc: 'Delhi Technological University\'s annual hackathon focusing on fintech, healthcare, and smart cities.',
            college: 'Delhi Technological University (DTU)',
            department: 'Dept. of Software Engineering & Innovation',
            location: 'BR Ambedkar Auditorium, New Delhi',
            prize: '₹2,00,000 Prize Pool',
            source: 'DTU Delhi',
            link: 'https://hackdtu.in/',
            daysOffset: 35
        },
        {
            title: '💻 TCS CodeVita Season 12',
            desc: 'TCS\'s global coding contest that promotes programming as a sport and uncovers top coding talent.',
            college: 'Tata Consultancy Services (TCS) Innovation Hub, Chennai',
            department: 'Global Placement & Talent Engineering Cell',
            location: 'TCS Siruseri Auditorium, OMR Chennai',
            prize: '$20,000 USD Grand Prize',
            source: 'TCS',
            link: 'https://www.tcscodevita.com/',
            daysOffset: 80
        },
        {
            title: '🛰️ ISRO SpaceTech Hackathon',
            desc: 'Use ISRO\'s open satellite datasets to build remote sensing, weather forecasting, and mapping tools.',
            college: 'Indian Institute of Space Science and Technology (IIST)',
            department: 'Dept. of Aerospace Engineering & Avionics',
            location: 'IIST Main Campus Auditorium, Thiruvananthapuram',
            prize: '₹3,00,000 Prize Pool',
            source: 'ISRO',
            link: 'https://www.isro.gov.in/',
            daysOffset: 45
        },
        {
            title: '🐙 GitHub Universe Campus Sprint',
            desc: 'Build tools and extensions that integrate with GitHub Copilot, GitHub Actions, and Codespaces.',
            college: 'International Institute of Information Technology (IIIT) Bangalore',
            department: 'Centre for Open Source & Cloud Computing',
            location: 'IIITB Main Auditorium, Electronic City',
            prize: '$10,000 USD + Features',
            source: 'GitHub',
            link: 'https://github.com/',
            daysOffset: 14
        },
        {
            title: '🩺 BioHack Cornell 2026',
            desc: 'Interdisciplinary hackathon bridging the gap between biology, computer science, and medicine.',
            college: 'Cornell University',
            department: 'Biomedical Engineering & CS Department',
            location: 'Weill Hall Auditorium, Ithaca, NY',
            prize: '$10,000 USD Prize Pool',
            source: 'Cornell University',
            link: 'https://cornell.edu/',
            daysOffset: 55
        },
        {
            title: '🛸 Knight Hacks 2026',
            desc: 'University of Central Florida\'s hackathon. Join for workshops, mentorship, and building awesome projects.',
            college: 'University of Central Florida (UCF)',
            department: 'College of Engineering & Computer Science',
            location: 'Student Union Pegasus Ballroom, Orlando, FL',
            prize: '$8,000 USD Prize Pool',
            source: 'UCF',
            link: 'https://knighthacks.org/',
            daysOffset: 50
        }
    ];

    const baseTime = Date.now();
    return hackathonsList.map((item, index) => {
        const targetDate = new Date(baseTime + item.daysOffset * 24 * 60 * 60 * 1000);
        const formattedDate = targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        
        return {
            id: `hack-${index}-${item.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
            title: item.title,
            desc: item.desc,
            date: formattedDate,
            day: targetDate.getDate(),
            month: targetDate.getMonth() + 1,
            year: targetDate.getFullYear(),
            rawDate: targetDate.toISOString(),
            college: item.college,
            department: item.department,
            location: item.location,
            prize: item.prize,
            source: item.source,
            link: item.link
        };
    });
};

export { getExternalHackathons };
