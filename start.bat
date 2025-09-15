@echo off
echo ===================================
echo  Mindmap App Deployment Script
echo ===================================

echo.
echo Step 1: Installing dependencies...
call npm install

echo.
echo Step 2: Building and starting the server...
call npm start

echo.
echo ===================================
echo  Deployment finished.
echo  You can now access the app at the URL provided above.
echo ===================================
pause
