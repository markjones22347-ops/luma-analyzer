@echo off
chcp 65001 >nul
title Luma - Update GitHub Repository
color 0B

echo.
echo ============================================
echo    Luma - Quick GitHub Update
echo ============================================
echo.

REM Check if in a git repository
if not exist .git (
    echo [ERROR] Not a git repository!
    echo Run github-simple.bat first to initialize.
    pause
    exit /b 1
)

REM Check for changes
git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git error occurred
    pause
    exit /b 1
)

REM Check if there are any changes to commit
git diff --quiet HEAD
echo %errorlevel% > temp_error.txt
set /p HAS_CHANGES=<temp_error.txt
del temp_error.txt

if "%HAS_CHANGES%"=="0" (
    echo [INFO] No changes to commit.
    echo.
    echo Options:
    echo 1. Force update anyway
    echo 2. Exit
    echo.
    set /p CHOICE="Choose (1-2): "
    
    if not "%CHOICE%"=="1" (
        echo Exiting...
        exit /b 0
    )
    
    echo Creating empty commit for force update...
    git commit --allow-empty -m "Force update: %date% %time%"
) else (
    REM Get custom message or use default
    set /p COMMIT_MSG="Enter update message (or press Enter for default): "
    
    if "!COMMIT_MSG!"=="" (
        set COMMIT_MSG=Update: %date% %time%
    )
    
    echo.
    echo [1/3] Adding all changes...
    git add .
    
    echo [2/3] Committing with message: %COMMIT_MSG%
    git commit -m "%COMMIT_MSG%"
)

echo [3/3] Pushing to GitHub...
git push origin main

if errorlevel 1 (
    echo.
    echo [ERROR] Push failed. Trying to pull first...
    git pull origin main --rebase
    git push origin main
)

echo.
echo ============================================
echo Update complete!
echo ============================================
echo.
echo Vercel will auto-deploy if connected.
echo.
pause
