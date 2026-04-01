@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "TS_SCRIPT=%SCRIPT_DIR%find-buddy.ts"

:: === 查找 bun ===
set "BUN_PATH="

:: 1. 已在 PATH 中
where bun >nul 2>&1
if not errorlevel 1 (
    for /f "delims=" %%i in ('where bun') do set "BUN_PATH=%%i"
    goto :found
)

:: 2. 常见安装位置
for %%p in (
    "%USERPROFILE%\.bun\bin\bun.exe"
    "%USERPROFILE%\.local\bin\bun.exe"
    "%LOCALAPPDATA%\bun\bun.exe"
    "C:\Program Files\bun\bun.exe"
) do (
    if exist %%p (
        set "BUN_PATH=%%p"
        goto :found
    )
)

:: 3. 通过用户目录下的 .bun 查找（bun install 默认路径）
if exist "%USERPROFILE%\.bun\bin\bun.exe" (
    set "BUN_PATH=%USERPROFILE%\.bun\bin\bun.exe"
    goto :found
)

:: === 未找到，自动安装 ===
echo bun 未安装，正在安装...
powershell -Command "irm bun.sh/install.ps1 | iex"
if exist "%USERPROFILE%\.bun\bin\bun.exe" (
    set "BUN_PATH=%USERPROFILE%\.bun\bin\bun.exe"
    echo bun 安装完成
) else (
    echo 安装失败，请手动安装 bun: https://bun.sh
    exit /b 1
)

:found
"%BUN_PATH%" run "%TS_SCRIPT%" %*
