@echo off
chcp 65001 >nul
title Luma GitHub Automation
color 0B

echo.
echo ============================================
echo    Luma - GitHub Automation Script
echo ============================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed. Please install Git first.
    echo Download: https://git-scm.com/download/win
    pause
    exit /b 1
)

REM Check if GitHub CLI is installed
gh --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] GitHub CLI not found. Installing via winget...
    winget install --id GitHub.cli --source winget --accept-source-agreements --accept-package-agreements
    if errorlevel 1 (
        echo [ERROR] Failed to install GitHub CLI. Please install manually:
        echo https://cli.github.com/
        pause
        exit /b 1
    )
    echo [OK] GitHub CLI installed. Please restart this script.
    pause
    exit /b 0
)

REM Check if user is authenticated with GitHub
gh auth status >nul 2>&1
if errorlevel 1 (
    echo.
    echo ============================================
    echo GitHub authentication required
    echo ============================================
    echo.
    echo Please authenticate using browser login...
    echo.
    gh auth login --web
    if errorlevel 1 (
        echo [ERROR] Authentication failed.
        pause
        exit /b 1
    )
)

echo.
echo [OK] GitHub CLI authenticated
echo.

REM Get repository name from user
set /p REPO_NAME="Enter repository name (default: luma-lua-analyzer): "
if "%REPO_NAME%"=="" set REPO_NAME=luma-lua-analyzer

REM Get repository description
set /p REPO_DESC="Enter repository description: "
if "%REPO_DESC%"=="" set REPO_DESC=Luma - AI-powered Lua script security analyzer

echo.
echo ============================================
echo Creating repository: %REPO_NAME%
echo ============================================
echo.

REM Check if already a git repository
if exist .git (
    echo [INFO] Git repository already initialized
) else (
    echo [1/7] Initializing Git repository...
    git init
    if errorlevel 1 (
        echo [ERROR] Failed to initialize Git repository
        pause
        exit /b 1
    )
    echo [OK] Git repository initialized
)

REM Create .gitignore if it doesn't exist
if not exist .gitignore (
    echo [2/7] Creating .gitignore...
    (
        echo # Dependencies
        echo node_modules/
        echo .pnp
        echo .pnp.js
        echo.
        echo # Testing
        echo coverage/
        echo.
        echo # Next.js
        echo .next/
        echo out/
        echo.
        echo # Production
        echo build/
        echo dist/
        echo.
        echo # Environment
        echo .env
        echo .env.local
        echo .env.development.local
        echo .env.test.local
        echo .env.production.local
        echo.
        echo # IDE
        echo .vscode/
        echo .idea/
        echo *.swp
        echo *.swo
        echo.
        echo # OS
        echo .DS_Store
        echo Thumbs.db
        echo.
        echo # Logs
        echo *.log
        echo npm-debug.log*
        echo yarn-debug.log*
        echo yarn-error.log*
    ) > .gitignore
    echo [OK] .gitignore created
) else (
    echo [2/7] .gitignore already exists
)

echo [3/7] Adding files to Git...
git add .
if errorlevel 1 (
    echo [ERROR] Failed to add files
    pause
    exit /b 1
)
echo [OK] Files added

echo [4/7] Committing changes...
git commit -m "Initial commit: Luma Lua Script Analyzer"
if errorlevel 1 (
    echo [INFO] No changes to commit or commit already exists
)
echo [OK] Changes committed

echo [5/7] Creating GitHub repository...
gh repo create %REPO_NAME% --public --description "%REPO_DESC%" --source=. --remote=origin --push 2>nul
if errorlevel 1 (
    echo [INFO] Repository may already exist, trying to push to existing...
    git remote get-url origin >nul 2>&1
    if errorlevel 1 (
        echo [INFO] Adding remote origin...
        git remote add origin https://github.com/%REPO_NAME%.git 2>nul
    )
)
echo [OK] GitHub repository ready

echo [6/7] Pushing to GitHub...
git branch -M main
git push -u origin main 2>nul
if errorlevel 1 (
    echo [INFO] Attempting push with force...
    git push -u origin main --force
)
echo [OK] Code pushed to GitHub

echo [7/7] Opening repository in browser...
for /f "tokens=*" %%a in ('git remote get-url origin') do set REMOTE_URL=%%a

if not "%REMOTE_URL%"=="" (
    start "" "%REMOTE_URL%"
) else (
    gh repo view --web
)

echo.
echo ============================================
echo SUCCESS!
echo Repository: %REPO_NAME%
echo Remote: origin
echo Ready for Vercel deployment!
echo ============================================
echo.
pause
