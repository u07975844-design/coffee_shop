import pool from '../config/db.js';
import { cancelOrder, createOrder } from '../services/orderService.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { validateCreateOrderInput, validateReviewInput } from '../validators/orderValidator.js';

export const placeOrder = asyncHandler(async (req, res) => {
  const payload = validateCreateOrderInput(req.body);
  const created = await createOrder(req.user, payload);

  res.status(201).json({
    success: true,
    message: `Order ${created.order_number} placed successfully.`,
    order: created,
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(30, Math.max(1, Number(req.query.limit || 10)));
  const offset = (page - 1) * limit;

  const [[countRow]] = await pool.query(
    'SELECT COUNT(*) AS total FROM orders WHERE user_id = ?',
    [req.user.id]
  );

  const [orders] = await pool.query(
    `SELECT
       o.id, o.order_number, o.fulfillment_type, o.payment_method,
       o.subtotal, o.discount_amount, o.total_amount, o.status, o.created_at,
       COUNT(oi.id) AS item_count,
       COALESCE(SUM(oi.quantity), 0) AS total_units
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [req.user.id, limit, offset]
  );

  const total = Number(countRow.total || 0);
  res.json({
    success: true,
    orders,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

export const getMyOrderDetails = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new AppError('Invalid order ID.', 400, 'VALIDATION_ERROR');
  }

  const [orders] = await pool.query(
    'SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1',
    [orderId, req.user.id]
  );
  if (orders.length === 0) {
    throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
  }

  const [items] = await pool.query(
    `SELECT
       oi.*,
       p.slug AS product_slug,
       r.id AS review_id,
       r.rating AS review_rating,
       r.status AS review_status
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     LEFT JOIN reviews r ON r.order_item_id = oi.id
     WHERE oi.order_id = ?
     ORDER BY oi.id ASC`,
    [orderId]
  );

  const [history] = await pool.query(
    `SELECT id, from_status, to_status, note, created_at
     FROM order_status_history
     WHERE order_id = ?
     ORDER BY created_at ASC, id ASC`,
    [orderId]
  );

  res.json({
    success: true,
    order: {
      ...orders[0],
      items: items.map((item) => ({
        ...item,
        selected_options:
          typeof item.selected_options_json === 'string'
            ? JSON.parse(item.selected_options_json)
            : item.selected_options_json || [],
      })),
      status_history: history,
    },
  });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new AppError('Invalid order ID.', 400, 'VALIDATION_ERROR');
  }
  const reason = req.body?.reason ? String(req.body.reason).trim().slice(0, 255) : 'Cancelled by customer';

  const result = await cancelOrder({
    orderId,
    actorUser: req.user,
    isAdmin: false,
    reason,
  });

  res.json({
    success: true,
    message: 'Order cancelled and inventory restored.',
    order: result,
  });
});

export const submitOrderItemReview = asyncHandler(async (req, res) => {
  const { order_item_id, rating, comment } = validateReviewInput(req.body);

  const [rows] = await pool.query(
    `SELECT
       oi.id AS order_item_id,
       oi.product_id,
       o.user_id,
       o.status AS order_status
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE oi.id = ?
     LIMIT 1`,
    [order_item_id]
  );

  if (rows.length === 0) {
    throw new AppError('Order item not found.', 404, 'ORDER_ITEM_NOT_FOUND');
  }

  const item = rows[0];
  if (item.user_id !== req.user.id) {
    throw new AppError('You can only review items from your own orders.', 403, 'FORBIDDEN');
  }

  if (item.order_status !== 'Delivered') {
    throw new AppError(
      'Reviews can only be submitted after your order has been fulfilled (Delivered).',
      400,
      'ORDER_NOT_FULFILLED'
    );
  }

  const [existing] = await pool.query(
    'SELECT id FROM reviews WHERE order_item_id = ? LIMIT 1',
    [order_item_id]
  );
  if (existing.length > 0) {
    throw new AppError('You have already submitted a review for this purchased item.', 409, 'DUPLICATE_REVIEW');
  }

  const [insert] = await pool.query(
    `INSERT INTO reviews (
      user_id, product_id, order_item_id, display_name, rating, comment, status, is_sample
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0)`,
    [req.user.id, item.product_id, order_item_id, req.user.name, rating, comment]
  );

  res.status(201).json({
    success: true,
    message: 'Review submitted! It will appear publicly once approved by our team.',
    review_id: insert.insertId,
  });
});
