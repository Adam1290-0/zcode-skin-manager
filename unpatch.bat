@echo off
chcp 65001 >nul
setlocal

echo ============================================
echo ZCode Skin Unpatcher
echo ============================================
echo.

set ASAR_PATH=H:\Zcode\resources\app.asar
set BACKUP_PATH=H:\Zcode\resources\app.asar.skinbak

:: Check if ZCode is running
tasklist /FI "IMAGENAME eq ZCode.exe" 2>nul | find /I "ZCode.exe" >nul
if %errorlevel% equ 0 (
    echo [ERROR] ZCode is still running!
    echo Please close ZCode completely and try again.
    echo.
    pause
    exit /b 1
)

:: Check backup exists
if not exist "%BACKUP_PATH%" (
    echo [ERROR] Backup not found: %BACKUP_PATH%
    echo Nothing to restore.
    echo.
    pause
    exit /b 1
)

echo Restoring original app.asar...
copy /Y "%BACKUP_PATH%" "%ASAR_PATH%" >nul
if %errorlevel% neq 0 (
    echo [ERROR] Restore failed
    pause
    exit /b 1
)

echo.
echo ============================================
echo [SUCCESS] Patch removed!
echo ============================================
echo.
echo The original ZCode has been restored.
echo Backup file (app.asar.skinbak) is kept for safety.
echo.
pause
