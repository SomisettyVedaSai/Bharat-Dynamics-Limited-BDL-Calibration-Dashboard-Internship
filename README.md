# 🔬 CMS — Calibration & Inventory Management System

An industrial-grade full-stack web application for managing the complete lifecycle of precision measurement instruments and gauges — designed and built during an internship at **Bharat Dynamics Limited (BDL)**, Hyderabad.

---

## ✨ Features

### 📦 Equipment Registry
- Register **Instruments** (Verniers, micrometers, dial gauges, etc.) and **Gauges** (Go/No-Go, plug gauges, etc.)
- Track serial numbers, material codes, range, accuracy, least count, and Q01 tolerances
- Full **CRUD** — create, view, edit, and delete equipment records
- QR-code-based employee registration scanning
- Plant, storage location, and maintenance plan tracking

### ⚙️ Calibration Engine
- Live real-time calculation of **lower limit**, **upper limit**, **measurement error**, and **tolerance check**
- **IN TOLERANCE / OUT OF TOLERANCE** verdict rendered instantly as values are typed
- Support for **early calibration** with a non-blocking warning banner
- Full **Physical Inspection Checklist** — Rust, Dent, Damage, Surface Finish (OK / NOT OK toggles)
- Go / No-Go gauge size entry
- Final PASS/FAIL verdict with automatic equipment status update

### 📊 Dashboards & Reports
- **Calibration Status Dashboard** — equipment due, overdue, and up-to-date counts at a glance
- **Calibration History** — full audit trail of every calibration record performed
- **Calibration Certificates** — view and download certificates per calibration event
- **Analytics overview** on the main dashboard with charts

### 📖 Narrative System
- Wizard-based narrative / inspection report creation
- Gallery view of all saved narrative documents

### 📅 Factory Calendar
- Custom factory working-day calendar management
- Used for calculating next-working-day calibration due dates

### 🔐 Authentication & Security
- JWT-based authentication with protected routes
- Session-aware UI with automatic redirect to login on token expiry
- XSS and SQL-injection safe data handling

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
- Node.js ≥ 18
- MongoDB ≥ 6 (must be running as a **Replica Set** — required for Prisma transactions)

### 1. Clone the repository
```bash
git clone https://github.com/SomisettyVedaSai/Bharat-Dynamics-Limited-BDL-Internship-Calibration-Dashboard.git
cd Bharat-Dynamics-Limited-BDL-Internship-Calibration-Dashboard
```

### 2. Start MongoDB as a Replica Set
```bash
# Create a data directory if it doesn't exist
mkdir db_data

# Start mongod with replica set
mongod --dbpath ./db_data --port 27018 --replSet rs0 --bind_ip 127.0.0.1
```

Then in a separate terminal, initialise the replica set (only required once):
```bash
mongosh --port 27018 --eval "rs.initiate()"
```

### 3. Configure the Backend
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
DATABASE_URL="mongodb://127.0.0.1:27018/cms_db?replicaSet=rs0&directConnection=true"
JWT_SECRET="your_secret_key_here"
PORT=5005
```

Run Prisma migrations and generate client:
```bash
npx prisma generate
npx prisma db push
```

Start the backend server:
```bash
node src/app.js
# → API running on http://localhost:5005
```

### 4. Configure the Frontend
```bash
cd ../frontend
npm install
npm run dev
# → App running on http://localhost:5175
```

### 5. Open the App
Navigate to [http://localhost:5175](http://localhost:5175) in your browser.

| Field | Value |
|---|---|
| Email | `admin@bdl.local` |
| Password | `admin123` |

---

## 🧪 E2E Testing

The project ships with a comprehensive Puppeteer-based end-to-end test suite covering:

- ✅ Authentication & route protection
- ✅ Equipment CRUD, form validation, XSS/SQL-injection safety
- ✅ Search, filter, and sort operations
- ✅ Live calibration engine (measurement inputs → real-time results)
- ✅ Calibration record save to database
- ✅ All secondary pages load without crash
- ✅ Navigation edge cases and logout flow

```bash
cd backend
node scripts/run-e2e-tests.js
```

**Latest result: 28/28 passed — 100.0% ✅**

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/        # Auth, Equipment, Calibration, Calendar,
│   │   │                       # Certificates, Narratives, Analytics
│   │   ├── middleware/         # JWT auth guard, global error handler
│   │   ├── routes/             # Express route definitions
│   │   ├── services/           # Business logic layer
│   │   └── utils/              # Prisma client, error mappers, calendar helpers
│   ├── scripts/
│   │   └── run-e2e-tests.js    # Puppeteer E2E test runner
│   └── prisma/
│       └── schema.prisma       # Database schema
└── frontend/
    └── src/
        ├── pages/              # All application pages
        │   ├── Dashboard.jsx
        │   ├── EquipmentPage.jsx
        │   ├── CalibrationPage.jsx
        │   ├── CalibrationHistory.jsx
        │   ├── CalibrationStatusDashboard.jsx
        │   ├── CertificatesPage.jsx
        │   ├── NarrativeGallery.jsx
        │   ├── NarrativeWizard.jsx
        │   ├── FactoryCalendarPage.jsx
        │   ├── SettingsPage.jsx
        │   └── Login.jsx
        ├── components/         # Shared UI components (Layout, Topbar, Sidebar)
        └── hooks/              # Custom React hooks
```

---

## 📸 Key Pages

| Page | Description |
|---|---|
| Dashboard | KPI overview with charts and calibration summary |
| Equipment | Full instrument/gauge registry with CRUD |
| Calibration | Live measurement engine with inspection checklist |
| Cal. History | Audit trail of all calibration sessions |
| Cal. Status | Due/overdue/passed status board |
| Certificates | Download calibration certificates |
| Narratives | Inspection narrative wizard and gallery |
| Calendar | Factory working-day calendar editor |

---

> Built with ❤️ for quality assurance and precision engineering operations at **Bharat Dynamics Limited (BDL)**, Hyderabad.
