import { Router } from 'express';
import {
  getActiveOffers,
  getApprovedReviews,
  getCafeSettings,
  getCategories,
  getProductDetails,
  getProducts,
  submitContactMessage,
  validateOfferCode,
} from '../controllers/publicController.js';

const router = Router();

router.get('/settings', getCafeSettings);
router.get('/offers', getActiveOffers);
router.post('/offers/validate', validateOfferCode);
router.get('/categories', getCategories);
router.get('/products', getProducts);
router.get('/products/:idOrSlug', getProductDetails);
router.get('/reviews', getApprovedReviews);
router.post('/contact', submitContactMessage);

export default router;
