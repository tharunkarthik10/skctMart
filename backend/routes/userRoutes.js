import express from 'express';
import * as UserController from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, UserController.getAllUsers);
router.get('/:id', authMiddleware, UserController.getUserById);
router.post('/upsert', authMiddleware, UserController.upsertUser);
router.put('/:id', authMiddleware, UserController.updateUser);
router.post('/:id/request-edit', authMiddleware, UserController.requestEditAccess);
router.post('/:id/approve-edit', authMiddleware, UserController.approveEditAccess);
router.post('/:id/reject-edit', authMiddleware, UserController.rejectEditAccess);
router.post('/block-by-email', authMiddleware, UserController.blockUserByEmail);

export default router;
