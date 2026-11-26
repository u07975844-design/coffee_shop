import { Router } from 'express';
import {
  cancelMyOrder,
  getMyOrderDetails,
  getMyOrders,
  placeOrder,
  submitOrderItemReview,
} from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', placeOrder);
router.get('/', getMyOrders);
router.get('/:id', getMyOrderDetails);
router.patch('/:id/cancel', cancelMyOrder);
router.post('/reviews', submitOrderItemReview);

export default router;
