# SmartSupport AI 🤖🛍️

**SmartSupport AI** is an AI-powered E-Commerce Customer Experience Application built with modern full-stack web technologies: Node.js (Express, Supabase PostgreSQL, Zod), Google GenAI SDK (`@google/genai`), React (Vite, Tailwind CSS, Recharts, Lucide Icons), and JWT Authentication.

---

## 📁 Project Structure

```
AI-for-Customer-Experience/
├── backend/                # Express 5 REST API Server (Render ready)
│   ├── config/             # Supabase Client singleton & DB connection check
│   ├── controllers/        # Auth, Product, and AI logic controllers
│   ├── middleware/         # JWT Auth & Zod payload validation
│   ├── routes/             # Express API router definitions
│   ├── supabase/           # PostgreSQL DDL Schema & Triggers (schema.sql)
│   ├── .env.example        # Backend environment variable blueprint
│   ├── seed.js             # E-commerce product catalog seeder script
│   ├── server.js           # Main Express server entry point
│   └── package.json
└── frontend/               # React 19 + Vite SPA Client (Vercel ready)
    ├── src/
    │   ├── components/     # Navbar, AIChatWidget, ProtectedRoute
    │   ├── context/        # AuthContext for global user state
    │   ├── pages/          # Home, Shop, ChatSupport, Dashboard, Login, Register
    │   ├── services/       # Dynamic Axios API client instance (api.js)
    │   ├── App.jsx         # App router & layout shell
    │   └── index.css       # Tailwind CSS base styles
    ├── vercel.json         # Vercel SPA route rewrite configuration
    ├── .env.example        # Frontend environment variable blueprint
    ├── tailwind.config.js
    └── package.json
```

---

## 🔑 Environment Variables Reference

### Backend Environment Variables (Render)

| Variable | Description | Example / Default | Required |
|---|---|---|---|
| `PORT` | HTTP server port | `5000` (auto-assigned on Render) | No |
| `SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` | **Yes** |
| `SUPABASE_ANON_KEY` | Supabase Anonymous API Key | `eyJhbGciOi...` | **Yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJhbGciOi...` | **Yes** |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_secure_jwt_secret_key` | **Yes** |
| `GROQ_API_KEY` | Groq API key for AI chat (https://console.groq.com/keys) | `gsk_...` | **Yes** |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (Test or Live) | `rzp_test_...` | **Yes** |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret — server-side only, never expose | `...` | **Yes** |
| `FRONTEND_URL` | Deployed Frontend URL for CORS | `https://smartsupport.vercel.app` | **Yes (Prod)** |

### Frontend Environment Variables (Vercel)

| Variable | Description | Example / Default | Required |
|---|---|---|---|
| `VITE_API_URL` | Production Backend API Base URL | `https://smartsupport-backend.onrender.com/api` | **Yes (Prod)** |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public Key ID (safe client-side) | `rzp_test_...` | Optional (backend also returns it) |

---

## ⚡ Quick Start (Local Development)

### 1. Database Setup (Supabase)
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run the SQL migration script: [`backend/supabase/schema.sql`](file:///d:/AI-for-Customer-Experience/backend/supabase/schema.sql).

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, and GEMINI_API_KEY in .env

# Seed product catalog:
npm run seed

# Start Express server:
npm run dev
```
Backend runs locally at `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs locally at `http://localhost:5173`.

---

## 🚀 Production Deployment Guide

### 1. Database Deployment (Supabase)
- Create a project on [Supabase](https://supabase.com/).
- Navigate to **SQL Editor** -> **New Query**.
- Paste and execute the contents of [`backend/supabase/schema.sql`](file:///d:/AI-for-Customer-Experience/backend/supabase/schema.sql).

### 2. Backend Deployment (Render)
1. Create a new **Web Service** on [Render](https://render.com/) connected to your Git repository.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
3. Add **Environment Variables** in Render Dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `FRONTEND_URL` (set to your Vercel URL once created)

### 3. Frontend Deployment (Vercel)
1. Import your repository into [Vercel](https://vercel.com/).
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add **Environment Variable** in Vercel Dashboard:
   - `VITE_API_URL` = `https://<your-render-backend-url>.onrender.com/api`
4. Deploy!

---

## 🌟 Key Features

- **Context-Aware AI Customer Service**: Powered by Groq (`llama-3.3-70b-versatile`) with automatic PostgreSQL catalog context injection. Clearly tells customers when an item isn't in the catalog instead of guessing, answers general product usage questions, and converts prices to other currencies using live exchange rates (not guessed).
- **Dynamic Product Recommendations**: Real-time product suggestion cards based on user conversation history.
- **Indian Rupee (₹) Pricing**: All products are priced and displayed in INR across the Shop, Home, Chat, and AI responses.
- **Razorpay Payment Gateway**: Full checkout flow (order creation → Razorpay Checkout → signature verification) with a ₹1 demo product for end-to-end testing.
- **Admin Product Management**: Admin-role users can add new products to the store directly from the Dashboard.
- **Relational PostgreSQL Database via Supabase**: Scalable schema for Users, Products, ChatHistories, Messages, and Orders using `@supabase/supabase-js`.
- **Stateless JWT Authentication**: Secure user registration & login with bcrypt password hashing and Zod validation.
- **Vercel & Render Production Ready**: Dynamic API routing, CORS origin security, health check endpoints, and SPA rewrite configuration.

### Becoming an admin (to use the Add Product form)
There's no signup toggle for this by design. After registering, open your Supabase project → Table Editor → `users` table, find your row, and change `role` from `customer` to `admin`.
