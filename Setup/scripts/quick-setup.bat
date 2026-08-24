@echo off
echo ========================================================
echo   🏺 CeramixFlow - Quick Setup Script (Windows)
echo ========================================================

echo [1/3] Installing Backend Dependencies...
cd ..\..\backend
call npm install
call npx prisma generate
call npx prisma db push

echo [2/3] Installing Frontend Dependencies...
cd ..\frontend
call npm install

echo [3/3] Seeding Initial Demo Data...
cd ..\backend
call npx ts-node-dev src/prisma/seed.ts

echo ========================================================
echo   ✅ Setup Completed Successfully!
echo   To start the project:
echo   Terminal 1: cd backend ^&^& npm run dev
echo   Terminal 2: cd frontend ^&^& npm run dev
echo ========================================================
pause
