import pool from '../config/db.js';

export async function getDashboardStats(days = 7) {
  const safeDays = Number(days) === 30 ? 30 : 7;

  const [[userCounts]] = await pool.query(`
    SELECT
      SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) AS total_customers,
      SUM(CASE WHEN role = 'admin' AND is_active = 1 THEN 1 ELSE 0 END) AS total_admins
    FROM users
  `);

  const [[orderCounts]] = await pool.query(`
    SELECT
      COUNT(*) AS total_orders,
      SUM(CASE WHEN status IN ('Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery') THEN 1 ELSE 0 END) AS pending_orders,
      SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS completed_orders,
      SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
      COALESCE(SUM(CASE WHEN status = 'Delivered' THEN total_amount ELSE 0 END), 0) AS fulfilled_revenue
    FROM orders
  `);

  const [recentOrders] = await pool.query(`
    SELECT id, order_number, customer_name, fulfillment_type, total_amount, status, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 8
  `);

  const [bestsellers] = await pool.query(`
    SELECT
      p.id,
      p.name,
      p.image_url,
      p.base_price,
      p.stock_quantity,
      COALESCE(SUM(oi.quantity), 0) AS units_sold,
      COALESCE(SUM(oi.line_total), 0) AS revenue_generated
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    INNER JOIN products p ON p.id = oi.product_id
    WHERE o.status <> 'Cancelled'
    GROUP BY p.id, p.name, p.image_url, p.base_price, p.stock_quantity
    ORDER BY units_sold DESC
    LIMIT 5
  `);

  const [lowStockProducts] = await pool.query(`
    SELECT
      p.id,
      p.name,
      c.name AS category_name,
      p.stock_quantity,
      p.low_stock_threshold,
      p.is_available
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    WHERE p.is_archived = 0
      AND p.stock_quantity <= p.low_stock_threshold
    ORDER BY p.stock_quantity ASC, p.name ASC
  `);

  const [lowStockVariants] = await pool.query(`
    SELECT
      po.id AS option_id,
      po.product_id,
      p.name AS product_name,
      po.option_group,
      po.option_name,
      po.stock_quantity,
      po.low_stock_threshold
    FROM product_options po
    INNER JOIN products p ON p.id = po.product_id
    WHERE p.is_archived = 0
      AND po.track_stock = 1
      AND po.stock_quantity <= po.low_stock_threshold
    ORDER BY po.stock_quantity ASC
  `);

  const [chartRows] = await pool.query(
    `SELECT
       DATE_FORMAT(created_at, '%Y-%m-%d') AS day_key,
       COUNT(*) AS orders_count,
       COALESCE(SUM(CASE WHEN status <> 'Cancelled' THEN total_amount ELSE 0 END), 0) AS sales_amount
     FROM orders
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
     ORDER BY day_key ASC`,
    [safeDays - 1]
  );

  const chartMap = new Map(chartRows.map((row) => [row.day_key, row]));
  const salesChart = [];
  const today = new Date();
  for (let i = safeDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const match = chartMap.get(key);
    salesChart.push({
      date: key,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      orders: match ? Number(match.orders_count) : 0,
      revenue: match ? Number(match.sales_amount) : 0,
    });
  }

  return {
    metrics: {
      total_customers: Number(userCounts?.total_customers || 0),
      total_admins: Number(userCounts?.total_admins || 0),
      total_orders: Number(orderCounts?.total_orders || 0),
      pending_orders: Number(orderCounts?.pending_orders || 0),
      completed_orders: Number(orderCounts?.completed_orders || 0),
      cancelled_orders: Number(orderCounts?.cancelled_orders || 0),
      fulfilled_revenue: Number(orderCounts?.fulfilled_revenue || 0),
      low_stock_count: lowStockProducts.length + lowStockVariants.length,
    },
    recent_orders: recentOrders,
    bestsellers,
    low_stock_products: lowStockProducts,
    low_stock_variants: lowStockVariants,
    sales_chart: salesChart,
    range_days: safeDays,
  };
}
