-- Roast & Reverie — Craft Roastery MySQL Schema
-- Engine: InnoDB | Charset: utf8mb4

CREATE DATABASE IF NOT EXISTS coffee_shop_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE coffee_shop_db;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users (Customers & Administrators)
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(40) DEFAULT NULL,
  default_address VARCHAR(500) DEFAULT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_active (role, is_active),
  KEY idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_active_archived (is_active, is_archived, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Products
CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  tasting_notes VARCHAR(255) DEFAULT NULL,
  origin VARCHAR(120) DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  low_stock_threshold INT UNSIGNED NOT NULL DEFAULT 10,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_bestseller TINYINT(1) NOT NULL DEFAULT 0,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_category (category_id),
  KEY idx_products_catalog_filter (is_archived, is_available, is_featured, is_bestseller),
  KEY idx_products_stock (stock_quantity, low_stock_threshold),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Product Options / Variants (Size, Milk Type, Extra Shots, Grind/Pack)
CREATE TABLE IF NOT EXISTS product_options (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  option_group VARCHAR(60) NOT NULL,
  option_name VARCHAR(80) NOT NULL,
  price_delta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  track_stock TINYINT(1) NOT NULL DEFAULT 0,
  stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  low_stock_threshold INT UNSIGNED NOT NULL DEFAULT 5,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_options_product (product_id, option_group, sort_order),
  CONSTRAINT fk_product_options_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Promotional Offers & Coupon Codes
CREATE TABLE IF NOT EXISTS offers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  coupon_code VARCHAR(50) DEFAULT NULL,
  discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  starts_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_offers_coupon_code (coupon_code),
  KEY idx_offers_active_dates (is_active, starts_at, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Orders
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number VARCHAR(32) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(190) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  fulfillment_type ENUM('pickup', 'delivery') NOT NULL DEFAULT 'pickup',
  delivery_address VARCHAR(500) DEFAULT NULL,
  order_notes VARCHAR(600) DEFAULT NULL,
  payment_method ENUM('cash_on_delivery', 'pay_at_pickup') NOT NULL DEFAULT 'pay_at_pickup',
  offer_id INT UNSIGNED DEFAULT NULL,
  coupon_code_snapshot VARCHAR(50) DEFAULT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM(
    'Pending',
    'Confirmed',
    'Preparing',
    'Ready for Pickup',
    'Out for Delivery',
    'Delivered',
    'Cancelled'
  ) NOT NULL DEFAULT 'Pending',
  stock_restored TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_order_number (order_number),
  KEY idx_orders_user_created (user_id, created_at),
  KEY idx_orders_status_created (status, created_at),
  KEY idx_orders_offer (offer_id),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_orders_offer
    FOREIGN KEY (offer_id) REFERENCES offers (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Order Items (Price & Product Snapshots)
CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  product_name_snapshot VARCHAR(160) NOT NULL,
  product_image_snapshot VARCHAR(500) DEFAULT NULL,
  unit_price_snapshot DECIMAL(10, 2) NOT NULL,
  options_price_delta DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  selected_options_json JSON DEFAULT NULL,
  selected_option_ids_json JSON DEFAULT NULL,
  quantity INT UNSIGNED NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL,
  from_status VARCHAR(40) DEFAULT NULL,
  to_status VARCHAR(40) NOT NULL,
  changed_by INT UNSIGNED DEFAULT NULL,
  note VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_status_history_order (order_id, created_at),
  KEY idx_order_status_history_user (changed_by),
  CONSTRAINT fk_osh_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_osh_user
    FOREIGN KEY (changed_by) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Reviews (Verified Order-Item Tied + Sample Flag)
CREATE TABLE IF NOT EXISTS reviews (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  order_item_id INT UNSIGNED DEFAULT NULL,
  display_name VARCHAR(100) NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NOT NULL,
  status ENUM('pending', 'approved', 'hidden') NOT NULL DEFAULT 'pending',
  is_sample TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_order_item (order_item_id),
  KEY idx_reviews_product_status (product_id, status, created_at),
  KEY idx_reviews_user (user_id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_order_item
    FOREIGN KEY (order_item_id) REFERENCES order_items (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Inventory Movements Ledger
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  option_id INT UNSIGNED DEFAULT NULL,
  movement_type ENUM(
    'Stock Added',
    'Manual Adjustment',
    'Order Deduction',
    'Order Cancellation Restock'
  ) NOT NULL,
  quantity_change INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  order_id INT UNSIGNED DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inv_movements_product_date (product_id, created_at),
  KEY idx_inv_movements_option (option_id),
  KEY idx_inv_movements_order (order_id),
  CONSTRAINT fk_inv_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_inv_option
    FOREIGN KEY (option_id) REFERENCES product_options (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_inv_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_inv_user
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Café Settings (Single-Row Storefront Configuration)
CREATE TABLE IF NOT EXISTS cafe_settings (
  id TINYINT UNSIGNED NOT NULL,
  shop_name VARCHAR(140) NOT NULL,
  tagline VARCHAR(255) NOT NULL,
  logo_url VARCHAR(500) DEFAULT NULL,
  established_year VARCHAR(20) NOT NULL,
  about_title VARCHAR(200) NOT NULL,
  about_story TEXT NOT NULL,
  contact_phone VARCHAR(40) NOT NULL,
  contact_email VARCHAR(190) NOT NULL,
  address VARCHAR(500) NOT NULL,
  opening_hours_json JSON NOT NULL,
  social_links_json JSON NOT NULL,
  hero_title VARCHAR(220) NOT NULL,
  hero_subtitle TEXT NOT NULL,
  hero_image_url VARCHAR(500) DEFAULT NULL,
  footer_note VARCHAR(300) NOT NULL,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'PKR',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
