import pool from '../config/db.js';
import { AppError } from '../utils/errors.js';

export async function adjustInventory({ productId, optionId, action, quantity, reason, adminUserId }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (optionId) {
      const [optRows] = await connection.query(
        `SELECT id, product_id, option_name, track_stock, stock_quantity
         FROM product_options
         WHERE id = ? AND product_id = ?
         FOR UPDATE`,
        [optionId, productId]
      );
      if (optRows.length === 0) {
        throw new AppError('Product option not found.', 404, 'OPTION_NOT_FOUND');
      }
      const option = optRows[0];
      if (!option.track_stock) {
        throw new AppError('Selected option does not use separate stock tracking.', 400, 'OPTION_NOT_STOCKED');
      }

      const prevStock = Number(option.stock_quantity);
      let newStock = prevStock;
      if (action === 'add') newStock = prevStock + quantity;
      if (action === 'reduce') newStock = prevStock - quantity;
      if (action === 'set') newStock = quantity;

      if (newStock < 0) {
        throw new AppError('Inventory cannot become negative.', 400, 'NEGATIVE_STOCK');
      }

      const movementType = action === 'add' ? 'Stock Added' : 'Manual Adjustment';
      const delta = newStock - prevStock;

      await connection.query('UPDATE product_options SET stock_quantity = ? WHERE id = ?', [newStock, optionId]);
      await connection.query(
        `INSERT INTO inventory_movements (
          product_id, option_id, movement_type, quantity_change,
          previous_stock, new_stock, reason, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, optionId, movementType, delta, prevStock, newStock, reason, adminUserId]
      );

      await connection.commit();
      return { product_id: productId, option_id: optionId, previous_stock: prevStock, new_stock: newStock };
    }

    const [prodRows] = await connection.query(
      'SELECT id, name, stock_quantity FROM products WHERE id = ? FOR UPDATE',
      [productId]
    );
    if (prodRows.length === 0) {
      throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
    }

    const product = prodRows[0];
    const prevStock = Number(product.stock_quantity);
    let newStock = prevStock;
    if (action === 'add') newStock = prevStock + quantity;
    if (action === 'reduce') newStock = prevStock - quantity;
    if (action === 'set') newStock = quantity;

    if (newStock < 0) {
      throw new AppError(`Inventory for "${product.name}" cannot become negative.`, 400, 'NEGATIVE_STOCK');
    }

    const movementType = action === 'add' ? 'Stock Added' : 'Manual Adjustment';
    const delta = newStock - prevStock;

    await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newStock, productId]);
    await connection.query(
      `INSERT INTO inventory_movements (
        product_id, option_id, movement_type, quantity_change,
        previous_stock, new_stock, reason, created_by
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`,
      [productId, movementType, delta, prevStock, newStock, reason, adminUserId]
    );

    await connection.commit();
    return { product_id: productId, option_id: null, previous_stock: prevStock, new_stock: newStock };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
