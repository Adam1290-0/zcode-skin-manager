@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo ZCode Skin Patcher
echo ============================================
echo.

:: Check if ZCode is running
tasklist /FI "IMAGENAME eq ZCode.exe" 2>nul | find /I "ZCode.exe" >nul
if %errorlevel% equ 0 (
    echo [ERROR] ZCode is still running!
    echo Please close ZCode completely and try again.
    echo.
    pause
    exit /b 1
)

set ASAR_PATH=H:\Zcode\resources\app.asar
set BACKUP_PATH=H:\Zcode\resources\app.asar.skinbak
set UNPACKED_PATH=H:\Zcode\resources\app.asar.unpacked
set BACKUP_UNPACKED=H:\Zcode\resources\app.asar.skinbak.unpacked
set INJECT_JS=ui_skin.js

:: Check files exist
if not exist "%ASAR_PATH%" (
    echo [ERROR] Cannot find app.asar at: %ASAR_PATH%
    pause
    exit /b 1
)

if not exist "%INJECT_JS%" (
    echo [ERROR] Cannot find %INJECT_JS% in current directory
    pause
    exit /b 1
)

:: Backup original asar AND its unpacked dir (both are required by extract)
if not exist "%BACKUP_PATH%" (
    echo [1/4] Creating backup...
    copy /Y "%ASAR_PATH%" "%BACKUP_PATH%" >nul
    if !errorlevel! neq 0 (
        echo [ERROR] Backup failed
        pause
        exit /b 1
    )
    echo       Backup saved: app.asar.skinbak
) else (
    echo [1/4] Backup already exists, skip.
)
if not exist "%BACKUP_UNPACKED%" (
    if exist "%UNPACKED_PATH%" (
        xcopy "%UNPACKED_PATH%" "%BACKUP_UNPACKED%" /E /I /Y >nul
        echo       Backup saved: app.asar.skinbak.unpacked
    )
)

:: Extract asar (always from the ORIGINAL backup, so re-patching works)
echo [2/4] Extracting asar from backup (this may take 2-3 minutes)...
set EXTRACT_DIR=%TEMP%\zcode-skin-patch
if exist "%EXTRACT_DIR%" rmdir /S /Q "%EXTRACT_DIR%" 2>nul
call npx --yes @electron/asar extract "%BACKUP_PATH%" "%EXTRACT_DIR%"
if !errorlevel! neq 0 (
    echo [ERROR] Extraction failed
    pause
    exit /b 1
)

:: Inject script into index.html
echo [3/4] Injecting skin script...
set HTML_PATH=%EXTRACT_DIR%\out\renderer\index.html
if not exist "%HTML_PATH%" (
    echo [ERROR] Cannot find index.html at: %HTML_PATH%
    pause
    exit /b 1
)

:: Use Python for safe injection (handles special chars, regex, unicode)
python inject.py "%HTML_PATH%" "%INJECT_JS%"
if !errorlevel! neq 0 (
    echo [ERROR] Injection failed
    pause
    exit /b 1
)

:: Repack asar. MUST --unpack native binaries (node/dll/exe) or ZCode terminal/SSH breaks.
echo [4/4] Repacking asar (this may take 2-3 minutes)...
rmdir /S /Q "%UNPACKED_PATH%" 2>nul
call npx --yes @electron/asar pack "%EXTRACT_DIR%" "%ASAR_PATH%" --unpack "*.{node,dll,exe}"
if !errorlevel! neq 0 (
    echo [ERROR] Repacking failed
    echo Restoring backup...
    copy /Y "%BACKUP_PATH%" "%ASAR_PATH%" >nul
    rmdir /S /Q "%UNPACKED_PATH%" 2>nul
    if exist "%BACKUP_UNPACKED%" xcopy "%BACKUP_UNPACKED%" "%UNPACKED_PATH%" /E /I /Y >nul
    pause
    exit /b 1
)

:: Cleanup
rmdir /S /Q "%EXTRACT_DIR%" 2>nul

echo.
echo ============================================
echo [SUCCESS] Patch completed!
echo ============================================
echo.
echo Now you can:
echo   1. Open ZCode
echo   2. Click the paint icon (top-right corner)
echo   3. Configure your skin
echo.
echo To revert: run unpatch.bat
echo.
pause
