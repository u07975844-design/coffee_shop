# Roast & Reverie — Full-Stack Specialty Coffee Shop Platform

A complete, production-structured specialty coffee shop web application with a Warm Editorial customer storefront, protected operations admin dashboard, Node.js/Express REST API, and transactional local MySQL database.

---

## 1. Project Overview

**Roast & Reverie** is built end-to-end with real persistence, atomic MySQL inventory management, and role-based access control:
- **Customer Website**: 14 complete pages including Home, About Us, Full Menu (search, category filters, sorting, pagination), Product Details (customizable options & live stock), Active Offers, Persistent Shopping Cart, Checkout (Pickup / Cash on Delivery), Login & Registration (no email verification/OTPs), Profile, My Orders, Order Tracking & Cancellation, Verified Reviews, and Contact Us.
- **Admin Dashboard (`/admin`)**: Real-time MySQL KPIs and 7/30-day sales chart, Menu & Category CRUD with local image uploads, Inventory Management & audit ledger, Order Queue & Status History, User & Admin Role Protection, Review Moderation, Date-Bounded Offers, and Café Settings.
- **MySQL Transactional Backend**: InnoDB normalized schema using `DECIMAL(10, 2)` money fields, `order_items` price snapshots, `SELECT ... FOR UPDATE` inventory locking, and idempotent stock restoration on eligible cancellations.

---

## 2. Technology Stack

- **Frontend**: React 19, Vite, JavaScript (`.jsx`/`.js`), React Router DOM, Axios, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express.js, `mysql2/promise`, `jsonwebtoken` (HttpOnly cookies), `bcryptjs`, `multer`, `cors`, `cookie-parser`, `dotenv`
- **Database**: MySQL 8.0+ (InnoDB, `utf8mb4`, foreign keys, indexes)

---

## 3. Required Software

Install the following on your local machine before starting:
1. **Node.js** (v20 LTS or newer) and **npm**
2. **MySQL Server 8.0+** (or MariaDB 10.6+ / XAMPP / Homebrew MySQL)
3. **MySQL Workbench** (optional GUI) or the `mysql` CLI

---

## 4. Project Folder Structure

```text
coffee-shop-project/
├── client/
│   ├── src/
│   │   ├── api/            # Axios instance & modular REST service calls
│   │   ├── components/     # ProductCard, CoffeeImage fallback, loading/error states
│   │   ├── context/        # AuthContext, CartContext, SettingsContext, ToastContext
│   │   ├── layouts/        # CustomerLayout & AdminLayout
│   │   ├── pages/
│   │   │   ├── customer/   # All 14 customer-facing pages
│   │   │   └── admin/      # All 8 admin operations modules
│   │   ├── routes/         # RequireAuth & RequireAdmin guards
│   │   ├── styles/         # Warm Editorial Tailwind theme
│   │   ├── utils/          # Currency, date, and validation helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── database/
│   │   ├── schema.sql      # Complete MySQL InnoDB database schema
│   │   └── seed.js         # Initial admin, café settings, categories, products, sample reviews
│   ├── src/
│   │   ├── config/         # Environment loader & mysql2 pool
│   │   ├── controllers/    # Auth, Public, Customer Orders, Admin controllers
│   │   ├── middleware/     # JWT cookie auth, RBAC, CSRF origin check, Multer uploads, errors
│   │   ├── routes/         # Modular Express routers
│   │   ├── services/       # Transactional order, inventory, and analytics services
│   │   ├── utils/          # Error & formatting utilities
│   │   ├── validators/     # Backend request validation
│   │   ├── app.js
│   │   └── server.js
│   ├── uploads/            # Uploaded product & café photography
│   ├── .env.example
│   └── package.json
├── docs/
│   └── API.md              # Complete REST API reference
├── .gitignore
└── README.md
```

---

## 5. How to Create the MySQL Database

Ensure your local MySQL server is running, then create the database (note: `schema.sql` also includes `CREATE DATABASE IF NOT EXISTS coffee_shop_db`):

