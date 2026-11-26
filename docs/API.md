# Roast & Reverie — REST API Documentation

Base URL (Local Standalone): `http://localhost:5000/api`  
Authentication: Signed JWT stored in an `HttpOnly` cookie (`rr_auth_token`).  
Content-Type: `application/json` (except `POST /api/admin/uploads` which uses `multipart/form-data`).

All error responses use the standard format:
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human-readable explanation"
}
```

---

## 1. System Health

### `GET /api/health`
Verifies Express server status and live MySQL connection pool ping.
- **Response (`200`)**: `{ "success": true, "status": "ok", "database": "connected", "currency": "PKR" }`
- **Response (`503`)**: Returned when MySQL is offline or credentials are misconfigured.

---

## 2. Authentication Endpoints

### `POST /api/auth/register`
Creates a new **customer** account (always assigns `role = 'customer'`). No email verification or OTP is sent.
- **Body**: `{ "name": "Amina Tariq", "email": "amina@example.com", "password": "Password123", "phone": "+92...", "default_address": "..." }`
- **Validation**: Valid email syntax; password $\ge 8$ chars containing uppercase, lowercase, and numeric digit.
- **Response (`201`)**: Sets `rr_auth_token` HttpOnly cookie and returns `{ "success": true, "user": { ... } }`.

### `POST /api/auth/login`
Authenticates customer or admin credentials against bcrypt password hash.
- **Body**: `{ "email": "...", "password": "..." }`
- **Response (`200`)**: Sets `rr_auth_token` HttpOnly cookie and returns `{ "success": true, "user": { ... } }`.

### `POST /api/auth/logout`
Clears the authentication cookie.

### `GET /api/auth/me` *(Authenticated)*
Returns the currently signed-in user's profile.

### `PUT /api/auth/profile` *(Authenticated)*
Updates `name`, `phone`, `default_address`, and optionally password (requires `current_password` + strong `new_password`).

---

## 3. Public Storefront Endpoints

### `GET /api/public/settings`
Returns café configuration (`shop_name`, `established_year`, `about_story`, `opening_hours`, `social_links`, `hero_title`, `hero_image_url`, etc.).

### `GET /api/public/offers`
Returns only active offers where `is_active = 1` and `NOW()` is between `starts_at` and `expires_at`.

### `POST /api/public/offers/validate`
Validates a promo code against a cart subtotal.
- **Body**: `{ "coupon_code": "REVERIE15", "subtotal": 2400 }`
- **Response (`200`)**: `{ "success": true, "offer": { ... }, "discount_amount": 360 }`

### `GET /api/public/categories`
Returns active, non-archived menu categories with active item counts.

### `GET /api/public/products`
Returns paginated catalog items with average approved rating and review counts.
- **Query Params**: `search`, `category` (slug or id), `featured` (`true`), `bestseller` (`true`), `sort` (`featured|price_asc|price_desc|rating|newest`), `page`, `limit`.

### `GET /api/public/products/:idOrSlug`
Returns single product details, grouped `options`, and `approved` reviews.

### `GET /api/public/reviews`
Returns approved reviews (including clearly flagged `is_sample` demo reviews).

### `POST /api/public/contact`
Submits a customer contact inquiry.

---

## 4. Customer Orders & Reviews Endpoints *(Authenticated)*

All routes below require a valid `rr_auth_token` cookie and enforce `order.user_id === req.user.id`.

### `POST /api/orders`
Places a new order inside an ACID MySQL transaction:
1. Locks target `products` and any tracked `product_options` (`FOR UPDATE`).
2. Verifies availability and sufficient stock.
3. Recalculates item prices, option deltas, coupon discounts, and totals server-side.
4. Inserts `orders`, `order_items` (with name & price snapshots), and `order_status_history`.
5. Deducts stock and writes `Order Deduction` rows into `inventory_movements`.

- **Body**:
```json
{
  "customer_name": "Amina Tariq",
  "customer_phone": "+92 300 1234567",
  "fulfillment_type": "delivery",
  "delivery_address": "House 12, Street 4, Gulberg III, Lahore",
  "order_notes": "Extra hot please",
  "payment_method": "cash_on_delivery",
  "coupon_code": "REVERIE15",
  "items": [
    { "product_id": 1, "quantity": 2, "option_ids": [1, 4] }
  ]
}
```

### `GET /api/orders`
Returns paginated orders belonging to the signed-in customer.

### `GET /api/orders/:id`
Returns order details, itemized snapshots, review eligibility status, and full `status_history`.

### `PATCH /api/orders/:id/cancel`
Cancels an order owned by the customer if status is `Pending` or `Confirmed`. Uses `stock_restored` guard inside a MySQL transaction to restore product/option stock at most once and logs `Order Cancellation Restock` in `inventory_movements`.

### `POST /api/orders/reviews`
Submits a verified 1–5 star review for a specific `order_item_id`.
- **Guards**: Order must belong to `req.user.id`, order status must be `Delivered`, and `order_item_id` must not already have a review (`uq_reviews_order_item`).

---

## 5. Admin Endpoints *(Authenticated + `role === 'admin'`)*

Every `/api/admin/*` route requires `authenticate` + `requireAdmin`. Non-admin accounts receive `403 Forbidden`.

| Method & Path | Description |
|---|---|
| `GET /api/admin/dashboard?days=7\|30` | Real MySQL KPIs, recent orders, bestsellers, low-stock warnings, and daily sales chart. |
| `GET /api/admin/categories` | List categories (optional `?archived=true`). |
| `POST /api/admin/categories` | Create a new category. |
| `PUT /api/admin/categories/:id` | Update category details. |
| `DELETE /api/admin/categories/:id` | Deletes empty categories or safely archives categories containing products. |
| `POST /api/admin/uploads` | Multipart image upload (`field: image`, JPG/PNG/WebP $\le$ 5MB) saved to `server/uploads`. |
| `GET /api/admin/products` | List menu products and options (optional `?archived=true&search=`). |
| `POST /api/admin/products` | Create product + options + initial `Stock Added` movement inside a transaction. |
| `PUT /api/admin/products/:id` | Update product details, pricing, availability, featured flags, and options. |
| `PATCH /api/admin/products/:id/archive` | Archive or restore a product without affecting historical orders. |
| `GET /api/admin/inventory?filter=all\|low\|out` | View current product and tracked-variant inventory levels. |
| `POST /api/admin/inventory/adjust` | Transactional `add`, `reduce`, or `set` stock adjustment with mandatory reason. |
| `GET /api/admin/inventory/movements` | Audit ledger of all stock additions, adjustments, order deductions, and cancellation restocks. |
| `GET /api/admin/orders?status=&search=&page=` | Search and filter all customer orders. |
| `GET /api/admin/orders/:id` | Full order details, customer info, items, and status history. |
| `PATCH /api/admin/orders/:id/status` | Update status (`Pending`..`Delivered`, or `Cancelled` with automatic single-restock). |
| `GET /api/admin/users` | Customer & admin lists, counts, registration dates, and order totals. |
| `PATCH /api/admin/users/:id` | Update role or active flag; blocks demoting/disabling the last active admin. |
| `GET /api/admin/reviews?status=` | List reviews for moderation. |
| `PATCH /api/admin/reviews/:id/status` | Set review status (`approved`, `hidden`, `pending`). |
| `DELETE /api/admin/reviews/:id` | Permanently remove an inappropriate review. |
| `GET /api/admin/offers` | List all promotional offers. |
| `POST /api/admin/offers` | Create offer. |
| `PUT /api/admin/offers/:id` | Update offer. |
| `DELETE /api/admin/offers/:id` | Delete offer. |
| `PUT /api/admin/settings` | Update café name, logo, year, story, hours, contact info, social links, hero, and footer. |
