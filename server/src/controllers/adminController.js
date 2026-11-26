import pool from '../config/db.js';
import { getDashboardStats } from '../services/analyticsService.js';
import { adjustInventory } from '../services/inventoryService.js';
import { updateOrderStatus } from '../services/orderService.js';
import { AppError, asyncHandler } from '../utils/errors.js';
import { slugify } from '../utils/slugify.js';
import {
  validateCategoryInput,
  validateInventoryAdjustmentInput,
  validateOfferInput,
  validateProductInput,
} from '../validators/adminValidator.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const days = Number(req.query.days || 7);
  const data = await getDashboardStats(days);
  res.json({ success: true, ...data });
});

// --- CATEGORIES ---
export const adminListCategories = asyncHandler(async (req, res) => {
  const includeArchived = req.query.archived === 'true';
  const [categories] = await pool.query(
    `SELECT c.*, COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.is_archived = 0
     ${includeArchived ? '' : 'WHERE c.is_archived = 0'}
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`
  );
  res.json({ success: true, categories });
});

export const adminCreateCategory = asyncHandler(async (req, res) => {
  const data = validateCategoryInput(req.body);
  const baseSlug = slugify(data.name) || `category-${Date.now()}`;
  const [dup] = await pool.query('SELECT id FROM categories WHERE slug = ? LIMIT 1', [baseSlug]);
  const slug = dup.length > 0 ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

  const [result] = await pool.query(
    `INSERT INTO categories (name, slug, description, image_url, sort_order, is_active, is_archived)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [data.name, slug, data.description, data.image_url, data.sort_order, data.is_active]
  );

  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ? LIMIT 1', [result.insertId]);
  res.status(201).json({ success: true, message: 'Category created.', category: rows[0] });
});

export const adminUpdateCategory = asyncHandler(async (req, res) => {
  const categoryId = Number(req.params.id);
  const data = validateCategoryInput(req.body);

  const [existing] = await pool.query('SELECT id FROM categories WHERE id = ? LIMIT 1', [categoryId]);
  if (existing.length === 0) throw new AppError('Category not found.', 404, 'CATEGORY_NOT_FOUND');

  await pool.query(
    `UPDATE categories
     SET name = ?, description = ?, image_url = ?, sort_order = ?, is_active = ?
     WHERE id = ?`,
    [data.name, data.description, data.image_url, data.sort_order, data.is_active, categoryId]
  );

  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ? LIMIT 1', [categoryId]);
  res.json({ success: true, message: 'Category updated.', category: rows[0] });
});

export const adminArchiveOrDeleteCategory = asyncHandler(async (req, res) => {
  const categoryId = Number(req.params.id);
  const [products] = await pool.query('SELECT COUNT(*) AS count FROM products WHERE category_id = ?', [categoryId]);

  if (Number(products[0].count) > 0) {
    await pool.query('UPDATE categories SET is_archived = 1, is_active = 0 WHERE id = ?', [categoryId]);
    return res.json({
      success: true,
      archived: true,
      message: 'Category archived safely because it contains existing menu products.',
    });
  }

  await pool.query('DELETE FROM categories WHERE id = ?', [categoryId]);
  res.json({ success: true, archived: false, message: 'Category deleted.' });
});

// --- PRODUCTS & IMAGE UPLOAD ---
export const adminUploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please attach an image file (JPG, PNG, or WebP).', 400, 'NO_FILE');
  }
  const publicPath = `/uploads/${req.file.filename}`;
  res.status(201).json({
    success: true,
    message: 'Image uploaded successfully.',
    image_url: publicPath,
  });
});

export const adminListProducts = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const includeArchived = req.query.archived === 'true';

  const where = [];
  const params = [];

  if (!includeArchived) {
    where.push('p.is_archived = 0');
  }
  if (search) {
    where.push('(p.name LIKE ? OR c.name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [products] = await pool.query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     ${whereSql}
     ORDER BY p.is_archived ASC, p.created_at DESC`,
    params
  );

  const [allOptions] = await pool.query(
    'SELECT * FROM product_options ORDER BY product_id ASC, sort_order ASC, id ASC'
  );
  const optMap = new Map();
  for (const opt of allOptions) {
    if (!optMap.has(opt.product_id)) optMap.set(opt.product_id, []);
    optMap.get(opt.product_id).push(opt);
  }

  res.json({
    success: true,
    products: products.map((p) => ({
      ...p,
      options: optMap.get(p.id) || [],
    })),
  });
});

