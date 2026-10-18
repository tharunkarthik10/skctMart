import express from 'express';
import { 
    getEvents, 
    createEvent,
    submitProposal,
    getProposals,
    updateProposal,
    removeProposal,
    getApprovedEventsList
} from '../controllers/eventController.js';

const router = express.Router();

// GET /api/events - Retrieve all live events
router.get('/', getEvents);

// POST /api/events - Create a new event
router.post('/', createEvent);

// User event submission & Admin approval routes
router.post('/proposals', submitProposal);
router.get('/proposals', getProposals);
router.put('/proposals/:id/status', updateProposal);
router.delete('/proposals/:id', removeProposal);
router.get('/approved', getApprovedEventsList);

export default router;
