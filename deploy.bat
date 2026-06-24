@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: ============================================================
::  OpenMT 一键部署到腾讯云 Lighthouse
::
::  自动检测 Python 环境，切换到项目根目录，执行 deploy.py
::  双击即可运行，也可从任意 IDE 的终端中调用
:: ============================================================

title OpenMT 一键部署

:: 定位项目根目录（本 bat 文件所在目录的父目录向上查找）
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: 检查 deploy.py 是否在当前目录
if not exist "deploy.py" (
    echo [ERROR] 未找到 deploy.py，请在项目根目录运行此脚本
    echo         当前目录: %CD%
    pause
    exit /b 1
)

:: 检查 Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    where python3 >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] 未找到 Python，请先安装 Python 3.8+
        echo         下载: https://www.python.org/downloads/
        pause
        exit /b 1
    )
    set "PYTHON=python3"
) else (
    set "PYTHON=python"
)

echo.
echo ============================================
echo   OpenMT 一键部署
echo   时间: %date% %time%
echo ============================================
echo.

:: 设置 UTF-8 编码，传递所有参数给 deploy.py
set "PYTHONIOENCODING=utf-8"
"%PYTHON%" deploy.py %*

if %errorlevel% neq 0 (
    echo.
    echo [FAIL] 部署失败，请检查上方错误信息
    pause
    exit /b 1
)

echo.
echo [DONE] 部署完成！
echo.
pause
