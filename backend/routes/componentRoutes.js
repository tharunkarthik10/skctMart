import express from 'express';
import * as ComponentController from '../controllers/componentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { verifiedProfileMiddleware } from '../middleware/verifiedProfileMiddleware.js';

const router = express.Router();

router.get('/', ComponentController.getComponents);
router.get('/:id', ComponentController.getComponentById);

router.get('/:id/bids', ComponentController.getComponentBids);

// Protected routes
router.use(authMiddleware);
router.post('/', verifiedProfileMiddleware, ComponentController.createComponent);
router.put('/:id', verifiedProfileMiddleware, ComponentController.updateComponent);
router.delete('/:id', verifiedProfileMiddleware, ComponentController.deleteComponent);
router.post('/:id/bids', verifiedProfileMiddleware, ComponentController.placeBid);

export default router;
