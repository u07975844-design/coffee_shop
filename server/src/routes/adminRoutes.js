import { Router } from 'express';
import {
  adminAdjustInventory,
  adminArchiveOrDeleteCategory,
  adminArchiveProduct,
  adminCreateCategory,
  adminCreateOffer,
  adminCreateProduct,
  adminDeleteOffer,
  adminDeleteReview,
  adminGetOrderDetails,
  adminListCategories,
  adminListInventory,
  adminListInventoryMovements,
  adminListOffers,
  adminListOrders,
  adminListProducts,
  adminListReviews,
  adminListUsers,
  adminUpdateCafeSettings,
  adminUpdateCategory,
  adminUpdateOffer,
  adminUpdateOrderStatus,
  adminUpdateProduct,
  adminUpdateReviewStatus,
  adminUpdateUserAccess,
  adminUploadImage,
  getDashboard,
} from '../controllers/adminController.js';
import { getCafeSettings } from '../controllers/publicController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();

router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Categories
router.get('/categories', adminListCategories);
router.post('/categories', adminCreateCategory);
router.put('/categories/:id', adminUpdateCategory);
router.delete('/categories/:id', adminArchiveOrDeleteCategory);

// Products & Upload
router.post('/uploads', uploadImage.single('image'), adminUploadImage);
router.get('/products', adminListProducts);
router.post('/products', adminCreateProduct);
router.put('/products/:id', adminUpdateProduct);
router.patch('/products/:id/archive', adminArchiveProduct);

// Inventory
router.get('/inventory', adminListInventory);
router.post('/inventory/adjust', adminAdjustInventory);
router.get('/inventory/movements', adminListInventoryMovements);

// Orders
router.get('/orders', adminListOrders);
router.get('/orders/:id', adminGetOrderDetails);
router.patch('/orders/:id/status', adminUpdateOrderStatus);

// Users
router.get('/users', adminListUsers);
router.patch('/users/:id', adminUpdateUserAccess);

// Reviews
router.get('/reviews', adminListReviews);
router.patch('/reviews/:id/status', adminUpdateReviewStatus);
router.delete('/reviews/:id', adminDeleteReview);

// Offers
router.get('/offers', adminListOffers);
router.post('/offers', adminCreateOffer);
router.put('/offers/:id', adminUpdateOffer);
router.delete('/offers/:id', adminDeleteOffer);

// Café Settings
router.get('/settings', getCafeSettings);
router.put('/settings', adminUpdateCafeSettings);

export default router;
