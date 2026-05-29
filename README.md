# 🔬 CMS — Calibration & Inventory Management System

> An industrial-grade full-stack web application for managing the complete lifecycle of precision measurement instruments and gauges — built during an internship at **Bharat Dynamics Limited (BDL)**, Hyderabad.

---

## ✨ Features

### 📦 Equipment Registry
- Register **Instruments** (Verniers, micrometers, dial gauges) and **Gauges** (Go/No-Go, plug gauges)
- Track serial numbers, material codes, range, accuracy, least count, and Q01 tolerances
- Full **CRUD** — create, view, edit, and delete equipment records
- QR-code-based employee registration scanning
- Plant, storage location, and maintenance plan tracking

### ⚙️ Live Calibration Engine
- Real-time calculation of **lower limit**, **upper limit**, **measurement error**, and **tolerance check**
- **IN TOLERANCE / OUT OF TOLERANCE** verdict rendered instantly as values are typed
- Support for **early calibration** with a non-blocking warning banner
- Full **Physical Inspection Checklist** — Rust, Dent, Damage, Surface Finish
- Go / No-Go gauge size entry with automatic result computation
- Final PASS/FAIL verdict with automatic equipment status update

### 📊 Dashboards & Reports
- **Calibration Status Dashboard** — due, overdue, and up-to-date counts at a glance
- **Calibration History** — full audit trail of every calibration session
- **Calibration Certificates** — view and download certificates per calibration event
- **Analytics overview** on main dashboard with charts
- **Dual Master Report Generation** — export both structured Excel (`.xlsx`) and print-ready BDL-branded A4 PDF (`.pdf`) master status reports sequentially in one click
- **Premium Light Theme Design** — clean white (#FFFFFF) visual layout with optimized high-contrast components, light slate borders, and custom chart themes

### 📖 Narrative System
- Wizard-based inspection narrative creation
- Gallery view of all saved narrative documents

### 📅 Factory Calendar
- Custom factory working-day calendar
- Used for calculating next-working-day calibration due dates

### 🔐 Authentication & Security
- JWT-based authentication with protected routes
- Session-aware UI — auto redirects to login on token expiry
- XSS and injection-safe data handling

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| ORM | Prisma |
| Database | MongoDB (Replica Set) |
| Auth | JWT (JSON Web Tokens) |
| Testing | Puppeteer E2E Test Suite |

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed on your system:

| Tool | Version | Download |
|---|---|---|
| Node.js | ≥ 18 | https://nodejs.org |
| MongoDB | ≥ 6 | https://www.mongodb.com/try/download/community |
| Git | any | https://git-scm.com |

---

### Option A — One-Click Setup (Windows)

```powershell
git clone https://github.com/SomisettyVedaSai/Bharat-Dynamics-Limited-BDL-Internship-Calibration-Dashboard.git
cd Bharat-Dynamics-Limited-BDL-Internship-Calibration-Dashboard
powershell -ExecutionPolicy Bypass -File setup.ps1
```

The script will:
- Install all backend and frontend dependencies
- Copy `.env.example` → `.env` automatically
- Generate the Prisma client
- Optionally seed the admin user

---

### Option B — Manual Setup

#### 1. Clone the repository

```bash
git clone https://github.com/SomisettyVedaSai/Bharat-Dynamics-Limited-BDL-Internship-Calibration-Dashboard.git
cd Bharat-Dynamics-Limited-BDL-Internship-Calibration-Dashboard
```

#### 2. Start MongoDB as a Replica Set

> ⚠️ MongoDB **must** run as a Replica Set — Prisma requires this for transaction support.

```bash
# Create the data directory (only once)
mkdir db_data

# Start MongoDB
mongod --dbpath ./db_data --port 27018 --replSet rs0 --bind_ip 127.0.0.1
```

In a **separate terminal**, initialize the replica set (**only once**):

```bash
mongosh --port 27018 --eval "rs.initiate()"
```

#### 3. Set up the Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env       # Linux/Mac
# OR
copy .env.example .env     # Windows

# Generate Prisma client
npx prisma generate

# Push schema to MongoDB
npx prisma db push

# Seed the admin user
node scripts/seed.js
```

#### 4. Set up the Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env       # Linux/Mac
# OR
copy .env.example .env     # Windows
```

#### 5. Start the Servers

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
node src/app.js
# → API running at http://localhost:5005
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → App running at http://localhost:5175
```

#### 6. Open the App

Navigate to **http://localhost:5175** in your browser.

| Field | Value |
|---|---|
| Email | `admin@bdl.local` |
| Password | `admin123` |

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/        # Auth, Equipment, Calibration, Calendar,
│   │   │                       # Certificates, Narratives, Analytics
│   │   ├── middleware/         # JWT auth guard, global error handler
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Certificate, QR & label generators
│   │   └── utils/              # Prisma client, error mappers, calendar helpers
│   ├── scripts/
│   │   ├── seed.js             # Seeds the admin user into the database
│   │   └── run-e2e-tests.js    # Puppeteer E2E test runner
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (all models)
│   └── .env.example            # Environment variable template
│
├── frontend/
│   └── src/
│       ├── pages/              # All 11 application pages
│       │   ├── Dashboard.jsx
│       │   ├── EquipmentPage.jsx
│       │   ├── CalibrationPage.jsx
│       │   ├── CalibrationHistory.jsx
│       │   ├── CalibrationStatusDashboard.jsx
│       │   ├── CertificatesPage.jsx
│       │   ├── NarrativeGallery.jsx
│       │   ├── NarrativeWizard.jsx
│       │   ├── FactoryCalendarPage.jsx
│       │   ├── SettingsPage.jsx
│       │   └── Login.jsx
│       ├── components/         # Shared UI components (Layout, Sidebar, Topbar)
│       ├── hooks/              # Custom React hooks
│       ├── context/            # Auth context (JWT management)
│       └── api/                # Axios API client
│   └── .env.example            # Environment variable template
│
├── setup.ps1                   # One-click Windows setup script
├── .gitignore
└── README.md
```

---

## 🧪 E2E Testing

The project ships with a full Puppeteer-based end-to-end test suite:

```bash
cd backend
node scripts/run-e2e-tests.js
```

**Covers:**
- ✅ Authentication & protected route redirection
- ✅ Equipment CRUD, HTML5 form validation, XSS/SQL-injection safety
- ✅ Table search, filter, and sort
- ✅ Live calibration engine — real-time tolerance calculations
- ✅ Calibration record save to database
- ✅ All 8 secondary pages load without crash
- ✅ Navigation edge cases and logout

**Latest result: 28/28 passed — 100.0% ✅**

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login and receive JWT token |
| GET | `/api/equipment` | List all equipment |
| POST | `/api/equipment` | Create new equipment |
| PUT | `/api/equipment/:id` | Update equipment |
| DELETE | `/api/equipment/:id` | Delete equipment |
| GET | `/api/calibration` | List calibration records |
| POST | `/api/calibration` | Submit a calibration record |
| GET | `/api/certificates` | List certificates |
| GET | `/api/analytics/dashboard` | Dashboard stats & analytics charts |
| GET | `/api/analytics/report` | Download Master Status Report as Excel (`.xlsx`) |
| GET | `/api/analytics/report-pdf` | Download Master Status Report as A4 PDF (`.pdf`) |
| GET | `/api/calendar` | Factory calendar |
| GET | `/api/health` | Backend health check |

---

## 📸 Pages Overview

| Page | Route | Description |
|---|---|---|
| Login | `/login` | JWT authentication |
| Dashboard | `/dashboard` | KPI cards + calibration charts |
| Equipment | `/equipment` | Instrument/gauge registry (CRUD) |
| Calibration | `/calibration` | Live calibration engine |
| Cal. History | `/cal-history` | Full audit trail |
| Cal. Status | `/cal-status` | Due/overdue/passed status board |
| Certificates | `/certificates` | Download calibration certificates |
| Narratives | `/narratives` | Inspection report gallery |
| Narrative Wizard | `/narrative/new` | Step-by-step report builder |
| Calendar | `/calendar` | Factory working-day editor |
| Settings | `/settings` | System settings |

---

## ⚙️ Environment Variables

### `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5005` | Express server port |
| `DATABASE_URL` | `mongodb://localhost:27018/cms_db` | MongoDB connection string |
| `JWT_SECRET` | — | Secret key for signing JWTs (change this!) |
| `SEED_EMAIL` | `admin@bdl.local` | Admin email created by seed script |
| `SEED_PASSWORD` | `admin123` | Admin password created by seed script |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |

### `frontend/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5005/api` | Backend API base URL |

---

> Built with ❤️ for quality assurance and precision engineering operations at **Bharat Dynamics Limited (BDL)**, Hyderabad — Internship Project 2026.
