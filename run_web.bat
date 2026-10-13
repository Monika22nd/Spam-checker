@echo off
setlocal
cd /d "%~dp0"

set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
set TF_CPP_MIN_LOG_LEVEL=2

if exist ".venv\Scripts\python.exe" (
    set "PYTHON_CMD=.venv\Scripts\python.exe"
) else (
    where py >nul 2>nul
    if not errorlevel 1 (
        set "PYTHON_CMD=py -3.11"
    ) else (
        set "PYTHON_CMD=python"
    )
)

echo Dang khoi dong SpamLens tai http://127.0.0.1:8000
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 10; Start-Process 'http://127.0.0.1:8000'"
%PYTHON_CMD% -m uvicorn main:app --host 127.0.0.1 --port 8000

echo.
echo Server da dung. Nhan phim bat ky de dong cua so.
pause >nul

