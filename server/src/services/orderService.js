import crypto from 'crypto';
import pool from '../config/db.js';
import { AppError } from '../utils/errors.js';
import { roundMoney } from '../utils/slugify.js';
import { CANCELLABLE_BY_CUSTOMER_STATUSES, ORDER_STATUSES } from '../validators/orderValidator.js';

function generateOrderNumber() {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `RR-${datePart}-${randPart}`;
}

export async function createOrder(user, payload) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Sort product IDs deterministically to avoid deadlocks under concurrent orders
    const uniqueProductIds = [...new Set(payload.items.map((item) => item.product_id))].sort((a, b) => a - b);
    const productPlaceholders = uniqueProductIds.map(() => '?').join(',');

    const [productRows] = await connection.query(
      `SELECT id, name, image_url, base_price, stock_quantity, is_available, is_archived
       FROM products
       WHERE id IN (${productPlaceholders})
       FOR UPDATE`,
      uniqueProductIds
    );

    const productMap = new Map(productRows.map((p) => [p.id, p]));

    // Collect and lock all requested product options
    const allOptionIds = [...new Set(payload.items.flatMap((i) => i.option_ids))].sort((a, b) => a - b);
    const optionMap = new Map();
    if (allOptionIds.length > 0) {
      const optPlaceholders = allOptionIds.map(() => '?').join(',');
      const [optRows] = await connection.query(
        `SELECT id, product_id, option_group, option_name, price_delta, track_stock, stock_quantity, is_available
         FROM product_options
         WHERE id IN (${optPlaceholders})
         FOR UPDATE`,
        allOptionIds
      );
      for (const opt of optRows) {
        optionMap.set(opt.id, opt);
      }
    }

    let subtotal = 0;
    const preparedItems = [];

    // Aggregate quantities per product and per tracked option before deducting
    const productDemand = new Map();
    const optionDemand = new Map();

    for (const reqItem of payload.items) {
      const product = productMap.get(reqItem.product_id);
      if (!product || product.is_archived || !product.is_available) {
        throw new AppError('One or more selected products are currently unavailable.', 400, 'PRODUCT_UNAVAILABLE');
      }

      const nextProdQty = (productDemand.get(product.id) || 0) + reqItem.quantity;
      if (nextProdQty > product.stock_quantity) {
        throw new AppError(
          `Insufficient stock for "${product.name}". Only ${product.stock_quantity} remaining.`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
      productDemand.set(product.id, nextProdQty);

      let optionsPriceDelta = 0;
      const selectedOptions = [];
      const selectedOptionIds = [];

      for (const optId of reqItem.option_ids) {
        const opt = optionMap.get(optId);
        if (!opt || opt.product_id !== product.id || !opt.is_available) {
          throw new AppError(`Selected option is invalid or unavailable for "${product.name}".`, 400, 'OPTION_UNAVAILABLE');
        }
        if (opt.track_stock) {
          const nextOptQty = (optionDemand.get(opt.id) || 0) + reqItem.quantity;
          if (nextOptQty > opt.stock_quantity) {
            throw new AppError(
              `Insufficient stock for "${product.name} — ${opt.option_name}". Only ${opt.stock_quantity} remaining.`,
              400,
              'INSUFFICIENT_STOCK'
            );
          }
          optionDemand.set(opt.id, nextOptQty);
        }
        optionsPriceDelta = roundMoney(optionsPriceDelta + Number(opt.price_delta));
        selectedOptions.push({
          id: opt.id,
          group: opt.option_group,
          name: opt.option_name,
          price_delta: Number(opt.price_delta),
        });
        selectedOptionIds.push(opt.id);
      }

      const unitPrice = Number(product.base_price);
      const effectiveUnit = roundMoney(unitPrice + optionsPriceDelta);
      const lineTotal = roundMoney(effectiveUnit * reqItem.quantity);
      subtotal = roundMoney(subtotal + lineTotal);

      preparedItems.push({
        product_id: product.id,
        product_name_snapshot: product.name,
        product_image_snapshot: product.image_url,
        unit_price_snapshot: unitPrice,
        options_price_delta: optionsPriceDelta,
        selected_options_json: JSON.stringify(selectedOptions),
        selected_option_ids_json: JSON.stringify(selectedOptionIds),
        quantity: reqItem.quantity,
        line_total: lineTotal,
      });
    }

    // Validate optional coupon code server-side
    let offerId = null;
    let couponSnapshot = null;
    let discountAmount = 0;

    if (payload.coupon_code) {
      const [offerRows] = await connection.query(
        `SELECT id, title, coupon_code, discount_type, discount_value, min_order_amount, starts_at, expires_at, is_active
         FROM offers
         WHERE coupon_code = ?
           AND is_active = 1
           AND starts_at <= NOW()
           AND expires_at >= NOW()
         LIMIT 1`,
        [payload.coupon_code]
      );

      if (offerRows.length === 0) {
        throw new AppError('Promo code is invalid, inactive, or expired.', 400, 'INVALID_COUPON');
      }

      const offer = offerRows[0];
      if (subtotal < Number(offer.min_order_amount)) {
        throw new AppError(
          `Promo code ${offer.coupon_code} requires a minimum order of PKR ${Number(offer.min_order_amount).toLocaleString()}.`,
          400,
          'MIN_ORDER_NOT_MET'
        );
      }

      offerId = offer.id;
      couponSnapshot = offer.coupon_code;
      if (offer.discount_type === 'percentage') {
        discountAmount = roundMoney((subtotal * Number(offer.discount_value)) / 100);
      } else {
        discountAmount = roundMoney(Math.min(subtotal, Number(offer.discount_value)));
      }
    }

    const totalAmount = roundMoney(Math.max(0, subtotal - discountAmount));
    const orderNumber = generateOrderNumber();

    const [orderInsert] = await connection.query(
      `INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        fulfillment_type, delivery_address, order_notes, payment_method,
        offer_id, coupon_code_snapshot, subtotal, discount_amount, total_amount,
        status, stock_restored
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 0)`,
      [
        orderNumber,
        user.id,
        payload.customer_name,
        user.email,
        payload.customer_phone,
        payload.fulfillment_type,
        payload.delivery_address,
        payload.order_notes,
        payload.payment_method,
        offerId,
        couponSnapshot,
        subtotal,
        discountAmount,
        totalAmount,
      ]
    );

    const orderId = orderInsert.insertId;

    for (const item of preparedItems) {
      await connection.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name_snapshot, product_image_snapshot,
          unit_price_snapshot, options_price_delta, selected_options_json,
          selected_option_ids_json, quantity, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.product_name_snapshot,
          item.product_image_snapshot,
          item.unit_price_snapshot,
          item.options_price_delta,
          item.selected_options_json,
          item.selected_option_ids_json,
          item.quantity,
          item.line_total,
        ]
      );
    }

    // Deduct product stock and log movements
    for (const [productId, qty] of productDemand.entries()) {
      const product = productMap.get(productId);
      const prevStock = Number(product.stock_quantity);
      const newStock = prevStock - qty;
      if (newStock < 0) {
        throw new AppError(`Insufficient stock for "${product.name}".`, 400, 'INSUFFICIENT_STOCK');
      }

      await connection.query(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [newStock, productId]
      );

      await connection.query(
        `INSERT INTO inventory_movements (
          product_id, option_id, movement_type, quantity_change,
          previous_stock, new_stock, reason, order_id, created_by
        ) VALUES (?, NULL, 'Order Deduction', ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          -qty,
          prevStock,
          newStock,
          `Order ${orderNumber} placed`,
          orderId,
          user.id,
        ]
      );
    }

    // Deduct separately tracked option stock
    for (const [optionId, qty] of optionDemand.entries()) {
      const opt = optionMap.get(optionId);
      const prevStock = Number(opt.stock_quantity);
      const newStock = prevStock - qty;
      if (newStock < 0) {
        throw new AppError(`Insufficient stock for option "${opt.option_name}".`, 400, 'INSUFFICIENT_STOCK');
      }

      await connection.query(
        'UPDATE product_options SET stock_quantity = ? WHERE id = ?',
        [newStock, optionId]
      );

      await connection.query(
        `INSERT INTO inventory_movements (
          product_id, option_id, movement_type, quantity_change,
          previous_stock, new_stock, reason, order_id, created_by
        ) VALUES (?, ?, 'Order Deduction', ?, ?, ?, ?, ?, ?)`,
        [
          opt.product_id,
          optionId,
          -qty,
          prevStock,
          newStock,
          `Order ${orderNumber} variant "${opt.option_name}"`,
          orderId,
          user.id,
        ]
      );
    }

    // Record initial status history
    await connection.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES (?, NULL, 'Pending', ?, 'Order submitted by customer')`,
      [orderId, user.id]
    );

    await connection.commit();

    return { id: orderId, order_number: orderNumber, total_amount: totalAmount, status: 'Pending' };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function cancelOrder({ orderId, actorUser, isAdmin, reason }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? FOR UPDATE',
      [orderId]
    );
    if (orders.length === 0) {
      throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
    }

    const order = orders[0];

    if (!isAdmin && order.user_id !== actorUser.id) {
      throw new AppError('You do not have permission to cancel this order.', 403, 'FORBIDDEN');
    }

    if (order.status === 'Cancelled') {
      throw new AppError('This order is already cancelled.', 400, 'ALREADY_CANCELLED');
    }

    if (order.status === 'Delivered') {
      throw new AppError('Delivered orders cannot be cancelled.', 400, 'CANNOT_CANCEL_DELIVERED');
    }

    if (!isAdmin && !CANCELLABLE_BY_CUSTOMER_STATUSES.includes(order.status)) {
      throw new AppError(
        `Order cannot be cancelled once it is "${order.status}". Please contact the café directly.`,
        400,
        'CANCELLATION_WINDOW_CLOSED'
      );
    }

    // Idempotency guard: restore stock at most once per order
    if (!order.stock_restored) {
      const [items] = await connection.query(
        'SELECT product_id, quantity, selected_option_ids_json FROM order_items WHERE order_id = ?',
        [orderId]
      );

      const productRestore = new Map();
      const optionRestore = new Map();

      for (const item of items) {
        productRestore.set(item.product_id, (productRestore.get(item.product_id) || 0) + Number(item.quantity));
        let optionIds = [];
        try {
          optionIds = typeof item.selected_option_ids_json === 'string'
            ? JSON.parse(item.selected_option_ids_json)
            : Array.isArray(item.selected_option_ids_json)
            ? item.selected_option_ids_json
            : [];
        } catch {
          optionIds = [];
        }
        for (const optId of optionIds) {
          optionRestore.set(optId, (optionRestore.get(optId) || 0) + Number(item.quantity));
        }
      }

      const prodIds = [...productRestore.keys()].sort((a, b) => a - b);
      if (prodIds.length > 0) {
        const placeholders = prodIds.map(() => '?').join(',');
        const [lockedProducts] = await connection.query(
          `SELECT id, stock_quantity FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
          prodIds
        );

        for (const prod of lockedProducts) {
          const restoreQty = productRestore.get(prod.id) || 0;
          const prevStock = Number(prod.stock_quantity);
          const newStock = prevStock + restoreQty;

          await connection.query(
            'UPDATE products SET stock_quantity = ? WHERE id = ?',
            [newStock, prod.id]
          );

          await connection.query(
            `INSERT INTO inventory_movements (
              product_id, option_id, movement_type, quantity_change,
              previous_stock, new_stock, reason, order_id, created_by
            ) VALUES (?, NULL, 'Order Cancellation Restock', ?, ?, ?, ?, ?, ?)`,
            [
              prod.id,
              restoreQty,
              prevStock,
              newStock,
              reason || `Order ${order.order_number} cancelled`,
              orderId,
              actorUser.id,
            ]
          );
        }
      }

      const optIds = [...optionRestore.keys()].sort((a, b) => a - b);
      if (optIds.length > 0) {
        const placeholders = optIds.map(() => '?').join(',');
        const [lockedOpts] = await connection.query(
          `SELECT id, product_id, option_name, track_stock, stock_quantity
           FROM product_options
           WHERE id IN (${placeholders}) AND track_stock = 1
           FOR UPDATE`,
          optIds
        );

        for (const opt of lockedOpts) {
          const restoreQty = optionRestore.get(opt.id) || 0;
          const prevStock = Number(opt.stock_quantity);
          const newStock = prevStock + restoreQty;

          await connection.query(
            'UPDATE product_options SET stock_quantity = ? WHERE id = ?',
            [newStock, opt.id]
          );

          await connection.query(
            `INSERT INTO inventory_movements (
              product_id, option_id, movement_type, quantity_change,
              previous_stock, new_stock, reason, order_id, created_by
            ) VALUES (?, ?, 'Order Cancellation Restock', ?, ?, ?, ?, ?, ?)`,
            [
              opt.product_id,
              opt.id,
              restoreQty,
              prevStock,
              newStock,
              reason || `Order ${order.order_number} cancelled (${opt.option_name})`,
              orderId,
              actorUser.id,
            ]
          );
        }
      }
    }

    await connection.query(
      'UPDATE orders SET status = "Cancelled", stock_restored = 1 WHERE id = ?',
      [orderId]
    );

    await connection.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES (?, ?, 'Cancelled', ?, ?)`,
      [
        orderId,
        order.status,
        actorUser.id,
        reason || (isAdmin ? 'Cancelled by administrator' : 'Cancelled by customer'),
      ]
    );

    await connection.commit();
    return { id: orderId, status: 'Cancelled', stock_restored: true };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function updateOrderStatus({ orderId, newStatus, adminUser, note }) {
  if (!ORDER_STATUSES.includes(newStatus)) {
    throw new AppError('Invalid order status specified.', 400, 'INVALID_STATUS');
  }

  if (newStatus === 'Cancelled') {
    return cancelOrder({
      orderId,
      actorUser: adminUser,
      isAdmin: true,
      reason: note || 'Cancelled via admin order management',
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      'SELECT id, status FROM orders WHERE id = ? FOR UPDATE',
      [orderId]
    );

    if (orders.length === 0) {
      throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
    }

    const currentStatus = orders[0].status;
    if (currentStatus === 'Cancelled') {
      throw new AppError('Cancelled orders cannot be reopened.', 400, 'INVALID_TRANSITION');
    }
    if (currentStatus === newStatus) {
      await connection.commit();
      return { id: orderId, status: newStatus };
    }

    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [newStatus, orderId]);
    await connection.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES (?, ?, ?, ?, ?)`,
      [orderId, currentStatus, newStatus, adminUser.id, note || `Status updated to ${newStatus}`]
    );

    await connection.commit();
    return { id: orderId, status: newStatus };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
