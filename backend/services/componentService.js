import prisma from '../config/prisma.js';
import * as ChatService from './chatService.js';
import * as MessageService from './messageService.js';
import { emitNewChat, emitNewMessage, emitComponentUpdate, emitNewBid } from './socketService.js';

export const getAllComponents = async (filters = {}) => {
    // Add logic for filters (category, search, condition, status) if passed
    const where = {};
    if (filters.category && filters.category !== 'All Categories') where.category = filters.category;
    if (filters.status) where.status = filters.status;
    if (filters.seller_id) where.seller_id = filters.seller_id;
    if (filters.search) {
        where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
        ];
    }
    
    let components = await prisma.component.findMany({
        where,
        include: { seller: { select: { id: true, name: true, email: true, avatar_url: true } } },
        orderBy: { createdAt: 'desc' },
    });

    if (!filters.seller_id && !filters.includeSold && !filters.status) {
        components = components.filter(c => c.status !== 'SOLD' && c.status !== 'Archived' && c.status !== 'ARCHIVED');
    }

    return components;
};

export const getComponentById = async (id) => {
    return await prisma.component.findUnique({
        where: { id },
        include: { seller: { select: { id: true, name: true, email: true, avatar_url: true } } },
    });
};

export const getComponentsBySeller = async (sellerId) => {
    return await prisma.component.findMany({
        where: { seller_id: sellerId },
        include: { seller: { select: { id: true, name: true, email: true, avatar_url: true } } },
        orderBy: { createdAt: 'desc' },
    });
};

export const createComponent = async (data) => {
    return await prisma.component.create({
        data,
    });
};

export const updateComponent = async (id, data) => {
    return await prisma.component.update({
        where: { id },
        data,
    });
};

export const deleteComponent = async (id) => {
    return await prisma.component.delete({
        where: { id },
    });
};

export const getComponentBids = async (id) => {
    return await prisma.bid.findMany({
        where: { component_id: id },
        orderBy: { amount: 'desc' },
        include: { bidder: { select: { id: true, name: true, avatar_url: true } } }
    });
};

export const placeBid = async (id, bidder_id, amount) => {
    // 1. Fetch component with seller
    const component = await prisma.component.findUnique({
        where: { id },
        include: { seller: true }
    });

    if (!component) {
        throw new Error('Component not found');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Invalid bid amount');
    }

    // Prevent auction owner from bidding on their own item
    if (component.seller_id === bidder_id) {
        throw new Error('You cannot place a bid on your own auction.');
    }

    // Verify bid is strictly higher than current highest bid or base price
    const currentHighest = await prisma.bid.findFirst({
        where: { component_id: id },
        orderBy: { amount: 'desc' }
    });

    const currentPrice = currentHighest ? currentHighest.amount : component.price;
    if (parsedAmount <= currentPrice) {
        throw new Error(`Bid amount must be strictly higher than current highest bid (₹${currentPrice})`);
    }

    // 2. Create bid record
    const newBid = await prisma.bid.create({
        data: {
            amount: parsedAmount,
            bidder_id,
            component_id: id
        },
        include: {
            bidder: { select: { id: true, name: true, email: true, avatar_url: true } }
        }
    });

    // 3. Update component price to the new highest bid
    let updatedComponent = component;
    try {
        updatedComponent = await prisma.component.update({
            where: { id },
            data: { price: parsedAmount },
            include: { seller: true }
        });
    } catch (e) {
        console.error('Error updating component price on bid:', e);
    }

    // 4. Fetch bidder details
    let bidderName = 'A student maker';
    try {
        const bidder = await prisma.user.findUnique({ where: { id: bidder_id } });
        if (bidder?.name) bidderName = bidder.name;
        else if (bidder?.email) bidderName = bidder.email.split('@')[0];
    } catch (e) {}

    // 5. Notify the auction owner
    const sellerId = component.seller_id;
    if (sellerId && sellerId !== bidder_id) {
        try {
            const chat = await ChatService.getOrCreateChat(bidder_id, sellerId, id);
            const bidPayload = {
                type: 'NEW_BID',
                bidId: newBid.id,
                componentId: id,
                componentTitle: component.title,
                componentImage: component.image_url || (component.images && component.images[0]) || null,
                bidAmount: parsedAmount,
                bidderId: bidder_id,
                bidderName: bidderName,
                note: `🔥 New Bid Alert!\n\n${bidderName} placed a new highest bid of ₹${parsedAmount.toLocaleString('en-IN')} on your auction "${component.title}".\n\nThe current price has been updated!`
            };
            const messageText = JSON.stringify(bidPayload);
            const automatedMessage = await MessageService.createMessage(chat.id, bidder_id, sellerId, messageText);
            emitNewChat(chat, bidder_id, sellerId);
            emitNewMessage(automatedMessage, sellerId);
        } catch (chatError) {
            console.error('Failed to notify auction owner of new bid:', chatError);
        }
    }

    // 6. Broadcast real-time bid and component update
    try {
        emitComponentUpdate(updatedComponent);
        emitNewBid(newBid, updatedComponent, sellerId);
    } catch (e) {}

    return newBid;
};
