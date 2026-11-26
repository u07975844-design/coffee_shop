import pool from '../config/db.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { roundMoney } from '../utils/slugify.js';
import { isValidEmail } from '../validators/authValidator.js';

function safeJsonParse(val, fallback) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export const getCafeSettings = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM cafe_settings WHERE id = 1 LIMIT 1');
  if (rows.length === 0) {
    throw new AppError('Café settings have not been seeded yet.', 404, 'SETTINGS_NOT_FOUND');
  }
  const s = rows[0];
  res.json({
    success: true,
    settings: {
      ...s,
      opening_hours: safeJsonParse(s.opening_hours_json, []),
      social_links: safeJsonParse(s.social_links_json, {}),
    },
  });
});

export const getActiveOffers = asyncHandler(async (req, res) => {
  const [offers] = await pool.query(
    `SELECT id, title, description, coupon_code, discount_type, discount_value, min_order_amount, starts_at, expires_at
     FROM offers
     WHERE is_active = 1
       AND starts_at <= NOW()
       AND expires_at >= NOW()
     ORDER BY expires_at ASC`
  );
  res.json({ success: true, offers });
});

export const validateOfferCode = asyncHandler(async (req, res) => {
  const code = String(req.body?.coupon_code || '').trim().toUpperCase();
  const subtotal = Number(req.body?.subtotal || 0);
  if (!code) {
    throw new AppError('Please enter a promo code.', 400, 'VALIDATION_ERROR');
  }

  const [rows] = await pool.query(
    `SELECT id, title, coupon_code, discount_type, discount_value, min_order_amount
     FROM offers
     WHERE coupon_code = ?
       AND is_active = 1
       AND starts_at <= NOW()
       AND expires_at >= NOW()
     LIMIT 1`,
    [code]
  );

  if (rows.length === 0) {
    throw new AppError('Promo code is invalid or expired.', 404, 'INVALID_COUPON');
  }

  const offer = rows[0];
  if (subtotal < Number(offer.min_order_amount)) {
    throw new AppError(
      `Minimum order of PKR ${Number(offer.min_order_amount).toLocaleString()} required for ${offer.coupon_code}.`,
      400,
      'MIN_ORDER_NOT_MET'
    );
  }

  const discountAmount =
    offer.discount_type === 'percentage'
      ? roundMoney((subtotal * Number(offer.discount_value)) / 100)
      : roundMoney(Math.min(subtotal, Number(offer.discount_value)));

  res.json({
    success: true,
    offer,
    discount_amount: discountAmount,
  });
});

export const getCategories = asyncHandler(async (req, res) => {
  const [categories] = await pool.query(
    `SELECT
       c.id, c.name, c.slug, c.description, c.image_url, c.sort_order,
       COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.is_archived = 0 AND p.is_available = 1
     WHERE c.is_active = 1 AND c.is_archived = 0
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`
  );
  res.json({ success: true, categories });
});

