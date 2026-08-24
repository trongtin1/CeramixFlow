@echo off
title CeramixFlow Key & Connection Checker
echo ========================================================
echo   🏺 CeramixFlow - Kiem Tra Key Database, Gemini, Telegram
echo ========================================================

cd ..\..\backend
call npm run test:connections

pause