```sql
CREATE DATABASE IF NOT EXISTS coffee_shop_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

---

## 6. How to Import the SQL Schema

### Option A: Using the Command Line
```bash
mysql -u root -p < server/database/schema.sql
```
*(Enter your MySQL root password when prompted.)*

### Option B: Using MySQL Workbench
1. Open **MySQL Workbench** and connect to your local MySQL server.
2. Go to **File → Open SQL Script...** and select `server/database/schema.sql`.
3. Click the **Lightning Bolt (Execute)** icon to create `coffee_shop_db` and all 11 tables.
4. Refresh the **Schemas** sidebar to confirm `coffee_shop_db` and its tables appear.

---

## 7. Where to Change MySQL Credentials

Open `server/.env` (created from `server/.env.example` in Step 8) and update:
- `DB_HOST` (usually `localhost` or `127.0.0.1`)
- `DB_PORT` (default MySQL port is `3306`)
- `DB_USER` (e.g., `root` or your dedicated MySQL user)
- `DB_PASSWORD` (your local MySQL password)
- `DB_NAME` (default `coffee_shop_db`)

---

## 8. How to Configure Environment Variables

### Backend (`server/.env`)
Copy the template file:
```bash
cp server/.env.example server/.env
```
Edit `server/.env`:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=coffee_shop_db

JWT_SECRET=replace_with_a_long_random_64_char_secret_string
JWT_EXPIRES_IN=1d

ADMIN_NAME=Project Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeThisAdminPassword123

CURRENCY_CODE=PKR
```
> Never commit `.env` files to version control. Never put database credentials or `JWT_SECRET` into frontend variables.

### Frontend (`client/.env`)
Copy the frontend template:
```bash
cp client/.env.example client/.env
```
Default contents:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 9. How to Create the First Admin Account & 10. Seed Demo Products

Both the initial administrator account (read from `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`) and the demo menu catalog (5 categories, 12 PKR-priced coffee/pastry products, customizable options, active promo codes `REVERIE15` & `MORNING250`, café settings, and clearly marked sample reviews) are created by running the seed script after installing backend dependencies:

```bash
cd server
npm install
npm run seed
```

---

## 11. Install Backend Dependencies & 12. Start the Backend

```bash
cd server
npm install
npm run dev
```
The Express API starts on `http://localhost:5000`. Verify database connectivity at:
`http://localhost:5000/api/health`

---

## 13. Install Frontend Dependencies & 14. Start the React Frontend

Open a second terminal window:
```bash
cd client
npm install
npm run dev
```
The React Vite app starts on `http://localhost:5173`.

---

## 15. Local Website & API URLs

- **Customer Website**: `http://localhost:5173`
- **Admin Dashboard**: `http://localhost:5173/admin`
- **Backend REST API**: `http://localhost:5000/api`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 16. Admin Login Instructions

1. Visit `http://localhost:5173/login`.
2. Sign in using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you configured in `server/.env` before running `npm run seed`.
3. Once authenticated, you will be redirected to `http://localhost:5173/admin`.

---

## 17. Image Upload Instructions

1. Sign in as an administrator and open **Admin → Menu & Categories** or **Admin → Café Settings**.
2. Click **Upload File** to choose a `.jpg`, `.png`, or `.webp` image (max 5 MB).
3. Files are stored in `server/uploads/` and served at `/uploads/<filename>`.
4. In standalone local dev, `client/vite.config.ts` automatically proxies `/uploads` to `http://localhost:5000/uploads`.

---

## 18. Common Errors & Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `503 Database Unavailable` or `ECONNREFUSED` | Local MySQL server is stopped or wrong `DB_PORT`/`DB_HOST` | Start your MySQL service and verify `DB_HOST=127.0.0.1` / `DB_PORT=3306` in `server/.env`. |
| `ER_ACCESS_DENIED_ERROR` | Incorrect `DB_USER` or `DB_PASSWORD` | Update credentials in `server/.env` and re-test `/api/health`. |
| `ER_NO_SUCH_TABLE` | `schema.sql` has not been imported yet | Run `mysql -u root -p < server/database/schema.sql` then `cd server && npm run seed`. |
| Cookies not persisting in browser | Mismatched `CLIENT_URL` or CORS origin | Ensure `CLIENT_URL=http://localhost:5173` in `server/.env` and visit `http://localhost:5173` (not `127.0.0.1`). |
| Uploaded image does not appear | Backend not running on port `5000` | Start backend (`cd server && npm run dev`) so `/uploads` proxy resolves. |

---

## 19. Final Setup Checklist

- [ ] MySQL 8+ server is running locally.
- [ ] `server/database/schema.sql` imported into `coffee_shop_db`.
- [ ] `server/.env` configured with MySQL credentials, `JWT_SECRET`, and `ADMIN_*` login credentials.
- [ ] `client/.env` configured with `VITE_API_BASE_URL=http://localhost:5000/api`.
- [ ] `cd server && npm install && npm run seed` completed cleanly.
- [ ] `cd server && npm run dev` running and `http://localhost:5000/api/health` returns `"database": "connected"`.
- [ ] `cd client && npm install && npm run dev` running on `http://localhost:5173`.
- [ ] Logged into `/admin` using seeded admin credentials.
