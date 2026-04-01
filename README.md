# 🍣 Smart Restaurant Intelligence System

*A Data-Driven Digital Transformation Suite for F&B Businesses*

---

## 📌 Overview

This project is a **comprehensive digital ecosystem** designed for Koryori Hayashi to enhance **operational efficiency, improved customer experience, and revenue optimization** through data, AI, and simulation.

It consists of five core components with links to their deployed applications:

* **Company-Facing Application** (Operations & Analytics) https://koryori-hayashi-company.vercel.app/
* **Customer-Facing Application** (Customer Experience) https://koryori-hayashi-customers.vercel.app/
* **Queue Table Management System** (Table & queue operations) https://koryori-hayashi-qtms.vercel.app/
* **Digital Twin** (Simulation) https://koryori-hayashi-digital-twin.vercel.app/
* **Dashboard** (For Samuel- restaurant owner)


---

## 🚀 Key Features

### 🏢 Company-Facing App 

Designed for restaurant owners and managers to make **data-driven decisions**:

* 📊 Best-selling & slow-moving items tracking
* 📈 Multi-metric performance analysis
* 💰 Revenue breakdown by category
* 🎯 Daily targets & weekly goals monitoring
* ⏱ Hourly, daily, weekly & monthly sales tracking
* 🔥 Sales heatmap visualization
* 🤖 AI-powered demand forecasting
* 💬 AI assistant for insights & recommendations
* 📦 Inventory optimization system
* 👨‍🍳 Staff allocation planner
* 💸 Dynamic pricing recommendations

---

### 📱 Customer-Facing App

Enhances **user experience, personalization, and retention**:

* 🎁 Loyalty program & membership benefits
* 🌦 Weather-responsive menu suggestions (Weather API integration)
* 🧬 Biometric-style "Flavor Profile" quiz
* 🎰 Multi-Armed Bandit (MAB) with Thompson Sampling for recommendations
* ♻️ *Mottainai* dynamic pricing (reduce food waste)
* 🧠 Personalized suggestions based on order history
* 🍱 Frequently paired item recommendations
* 📷 QR code-based ordering system
* 🎮 In-app gamification to earn rewards

---

### 🔁 Digital Twin System

A virtual replica of restaurant operations used to **simulate scenarios**:

* 🧪 Run simulations using Machine Learning
* 📉 Predict impact of pricing, staffing, inventory levels and demand changes
* ⚙️ Optimize operational decisions before real-world implementation

---

## 📊 Dashboard

### 📓 Jupyter Notebook (Data Science Layer)

Used for analysis and modeling:

* Exploratory Data Analysis (EDA)
* Sales forecasting using:

  * Linear Regression
  * ARIMA
  * Exponential Smoothing
* Monte Carlo Simulation for uncertainty modeling

---

### 🌐 Streamlit App (Interactive Simulation Layer)

* Real-time simulation based on user inputs
* Scenario testing (pricing, demand, staffing, etc.)
* Visualization of forecast outcomes and risk ranges

---

## Quick Start

### 1. Install dependencies

In five terminals:

```powershell
cd backend
npm install
```

```powershell
cd CustomerFacingApp
npm install
```

```powershell
cd CompanyFacingApp
npm install
```

```powershell
cd QueueTableManagementSystem
npm install
```

```powershell
cd DigitalTwin
npm install
```

### 2. Configure backend env

Copy [backend/.env.example] to [backend/.env]

Important:
- `backend/.env` should stay local and should not contain committed secrets.
- Everyone only sees the same data if they use the same Supabase project in `backend/.env`.

For Supabase, fill:

```env
NODE_ENV=development
PORT=4000
HOST=0.0.0.0
LOG_LEVEL=info

DATABASE_URL=your-supabase-transaction-pooler-url-with-pgbouncer
DIRECT_URL=your-supabase-direct-db-url

JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d

CUSTOMER_APP_ORIGIN=http://localhost:5173
COMPANY_APP_ORIGIN=http://localhost:5174

SEED_STAFF_EMAIL=admin@gmail.com
SEED_STAFF_PASSWORD=[setyourpassword]
SYNC_STATE_PATH=.data/spreadsheet-sync.json
```

Notes:
- `DATABASE_URL` should be the Supabase pooled connection.
- `DIRECT_URL` should be the direct database connection.
- Do not commit real secrets.
- `SYNC_STATE_PATH` stores local spreadsheet watcher state for the backend integration feature.

### 3. Create schema and seed data

```powershell
cd backend
npm run prisma:push
npm run prisma:seed
```

If Prisma client generation is missing locally, run:

```powershell
cd backend
npm run prisma:generate
```

### 4. Start the apps

Backend:

```powershell
cd backend
npm run dev
```

Customer app:

```powershell
cd CustomerFacingApp
npm run dev
```

Company app:

```powershell
cd CompanyFacingApp
npm run dev
```

Queue Table Management System:

```powershell
cd QueueTableManagementSystem
npm run dev
```

Digital Twin:

```powershell
cd DigitalTwin
npm run dev
```

Or from the repo root, launch everything with one command:

```powershell
.\run-all.cmd
```

If you also want the script to install dependencies and run the backend Prisma setup first:

```powershell
.\run-all.cmd -Setup
```

## URLs

- Backend health: `http://localhost:4000/health`
- Backend Swagger: `http://localhost:4000/docs`
- Backend staff integrations: `http://localhost:4000/api/integrations/*`
- Customer app: `http://localhost:5173`
- Company app: `http://localhost:5174`
- Queue Table Management System: `http://localhost:5175` (Vite may pick the next available port)
- Digital Twin: `http://localhost:5176` (Vite may pick the next available port)

## Seeded Login

Staff dashboard:
- Email: whatever you set in `SEED_STAFF_EMAIL`
- Password: whatever you set in `SEED_STAFF_PASSWORD`

Customer quick access numbers:
- `+1 (555) 123-4567`
- `+1 (555) 987-6543`
- `+1 (555) 555-5555`

