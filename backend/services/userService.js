import prisma from '../config/prisma.js';

export const getUserById = async (id) => {
    return await prisma.user.findUnique({
        where: { id },
    });
};

export const getAllUsers = async () => {
    return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
    });
};

export const upsertUser = async (id, email) => {
    const ADMIN_EMAILS = ['tharunkarthikav21@gmail.com', '727824tuio046@skct.edu.in', 'tharunkarthik21112006@gmail.com'];
    const isAdmin = ADMIN_EMAILS.includes((email || '').toLowerCase());
    return await prisma.user.upsert({
        where: { id },
        update: isAdmin ? { is_admin: true, role: 'Admin', is_profile_verified: true } : {},
        create: {
            id,
            email,
            is_admin: isAdmin,
            role: isAdmin ? 'Admin' : 'Member',
            is_profile_verified: isAdmin,
        },
    });
};

export const updateUser = async (id, data) => {
    return await prisma.user.update({
        where: { id },
        data,
    });
};
