import prisma from '../config/prisma.js';
import {
    getAllProposals,
    createEventProposal,
    updateProposalStatus,
    deleteProposal,
    getApprovedEvents
} from '../services/eventProposalService.js';

export const getEvents = async (req, res, next) => {
    try {
        const events = await prisma.event.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(events);
    } catch (error) {
        next(error);
    }
};

export const createEvent = async (req, res, next) => {
    try {
        const { title, description, buttonText, link, bgClass, textClass, btnClass } = req.body;
        
        const event = await prisma.event.create({
            data: {
                title,
                description,
                buttonText,
                link,
                bgClass,
                textClass,
                btnClass,
            },
        });
        
        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
};

// Event Proposals & Admin Approval Controllers
export const submitProposal = async (req, res, next) => {
    try {
        const proposalData = req.body;
        if (!proposalData.title || !proposalData.category) {
            return res.status(400).json({ error: 'Event title and category are required.' });
        }

        // Check if organizer or user is blocked
        const emailToCheck = (proposalData.contactEmail || req.user?.email || '').toLowerCase().trim();
        if (emailToCheck) {
            const blockedUser = await prisma.user.findFirst({
                where: {
                    email: { equals: emailToCheck, mode: 'insensitive' },
                    is_blocked: true
                }
            });
            if (blockedUser) {
                return res.status(403).json({ error: 'Your account has been blocked by the admin from posting events and accessing the platform.' });
            }
        }

        const created = createEventProposal(proposalData);
        res.status(201).json({
            message: 'Event proposal submitted successfully and sent to admin for review.',
            proposal: created
        });
    } catch (error) {
        next(error);
    }
};

export const getProposals = async (req, res, next) => {
    try {
        const proposals = getAllProposals();
        res.status(200).json(proposals);
    } catch (error) {
        next(error);
    }
};

export const updateProposal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, adminNotes, editedData } = req.body;
        const updated = updateProposalStatus(id, { status, adminNotes, editedData });
        if (!updated) {
            return res.status(404).json({ error: 'Proposal not found' });
        }
        res.status(200).json({
            message: `Event proposal marked as ${status}.`,
            proposal: updated
        });
    } catch (error) {
        next(error);
    }
};

export const removeProposal = async (req, res, next) => {
    try {
        const { id } = req.params;
        deleteProposal(id);
        res.status(200).json({ message: 'Event proposal deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

export const getApprovedEventsList = async (req, res, next) => {
    try {
        const { category } = req.query;
        const approved = getApprovedEvents(category);
        res.status(200).json(approved);
    } catch (error) {
        next(error);
    }
};