export const getProducts = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const category = String(req.query.category || '').trim();
  const featured = req.query.featured === 'true' || req.query.featured === '1';
  const bestseller = req.query.bestseller === 'true' || req.query.bestseller === '1';
  const sort = String(req.query.sort || 'featured');
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(48, Math.max(1, Number(req.query.limit || 12)));
  const offset = (page - 1) * limit;

  const where = ['p.is_archived = 0', 'c.is_active = 1', 'c.is_archived = 0'];
  const params = [];

  if (search) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR p.tasting_notes LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  if (category && category !== 'all') {
    if (/^\d+$/.test(category)) {
      where.push('c.id = ?');
      params.push(Number(category));
    } else {
      where.push('c.slug = ?');
      params.push(category);
    }
  }

  if (featured) where.push('p.is_featured = 1');
  if (bestseller) where.push('p.is_bestseller = 1');

  const whereSql = where.join(' AND ');

  let orderBySql = 'p.is_featured DESC, p.is_bestseller DESC, p.created_at DESC';
  if (sort === 'price_asc') orderBySql = 'p.base_price ASC, p.name ASC';
  else if (sort === 'price_desc') orderBySql = 'p.base_price DESC, p.name ASC';
  else if (sort === 'rating') orderBySql = 'avg_rating DESC, review_count DESC, p.name ASC';
  else if (sort === 'newest') orderBySql = 'p.created_at DESC';

  const [[countRow]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE ${whereSql}`,
    params
  );

  const [products] = await pool.query(
    `SELECT
       p.id, p.category_id, c.name AS category_name, c.slug AS category_slug,
       p.name, p.slug, p.description, p.tasting_notes, p.origin, p.image_url,
       p.base_price, p.stock_quantity, p.low_stock_threshold,
       p.is_featured, p.is_bestseller, p.is_available,
       COALESCE(ROUND(AVG(CASE WHEN r.status = 'approved' THEN r.rating END), 1), 0) AS avg_rating,
       COUNT(CASE WHEN r.status = 'approved' THEN 1 END) AS review_count
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE ${whereSql}
     GROUP BY p.id
     ORDER BY ${orderBySql}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const total = Number(countRow.total || 0);
  res.json({
    success: true,
    products,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

export const getProductDetails = asyncHandler(async (req, res) => {
  const idOrSlug = String(req.params.idOrSlug || '').trim();
  const isNumeric = /^\d+$/.test(idOrSlug);

  const [rows] = await pool.query(
    `SELECT
       p.*, c.name AS category_name, c.slug AS category_slug,
       COALESCE(ROUND(AVG(CASE WHEN r.status = 'approved' THEN r.rating END), 1), 0) AS avg_rating,
       COUNT(CASE WHEN r.status = 'approved' THEN 1 END) AS review_count
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE ${isNumeric ? 'p.id = ?' : 'p.slug = ?'} AND p.is_archived = 0
     GROUP BY p.id
     LIMIT 1`,
    [isNumeric ? Number(idOrSlug) : idOrSlug]
  );

  if (rows.length === 0) {
    throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  const product = rows[0];

  const [options] = await pool.query(
    `SELECT id, option_group, option_name, price_delta, track_stock, stock_quantity, low_stock_threshold, is_available
     FROM product_options
     WHERE product_id = ? AND is_available = 1
     ORDER BY sort_order ASC, id ASC`,
    [product.id]
  );

  const [reviews] = await pool.query(
    `SELECT id, display_name, rating, comment, is_sample, created_at
     FROM reviews
     WHERE product_id = ? AND status = 'approved'
     ORDER BY created_at DESC`,
    [product.id]
  );

  res.json({
    success: true,
    product: {
      ...product,
      options,
      reviews,
    },
  });
});

export const getApprovedReviews = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const [reviews] = await pool.query(
    `SELECT
       r.id, r.product_id, p.name AS product_name, p.slug AS product_slug,
       r.display_name, r.rating, r.comment, r.is_sample, r.created_at
     FROM reviews r
     INNER JOIN products p ON p.id = r.product_id
     WHERE r.status = 'approved' AND p.is_archived = 0
     ORDER BY r.is_sample ASC, r.created_at DESC
     LIMIT ?`,
    [limit]
  );
  res.json({ success: true, reviews });
});

export const submitContactMessage = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();

  if (name.length < 2) throw new AppError('Please enter your name.', 400, 'VALIDATION_ERROR');
  if (!isValidEmail(email)) throw new AppError('Please enter a valid email address.', 400, 'VALIDATION_ERROR');
  if (subject.length < 3) throw new AppError('Please enter a subject.', 400, 'VALIDATION_ERROR');
  if (message.length < 10) throw new AppError('Message must be at least 10 characters.', 400, 'VALIDATION_ERROR');

  res.status(201).json({
    success: true,
    message: 'Thank you for reaching out. Our roastery team has received your inquiry and will reply shortly.',
  });
});
