@echo off
title [The Pang] Mobile Server Starter
setlocal enabledelayedexpansion

echo ====================================================
echo   THE PANG - Mobile Access Easy Starter
echo ====================================================
echo.

:: 1. Kill any existing server on port 8082 to avoid "Address already in use"
echo [STEP 1] Checking for existing servers on port 8082...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8082 ^| findstr LISTENING') do (
    if not "%%a"=="" (
        echo   - Found existing process (PID %%a). Closing it...
        taskkill /F /PID %%a >nul 2>&1
    )
)
echo   - Clean state ready.
echo.

:: 2. Find current IP address
echo [STEP 2] Detecting your Network IP...
set "MY_IP=Unknown"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set "temp_ip=%%a"
    set "temp_ip=!temp_ip: =!"
    :: Save any IP found, but prefer 210. or 192.
    if "!MY_IP!"=="Unknown" set "MY_IP=!temp_ip!"
    echo !temp_ip! | find "210." >nul && set "MY_IP=!temp_ip!"
    echo !temp_ip! | find "192.168" >nul && set "MY_IP=!temp_ip!"
)

echo.
echo ====================================================
echo   SERVER IS STARTING!
echo ====================================================
echo   1. PHONE ACCESS LINK: http://%MY_IP%:8082
echo   2. PC LOCAL LINK:     http://localhost:8082
echo ====================================================
echo.
echo   [IMPORTANT CHECKLIST]
echo   - Phone must be on the SAME Wi-Fi as your PC.
echo   - When a Windows Security Alert pops up,
echo     CHECK BOTH [Private] AND [Public] boxes,
echo     then click [Allow Access].
echo.
echo   [To Stop] Close this window.
echo ====================================================
echo.

:: Start the actual python server
python server.py
if errorlevel 1 (
    echo.
    echo [ERROR] Python not found or server failed to start!
    echo Please make sure Python is installed.
    pause
)
