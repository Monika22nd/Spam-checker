@echo off
setlocal
cd /d "%~dp0"

set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

where py >nul 2>nul
if not errorlevel 1 (
    set "PYTHON_CMD=py -3.11"
) else (
    set "PYTHON_CMD=python"
)

echo Tao moi truong Python trong .venv...
%PYTHON_CMD% -m venv .venv
if errorlevel 1 goto error

echo Nang cap pip...
.venv\Scripts\python.exe -m pip install --upgrade pip
if errorlevel 1 goto error

echo Cai cac thu vien cua du an...
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto error

echo.
echo Cai dat thanh cong. Hay chay run_web.bat
pause
exit /b 0

:error
echo.
echo Cai dat that bai. Kiem tra Python 3.11 va ket noi Internet.
pause
exit /b 1
