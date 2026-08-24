@echo off
title CeramixFlow Runner
echo ========================================================
echo   🏺 CeramixFlow - Khoi Chay He Thong San Xuat Gom
echo ========================================================

echo [1/2] Dang khoi dong Backend Server (Port 5000)...
start "CeramixFlow Backend" cmd /k "cd ..\..\backend && npm run dev"

echo [2/2] Dang khoi dong Frontend Dashboard (Port 5173)...
start "CeramixFlow Frontend" cmd /k "cd ..\..\frontend && npm run dev"

echo ========================================================
echo   🚀 He thong dang khoi chay!
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:5173
echo ========================================================
timeout /t 3 >nul
start http://localhost:5173