export const adminCreateProduct = asyncHandler(async (req, res) => {
  const data = validateProductInput(req.body, true);
  const baseSlug = slugify(data.name) || `product-${Date.now()}`;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [dup] = await connection.query('SELECT id FROM products WHERE slug = ? LIMIT 1', [baseSlug]);
    const slug = dup.length > 0 ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const [insert] = await connection.query(
      `INSERT INTO products (
        category_id, name, slug, description, tasting_notes, origin, image_url,
        base_price, stock_quantity, low_stock_threshold,
        is_featured, is_bestseller, is_available, is_archived
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        data.category_id,
        data.name,
        slug,
        data.description,
        data.tasting_notes,
        data.origin,
        data.image_url,
        data.base_price,
        data.stock_quantity,
        data.low_stock_threshold,
        data.is_featured,
        data.is_bestseller,
        data.is_available,
      ]
    );

    const productId = insert.insertId;

    if (data.options?.length) {
      for (const opt of data.options) {
        await connection.query(
          `INSERT INTO product_options (
            product_id, option_group, option_name, price_delta,
            track_stock, stock_quantity, low_stock_threshold, is_available, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            productId,
            opt.option_group,
            opt.option_name,
            opt.price_delta,
            opt.track_stock,
            opt.stock_quantity,
            opt.low_stock_threshold,
            opt.is_available,
            opt.sort_order,
          ]
        );
      }
    }

    if (data.stock_quantity > 0) {
      await connection.query(
        `INSERT INTO inventory_movements (
          product_id, movement_type, quantity_change, previous_stock, new_stock, reason, created_by
        ) VALUES (?, 'Stock Added', ?, 0, ?, 'Initial product stock on creation', ?)`,
        [productId, data.stock_quantity, data.stock_quantity, req.user.id]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Product created.', id: productId });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

export const adminUpdateProduct = asyncHandler(async (req, res) => {
  const productId = Number(req.params.id);
  const data = validateProductInput(req.body, false);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query('SELECT id FROM products WHERE id = ? LIMIT 1', [productId]);
    if (existing.length === 0) throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');

    await connection.query(
      `UPDATE products
       SET category_id = ?, name = ?, description = ?, tasting_notes = ?, origin = ?,
           image_url = ?, base_price = ?, low_stock_threshold = ?,
           is_featured = ?, is_bestseller = ?, is_available = ?
       WHERE id = ?`,
      [
        data.category_id,
        data.name,
        data.description,
        data.tasting_notes,
        data.origin,
        data.image_url,
        data.base_price,
        data.low_stock_threshold,
        data.is_featured,
        data.is_bestseller,
        data.is_available,
        productId,
      ]
    );

    if (Array.isArray(data.options)) {
      const keepIds = [];
      for (const opt of data.options) {
        if (opt.id) {
          keepIds.push(opt.id);
          await connection.query(
            `UPDATE product_options
             SET option_group = ?, option_name = ?, price_delta = ?,
                 track_stock = ?, stock_quantity = ?, low_stock_threshold = ?,
                 is_available = ?, sort_order = ?
             WHERE id = ? AND product_id = ?`,
            [
              opt.option_group,
              opt.option_name,
              opt.price_delta,
              opt.track_stock,
              opt.stock_quantity,
              opt.low_stock_threshold,
              opt.is_available,
              opt.sort_order,
              opt.id,
              productId,
            ]
          );
        } else {
          const [optIns] = await connection.query(
            `INSERT INTO product_options (
              product_id, option_group, option_name, price_delta,
              track_stock, stock_quantity, low_stock_threshold, is_available, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              productId,
              opt.option_group,
              opt.option_name,
              opt.price_delta,
              opt.track_stock,
              opt.stock_quantity,
              opt.low_stock_threshold,
              opt.is_available,
              opt.sort_order,
            ]
          );
          keepIds.push(optIns.insertId);
        }
      }

      if (keepIds.length > 0) {
        const placeholders = keepIds.map(() => '?').join(',');
        await connection.query(
          `DELETE FROM product_options WHERE product_id = ? AND id NOT IN (${placeholders})`,
          [productId, ...keepIds]
        );
      } else {
        await connection.query('DELETE FROM product_options WHERE product_id = ?', [productId]);
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Product updated.' });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

export const adminArchiveProduct = asyncHandler(async (req, res) => {
  const productId = Number(req.params.id);
  const archived = req.body?.is_archived === undefined ? 1 : req.body.is_archived ? 1 : 0;

  await pool.query(
    'UPDATE products SET is_archived = ?, is_available = ? WHERE id = ?',
    [archived, archived ? 0 : 1, productId]
  );

  res.json({
    success: true,
    message: archived
      ? 'Product archived. Historical order records remain fully preserved.'
      : 'Product restored to menu.',
  });
});

// --- INVENTORY ---
export const adminListInventory = asyncHandler(async (req, res) => {
  const filter = String(req.query.filter || 'all');

  let havingClause = '';
  if (filter === 'low') havingClause = 'AND p.stock_quantity > 0 AND p.stock_quantity <= p.low_stock_threshold';
  else if (filter === 'out') havingClause = 'AND p.stock_quantity = 0';

  const [products] = await pool.query(
    `SELECT
       p.id, p.name, c.name AS category_name, p.stock_quantity,
       p.low_stock_threshold, p.is_available, p.base_price
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE p.is_archived = 0 ${havingClause}
     ORDER BY p.stock_quantity ASC, p.name ASC`
  );

  const [variants] = await pool.query(
    `SELECT
       po.id AS option_id, po.product_id, p.name AS product_name,
       po.option_group, po.option_name, po.stock_quantity, po.low_stock_threshold
     FROM product_options po
     INNER JOIN products p ON p.id = po.product_id
     WHERE p.is_archived = 0 AND po.track_stock = 1
     ORDER BY po.stock_quantity ASC`
  );

  res.json({ success: true, products, variants });
});

export const adminAdjustInventory = asyncHandler(async (req, res) => {
  const { product_id, option_id, action, quantity, reason } = validateInventoryAdjustmentInput(req.body);
  const result = await adjustInventory({
    productId: product_id,
    optionId: option_id,
    action,
    quantity,
    reason,
    adminUserId: req.user.id,
  });
  res.json({ success: true, message: 'Inventory updated and logged.', adjustment: result });
});

export const adminListInventoryMovements = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 40)));
  const productId = req.query.product_id ? Number(req.query.product_id) : null;

  const whereSql = productId ? 'WHERE im.product_id = ?' : '';
  const params = productId ? [productId, limit] : [limit];

  const [movements] = await pool.query(
    `SELECT
       im.*, p.name AS product_name, po.option_name,
       o.order_number, u.name AS actor_name
     FROM inventory_movements im
     INNER JOIN products p ON p.id = im.product_id
     LEFT JOIN product_options po ON po.id = im.option_id
     LEFT JOIN orders o ON o.id = im.order_id
     LEFT JOIN users u ON u.id = im.created_by
     ${whereSql}
     ORDER BY im.created_at DESC, im.id DESC
     LIMIT ?`,
    params
  );

  res.json({ success: true, movements });
});

// --- ORDERS ---
export const adminListOrders = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 15)));
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];

  if (search) {
    where.push('(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ? OR o.customer_phone LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (status && status !== 'all') {
    where.push('o.status = ?');
    params.push(status);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[countRow]] = await pool.query(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`, params);

  const [orders] = await pool.query(
    `SELECT
       o.*, COUNT(oi.id) AS item_count, COALESCE(SUM(oi.quantity), 0) AS total_units
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     ${whereSql}
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    orders,
    pagination: {
      page,
      limit,
      total: Number(countRow.total || 0),
      total_pages: Math.max(1, Math.ceil(Number(countRow.total || 0) / limit)),
    },
  });
});

export const adminGetOrderDetails = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId]);
  if (orders.length === 0) throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');

  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [orderId]);
  const [history] = await pool.query(
    `SELECT osh.*, u.name AS changed_by_name
     FROM order_status_history osh
     LEFT JOIN users u ON u.id = osh.changed_by
     WHERE osh.order_id = ?
     ORDER BY osh.created_at ASC, osh.id ASC`,
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

export const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const newStatus = String(req.body?.status || '').trim();
  const note = req.body?.note ? String(req.body.note).trim().slice(0, 255) : null;

  const result = await updateOrderStatus({
    orderId,
    newStatus,
    adminUser: req.user,
    note,
  });

  res.json({
    success: true,
    message: `Order status updated to "${result.status}".`,
    order: result,
  });
});

// --- USERS & ADMIN PROTECTION ---
export const adminListUsers = asyncHandler(async (req, res) => {
  const [users] = await pool.query(
    `SELECT
       u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at,
       COUNT(o.id) AS order_count,
       COALESCE(SUM(CASE WHEN o.status = 'Delivered' THEN o.total_amount ELSE 0 END), 0) AS total_spent
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     GROUP BY u.id
     ORDER BY u.role DESC, u.created_at DESC`
  );

  const customers = users.filter((u) => u.role === 'customer');
  const admins = users.filter((u) => u.role === 'admin');

  res.json({
    success: true,
    summary: {
      total_customers: customers.length,
      total_admins: admins.length,
      active_admins: admins.filter((a) => a.is_active).length,
    },
    customers,
    admins,
  });
});

export const adminUpdateUserAccess = asyncHandler(async (req, res) => {
  const targetUserId = Number(req.params.id);
  const nextRole = req.body?.role;
  const nextActive = req.body?.is_active;

  if (nextRole !== undefined && !['customer', 'admin'].includes(nextRole)) {
    throw new AppError('Invalid role specified.', 400, 'VALIDATION_ERROR');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT id, role, is_active FROM users WHERE id = ? FOR UPDATE',
      [targetUserId]
    );
    if (rows.length === 0) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

    const target = rows[0];
    const effectiveRole = nextRole !== undefined ? nextRole : target.role;
    const effectiveActive = nextActive !== undefined ? (nextActive ? 1 : 0) : target.is_active;

    const wasActiveAdmin = target.role === 'admin' && Boolean(target.is_active);
    const remainsActiveAdmin = effectiveRole === 'admin' && Boolean(effectiveActive);

    if (wasActiveAdmin && !remainsActiveAdmin) {
      const [[countRow]] = await connection.query(
        'SELECT COUNT(*) AS count FROM users WHERE role = "admin" AND is_active = 1 FOR UPDATE'
      );
      if (Number(countRow.count) <= 1) {
        throw new AppError(
          'The last active administrator account cannot be demoted or deactivated.',
          400,
          'LAST_ADMIN_PROTECTED'
        );
      }
    }

    await connection.query(
      'UPDATE users SET role = ?, is_active = ? WHERE id = ?',
      [effectiveRole, effectiveActive, targetUserId]
    );

    await connection.commit();
    res.json({ success: true, message: 'User access updated.' });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

// --- REVIEWS MODERATION ---
export const adminListReviews = asyncHandler(async (req, res) => {
  const status = String(req.query.status || 'all');
  const whereSql = status !== 'all' ? 'WHERE r.status = ?' : '';
  const params = status !== 'all' ? [status] : [];

  const [reviews] = await pool.query(
    `SELECT
       r.*, p.name AS product_name, u.email AS reviewer_email
     FROM reviews r
     INNER JOIN products p ON p.id = r.product_id
     INNER JOIN users u ON u.id = r.user_id
     ${whereSql}
     ORDER BY r.created_at DESC`,
    params
  );
  res.json({ success: true, reviews });
});

export const adminUpdateReviewStatus = asyncHandler(async (req, res) => {
  const reviewId = Number(req.params.id);
  const status = String(req.body?.status || '');
  if (!['pending', 'approved', 'hidden'].includes(status)) {
    throw new AppError('Review status must be pending, approved, or hidden.', 400, 'VALIDATION_ERROR');
  }

  await pool.query('UPDATE reviews SET status = ? WHERE id = ?', [status, reviewId]);
  res.json({ success: true, message: `Review marked as ${status}.` });
});

export const adminDeleteReview = asyncHandler(async (req, res) => {
  const reviewId = Number(req.params.id);
  await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
  res.json({ success: true, message: 'Review deleted.' });
});

// --- OFFERS ---
export const adminListOffers = asyncHandler(async (req, res) => {
  const [offers] = await pool.query('SELECT * FROM offers ORDER BY created_at DESC');
  res.json({ success: true, offers });
});

export const adminCreateOffer = asyncHandler(async (req, res) => {
  const data = validateOfferInput(req.body);
  const [result] = await pool.query(
    `INSERT INTO offers (
      title, description, coupon_code, discount_type, discount_value,
      min_order_amount, starts_at, expires_at, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.description,
      data.coupon_code,
      data.discount_type,
      data.discount_value,
      data.min_order_amount,
      data.starts_at,
      data.expires_at,
      data.is_active,
    ]
  );
  const [rows] = await pool.query('SELECT * FROM offers WHERE id = ? LIMIT 1', [result.insertId]);
  res.status(201).json({ success: true, message: 'Offer created.', offer: rows[0] });
});

export const adminUpdateOffer = asyncHandler(async (req, res) => {
  const offerId = Number(req.params.id);
  const data = validateOfferInput(req.body);
  await pool.query(
    `UPDATE offers
     SET title = ?, description = ?, coupon_code = ?, discount_type = ?,
         discount_value = ?, min_order_amount = ?, starts_at = ?, expires_at = ?, is_active = ?
     WHERE id = ?`,
    [
      data.title,
      data.description,
      data.coupon_code,
      data.discount_type,
      data.discount_value,
      data.min_order_amount,
      data.starts_at,
      data.expires_at,
      data.is_active,
      offerId,
    ]
  );
  const [rows] = await pool.query('SELECT * FROM offers WHERE id = ? LIMIT 1', [offerId]);
  res.json({ success: true, message: 'Offer updated.', offer: rows[0] });
});

export const adminDeleteOffer = asyncHandler(async (req, res) => {
  const offerId = Number(req.params.id);
  await pool.query('DELETE FROM offers WHERE id = ?', [offerId]);
  res.json({ success: true, message: 'Offer deleted.' });
});

// --- CAFÉ SETTINGS ---
export const adminUpdateCafeSettings = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const shopName = String(b.shop_name || '').trim();
  if (shopName.length < 2) {
    throw new AppError('Coffee shop name is required.', 400, 'VALIDATION_ERROR');
  }

  await pool.query(
    `UPDATE cafe_settings
     SET shop_name = ?,
         tagline = ?,
         logo_url = ?,
         established_year = ?,
         about_title = ?,
         about_story = ?,
         contact_phone = ?,
         contact_email = ?,
         address = ?,
         opening_hours_json = ?,
         social_links_json = ?,
         hero_title = ?,
         hero_subtitle = ?,
         hero_image_url = ?,
         footer_note = ?
     WHERE id = 1`,
    [
      shopName,
      String(b.tagline || '').trim(),
      b.logo_url || null,
      String(b.established_year || 'Est. 2019').trim(),
      String(b.about_title || '').trim(),
      String(b.about_story || '').trim(),
      String(b.contact_phone || '').trim(),
      String(b.contact_email || '').trim(),
      String(b.address || '').trim(),
      JSON.stringify(Array.isArray(b.opening_hours) ? b.opening_hours : []),
      JSON.stringify(b.social_links && typeof b.social_links === 'object' ? b.social_links : {}),
      String(b.hero_title || '').trim(),
      String(b.hero_subtitle || '').trim(),
      b.hero_image_url || null,
      String(b.footer_note || '').trim(),
    ]
  );

  res.json({ success: true, message: 'Café settings updated.' });
});
