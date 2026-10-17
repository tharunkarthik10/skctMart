import express from 'express';
import { getMyOrders, getSellerOrders, getOrderById, updateOrderStatus, cancelOrder, createCodOrder, respondToOrder } from '../controllers/orderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createCodOrder);
router.post('/respond', respondToOrder);

router.get('/my-orders', getMyOrders);
router.get('/seller-orders', getSellerOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/cancel', cancelOrder);

export default router;
