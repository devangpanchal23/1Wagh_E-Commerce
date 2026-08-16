# WAGH Mobile Accessories — Full MERN Stack Platform

> **"Power that feels premium. Speed you can trust."**

Recreation of the [WAGH Mobile Accessories](https://wagh-e-commerce.vercel.app/) e-commerce platform built end-to-end using MongoDB, Express.js, React 18 (Vite), and Node.js with Tailwind CSS design tokens.

---

## ⚡ Tech Stack

- **Frontend**: React 18 (Vite SPA), React Router v6, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js (REST API, MVC structure)
- **Database**: MongoDB & Mongoose
- **Auth**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Design Tokens**:
  - Primary Deep Teal (`#0D5C52`)
  - Accent Amber Gold (`#D4A94F`)
  - Off-White Background (`#FAF9F6`)
  - Typography: Fraunces (serif headlines), Manrope (sans body), Space Mono (price tags & badges)

---

## 🚀 Quick Start Instructions

### 1. Install Backend Dependencies & Seed Database

```bash
cd server
npm install
npm run seed     # Populates MongoDB with sample 45W Chargers, Power Banks, Cables, Audio & Admin user
npm run dev      # Starts Express REST API on http://localhost:5050
```

*Default Seeded Credentials:*
- **Admin**: `admin@wagh.com` / `admin123password`
- **Customer**: `devang@example.com` / `customer123password`

### 2. Install Frontend Dependencies & Start Dev Server

```bash
cd client
npm install
npm run dev      # Starts React Vite SPA on http://localhost:5173
```

---

## 🌐 Routes Overview

- `/` — Home (Hero, Stat strip, Feature grid, Best Sellers, Flagship banner, Trust strip, Newsletter)
- `/shop` — Shop catalog with sidebar filters (category, price range, in-stock), sorting, and pagination
- `/product/:id` — Product Detail with 4-image interactive gallery, specs, and customer reviews
- `/cart` — Cart line items, stepper quantity adjustments, promo code `WAGH200`, subtotal/shipping totals
- `/checkout` — Shipping address form, Razorpay test mode / COD selection, order confirmation screen
- `/about` — Brand narrative, mission, 3 WAGH pillars, and warranty highlights
- `/contact` — Functional contact form, direct phone (+91 90544 05305), email, and headquarters info
- `/profile` — Auth tabbed forms (Login/Register), user profile details, order history list, and saved wishlist
- `/admin` — Auth-gated Admin portal: product CRUD with 4-image URL uploads, order status management, and statistics