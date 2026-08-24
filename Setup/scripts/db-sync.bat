@echo off
title CeramixFlow Database Sync
echo ========================================================
echo   🏺 CeramixFlow - Dong Bo Database & Seed Du Lieu
echo ========================================================

cd ..\..\backend
echo [1/2] Day Schema len PostgreSQL / Supabase...
call npx prisma db push

echo [2/2] Khoi tao du lieu mau (Seeding initial batches)...
call npx ts-node-dev src/prisma/seed.ts

echo ========================================================
echo   ✅ Dong bo database thanh cong!
echo ========================================================
pause
