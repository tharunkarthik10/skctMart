import prisma from '../config/prisma.js';

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
    return await prisma.bid.create({
        data: {
            amount: parseFloat(amount),
            bidder_id,
            component_id: id
        }
    });
};
