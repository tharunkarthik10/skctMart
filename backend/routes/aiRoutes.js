import express from 'express';

const router = express.Router();

const KNOWLEDGE_BASE = [
    {
        keywords: ['esp32', 'esp-32', 'wroom'],
        response: `⚡ **ESP32 Dev Kit Guide**:
• **Specs**: Dual-core Tensilica Xtensa 32-bit LX6, 240 MHz, 520 KB SRAM, Wi-Fi 802.11 b/g/n, Bluetooth v4.2 BR/EDR & BLE.
• **Pinout Tips**: Operating voltage is 3.3V (do NOT connect 5V to GPIOs). GPIO 34, 35, 36, 39 are input-only without internal pullups.
• **Best For**: IoT sensors, web servers, Bluetooth gateways, smart home automation.`
    },
    {
        keywords: ['arduino', 'uno', 'atmega'],
        response: `🤖 **Arduino UNO R3 Guide**:
• **Specs**: ATmega328P, 16 MHz, 32 KB Flash, 2 KB SRAM, 14 Digital I/O (6 PWM), 6 Analog inputs.
• **Operating Voltage**: 5V. Recommended input voltage on Vin/Barrel jack: 7–12V.
• **Best For**: Beginners, robotics motor control, basic sensor interfacing, and rapid hardware prototyping.`
    },
    {
        keywords: ['raspberry pi', 'rpi', 'pi 4', 'pi 5'],
        response: `🥧 **Raspberry Pi Guide**:
• **Best For**: Computer vision, deep learning at the edge, OpenCV, home media servers, and autonomous robotics navigation.
• **Power Tip**: Raspberry Pi 4 requires at least a 5V 3A Type-C power supply; Raspberry Pi 5 requires a 5V 5A PD adapter for full peripheral support.`
    },
    {
        keywords: ['sell', 'list', 'listing', 'how to sell'],
        response: `📦 **How to Sell on MakerMart**:
1. Click the **'+ Sell'** button in the bottom navigation.
2. Enter your component title, category, price, and condition.
3. Choose listing type: **Direct Sell** or **Live Auction** (with duration and auto-win price).
4. Upload photos and provide why you are selling.
5. Once your profile is verified, your listing goes live instantly on campus!`
    },
    {
        keywords: ['auction', 'bid', 'bidding'],
        response: `🔨 **Live Auctions on MakerMart**:
• Sellers can list components for auction with a starting price and duration (e.g. 2h, 4h, 24h).
• Buyers place bids on the product page.
• If someone places a bid above the **Auto-Win Price**, the auction closes immediately in their favor!
• Track active auctions on the homepage under **⚡ Live Auctions**.`
    },
    {
        keywords: ['buy', 'order', 'purchase', 'payment'],
        response: `💳 **Buying & Payments**:
• Click on any component to view details, test specifications, and seller rating.
• Tap **'Buy Now'** to proceed to checkout with campus pickup or delivery.
• Complete secure checkout via Razorpay or simulated test payment.
• Track your orders anytime in **My Orders**!`
    },
    {
        keywords: ['chat', 'message', 'seller', 'contact'],
        response: `💬 **Chatting with Sellers**:
• Tap **'Chat with Seller'** on any product page.
• You can negotiate pricing, request test videos, and coordinate the campus pickup spot (e.g., Central Library, Mech Block, Canteen).
• Chats update in real-time with instant read receipts!`
    },
    {
        keywords: ['events', 'hackathon', 'expo', 'workshop'],
        response: `📅 **Campus & External Events**:
• Check our **📅 Upcoming Events** on the homepage for 4 specialized categories:
  1. 👨‍💻 **Campus Hackathons**: Live national & global hackathons with prize pools!
  2. 🏭 **Tech Innovation Expo**: Book stalls to showcase your startup or project!
  3. 🤖 **Robotics Workshops**: Hands-on hardware robotics & ROS2 sessions!
  4. 🎉 **Campus Events**: Seminars, technical symposiums, and guest talks!`
    },
    {
        keywords: ['sih', 'problem', 'smart india hackathon', 'ideas'],
        response: `💡 **Hackathon Problem Statements**:
• Head to the **Explore** tab to browse official problem statements from:
  - **Smart India Hackathon (SIH)**
  - **India Innovate (MyGov)**
  - **Startup India Challenges**
• You can filter by domain (IoT, AI, HealthTech, Agriculture) and review official links directly!`
    },
    {
        keywords: ['admin', 'portal', 'verification', 'verify'],
        response: `🛡️ **Profile Verification & Admin**:
• All student profiles are verified by administrators to ensure a safe, scam-free campus community.
• Once approved, you can sell components, start auctions, and chat freely with fellow makers.`
    }
];

router.post('/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const query = message.toLowerCase().trim();

        // 1. Check for keyword matches in MakerMart knowledge base
        for (const item of KNOWLEDGE_BASE) {
            if (item.keywords.some(kw => query.includes(kw))) {
                return res.status(200).json({
                    reply: item.response,
                    source: 'MakerMart Assistant'
                });
            }
        }

        // 2. Fallback smart engineering answer generator
        let reply = `🤖 **Maker AI**: That's a great question regarding "${message.trim()}"!\n\n`;
        if (query.includes('sensor') || query.includes('iot')) {
            reply += `For IoT and sensor projects, we recommend pairing analog/I2C sensors with an **ESP32** or **Arduino UNO**. You can browse all available sensors under **⚡ Popular Categories > Sensors** right here on MakerMart!`;
        } else if (query.includes('price') || query.includes('cost') || query.includes('cheap')) {
            reply += `Components on MakerMart are priced by fellow campus students at 30%–70% off retail prices. Use the Search filters or sort by **Recently Added** to find the best deals!`;
        } else if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
            reply += `Hello there! 👋 I can help you find hardware parts, check pinouts, guide you through buying/selling, or connect you with hackathons and project challenges. What are you building today?`;
        } else {
            reply += `Here are some quick actions you can explore on MakerMart:\n• Browse **Components** in the store or search by keyword.\n• Participate in **Live Auctions** to win components at great discounts.\n• Check the **Explore** tab for SIH problem statements and daily tech news.\n• Visit the **Upcoming Events** section to register for hackathons and workshops!`;
        }

        res.status(200).json({
            reply,
            source: 'Maker AI'
        });
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ error: 'Failed to generate AI response' });
    }
});

export default router;
