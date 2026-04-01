@echo off
chcp 65001 >/dev/null 2>&1
setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set TS_SCRIPT=%SCRIPT_DIR%find-buddy.ts

set BUN_PATH=

where bun >/dev/null 2>&1
if not errorlevel 1 (
    for /f "tokens=*" %%i in ('where bun') do set BUN_PATH=%%i
    goto :found
)

if exist "%USERPROFILE%\.bun\bin\bun.exe" (
    set "BUN_PATH=%USERPROFILE%\.bun\bin\bun.exe"
    goto :found
)

if exist "%USERPROFILE%\.local\bin\bun.exe" (
    set "BUN_PATH=%USERPROFILE%\.local\bin\bun.exe"
    goto :found
)

if exist "%LOCALAPPDATA%\bun\bun.exe" (
    set "BUN_PATH=%LOCALAPPDATA%\bun\bun.exe"
    goto :found
)

echo bun not installed, installing...
powershell -NoProfile -Command "irm bun.sh/install.ps1 | iex"
if exist "%USERPROFILE%\.bun\bin\bun.exe" (
    set "BUN_PATH=%USERPROFILE%\.bun\bin\bun.exe"
    echo bun installed
) else (
    echo install failed - visit https://bun.sh
    exit /b 1
)

:found
"%BUN_PATH%" run "%TS_SCRIPT%" %*
