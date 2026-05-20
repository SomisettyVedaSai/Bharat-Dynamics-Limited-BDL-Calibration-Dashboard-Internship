# ============================================================
#  CMS — One-Click Setup Script (Windows PowerShell)
#  Run this after cloning the repo:
#    powershell -ExecutionPolicy Bypass -File setup.ps1
# ============================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   CMS Calibration & Inventory Management System — Setup    " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Backend setup ─────────────────────────────────────────
Write-Host "[1/5] Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "      Created backend/.env from .env.example" -ForegroundColor Green
} else {
    Write-Host "      backend/.env already exists, skipping." -ForegroundColor DarkGray
}

# ── 2. Prisma generate ───────────────────────────────────────
Write-Host "[2/5] Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# ── 3. Frontend setup ────────────────────────────────────────
Write-Host "[3/5] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
npm install

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "      Created frontend/.env from .env.example" -ForegroundColor Green
} else {
    Write-Host "      frontend/.env already exists, skipping." -ForegroundColor DarkGray
}

Set-Location ..

# ── 4. MongoDB reminder ──────────────────────────────────────
Write-Host ""
Write-Host "[4/5] MongoDB Setup Required:" -ForegroundColor Yellow
Write-Host "      Make sure MongoDB is installed and start it as a Replica Set:" -ForegroundColor White
Write-Host "      > mkdir db_data" -ForegroundColor DarkCyan
Write-Host "      > mongod --dbpath ./db_data --port 27018 --replSet rs0 --bind_ip 127.0.0.1" -ForegroundColor DarkCyan
Write-Host "      Then in a new terminal (only once):" -ForegroundColor White
Write-Host "      > mongosh --port 27018 --eval `"rs.initiate()`"" -ForegroundColor DarkCyan

# ── 5. Seed admin user ───────────────────────────────────────
Write-Host ""
$seed = Read-Host "[5/5] Seed the admin user now? (y/n)"
if ($seed -eq "y" -or $seed -eq "Y") {
    Set-Location backend
    node scripts/seed.js
    Set-Location ..
    Write-Host "      Admin user created: admin@bdl.local / admin123" -ForegroundColor Green
}

# ── Done ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Setup complete! To start the project:" -ForegroundColor Green
Write-Host ""
Write-Host "  Terminal 1 (Backend):" -ForegroundColor White
Write-Host "    cd backend" -ForegroundColor DarkCyan
Write-Host "    node src/app.js" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  Terminal 2 (Frontend):" -ForegroundColor White
Write-Host "    cd frontend" -ForegroundColor DarkCyan
Write-Host "    npm run dev" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  Then open: http://localhost:5175" -ForegroundColor Green
Write-Host "  Login:     admin@bdl.local / admin123" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
